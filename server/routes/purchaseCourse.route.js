import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { initializePayment } from "../controllers/esewa.controller.js";
import {
  createCheckoutSession,
  getAllPurchasedCourse,
  getCourseDetailWithPurchaseStatus,
  stripeWebhook,
} from "../controllers/coursePurchase.controller.js";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// All other routes below (these will use express.json() if set globally)
router.route("/esewa").post(isAuthenticated, initializePayment);
router
  .route("/checkout/create-checkout-session")
  .post(isAuthenticated, createCheckoutSession);
router
  .route("/course/:courseId/detail-with-status")
  .get(isAuthenticated, getCourseDetailWithPurchaseStatus);
router.route("/").get(isAuthenticated, getAllPurchasedCourse);

export default router;
