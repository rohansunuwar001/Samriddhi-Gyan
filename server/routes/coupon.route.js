import express from "express";
import {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/coupon.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Public / User route: Validate and calculate coupon discount
router.route("/validate").post(validateCoupon);

// Protected admin routes: CRUD coupons
router
  .route("/")
  .get(isAuthenticated, authorizeRoles("admin"), getCoupons)
  .post(isAuthenticated, authorizeRoles("admin"), createCoupon);

router
  .route("/:id")
  .get(isAuthenticated, authorizeRoles("admin"), getCouponById)
  .put(isAuthenticated, authorizeRoles("admin"), updateCoupon)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteCoupon);

export default router;
