import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  createReminder,
  getUserReminders,
  deleteReminder,
} from "../controllers/reminder.controller.js";

const router = express.Router();

router.post("/:courseId", isAuthenticated, createReminder);
router.get("/:courseId", isAuthenticated, getUserReminders);
router.delete("/:reminderId", isAuthenticated, deleteReminder);

export default router;
