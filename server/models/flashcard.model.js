import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema({
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
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  repetitions: {
    type: Number,
    default: 0,
  },
  interval: {
    type: Number,
    default: 1, // in days
  },
  easeFactor: {
    type: Number,
    default: 2.5,
  },
  nextReviewDate: {
    type: Date,
    default: () => new Date(),
  },
}, { timestamps: true });

FlashcardSchema.index({ userId: 1, courseId: 1, nextReviewDate: 1 });

const Flashcard = mongoose.model("Flashcard", FlashcardSchema);

export default Flashcard;
