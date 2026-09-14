import { BaseController } from "../core/base.controller.js";
import { couponService } from "../service/coupon.service.js";

export class CouponController extends BaseController {
  constructor(service = couponService) {
    super();
    this.service = service;
  }

  getCoupons = async (req, res) => {
    try {
      const coupons = await this.service.getAllCoupons();
      return this.sendSuccess(res, { coupons });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  getCouponById = async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await this.service.getCouponById(id);
      if (!coupon) {
        return this.sendError(res, "Coupon not found", 404);
      }
      return this.sendSuccess(res, { coupon });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  createCoupon = async (req, res) => {
    try {
      const coupon = await this.service.createCoupon(req.body);
      return this.sendSuccess(res, { coupon }, "Coupon created successfully", 201);
    } catch (error) {
      return this.sendError(res, error.message, 400);
    }
  };

  updateCoupon = async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await this.service.updateCoupon(id, req.body);
      if (!coupon) {
        return this.sendError(res, "Coupon not found", 404);
      }
      return this.sendSuccess(res, { coupon }, "Coupon updated successfully");
    } catch (error) {
      return this.sendError(res, error.message, 400);
    }
  };

  deleteCoupon = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteCoupon(id);
      return this.sendSuccess(res, {}, "Coupon deleted successfully");
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  validateCoupon = async (req, res) => {
    try {
      const { code, courseId, amount } = req.body;
      const result = await this.service.validateCoupon({ code, courseId, amount });
      return this.sendSuccess(res, result, "Coupon applied successfully");
    } catch (error) {
      return this.sendError(res, error.message, 400);
    }
  };
}

const couponController = new CouponController();
export const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = couponController;
