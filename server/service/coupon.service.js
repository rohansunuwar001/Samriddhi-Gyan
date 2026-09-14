import { Coupon } from "../models/coupon.model.js";
import { BaseService } from "../core/base.service.js";

export class CouponService extends BaseService {
  constructor() {
    super(Coupon);
  }

  async getAllCoupons() {
    return await Coupon.find().populate("courseId", "title").sort({ createdAt: -1 });
  }

  async getCouponById(id) {
    return await Coupon.findById(id).populate("courseId", "title");
  }

  async createCoupon(data) {
    const code = data.code?.trim().toUpperCase();
    if (!code) {
      throw new Error("Coupon code is required");
    }

    const existing = await Coupon.findOne({ code });
    if (existing) {
      throw new Error(`Coupon with code "${code}" already exists`);
    }

    const payload = {
      ...data,
      code,
      discountValue: Number(data.discountValue),
      minPurchaseAmount: Number(data.minPurchaseAmount) || 0,
      maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      courseId: data.courseId ? data.courseId : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
    };

    return await Coupon.create(payload);
  }

  async updateCoupon(id, data) {
    if (data.code) {
      const code = data.code.trim().toUpperCase();
      const existing = await Coupon.findOne({ code, _id: { $ne: id } });
      if (existing) {
        throw new Error(`Another coupon with code "${code}" already exists`);
      }
      data.code = code;
    }

    const payload = { ...data };
    if (payload.discountValue !== undefined) payload.discountValue = Number(payload.discountValue);
    if (payload.minPurchaseAmount !== undefined) payload.minPurchaseAmount = Number(payload.minPurchaseAmount) || 0;
    if (payload.maxDiscountAmount !== undefined) payload.maxDiscountAmount = payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : null;
    if (payload.usageLimit !== undefined) payload.usageLimit = payload.usageLimit ? Number(payload.usageLimit) : null;
    if (payload.courseId !== undefined) payload.courseId = payload.courseId ? payload.courseId : null;
    if (payload.validUntil !== undefined) payload.validUntil = payload.validUntil ? new Date(payload.validUntil) : null;

    return await Coupon.findByIdAndUpdate(id, payload, { new: true });
  }

  async deleteCoupon(id) {
    return await Coupon.findByIdAndDelete(id);
  }

  async validateCoupon({ code, courseId = null, amount = 0 }) {
    if (!code || typeof code !== "string" || !code.trim()) {
      throw new Error("Please enter a valid coupon code");
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
      throw new Error("Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new Error("This coupon is currently inactive");
    }

    const now = new Date();
    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      throw new Error("This coupon is not active yet");
    }

    if (coupon.validUntil && now > new Date(coupon.validUntil)) {
      throw new Error("This coupon has expired");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("This coupon usage limit has been reached");
    }

    const purchaseAmount = Number(amount) || 0;
    if (coupon.minPurchaseAmount && purchaseAmount < coupon.minPurchaseAmount) {
      throw new Error(
        `Minimum purchase amount of Rs ${coupon.minPurchaseAmount} is required to apply this coupon`
      );
    }

    if (coupon.courseId && courseId) {
      if (coupon.courseId.toString() !== courseId.toString()) {
        throw new Error("This coupon is not applicable for this course");
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((purchaseAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      // Fixed amount
      discountAmount = Math.min(coupon.discountValue, purchaseAmount);
    }

    const finalPrice = Math.max(0, purchaseAmount - discountAmount);

    return {
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minPurchaseAmount: coupon.minPurchaseAmount,
        description: coupon.description,
      },
      discountAmount,
      finalPrice,
    };
  }
}

export const couponService = new CouponService();
