import express from "express";
import { generateGeminiResponse } from "../utils/geminiClient.js";
import { isOptionalAuthenticated } from "../middlewares/isAuthenticated.js";
import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";

const router = express.Router();

router.post("/ask", isOptionalAuthenticated, async (req, res) => {
  const { prompt, courseId, lectureId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const context = {};
  if (req.user) {
    context.user = {
      name: req.user.name,
      email: req.user.email,
    };
  }

  if (courseId) {
    try {
      const course = await Course.findById(courseId).select("title description learnings subtitle");
      if (course) {
        context.course = {
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          learnings: course.learnings,
        };
      }
    } catch (err) {
      console.error("Error fetching course for context:", err);
    }
  }

  if (lectureId) {
    try {
      const lecture = await Lecture.findById(lectureId).select("title description transcript");
      if (lecture) {
        context.lecture = {
          title: lecture.title,
          description: lecture.description,
          transcript: lecture.transcript,
        };
      }
    } catch (err) {
      console.error("Error fetching lecture for context:", err);
    }
  }

  try {
    const answer = await generateGeminiResponse(prompt, context);
    res.json({ answer });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "AI response failed" });
  }
});

export default router;
