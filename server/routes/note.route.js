import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  getCourseNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/note.controller.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/:courseId", getCourseNotes);
router.post("/", createNote);
router.put("/:noteId", updateNote);
router.delete("/:noteId", deleteNote);

export default router;
