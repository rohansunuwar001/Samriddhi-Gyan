import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    // --- CORE COURSE INFO (Updated for consistency) ---
    title: {
      // RENAMED from courseTitle
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      // RENAMED from subTitle
      type: String,
      trim: true,
    },
    description: {
      // This will hold the main description HTML
      type: String,
      trim: true,
    },
    language: {
      // NEW
      type: String,
      required: true,
      default: "English",
    },
    category: {
      type: String,
      required: true,
    },
    level: {
      // RENAMED from courseLevel
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
    },

    // --- PRICING & METADATA (Updated for new structure) ---
    price: {
      // UPDATED to a nested object
      original: { type: Number, required: true },
      current: { type: Number, required: true },
      // The discount percentage will be calculated on the frontend or backend dynamically
    },
    thumbnail: {
      type: String,
      // The thumbnail is NOT required for initial creation.
      // It can be added later. We can give it a default placeholder.
      default: "https://via.placeholder.com/720x405.png?text=Course+Thumbnail",
    },

    isBestseller: {
      // NEW
      type: Boolean,
      default: false,
    },

    // --- COURSE STRUCTURE (Major Architectural Change) ---
    // A Course now has Sections, and each Section has Lectures.
    sections: [
      {
        // REPLACED the old 'lectures' array
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
    totalLectures: {
      // NEW - For quick display
      type: Number,
      default: 0,
    },
    totalDurationInSeconds: {
      // NEW - For calculation and display
      type: Number,
      default: 0,
    },

    // --- STUDENT-FACING CONTENT ---
    learnings: {
      // NEW - "What you'll learn"
      type: [String],
      default: [],
    },
    requirements: {
      // NEW
      type: [String],
      default: [],
    },
    includes: {
      // NEW - "This course includes"
      type: [String],
      default: [],
    },
    subtitles: {
      // NEW - Array of available subtitle languages
      type: [String],
      default: [],
    },

    // --- USER RELATIONSHIPS & PUBLISHING ---
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },

    // --- REVIEWS & RATINGS (Existing fields are good) ---
    ratings: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating cannot be more than 5"],
      set: (val) => Math.round(val * 10) / 10,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
