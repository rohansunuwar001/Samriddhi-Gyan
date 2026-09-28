import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        select: false,
        required: function() { return !this.googleId; }
    },
    googleId: {
        type: String
    },
    role: {
        type: String,
        enum: ["instructor", "student","admin"],
        default: 'student'
    },
    enrolledCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    archivedCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
     cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    cartCertifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certification'
      }
    ],
    photoUrl: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: "This user has not provided a description."
    },
    headline: {
        type: String,
        default: "E-Learning Enthusiast"
    },
      links: {
        website: { type: String, default: "" },
        facebook: { type: String, default: "" },
        instagram: { type: String, default: "" },
        twitter: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        tiktok: { type: String, default: "" },
        youtube: { type: String, default: "" },
    },
    language: {
        type: String,
        default: "English (US)"
    },
    privacy: {
        showProfileToLoggedIn: { type: Boolean, default: true },
        showCoursesTaking: { type: Boolean, default: true },
    },
    locationDetails: {
        continent: { type: String, default: "" },
        country: { type: String, default: "" },
        city: { type: String, default: "" },
        formattedAddress: { type: String, default: "" },
        latitude: { type: Number },
        longitude: { type: Number },
    },
    occupation: {
        type: String,
        default: ""
    },
    interests: [
        {
            type: String
        }
    ],
    viewHistory: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        viewedAt: { type: Date, default: Date.now },
      }
    ],
    // Stores the last 10 search terms submitted by the user (newest first)
    searchHistory: [{ type: String }],
    subscription: {
        status: {
            type: String,
            enum: ["none", "active", "expired"],
            default: "none"
        },
        planName: { type: String, default: "" },
        startsAt: { type: Date },
        expiresAt: { type: Date },
        paymentMethod: { type: String, default: "" }
    },
}, {timestamps: true});

export const User = mongoose.model("User", userSchema);