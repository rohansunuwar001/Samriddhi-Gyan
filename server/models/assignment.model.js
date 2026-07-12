import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["coding", "essay"],
      required: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: false
    },
    requiredStructures: [
      {
        type: String // e.g. "ForStatement", "VariableDeclaration"
      }
    ],
    maxPoints: {
      type: Number,
      default: 100
    },
    deadline: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

export const Assignment = mongoose.model("Assignment", assignmentSchema);
