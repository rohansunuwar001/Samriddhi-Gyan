import mongoose from "mongoose";

const column2SubItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    link: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const column2ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    link: { type: String, default: "", trim: true },
    hasChevron: { type: Boolean, default: false },
    subItems: [column2SubItemSchema],
  },
  { _id: true }
);

const exploreSectionItemSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      enum: ["featured", "goal"], // "featured" = New & Featured, "goal" = Explore by goal
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    badgeOrIcon: { type: String, default: "", trim: true }, // e.g. "google", "ai", "rocket", "award", or custom image URL
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    column2Header: { type: String, default: "", trim: true },
    column2Items: [column2ItemSchema],
  },
  { timestamps: true }
);

const ExploreSectionItem = mongoose.model("ExploreSectionItem", exploreSectionItemSchema);
export default ExploreSectionItem;
