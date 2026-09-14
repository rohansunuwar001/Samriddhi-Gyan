import express from "express";
import { generateGeminiResponse } from "../utils/geminiClient.js";
import { isOptionalAuthenticated } from "../middlewares/isAuthenticated.js";
import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";

const router = express.Router();

router.post("/ask", isOptionalAuthenticated, async (req, res) => {
  const { prompt, courseId, lectureId, contents, history } = req.body;

  let queryPrompt = prompt;
  if (!queryPrompt && Array.isArray(contents) && contents.length > 0) {
    // Find the latest user message in Gemini contents array format [{ role, parts: [{ text }] }]
    const lastUserItem = [...contents].reverse().find((c) => c.role === "user" && c.parts?.[0]?.text);
    if (lastUserItem) {
      queryPrompt = lastUserItem.parts[0].text;
    } else {
      const anyItem = [...contents].reverse().find((c) => c.parts?.[0]?.text);
      queryPrompt = anyItem ? anyItem.parts[0].text : "";
    }
  } else if (!queryPrompt && Array.isArray(history) && history.length > 0) {
    const lastUserItem = [...history].reverse().find((h) => h.role === "user" && h.text);
    queryPrompt = lastUserItem ? lastUserItem.text : "";
  }

  if (!queryPrompt || !queryPrompt.trim()) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const context = {};
  if (req.user) {
    context.user = {
      name: req.user.name,
      role: req.user.role,
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
    const answer = await generateGeminiResponse(queryPrompt, context);
    res.json({ answer, options: [] });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "AI response failed" });
  }
});

export default router;
