import mongoose from "mongoose";
import { nanoid } from "nanoid";

const CERTIFICATE_TITLES = [
  "Certificate of Completion",
  "Certificate of Achievement",
  "Certificate of Participation",
  "Certificate of Excellence",
];

const certificateSchema = new mongoose.Schema(
  {
    // ── Ownership ────────────────────────────────────────────────────────────
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },

    // ── Template state ───────────────────────────────────────────────────────
    // true  → this is a re-usable template (not yet issued to anyone)
    // false → this record represents a certificate actually issued to a student
    isTemplate: {
      type: Boolean,
      default: true,
    },

    // ── Issued-to (populated when isTemplate = false) ────────────────────────
    issuedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recipientName: {
      type: String,
      trim: true,
    },

    // ── Certificate identity ─────────────────────────────────────────────────
    // Unique, human-readable ID: SG-2026-<RAND6>
    // Auto-generated on creation — never set manually.
    certificateId: {
      type: String,
      unique: true,
      sparse: true, // templates don't get a cert ID until issued
    },

    // ── Issuing organisation ─────────────────────────────────────────────────
    organizationName: {
      type: String,
      required: true,
      trim: true,
      default: "Samriddhi Gyan",
    },
    organizationLogo: {
      type: String, // Cloudinary URL
      default: "",
    },

    // ── Certificate content ───────────────────────────────────────────────────
    certificateTitle: {
      type: String,
      enum: CERTIFICATE_TITLES,
      default: "Certificate of Completion",
    },
    certificateStatement: {
      type: String,
      trim: true,
      default:
        "This is to certify that the above-named individual has successfully completed the course.",
    },
    courseName: {
      type: String,
      trim: true,
    },

    // ── Dates ─────────────────────────────────────────────────────────────────
    completionDate: {
      type: Date,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },

    // ── Visual elements ───────────────────────────────────────────────────────
    authorizedSignature: {
      type: String, // Cloudinary URL of signature image
      default: "",
    },
    officialSeal: {
      type: String, // Cloudinary URL
      default: "",
    },

    // ── Optional metadata ─────────────────────────────────────────────────────
    duration: {
      type: String,
      trim: true,
    },
    grade: {
      type: String,
      trim: true,
    },
    instructorName: {
      type: String,
      trim: true,
    },
    accreditation: {
      type: String,
      trim: true,
    },

    // ── Verification ──────────────────────────────────────────────────────────
    verificationUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// ── Pre-save: generate certificateId when being issued ───────────────────────
certificateSchema.pre("save", function () {
  if (!this.isTemplate && !this.certificateId) {
    const year = new Date().getFullYear();
    const rand = nanoid(6).toUpperCase();
    this.certificateId = `SG-${year}-${rand}`;
    this.verificationUrl = `/verify/${this.certificateId}`;
  }
});

export const Certificate = mongoose.model("Certificate", certificateSchema);
export { CERTIFICATE_TITLES };
