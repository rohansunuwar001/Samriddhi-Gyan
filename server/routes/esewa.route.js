import express from "express";

import { completePayment, fillEsewaForm, initializePayment } from "../controllers/esewa.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { paymentFailed } from "../controllers/coursePurchase.controller.js";


const router = express.Router();
router.route("/initialize-esewa").post(isAuthenticated,initializePayment);
router.route("/complete-payment").get(completePayment);
router.route("/generate-esewa-form").get(fillEsewaForm);
router.route("/payment-failed").get(paymentFailed);

export default router