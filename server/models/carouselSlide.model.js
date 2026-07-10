import mongoose from "mongoose";

const carouselSlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    bgColor: { type: String, default: "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100" },
    textColor: { type: String, default: "text-amber-900" },
    link: { type: String, default: "/course/search" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const CarouselSlide = mongoose.model("CarouselSlide", carouselSlideSchema);
