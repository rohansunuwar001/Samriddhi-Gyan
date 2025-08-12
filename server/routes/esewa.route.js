import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { completePayment, fillEsewaForm, initializePayment } from "../controllers/esewa.controller.js";


const router = express.Router();
router.route("/initialize-esewa").post(isAuthenticated,initializePayment);
router.route("/complete-payment").get(completePayment);
router.route("/generate-esewa-form").get(fillEsewaForm);

export default router