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
import { Certification } from "../models/certification.model.js";
import { ExamRegistration } from "../models/examRegistration.model.js";

/**
 * Creates a new pending order OR reuses an existing one if the user
 * already has a recent pending order for the same courses.
 *
 * Returns: { order, courses, totalAmount, purchaseCourses, reused }
 *   - reused: true if an existing pending order was returned instead of creating a new one
 */
export const createPendingOrder = async ({
  userId,
  courseIds = [],
  certificationIds = [],
  paymentMethod,
}) => {
  // Fetch course data to lock prices
  const courses = courseIds.length > 0
    ? await Course.find({ _id: { $in: courseIds } }).select("title thumbnail price")
    : [];

  if (courseIds.length > 0 && courses.length !== courseIds.length) {
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

  // Fetch certifications
  const certifications = certificationIds.length > 0
    ? await Certification.find({ _id: { $in: certificationIds } }).select("name badgeUrl examPrice")
    : [];

  if (certificationIds.length > 0 && certifications.length !== certificationIds.length) {
    const error = new Error("One or more certifications not found!");
    error.statusCode = 404;
    throw error;
  }

  const purchaseCertifications = await Promise.all(
    certifications.map(async (cert) => {
      // Calculate attempt number & reapplying status for discount (same as initializeExamEsewa)
      const finishedCount = await ExamRegistration.countDocuments({
        student: userId,
        certification: cert._id,
        examStatus: "completed",
      });
      const isReapplying = finishedCount > 0;
      const basePrice = cert.examPrice || 0;
      const finalPrice = isReapplying ? Math.round(basePrice * 0.75) : basePrice;

      return {
        certificationId: cert._id,
        priceAtPurchase: finalPrice,
      };
    })
  );

  const totalCourseAmount = purchaseCourses.reduce(
    (sum, item) => sum + item.priceAtPurchase,
    0,
  );

  const totalCertAmount = purchaseCertifications.reduce(
    (sum, item) => sum + item.priceAtPurchase,
    0,
  );

  const totalAmount = totalCourseAmount + totalCertAmount;

  // Check for an existing recent pending order for courses only
  if (certificationIds.length === 0 && courseIds.length > 0) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingPendingOrder = await CoursePurchase.findOne({
      userId,
      status: "pending",
      paymentMethod,
      createdAt: { $gte: oneDayAgo },
      "courses.courseId": { $all: courseIds },
      certifications: { $size: 0 },
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
        purchaseCertifications: [],
        reused: true,
      };
    }
  }

  // Create a fresh order
  const order = await CoursePurchase.create({
    orderId: generateOrderId(),
    userId,
    courses: purchaseCourses,
    certifications: purchaseCertifications,
    totalAmount,
    paymentMethod,
    status: "pending",
    paymentDetails: {},
  });

  return { order, courses, totalAmount, purchaseCourses, purchaseCertifications, reused: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPLETE AN ORDER (the shared enrollment logic)
//    Called by: stripeWebhook, completePayment (eSewa)
// ─────────────────────────────────────────────────────────────────────────────
export const completeOrder = async (purchase) => {
  if (purchase.status === "completed") return purchase;

  purchase.status = "completed";
  await purchase.save();

  const courseIds = (purchase.courses || []).map((c) => c.courseId);
  const certItems = purchase.certifications || [];

  // 1. Process course enrollments
  if (courseIds.length > 0) {
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

    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { enrolledStudents: purchase.userId } }
    );

    await createNotification(
      purchase.userId,
      `Your purchase was successful! You are now enrolled in: "${courseTitles}".`,
      "/my-learning",
      "course_enrollment"
    );
  }

  // 2. Process certification vouchers
  if (certItems.length > 0) {
    const certIds = certItems.map((c) => c.certificationId);

    // Pull from user's cartCertifications
    await User.findByIdAndUpdate(purchase.userId, {
      $pull: {
        cartCertifications: { $in: certIds },
      },
    });

    for (const certItem of certItems) {
      const certId = certItem.certificationId;
      const pricePaid = certItem.priceAtPurchase;

      const cert = await Certification.findById(certId).lean();
      if (cert) {
        const finishedCount = await ExamRegistration.countDocuments({
          student: purchase.userId,
          certification: certId,
          examStatus: "completed",
        });
        const attemptNumber = finishedCount + 1;

        // Check if there is a pending registration and update it, or create a new completed registration
        let reg = await ExamRegistration.findOne({
          student: purchase.userId,
          certification: certId,
          paymentStatus: "pending",
        });

        if (reg) {
          reg.paymentStatus = "completed";
          reg.examStatus = "registered";
          reg.amountPaid = pricePaid;
          reg.paymentMethod = purchase.paymentMethod;
          reg.attemptNumber = attemptNumber;
          await reg.save();
        } else {
          await ExamRegistration.create({
            student: purchase.userId,
            certification: certId,
            paymentStatus: "completed",
            examStatus: "registered",
            amountPaid: pricePaid,
            paymentMethod: purchase.paymentMethod,
            attemptNumber: attemptNumber,
          });
        }

        await createNotification(
          purchase.userId,
          `Your purchase was successful! Exam voucher for "${cert.name}" is now active.`,
          `/certification/${cert.slug}`,
          "exam_registration"
        );
      }
    }
  }

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
    { returnDocument: 'after' },
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
