import mongoose from "mongoose";
import { generateEmbedding } from "../service/embedding.service.js";

const courseSchema = new mongoose.Schema(
  {
    // --- CORE COURSE INFO ---
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      required: true,
      default: "English",
    },
    category: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
    },

    // --- PRICING & METADATA ---
    price: {
      original: { type: Number, required: true },
      current: { type: Number, required: true },
    },
    thumbnail: {
      type: String,
      default: "https://via.placeholder.com/720x405.png?text=Course+Thumbnail",
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },

    // --- COURSE STRUCTURE ---
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],
    totalLectures: {
      type: Number,
      default: 0,
    },
    totalDurationInSeconds: {
      type: Number,
      default: 0,
    },

    // --- STUDENT-FACING CONTENT ---
    learnings: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    includes: {
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

    // --- REVIEWS & RATINGS ---
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

    // --- EMBEDDINGS FOR RECOMMENDATIONS ---
    embedding: {
      type: [Number],
      // IMPORTANT: For fast vector search, create a "Vector Search Index"
      // in MongoDB Atlas on this field. The `index: '2dsphere'` is for
      // geospatial queries and should not be used here.
    },
  },
  { timestamps: true }
);

// Step 2: Add Mongoose middleware to automatically generate embeddings
courseSchema.pre("save", async function (next) {
  // Check if the document is new or if any of the key text fields were modified.
  const fieldsToMonitor = [
    'title',
    'subtitle',
    'description',
    'language',
    'category',
    'level',
    'learnings',
    'requirements',
  ];

  const wasModified = fieldsToMonitor.some(field => this.isModified(field));

  if (this.isNew || wasModified) {
    try {
      // Create a comprehensive text block for embedding.
      // This combines all relevant info into one string for the AI model.
      const textToEmbed = [
        `Title: ${this.title || ""}`,
        `Subtitle: ${this.subtitle || ""}`,
        `Description: ${this.description || ""}`,
        `Category: ${this.category || ""}`,
        `Level: ${this.level || ""}`,
        `Language: ${this.language || ""}`,
        `What you'll learn: ${(this.learnings || []).join(', ')}`,
        `Requirements: ${(this.requirements || []).join(', ')}`,
      ]
      .filter(Boolean) // Remove any empty or null lines
      .join(". ");

      console.log(`INFO: Generating new embedding for course "${this.title}"...`);

      // Generate the embedding using the service
      this.embedding = await generateEmbedding(textToEmbed);

      console.log(`SUCCESS: Embedding updated for course "${this.title}".`);

    } catch (error) {
      // If embedding fails, log the error but don't block the save operation
      console.error(`ERROR: Failed to generate embedding for course "${this.title}".`, error);
    }
  }

  // Continue with the save operation
  next();
});

export const Course = mongoose.model("Course", courseSchema);