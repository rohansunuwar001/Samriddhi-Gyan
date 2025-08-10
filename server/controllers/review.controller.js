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
    const userId = req.id;

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