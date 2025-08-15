import { Course } from "../models/course.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { createNotification } from "../service/notification.service.js";

const updateCourseRating = async (courseId) => {
    const reviews = await Review.find({ course: courseId });
    if (reviews.length > 0) {
        const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
        const averageRating = totalRating / reviews.length;
        
        await Course.findByIdAndUpdate(courseId, {
            ratings: averageRating, 
            numOfReviews: reviews.length,
        });
    } else {
        await Course.findByIdAndUpdate(courseId, {
            ratings: 0,
            numOfReviews: 0,
        });
    }
};

export const createReview = async (req, res) => {
    const { rating, comment } = req.body;
    const { courseId } = req.params;
    const userId = req.user._id;

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        const isEnrolled = course.enrolledStudents.includes(userId);
        if (!isEnrolled) {
            return res.status(403).json({ message: "You must be enrolled in this course to leave a review." });
        }

        const existingReview = await Review.findOne({ course: courseId, user: userId });
        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this course." });
        }

        const review = await Review.create({
            rating,
            comment,
            user: userId,
            course: courseId,
        });

        course.reviews.push(review._id);
        await course.save();
        await updateCourseRating(courseId);

        // --- 2. TRIGGER THE INSTRUCTOR NOTIFICATION HERE ---
        const student = await User.findById(userId);
        if (course.creator && student) {
            await createNotification(
                course.creator, // The ID of the course instructor
                `${student.name} left a ${rating}-star review on your course "${course.courseTitle}".`,
                `/instructor/course/${courseId}`, // Example link to instructor course manager
                'new_review'
            );
        }

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

export const replyToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reply } = req.body;
        const instructorId = req.user._id;

        const review = await Review.findById(reviewId).populate('course');
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // --- SECURITY CHECK: Ensure the instructor owns the course this review is for ---
        if (review.course.creator.toString() !== instructorId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to reply to this review.' });
        }
        
        review.reply = reply;
        await review.save();

        // Optional: Notify the student that the instructor replied.
        // await createNotification(review.user, `Your instructor replied to your review...`);

        res.status(200).json({ success: true, message: 'Reply submitted successfully.', review });

    } catch (error) {
        console.error("Error replying to review:", error);
        res.status(500).json({ success: false, message: 'Server error while submitting reply.' });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const instructorId = req.user._id;

        const review = await Review.findById(reviewId).populate('course');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        const courseId = review.course._id;

        // --- SECURITY CHECK: Ensure the instructor owns the course ---
        if (review.course.creator.toString() !== instructorId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
        }
        
        // --- DATA CONSISTENCY LOGIC ---
        // 1. Remove the review's ID from the course's `reviews` array
        await Course.findByIdAndUpdate(courseId, {
            $pull: { reviews: reviewId }
        });
        
        // 2. Delete the actual review document
        await Review.findByIdAndDelete(reviewId);

        // 3. Recalculate the course's average rating now that the review is gone
        await updateCourseRating(courseId);

        res.status(200).json({ success: true, message: 'Review deleted successfully.' });

    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ success: false, message: 'Server error while deleting review.' });
    }
};