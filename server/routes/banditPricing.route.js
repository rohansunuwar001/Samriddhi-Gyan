import express from "express";
import { getCourseDiscount, recordBanditPurchase } from "../controllers/banditPricing.controller.js";

const router = express.Router();

router.get("/:courseId", getCourseDiscount);
router.post("/purchase", recordBanditPurchase);

export default router;
