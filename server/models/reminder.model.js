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
      required: false, // Optional if user selects "None"
    },
    name: {
      type: String,
      default: "Learning reminder",
    },
    time: {
      type: String, // e.g. "12:00 PM"
      required: true,
    },
    days: [
      {
        type: String, // e.g. ["Monday", "Wednesday"]
      },
    ],
    frequency: {
      type: String, // e.g. "Daily", "Weekly", "Once"
      default: "Weekly",
    },
    calendarSynced: {
      type: String, // e.g. "Google", "Apple", "Outlook", "None"
      default: "None",
    },
  },
  { timestamps: true }
);

export const Reminder = mongoose.model("Reminder", reminderSchema);
