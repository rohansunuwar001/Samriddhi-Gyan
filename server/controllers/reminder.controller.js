import { Reminder } from "../models/reminder.model.js";

// Create a new reminder
export const createReminder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { time, days, frequency } = req.body;
    const userId = req.user._id;

    if (!time || !days || !days.length) {
      return res.status(400).json({ success: false, message: "Time and days are required." });
    }

    const reminder = new Reminder({
      userId,
      courseId,
      time,
      days,
      frequency: frequency || "Weekly",
    });

    await reminder.save();
    return res.status(201).json({ success: true, reminder });
  } catch (error) {
    console.error("createReminder error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Get all reminders of a user for a specific course
export const getUserReminders = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const reminders = await Reminder.find({ userId, courseId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, reminders });
  } catch (error) {
    console.error("getUserReminders error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Delete a reminder
export const deleteReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.user._id;

    const reminder = await Reminder.findOneAndDelete({ _id: reminderId, userId });
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found or unauthorized." });
    }

    return res.status(200).json({ success: true, message: "Reminder deleted successfully." });
  } catch (error) {
    console.error("deleteReminder error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
