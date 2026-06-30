import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    time: {
      type: String, // e.g. "09:00"
      required: true,
    },
    days: [
      {
        type: String, // e.g. ["Monday", "Wednesday"]
      },
    ],
    frequency: {
      type: String, // e.g. "Daily", "Weekly"
      default: "Weekly",
    },
  },
  { timestamps: true }
);

export const Reminder = mongoose.model("Reminder", reminderSchema);
