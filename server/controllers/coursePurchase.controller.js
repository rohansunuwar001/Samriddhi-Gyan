import Stripe from "stripe";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
// Adjust path if needed

import { createNotification } from "../service/notification.service.js";
import { User } from "../models/user.model.js"; // Adjust path as needed
dotenv.config({});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: "No courses selected!" });
    }

    // Fetch all courses
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res
        .status(404)
        .json({ message: "One or more courses not found!" });
    }

    // Prepare line items and purchase details
    const line_items = [];
    const purchaseCourses = [];
    let totalAmount = 0;

    courses.forEach((course) => {
      line_items.push({
        price_data: {
          currency: "npr",
          product_data: {
            name: course.title,
            images: [course.thumbnail],
          },
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

    // Generate unique orderId
    const orderId = `LMS-ORD-${uuidv4().split("-")[0].toUpperCase()}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/my-learning`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout-cancel`,
      metadata: {
        orderId,
        userId,
        courseIds: courseIds.join(","),
      },
      shipping_address_collection: {
        allowed_countries: ["NP"],
      },
    });

    if (!session.url) {
      return res
        .status(400)
        .json({ success: false, message: "Error while creating session" });
    }

    // Save the purchase record
    const newPurchase = new CoursePurchase({
      orderId,
      userId,
      courses: purchaseCourses,
      totalAmount,
      paymentMethod: "Stripe",
      status: "pending",
      // isPurchased: true, // Set to true as the purchase is being made
      paymentDetails: {
        stripeSessionId: session.id,
      },
    });
    await newPurchase.save();

    return res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const stripeWebhook = async (req, res) => {
  let event;

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const header = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, header, secret);
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  console.log("Stripe event type:", event.type);

  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object;
      const purchase = await CoursePurchase.findOne({
        "paymentDetails.stripeSessionId": session.id,
      });

      if (!purchase)
        return res.status(404).json({ message: "Purchase not found" });

      if (session.amount_total) {
        purchase.totalAmount = session.amount_total / 100;
      }
      purchase.status = "completed";
      await purchase.save();

      for (const courseObj of purchase.courses) {
        await Course.findByIdAndUpdate(courseObj.courseId, {
          $addToSet: { enrolledStudents: purchase.userId }
        });
      }

      // --- Add this block ---
      await User.findByIdAndUpdate(purchase.userId, {
        $addToSet: {
          enrolledCourses: { $each: purchase.courses.map((c) => c.courseId) },
        },
        $pull: {
          cart: { $in: purchase.courses.map((c) => c.courseId) },
          wishlist: { $in: purchase.courses.map((c) => c.courseId) },
        },
      });
      // --- End block ---

      // Send notification
      await createNotification(
        purchase.userId,
        "Your course purchase was successful!",
        "/my-learning",
        "purchase_success"
      );
    } catch (error) {
      console.error("Error handling event:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  if (event.type === "payment_intent.succeeded") {
    console.log("Payment intent succeeded:", event.data.object.id);
  }

  res.status(200).send();
};

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({
        path: "sections",
        populate: {
          path: "lectures",
          select: "title videoUrl durationInSeconds isPreview", // Add any lecture fields you need
        },
        select: "title lectures totalDurationInSeconds", // Add any section fields you need
      })
      .populate({
        path: "creator",
        select: "name headline photoUrl links",
      })
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name photoUrl",
        },
      });

    if (!course) {
      return res.status(404).json({ message: "course not found!" });
    }

    // Default values
    let purchaseStatus = "not_purchased";
    let allowReview = false;
    let isPurchased = false;

    // Check if user has purchased this course
    const purchased = await CoursePurchase.findOne({
      userId,
      "courses.courseId": courseId,
      status: "completed",
    });

    if (purchased) {
      purchaseStatus = "completed";
      allowReview = true;
      isPurchased = true;
    }

    return res.status(200).json({
      course,
      purchaseStatus,
      allowReview,
      isPurchased,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllPurchasedCourse = async (_, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate("courses.courseId");
    if (!purchasedCourse) {
      return res.status(404).json({
        purchasedCourse: [],
      });
    }
    return res.status(200).json({
      purchasedCourse,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getCoursePurchases = async (req, res) => {
  try {
    // Find all course purchases, populate user and course info
    const purchases = await CoursePurchase.find({ status: "completed" })
      .populate("userId", "name email photoUrl")
      .populate("courses.courseId", "title thumbnail price");

    res.status(200).json({ purchases });
  } catch (error) {
    console.error("Error fetching course purchases:", error);
    res.status(500).json({ message: "Failed to fetch course purchases" });
  }
};
