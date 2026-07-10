import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  ip: {
    type: String,
    default: ""
  },
  locationDetails: {
    continent: { type: String, default: "Unknown" },
    country: { type: String, default: "Unknown" },
    region: { type: String, default: "Unknown" },
    city: { type: String, default: "Unknown" },
    formattedAddress: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  visitedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export const Visitor = mongoose.model("Visitor", visitorSchema);
