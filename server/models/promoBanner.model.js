import mongoose from "mongoose";

const promoBannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    primaryBtnText: { type: String, default: "Learn AI and more" },
    primaryBtnLink: { type: String, default: "/course/search" },
    secondaryBtnText: { type: String, default: "Prep for a certification" },
    secondaryBtnLink: { type: String, default: "/course/search" },
    categoryName: { type: String, default: "" }, // Associated Category or Topic for personalization
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const PromoBanner = mongoose.model("PromoBanner", promoBannerSchema);
