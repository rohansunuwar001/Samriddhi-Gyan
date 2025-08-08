import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    // --- 1. Renamed for consistency ---
    title: {
        type: String,
        required: [true, 'A lecture title is required.'],
        trim: true,
    },
    
    // --- Video Information (No changes needed here) ---
    videoUrl: {
        type: String, // The secure URL from Cloudinary
    },
    publicId: {
        type: String, // The public_id from Cloudinary, used for deleting/managing the video
    },

    // --- 2. Renamed and updated for better data management ---
    durationInSeconds: {
        type: Number, // Storing duration as seconds makes calculations easy
        default: 0,
    },
    isPreview: { // RENAMED from isPreviewFree
        type: Boolean,
        default: false, // It's safer to default to not free
    },

    // --- 3. CRITICAL: The required relationship to the parent Section ---
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section', // This creates the link to the Section model
        required: true, // A lecture MUST belong to a section.
    },
}, { timestamps: true });

export const Lecture = mongoose.model("Lecture", lectureSchema);