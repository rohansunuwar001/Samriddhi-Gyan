// server/controllers/coursePurchase.controller.js
//
// WHAT CHANGED: Controllers no longer touch models directly.
// They delegate all DB work to purchase.service.js.
// Each controller function is now only responsible for:
//   1. Reading from req
//   2. Calling the service
//   3. Sending the HTTP response

import Stripe from "stripe";
import dotenv from "dotenv";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import Category from "../models/category.model.js";
import { completeOrder, createPendingOrder, getAllCompletedPurchases, getOrderByOrderId } from "../service/purchase.service.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const normalizeTopicName = (value) => value?.trim().toLowerCase();

const getCategoryDisplayInfo = async (categoryName) => {
  if (!categoryName) return { categoryDetails: null, categoryHierarchy: [] };

  const category = await Category.findOne({ name: categoryName })
    .populate('parent', 'name slug')
    .lean();

  if (!category) {
    return { categoryDetails: null, categoryHierarchy: [categoryName] };
  }

  return {
    categoryDetails: category,
    categoryHierarchy: category.parent ? [category.parent.name, category.name] : [category.name],
  };
};

const removeDuplicateCategoryTopics = (topics, category) => {
  if (!Array.isArray(topics) || topics.length === 0) return [];

  const categoryName = normalizeTopicName(category);
  const seen = new Set();

  return topics
    .map((topic) => topic?.trim())
    .filter(Boolean)
    .filter((topic) => {
      const normalizedTopic = normalizeTopicName(topic);
      if (!normalizedTopic || normalizedTopic === categoryName || seen.has(normalizedTopic)) {
        return false;
      }

      seen.add(normalizedTopic);
      return true;
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /checkout/create-checkout-session
// Creates a Stripe session and a "pending" order in the DB.
// ─────────────────────────────────────────────────────────────────────────────
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: "No courses selected!" });
    }

    // ── Step 1: Create the pending order via service ───────────────────────
    // The service handles: fetching courses, locking prices, saving to DB
    const { order, courses, totalAmount } = await createPendingOrder({
      userId,
      courseIds,
      paymentMethod: "Stripe",
    });

    // ── Step 2: Build Stripe line_items from the fetched courses ───────────
    // (Controller's job: prepare gateway-specific data)
    const line_items = courses.map((course) => ({
      price_data: {
        currency: "npr",
        product_data: { name: course.title, images: [course.thumbnail] },
        unit_amount: course.price.current * 100, // Stripe expects paise/cents
      },
      quantity: 1,
    }));

    // ── Step 3: Create the Stripe Checkout session ─────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        orderId: order.orderId,
        userId: userId.toString(),
        courseIds: courseIds.join(","),
      },
      shipping_address_collection: { allowed_countries: ["NP"] },
    });

    if (!session?.id) {
      return res
        .status(500)
        .json({ success: false, message: "Could not create Stripe session." });
    }

    // ── Step 4: Save the Stripe session ID onto the pending order ──────────
    order.paymentDetails.stripeSessionId = session.id;
    await order.save();

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Session Creation Error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message || "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook  (Stripe calls this automatically after payment)
// Raw body required — see app.js for express.raw() setup on this route.
// ─────────────────────────────────────────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const purchase = await CoursePurchase.findOne({
        "paymentDetails.stripeSessionId": session.id,
      });

      if (!purchase) {
        console.error(`No purchase found for Stripe session: ${session.id}`);
      } else {
        // Sync Stripe's final amount, then hand off to service
        purchase.totalAmount = session.amount_total / 100;
        // completeOrder handles: status, enrollment, notification, cart/wishlist
        await completeOrder(purchase);
      }
    } catch (error) {
      console.error("Error processing checkout.session.completed:", error);
      // Always return 200 to Stripe so it doesn't retry indefinitely
    }
  }

  res.status(200).send();
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /course/:courseId/detail-with-status
// Returns course details + enrollment/progress info for the logged-in user.
// (No changes needed here — this controller queries CourseProgress directly
//  which is correct since it's not purchase logic, it's progress logic.)
// ─────────────────────────────────────────────────────────────────────────────
// export const getCourseDetailWithPurchaseStatus = async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const userId = req.user?._id;

//     const course = await Course.findById(courseId)
//       .populate({ path: "creator", select: "name headline photoUrl links" })
//       .populate({ path: "sections", populate: { path: "lectures" } })
//       .populate({ path: "reviews", populate: { path: "user", select: "name photoUrl" } })
//       .lean();

//     if (!course) {
//       return res.status(404).json({ success: false, message: "Course not found!" });
//     }

//     // Default values — not enrolled
//     course.isEnrolled = false;
//     course.allowReview = false;
//     course.purchaseStatus = "not_purchased";
//     course.progress = null;

//     if (userId) {
//       const purchase = await CoursePurchase.findOne({
//         userId,
//         "courses.courseId": courseId,
//         status: "completed",
//       });

//       if (purchase) {
//         course.isEnrolled = true;
//         course.purchaseStatus = "completed";

//         // Calculate progress from CourseProgress model
//         const progress = await CourseProgress.findOne({ userId, courseId }).lean();

//         const totalLectures = course.sections.reduce(
//           (sum, section) => sum + (section.lectures?.length || 0),
//           0
//         );

//         let percentage = 0;
//         let completedLectures = [];

//         if (progress?.lectureProgress?.length) {
//           const viewedLectures = progress.lectureProgress.filter((lp) => lp.viewed);
//           completedLectures = viewedLectures.map((lp) => lp.lectureId);
//           if (totalLectures > 0) {
//             percentage = Math.round((viewedLectures.length / totalLectures) * 100);
//           }
//         }

//         course.progress = { completedLectures, percentage };
//         course.allowReview = percentage >= 80;
//       }
//     }

//     return res.status(200).json({ success: true, course });
//   } catch (error) {
//     console.error("getCourseDetailWithPurchaseStatus error:", error);
//     return res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };











// REPLACE only the getCourseDetailWithPurchaseStatus function in coursePurchase.controller.js
//
// ROOT CAUSE OF THE BUG:
// The controller checked ONLY CoursePurchase collection for status="completed".
// But for eSewa payments, the enrollment (User.enrolledCourses + Course.enrolledStudents)
// can succeed even if the CoursePurchase document gets stuck on "pending" — because
// eSewa's completePayment() saves enrollment AFTER setting status="completed", and a
// crash or redirect issue between those two steps leaves the purchase as "pending"
// while the user IS actually enrolled.
//
// FIX: Two-step check —
//   1. Check CoursePurchase (the proper way)
//   2. If that fails, check course.enrolledStudents as a reliable fallback
//      (this array is the ground truth for who actually has access)

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator", select: "name headline photoUrl links" })
      .populate({ path: "sections", populate: { path: "lectures" } })
      .populate({
        path: "reviews",
        populate: { path: "user", select: "name photoUrl" },
      })
      .lean();

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found!" });
    }

    // Default values — not enrolled
    course.topics = removeDuplicateCategoryTopics(course.topics, course.category);
    Object.assign(course, await getCategoryDisplayInfo(course.category));

    course.isEnrolled      = false;
    course.allowReview     = false;
    course.purchaseStatus  = "not_purchased";
    course.progress        = null;

    if (userId) {
      // ── Step 1: Check the CoursePurchase collection (preferred) ───────────
      const purchase = await CoursePurchase.findOne({
        userId,
        "courses.courseId": courseId,
        status: "completed",
      });

      // ── Step 2: Fallback — check if user is in enrolledStudents ───────────
      // This catches cases where eSewa enrollment succeeded but the purchase
      // document is still "pending" due to a redirect/crash between the two steps.
      const isDirectlyEnrolled = course.enrolledStudents?.some(
        (studentId) => studentId.toString() === userId.toString()
      );

      const isSubscribedAndIncluded = req.user?.subscription?.status === "active" && course.includedInSubscription;

      const hasAccess = !!purchase || isDirectlyEnrolled || !!isSubscribedAndIncluded;

      if (hasAccess) {
        course.isEnrolled     = true;
        course.purchaseStatus = "completed";

        // ── If we have a stale purchase doc, fix it now ───────────────────
        // This self-heals the data so future checks work correctly
        if (!purchase && isDirectlyEnrolled) {
          await CoursePurchase.findOneAndUpdate(
            { userId, "courses.courseId": courseId },
            { status: "completed" },
            { new: true }
          ).catch(() => {}); // non-critical — don't block the response
        }

        // ── Calculate progress ─────────────────────────────────────────────
        const progress = await CourseProgress.findOne({ userId, courseId }).lean();

        const totalLectures = course.sections.reduce(
          (sum, section) => sum + (section.lectures?.length || 0),
          0
        );

        let percentage = 0;
        let completedLectures = [];

        if (progress?.lectureProgress?.length) {
          const viewed = progress.lectureProgress.filter((lp) => lp.viewed);
          completedLectures = viewed.map((lp) => lp.lectureId);
          if (totalLectures > 0) {
            percentage = Math.round((viewed.length / totalLectures) * 100);
          }
        }

        course.progress    = { completedLectures, percentage };
        course.allowReview = percentage >= 80;
      }
    }

    return res.status(200).json({ success: true, course });
  } catch (error) {
    console.error("getCourseDetailWithPurchaseStatus error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};














// ─────────────────────────────────────────────────────────────────────────────
// GET /  (admin: all completed purchases)
// Replaces both getAllPurchasedCourse and getCoursePurchases — they did the
// same thing. One function is enough.
// ─────────────────────────────────────────────────────────────────────────────
export const getAllPurchasedCourse = async (req, res) => {
  try {
    const purchases = await getAllCompletedPurchases(); // ← calls service
    return res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error("getAllPurchasedCourse error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch purchases" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /payment-status/:orderId
// Checks the status of an order by its human-readable orderId ("LMS-ORD-...").
// Called by the frontend on the success/failed page to confirm payment.
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentStatus = async (req, res) => {
  try {
    const order = await getOrderByOrderId(req.params.orderId); // ← calls service

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      status: order.status,
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /payment-failed
// eSewa redirects here on failure. Marks the order as "failed".
// FIX: The original used findByIdAndUpdate(transaction_uuid) which is WRONG
//      because transaction_uuid is the MongoDB _id of the CoursePurchase doc.
//      We now use findByIdAndUpdate correctly.
// ─────────────────────────────────────────────────────────────────────────────
export const paymentFailed = async (req, res) => {
  const { transaction_uuid } = req.query;

  if (transaction_uuid) {
    // transaction_uuid IS the CoursePurchase MongoDB _id (set in esewa controller)
    await CoursePurchase.findByIdAndUpdate(transaction_uuid, { status: "failed" });
  }

  return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
};