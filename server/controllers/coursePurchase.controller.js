import Stripe from "stripe";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { createNotification } from "../service/notification.service.js";
import { CourseProgress } from "../models/courseProgress.model.js";


dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe Checkout Session for purchasing courses.
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id; // Assumes isAuthenticated middleware ran
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: "No courses selected!" });
    }

    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res
        .status(404)
        .json({ message: "One or more courses not found!" });
    }

    // Prepare Stripe line items and our internal purchase details
    const line_items = [];
    const purchaseCourses = [];
    let totalAmount = 0;

    courses.forEach((course) => {
      line_items.push({
        price_data: {
          currency: "npr",
          product_data: { name: course.title, images: [course.thumbnail] },
          unit_amount: course.price.current * 100,
        },
        quantity: 1,
      });
      purchaseCourses.push({
        courseId: course._id,
        priceAtPurchase: course.price.current,
      });
      totalAmount += course.price.current;
    });

    // Generate a unique orderId for your system
    const orderId = `LMS-ORD-${uuidv4().split("-")[0].toUpperCase()}`;

    // Create the Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
     success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cart`,

      // --- CRITICAL FIX: Convert all ObjectIds to strings for Stripe metadata ---
      metadata: {
        orderId,
        userId: userId.toString(), // <-- THE FIX
        courseIds: courseIds.join(","),
      },
      shipping_address_collection: {
        allowed_countries: ["NP"],
      },
    });

    if (!session || !session.id) {
      return res
        .status(500)
        .json({ success: false, message: "Could not create Stripe session." });
    }

    // Save a 'pending' purchase record to your database
    await CoursePurchase.create({
      orderId,
      userId,
      courses: purchaseCourses,
      totalAmount,
      paymentMethod: "Stripe",
      status: "pending",
      paymentDetails: { stripeSessionId: session.id },
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Session Creation Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Listens for events from Stripe. This is the endpoint that Stripe will call.
 */
export const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed.", error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  // Handle the 'checkout.session.completed' event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const purchase = await CoursePurchase.findOne({
        "paymentDetails.stripeSessionId": session.id,
      });

      // --- IMPROVED LOGIC ---
      if (!purchase) {
        // If we can't find the purchase, log it as an issue but don't tell Stripe to retry.
        // This could happen if there was a DB write error during session creation.
        console.error(
          `Webhook handler could not find purchase for session ID: ${session.id}`
        );
      } else if (purchase.status !== "completed") {
        // Only process if the order is still pending to prevent double-processing.
        purchase.totalAmount = session.amount_total / 100;
        purchase.status = "completed";
        await purchase.save();

        const courseIds = purchase.courses.map((c) => c.courseId);

        // Enroll user in courses
        await User.findByIdAndUpdate(purchase.userId, {
          $addToSet: { enrolledCourses: { $each: courseIds } },
          $pull: { cart: { $in: courseIds }, wishlist: { $in: courseIds } }, // Also clear cart/wishlist
        });

        await Course.updateMany(
          { _id: { $in: courseIds } },
          { $addToSet: { enrolledStudents: purchase.userId } }
        );

        // Send a success notification
        await createNotification(
          purchase.userId,
          "Your course purchase was successful!",
          "/my-learning",
          "purchase_success"
        );
      }
    } catch (error) {
      console.error("Error processing 'checkout.session.completed':", error);
      // Still return 200, but log the error for investigation.
    }
  }

  // Acknowledge receipt of the event to Stripe
  res.status(200).send();
};

/**
 * Public, user-aware controller to get details for a single course.
 */
export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator", select: "name headline photoUrl links" })
      .populate({ path: "sections", populate: { path: "lectures" } })
      .populate({ path: "reviews", populate: { path: "user", select: "name photoUrl" } })
      .lean();

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found!" });
    }

    // --- Default Values ---
    course.isEnrolled = false;
    course.allowReview = false;
    course.purchaseStatus = "not_purchased";
    course.progress = null;

    if (userId) {
      const purchase = await CoursePurchase.findOne({
        userId,
        "courses.courseId": courseId,
        status: "completed",
      });

      if (purchase) {
        course.isEnrolled = true;
        course.purchaseStatus = "completed";

        // --- PROGRESS CALCULATION LOGIC (MATCHES YOUR SCHEMA) ---
        const progress = await CourseProgress.findOne({ userId, courseId }).lean();

        const totalLectures = course.sections.reduce(
          (sum, section) => sum + (section.lectures?.length || 0),
          0
        );

        let completedLecturesCount = 0;
        let percentage = 0;

        if (progress?.lectureProgress?.length) {
          // Count lectures where 'viewed' is true, as per your schema
          completedLecturesCount = progress.lectureProgress.filter(lp => lp.viewed).length;
          if (totalLectures > 0) {
            percentage = Math.round((completedLecturesCount / totalLectures) * 100);
          }
        }

        course.progress = {
          // Send back the IDs of lectures that have been viewed
          completedLectures: progress?.lectureProgress?.filter(lp => lp.viewed).map(lp => lp.lectureId) || [],
          percentage,
        };

        // --- ALLOW REVIEW LOGIC ---
        // Only set to true if completion is 80% or more
        if (percentage >= 80) {
          course.allowReview = true;
        }
      }
    }

    return res.status(200).json({ success: true, course });
  } catch (error) {
    console.error("Error in getCourseDetailWithPurchaseStatus:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
/**
 * Retrieves all completed course purchases.
 * SECURITY: This should be an admin-only route.
 */
export const getCoursePurchases = async (req, res) => {
  // NOTE: Ensure this route is protected in your router file, e.g.:
  // router.route('/purchases').get(isAuthenticated, authorizeRoles('admin'), getCoursePurchases);
  try {
    const purchases = await CoursePurchase.find({ status: "completed" })
      .populate("userId", "name email photoUrl")
      .populate("courses.courseId", "title thumbnail");
    res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error("Error fetching course purchases:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch course purchases" });
  }
};

// NOTE: getAllPurchasedCourse appears to do the same thing as getCoursePurchases.
// You can probably remove it unless it has a different purpose.
export const getAllPurchasedCourse = async (_, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate("courses.courseId");
    if (!purchasedCourse) {
      return res.status(404).json({ purchasedCourse: [] });
    }
    return res.status(200).json({ purchasedCourse });
  } catch (error) {
    console.log(error);
  }
};
