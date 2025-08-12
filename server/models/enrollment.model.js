import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    // --- Core Relationships ---
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    // A reference back to the transaction for auditing
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },

    // --- Progress Tracking System ---

    // An array storing the ObjectIds of all lectures the user has completed for THIS course.
    // This is the single source of truth for progress.
    completedLectures: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
    }],
    
    // Stores the last lecture the user was viewing to enable a "Continue Watching" feature.
    lastViewedLecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
    },
    
    // This timestamp is set only once when the user completes the final lecture.
    // It remains null until progress is 100%, and can be used to issue certificates.
    completedAt: {
        type: Date
    }

}, {
    // CRITICAL: This ensures virtual fields are included when you send the data as JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true // Adds enrolledAt (via createdAt) and lastActivity (via updatedAt)
});

// --- VIRTUAL FIELD FOR ON-THE-FLY PROGRESS CALCULATION ---

// 'progressPercentage' is a virtual field. It is NOT saved in your database.
// It is calculated automatically every time you fetch an enrollment.
enrollmentSchema.virtual('progressPercentage').get(function() {
    // To make this work, you MUST use `.populate('courseId', 'totalLectures')` when you query.
    // Your `Course` schema conveniently already has a `totalLectures` field!
    if (!this.courseId || !this.courseId.totalLectures) {
        return 0;
    }
    
    const totalLectures = this.courseId.totalLectures;
    const completedCount = this.completedLectures.length;

    if (totalLectures === 0) {
        return 0; // Avoid NaN if a course somehow has 0 lectures.
    }

    // Calculate and round the percentage.
    const percentage = (completedCount / totalLectures) * 100;
    return Math.round(percentage);
});


// This database index prevents a user from being accidentally enrolled in the same course more than once.
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);