// server/service/purchase.service.js
//
// PURPOSE: This file contains ALL the business logic for course purchasing.
// Neither the Stripe controller nor the eSewa controller should touch models
// directly — they call these functions instead.
//
// RULE: Services never import `req` or `res`. They receive plain data,
// do work, and return plain results (or throw errors).

import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { generateOrderId } from "../helpers/Generateorderid.helper.js";
import { createNotification } from "./notification.service.js";

/**
 * Creates a new pending order OR reuses an existing one if the user
 * already has a recent pending order for the same courses.
 *
 * Returns: { order, courses, totalAmount, purchaseCourses, reused }
 *   - reused: true if an existing pending order was returned instead of creating a new one
 */
export const createPendingOrder = async ({
  userId,
  courseIds,
  paymentMethod,
}) => {
  // Fetch course data to lock prices
  const courses = await Course.find({ _id: { $in: courseIds } }).select(
    "title thumbnail price",
  );

  if (courses.length !== courseIds.length) {
    const error = new Error("One or more courses not found!");
    error.statusCode = 404;
    throw error;
  }

  const purchaseCourses = courses.map((course) => {
    const price = course.price.current;
    const instructorShare = Number((price * 0.37).toFixed(2));
    const adminShare = Number((price * 0.63).toFixed(2));
    return {
      courseId: course._id,
      priceAtPurchase: price,
      instructorShare,
      adminShare,
    };
  });

  const totalAmount = purchaseCourses.reduce(
    (sum, item) => sum + item.priceAtPurchase,
    0,
  );

  // ── Check for an existing recent pending order for the same user + courses ──
  // "Recent" = created within the last 24 hours (generous window)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingPendingOrder = await CoursePurchase.findOne({
    userId,
    status: "pending",
    paymentMethod,
    createdAt: { $gte: oneDayAgo },
    // Check that every courseId in the request is in this order
    "courses.courseId": { $all: courseIds },
  });

  if (existingPendingOrder) {
    console.log(
      `[createPendingOrder] Reusing existing pending order ${existingPendingOrder.orderId} for user ${userId}`,
    );
    return {
      order: existingPendingOrder,
      courses,
      totalAmount,
      purchaseCourses,
      reused: true,
    };
  }

  // ── No existing pending order — create a fresh one ────────────────────────
  const order = await CoursePurchase.create({
    orderId: generateOrderId(),
    userId,
    courses: purchaseCourses,
    totalAmount,
    paymentMethod,
    status: "pending",
    paymentDetails: {},
  });

  return { order, courses, totalAmount, purchaseCourses, reused: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPLETE AN ORDER (the shared enrollment logic)
//    Called by: stripeWebhook, completePayment (eSewa)
//    What it does:
//      - Marks the order "completed"
//      - Adds the courses to the user's enrolledCourses
//      - Adds the user to each course's enrolledStudents
//      - Removes purchased courses from the user's cart AND wishlist
//      - Sends an in-app notification
//    Returns: the completed order document
// ─────────────────────────────────────────────────────────────────────────────
export const completeOrder = async (purchase) => {
  if (purchase.status === "completed") return purchase;
 
  purchase.status = "completed";
  await purchase.save();
 
  const courseIds = purchase.courses.map((c) => c.courseId);
 
  // Fetch titles from DB — courseId is a plain ObjectId, not populated
  const courseDetails = await Course.find({ _id: { $in: courseIds } })
    .select("title")
    .lean();
  const courseTitles = courseDetails.map((c) => c.title).join('", "');
 
  await User.findByIdAndUpdate(purchase.userId, {
    $addToSet: { enrolledCourses: { $each: courseIds } },
    $pull: {
      cart: { $in: courseIds },
      wishlist: { $in: courseIds },
    },
  });

  const updatedUser = await User.findById(purchase.userId)
  .select("enrolledCourses")
  .lean();

console.log("Updated User:", updatedUser);
 
  await Course.updateMany(
    { _id: { $in: courseIds } },
    { $addToSet: { enrolledStudents: purchase.userId } }
  );
 
  await createNotification(
    purchase.userId,
    courseDetails.length === 1
      ? `Your purchase was successful! You are now enrolled in "${courseTitles}".`
      : `Your purchase was successful! You are now enrolled in: "${courseTitles}".`,
    "/my-learning",
    "course_enrollment"
  );
 
  return purchase;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. FAIL AN ORDER
//    Called by: paymentFailed route (eSewa failure redirect)
//    What it does: Marks the order status as "failed"
//    Returns: the updated order, or null if not found
// ─────────────────────────────────────────────────────────────────────────────
export const failOrder = async (purchaseId) => {
  // purchaseId here is the MongoDB _id (CoursePurchase document ObjectId)
  // eSewa uses newPurchase._id as its transaction_uuid
  const order = await CoursePurchase.findByIdAndUpdate(
    purchaseId,
    { status: "failed" },
    { new: true },
  );
  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET ORDER BY orderId  (the human-readable "LMS-ORD-..." string)
//    Called by: getPaymentStatus controller
//    Returns: the order with user and course details populated
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderByOrderId = async (orderId) => {
  const order = await CoursePurchase.findOne({ orderId })
    .populate("userId", "name email photoUrl")
    .populate("courses.courseId", "title thumbnail price");
  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET ALL COMPLETED PURCHASES  (admin view)
//    Called by: getAllPurchasedCourse / getCoursePurchases controllers
//    Note: Your two existing controllers do the same thing — this replaces both.
// ─────────────────────────────────────────────────────────────────────────────
export const getAllCompletedPurchases = async () => {
  const purchases = await CoursePurchase.find({ status: "completed" })
    .populate("userId", "name email photoUrl")
    .populate("courses.courseId", "title thumbnail")
    .sort({ createdAt: -1 });
  return purchases;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. CHECK IF USER HAS PURCHASED A SPECIFIC COURSE
//    Called by: getCourseDetailWithPurchaseStatus controller
//    Returns: true / false
// ─────────────────────────────────────────────────────────────────────────────
export const hasUserPurchasedCourse = async (userId, courseId) => {
  const purchase = await CoursePurchase.findOne({
    userId,
    "courses.courseId": courseId,
    status: "completed",
  });
  return !!purchase;
};
