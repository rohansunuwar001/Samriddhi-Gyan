import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    // --- 1. Renamed for consistency ---
    title: {
      type: String,
      required: [true, "A lecture title is required."],
      trim: true,
    },
    // Optional short description shown when the student expands the lecture row.
    // The frontend hides the expand/collapse toggle entirely when this is empty.
    description: {
      type: String,
      trim: true,
      default: "",
    },
    transcript: {
      type: String,
      default: "",
    },

    // --- Video Information (No changes needed here) ---
    videoUrl: {
      type: String, // The secure URL from Cloudinary
    },
    originalName: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    publicId: {
      type: String, // The public_id from Cloudinary, used for deleting/managing the video
    },

    // --- 2. Renamed and updated for better data management ---
    durationInSeconds: {
      type: Number, // Storing duration as seconds makes calculations easy
      default: 0,
    },
    isPreview: {
      // RENAMED from isPreviewFree
      type: Boolean,
      default: false, // It's safer to default to not free
    },
    downloadable: {
      type: Boolean,
      default: false,
    },

    // --- 3. CRITICAL: The required relationship to the parent Section ---
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section", // This creates the link to the Section model
      required: true, // A lecture MUST belong to a section.
    },
    status: {
      type: String,
      enum: ["pending", "transcoding", "uploading_r2", "ready", "failed"],
      default: "pending",
    },
    resolution: { type: String, default: "" },
    captions: [
      {
        language: { type: String, required: true },
        url: { type: String, required: true },
        filename: { type: String, default: "" },
      }
    ],
    captionsDisabled: {
      type: Boolean,
      default: false,
    },
    // Lecture Resources (Cloudinary uploaded files/PDFs or external links like Google Drive)
    resources: [
      {
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        type: { type: String, enum: ["pdf", "file", "link"], default: "link" },
        publicId: { type: String, default: "" }, // For Cloudinary cleanup
        size: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Lecture Lab Configuration (Lab instructions, Colab/Drive workspace URL, assignment PDF)
    lab: {
      title: { type: String, default: "", trim: true },
      description: { type: String, default: "", trim: true },
      url: { type: String, default: "", trim: true }, // e.g. Colab / GitHub / Google Drive URL
      pdfUrl: { type: String, default: "" }, // Cloudinary or Google Drive PDF URL
      pdfPublicId: { type: String, default: "" },
      pdfName: { type: String, default: "" },
      isActive: { type: Boolean, default: false },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true },
);

export const Lecture = mongoose.model("Lecture", lectureSchema);