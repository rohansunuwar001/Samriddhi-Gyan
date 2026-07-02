import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  createReminder,
  getUserReminders,
  updateReminder,
  deleteReminder,
} from "../controllers/reminder.controller.js";

const router = express.Router();

router.post("/", isAuthenticated, createReminder);
router.get("/", isAuthenticated, getUserReminders);
router.put("/:reminderId", isAuthenticated, updateReminder);
router.delete("/:reminderId", isAuthenticated, deleteReminder);

export default router;
