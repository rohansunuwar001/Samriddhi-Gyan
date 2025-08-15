// Make sure to import your Course model

import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";

/**
 * @desc    Add a course to the user's wishlist
 * @route   POST /api/wishlist/add
 * @access  Private
 */
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                message: "Course ID is required",
                success: false,
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Course not found",
                success: false,
            });
        }

        // Check if the course is already in the wishlist
        if (user.wishlist.includes(courseId)) {
            return res.status(400).json({
                message: "Course already in wishlist",
                success: false,
            });
        }

        user.wishlist.push(courseId);
        await user.save();

        res.status(200).json({
            message: "Course added to wishlist successfully",
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error",
            success: false,
        });
    }
};

/**
 * @desc    Remove a course from the user's wishlist
 * @route   POST /api/wishlist/remove
 * @access  Private
 */
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                message: "Course ID is required",
                success: false,
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // Check if the course is in the wishlist
        if (!user.wishlist.includes(courseId)) {
            return res.status(400).json({
                message: "Course not in wishlist",
                success: false,
            });
        }

        user.wishlist = user.wishlist.filter((id) => id.toString() !== courseId);
        await user.save();

        res.status(200).json({
            message: "Course removed from wishlist successfully",
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error",
            success: false,
        });
    }
};

/**
 * @desc    Get the user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('wishlist');

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        res.status(200).json({
            message: "Wishlist fetched successfully",
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error",
            success: false,
        });
    }
};