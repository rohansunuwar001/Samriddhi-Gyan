import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lectureProgress: [
    {
      lectureId: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture" },
      viewed: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

export const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);