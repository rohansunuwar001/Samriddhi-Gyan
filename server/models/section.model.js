import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    // Each section holds an array of lectures
    lectures: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    }],
    // Reference to the course this section belongs to
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    // It's helpful to store the total duration of each section
    totalDurationInSeconds: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Section = mongoose.model("Section", sectionSchema);