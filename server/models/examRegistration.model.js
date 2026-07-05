import mongoose from "mongoose";

const examRegistrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    certification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certification",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    examStatus: {
      type: String,
      enum: ["registered", "started", "completed"],
      default: "registered",
    },
    score: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    completionDate: {
      type: Date,
    },
    certificateId: {
      type: String, // SG-CERT-EXAM-XXXXXX
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: "esewa",
    },
    transactionId: {
      type: String,
      default: "",
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const ExamRegistration = mongoose.model("ExamRegistration", examRegistrationSchema);
