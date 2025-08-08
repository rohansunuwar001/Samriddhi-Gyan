import { Review } from "../models/review.model.js";
import { Course } from "../models/course.model.js";

// A helper function to recalculate and update a course's average rating
const updateCourseRating = async (courseId) => {
    const reviews = await Review.find({ course: courseId });
    if (reviews.length > 0) {
        const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
        const averageRating = totalRating / reviews.length;
        
        await Course.findByIdAndUpdate(courseId, {
            // CORRECTED: Pass the raw number. The Mongoose schema's 'set' function will handle rounding.
            ratings: averageRating, 
            numOfReviews: reviews.length,
        });
    } else {
        // If there are no reviews, reset the rating
        await Course.findByIdAndUpdate(courseId, {
            ratings: 0,
            numOfReviews: 0,
        });
    }
};

export const createReview = async (req, res) => {
    const { rating, comment } = req.body;
    const { courseId } = req.params;
    const userId = req.id; // From your auth middleware

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        // 1. Check if the user is enrolled in the course
        const isEnrolled = course.enrolledStudents.includes(userId);
        if (!isEnrolled) {
            return res.status(403).json({ message: "You must be enrolled in this course to leave a review." });
        }

        // 2. Check if the user has already reviewed this course
        const existingReview = await Review.findOne({ course: courseId, user: userId });
        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this course." });
        }

        // 3. Create and save the new review
        const review = await Review.create({
            rating,
            comment,
            user: userId,
            course: courseId,
        });

        // 4. Add the new review's ID to the course and update its rating
        course.reviews.push(review._id);
        await course.save();
        await updateCourseRating(courseId); // Recalculate the average rating

        res.status(201).json({
            success: true,
            message: "Review submitted successfully.",
            review,
        });

    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Server error while creating review." });
    }
};