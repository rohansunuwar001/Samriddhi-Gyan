import Flashcard from "../models/flashcard.model.js";
import { Lecture } from "../models/lecture.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Create a single manual flashcard
export const createFlashcard = async (req, res) => {
  try {
    const { courseId, question, answer } = req.body;
    const userId = req.user._id;

    if (!courseId || !question?.trim() || !answer?.trim()) {
      return res.status(400).json({ success: false, message: "Course ID, question and answer are required." });
    }

    const card = await Flashcard.create({
      userId,
      courseId,
      question: question.trim(),
      answer: answer.trim(),
    });

    return res.status(201).json({ success: true, card });
  } catch (error) {
    console.error("createFlashcard error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch all due cards for the user in this course
export const getDueFlashcards = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const cards = await Flashcard.find({
      userId,
      courseId,
      nextReviewDate: { $lte: new Date() },
    }).sort({ nextReviewDate: 1 }).lean();

    return res.status(200).json({ success: true, cards });
  } catch (error) {
    console.error("getDueFlashcards error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Submit a review score and update the SM2 properties
export const reviewFlashcard = async (req, res) => {
  try {
    const { cardId, quality } = req.body;
    const q = Number(quality);

    if (q < 0 || q > 5) {
      return res.status(400).json({ success: false, message: "Quality rating must be 0-5." });
    }

    const card = await Flashcard.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: "Flashcard not found." });
    }

    let { repetitions, interval, easeFactor } = card;

    if (q >= 3) {
      // Success review
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // Failed review
      repetitions = 0;
      interval = 1;
    }

    // Adjust EF
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    card.repetitions = repetitions;
    card.interval = interval;
    card.easeFactor = easeFactor;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    card.nextReviewDate = nextDate;

    await card.save();

    return res.status(200).json({ success: true, card });
  } catch (error) {
    console.error("reviewFlashcard error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Generate AI flashcards using Gemini model
export const generateAIFlashcards = async (req, res) => {
  try {
    const { courseId, lectureId } = req.body;
    const userId = req.user._id;

    if (!courseId || !lectureId) {
      return res.status(400).json({ success: false, message: "Course ID and Lecture ID are required." });
    }

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found." });
    }

    const prompt = `Generate exactly 3 diverse, specific study review flashcards based on this lecture transcript. 
    Lecture Title: "${lecture.title}"
    Lecture Transcript: "${lecture.transcript || lecture.description || 'No transcript available. Base cards on title.'}"
    
    Respond STRICTLY with a valid JSON array of objects, where each object has "question" and "answer" keys. 
    The questions must be highly specific to the facts, code examples, or concepts discussed directly in the transcript.
    Do not wrap the JSON in markdown code blocks or text. Example response format:
    [
      {"question": "What is the primary topic of the lecture?", "answer": "The primary topic is..."}
    ]`;

    const apiKey = process.env.GEMINI_API_KEY;
    let cardsData = [];

    if (apiKey && apiKey !== "your_api_key_here") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const generatedText = await result.response.text();

        const cleanJson = (raw) => {
          let cleaned = raw.trim();
          if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
          else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
          if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3);
          return cleaned.trim();
        };
        
        const parsed = JSON.parse(cleanJson(generatedText));
        if (Array.isArray(parsed)) {
          cardsData = parsed;
        }
      } catch (err) {
        console.warn("Direct Gemini AI generation failed or parsed incorrectly. Using fallback mock generation.", err.message);
      }
    }

    // Fallback if no API key or generation failed
    if (cardsData.length === 0) {
      cardsData = [
        {
          question: `What is the core concept of "${lecture.title}"?`,
          answer: `The core focus is learning the fundamentals and practical implementations of "${lecture.title}".`,
        },
        {
          question: `How do you apply concepts from "${lecture.title}" in real-world projects?`,
          answer: `By writing local code, configuring databases, and building hands-on exercises related to the lecture.`,
        },
      ];
    }

    // Insert created cards
    const createdCards = [];
    for (const card of cardsData) {
      const c = await Flashcard.create({
        userId,
        courseId,
        question: card.question || "Study Question",
        answer: card.answer || "Study Answer",
      });
      createdCards.push(c);
    }

    return res.status(201).json({ success: true, cards: createdCards });
  } catch (error) {
    console.error("generateAIFlashcards error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
