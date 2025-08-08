import express from "express";
import { createCheckoutSession, getAllPurchasedCourse, getCourseDetailWithStatus, stripeWebhook } from "../controllers/coursePurchase.controller.js";
import { initializePayment } from "../controllers/esewa.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();
router.route("/esewa").post(isAuthenticated,initializePayment);
router.route("/checkout/create-checkout-session").post(isAuthenticated, createCheckoutSession);
router.route("/webhook").post(express.raw({type:"application/json"}), stripeWebhook);
router.route("/course/:courseId/detail-with-status").get(isAuthenticated,getCourseDetailWithStatus);
router.route("/").get(isAuthenticated,getAllPurchasedCourse);
export default router;