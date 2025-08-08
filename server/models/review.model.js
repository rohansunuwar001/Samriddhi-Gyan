import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: [true, "A rating score is required."],
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: [true, "A review comment is required."],
        trim: true,
        maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    // Reference to the user who wrote the review
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Reference to the course being reviewed
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    }
}, { timestamps: true });

// This compound index ensures that a user can only write one review per course.
reviewSchema.index({ course: 1, user: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);