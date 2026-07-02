import { Reminder } from "../models/reminder.model.js";

// Create a new reminder
export const createReminder = async (req, res) => {
  try {
    const { name, courseId, time, days, frequency, calendarSynced } = req.body;
    const userId = req.user._id;

    if (!time) {
      return res.status(400).json({ success: false, message: "Time is required." });
    }

    const reminder = new Reminder({
      userId,
      courseId: courseId || null,
      name: name || "Learning reminder",
      time,
      days: days || [],
      frequency: frequency || "Weekly",
      calendarSynced: calendarSynced || "None",
    });

    await reminder.save();
    return res.status(201).json({ success: true, reminder });
  } catch (error) {
    console.error("createReminder error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Get all reminders of a user
export const getUserReminders = async (req, res) => {
  try {
    const userId = req.user._id;
    const reminders = await Reminder.find({ userId })
      .populate({
        path: "courseId",
        select: "title thumbnail",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reminders });
  } catch (error) {
    console.error("getUserReminders error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Update an existing reminder
export const updateReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { name, courseId, time, days, frequency, calendarSynced } = req.body;
    const userId = req.user._id;

    const reminder = await Reminder.findOne({ _id: reminderId, userId });
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found or unauthorized." });
    }

    if (name !== undefined) reminder.name = name;
    if (courseId !== undefined) reminder.courseId = courseId || null;
    if (time !== undefined) reminder.time = time;
    if (days !== undefined) reminder.days = days;
    if (frequency !== undefined) reminder.frequency = frequency;
    if (calendarSynced !== undefined) reminder.calendarSynced = calendarSynced;

    await reminder.save();
    return res.status(200).json({ success: true, reminder });
  } catch (error) {
    console.error("updateReminder error:", error);
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
