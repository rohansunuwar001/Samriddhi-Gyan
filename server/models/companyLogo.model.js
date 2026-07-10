import mongoose from "mongoose";

const companyLogoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const CompanyLogo = mongoose.model("CompanyLogo", companyLogoSchema);
