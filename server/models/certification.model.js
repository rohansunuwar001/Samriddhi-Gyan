import mongoose from "mongoose";
import { slugify } from "../utils/slugify.js";

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Certification name is required."],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    issuer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificationIssuer",
      required: true,
      index: true,
    },
    badgeUrl: {
      type: String, // Hexagon / badge image URL
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    categoryFilterParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    categoryFilterChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    categoryFilterSubChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    examPrice: {
      type: Number,
      default: 0, // Exam registering fee
    },
    certificatePrice: {
      type: Number,
      default: 0, // Registry / issuance fee
    },
    passingScore: {
      type: Number,
      default: 70, // percentage required (e.g. 70%)
    },
    totalMarks: {
      type: Number,
      default: 100, // total marks for the exam
    },
    passMarks: {
      type: Number,
      default: 40, // pass marks for the exam
    },
    grades: {
      type: String,
      default: "A, B, C, Pass",
    },
    duration: {
      type: Number,
      default: 90, // duration in minutes
    },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }], // array of options
        correctOptionIndex: { type: Number, required: true }, // index of correct option (0-3)
      },
    ],
  },
  { timestamps: true }
);

// Auto-slugify on save
certificationSchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name);
  }
});

export const Certification = mongoose.model("Certification", certificationSchema);
