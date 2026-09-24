import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lectureId: {
      type: String,
      required: true,
    },
    lectureTitle: {
      type: String,
      default: "Untitled Lecture",
    },
    timestamp: {
      type: Number,
      default: 0, // timestamp in seconds within the video
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, courseId: 1, createdAt: -1 });

const Note = mongoose.model("Note", NoteSchema);

export default Note;
