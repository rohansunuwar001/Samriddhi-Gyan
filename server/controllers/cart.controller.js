// controllers/cartController.js

import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";

// Make sure to import your Course model

/**
 * @desc    Get all courses in the user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate("cart")
      .populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Convert enrolled courses into a Set for fast lookup
    const enrolledIds = new Set(
      user.enrolledCourses.map((course) => course._id.toString()),
    );

    // Hide already purchased courses
    const filteredCart = user.cart.filter(
      (course) => !enrolledIds.has(course._id.toString()),
    );

    res.status(200).json({
      success: true,
      cart: filteredCart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * @desc    Add a course to the user's cart
 * @route   POST /api/cart/add
 * @access  Private
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    if (!courseId) {
      return res
        .status(400)
        .json({ message: "Course ID is required", success: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found", success: false });
    }

    // Check if the course is already in the cart
    if (user.enrolledCourses.some((id) => id.toString() === courseId)) {
      return res.status(400).json({
        success: false,
        message: "You already own this course.",
      });
    }

    user.cart.push(courseId);
    await user.save();

    res.status(200).json({
      message: "Course added to cart successfully",
      success: true,
      cart: user.cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

/**
 * @desc    Remove a course from the user's cart
 * @route   POST /api/cart/remove
 * @access  Private
 */
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    if (!courseId) {
      return res
        .status(400)
        .json({ message: "Course ID is required", success: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Remove the course from the cart array
    user.cart = user.cart.filter((id) => id.toString() !== courseId);
    await user.save();

    res.status(200).json({
      message: "Course removed from cart successfully",
      success: true,
      cart: user.cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};
