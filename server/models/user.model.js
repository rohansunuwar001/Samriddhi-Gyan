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
        // You can add more links here in the future (e.g., twitter, linkedin)
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