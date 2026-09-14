// server/controllers/cart.controller.js

import { BaseController } from "../core/base.controller.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { Certification } from "../models/certification.model.js";

export class CartController extends BaseController {
  constructor() {
    super();
  }

  getCart = async (req, res) => {
    try {
      const userId = req.user._id;

      const user = await User.findById(userId)
        .populate("cart")
        .populate({
          path: "cartCertifications",
          populate: { path: "issuer", select: "name type" }
        })
        .populate("enrolledCourses");

      if (!user) {
        return this.sendError(res, "User not found", 404);
      }

      const enrolledIds = new Set(
        user.enrolledCourses.map((course) => course._id.toString()),
      );

      const filteredCart = user.cart.filter(
        (course) => !enrolledIds.has(course._id.toString()),
      );

      return this.sendSuccess(res, {
        cart: filteredCart,
        cartCertifications: user.cartCertifications || [],
      });
    } catch (error) {
      console.error(error);
      return this.sendError(res, "Server Error", 500);
    }
  };

  addToCart = async (req, res) => {
    try {
      if (req.user?.role === "admin") {
        return this.sendError(res, "Administrators cannot enroll in or purchase items.", 403);
      }

      const userId = req.user._id;
      const { courseId, certificationId } = req.body;

      if (!courseId && !certificationId) {
        return this.sendError(res, "Course ID or Certification ID is required", 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        return this.sendError(res, "User not found", 404);
      }

      if (certificationId) {
        const cert = await Certification.findById(certificationId);
        if (!cert) {
          return this.sendError(res, "Certification not found", 404);
        }

        if (user.cartCertifications?.some((id) => id.toString() === certificationId)) {
          return this.sendError(res, "Certification is already in your cart.", 400);
        }

        user.cartCertifications = user.cartCertifications || [];
        user.cartCertifications.push(certificationId);
        await user.save();

        return this.sendSuccess(res, {
          cart: user.cart,
          cartCertifications: user.cartCertifications,
        }, "Certification added to cart successfully");
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return this.sendError(res, "Course not found", 404);
      }

      if (user.enrolledCourses.some((id) => id.toString() === courseId)) {
        return this.sendError(res, "You already own this course.", 400);
      }

      user.cart.push(courseId);
      await user.save();

      return this.sendSuccess(res, {
        cart: user.cart,
        cartCertifications: user.cartCertifications,
      }, "Course added to cart successfully");
    } catch (error) {
      console.error(error);
      return this.sendError(res, "Server Error", 500);
    }
  };

  removeFromCart = async (req, res) => {
    try {
      const userId = req.user._id;
      const { courseId, certificationId } = req.body;

      if (!courseId && !certificationId) {
        return this.sendError(res, "Course ID or Certification ID is required", 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        return this.sendError(res, "User not found", 404);
      }

      if (certificationId) {
        user.cartCertifications = (user.cartCertifications || []).filter(
          (id) => id.toString() !== certificationId
        );
        await user.save();

        return this.sendSuccess(res, {
          cart: user.cart,
          cartCertifications: user.cartCertifications,
        }, "Certification removed from cart successfully");
      }

      user.cart = user.cart.filter((id) => id.toString() !== courseId);
      await user.save();

      return this.sendSuccess(res, {
        cart: user.cart,
        cartCertifications: user.cartCertifications,
      }, "Course removed from cart successfully");
    } catch (error) {
      console.error(error);
      return this.sendError(res, "Server Error", 500);
    }
  };
}

export const cartController = new CartController();

export const getCart = cartController.getCart;
export const addToCart = cartController.addToCart;
export const removeFromCart = cartController.removeFromCart;
