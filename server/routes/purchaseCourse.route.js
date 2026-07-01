import express from "express";

import { initializePayment } from "../controllers/esewa.controller.js";

import { createCheckoutSession, getAllPurchasedCourse, getCourseDetailWithPurchaseStatus, getPaymentStatus } from "../controllers/coursePurchase.controller.js";
import { isAuthenticated, isOptionalAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   stripeWebhook
// );

// All other routes below (these will use express.json() if set globally)
router.route("/esewa").post(isAuthenticated, initializePayment);
router
  .route("/checkout/create-checkout-session")
  .post(isAuthenticated, createCheckoutSession);
router
  .route("/course/:courseId/detail-with-status")
  .get(isOptionalAuthenticated, getCourseDetailWithPurchaseStatus);
router.route("/").get(isAuthenticated, getAllPurchasedCourse);
router.get("/payment-status/:orderId", isAuthenticated, getPaymentStatus);

export default router;
