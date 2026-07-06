import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    extractedText: {
      type: String,
      default: ""
    },
    astValid: {
      type: Boolean,
      default: null // null if not coding or not run
    },
    plagiarismMatches: [
      {
        id: { type: String },
        similarity: { type: Number }
      }
    ],
    grade: {
      type: Number,
      default: null
    },
    feedback: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["submitted", "graded"],
      default: "submitted"
    }
  },
  { timestamps: true }
);

// Compound index to prevent multiple submissions of the same assignment by the same student
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", submissionSchema);
