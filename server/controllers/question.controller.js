import { Question } from "../models/question.model.js";

// Create a new question
export const createQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lectureId, title, content } = req.body;
    const userId = req.user._id;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    const question = new Question({
      courseId,
      lectureId: lectureId || null,
      userId,
      title,
      content,
      upvotes: [],
      answers: [],
    });

    await question.save();
    
    // Return populated question
    const populated = await Question.findById(question._id)
      .populate("userId", "name photoUrl")
      .populate("answers.userId", "name photoUrl")
      .populate("lectureId", "title");

    return res.status(201).json({ success: true, question: populated });
  } catch (error) {
    console.error("createQuestion error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Get all questions for a course
export const getCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;

    const questions = await Question.find({ courseId })
      .populate("userId", "name photoUrl")
      .populate("answers.userId", "name photoUrl")
      .populate("lectureId", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error("getCourseQuestions error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Toggle upvote on a question
export const toggleUpvote = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    const upvoteIndex = question.upvotes.indexOf(userId);
    if (upvoteIndex !== -1) {
      // Remove upvote
      question.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      question.upvotes.push(userId);
    }

    await question.save();
    return res.status(200).json({ success: true, upvotes: question.upvotes });
  } catch (error) {
    console.error("toggleUpvote error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Add an answer/reply to a question
export const addAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ success: false, message: "Answer content is required." });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    question.answers.push({
      userId,
      content,
    });

    await question.save();

    const populated = await Question.findById(questionId)
      .populate("userId", "name photoUrl")
      .populate("answers.userId", "name photoUrl")
      .populate("lectureId", "title");

    return res.status(200).json({ success: true, question: populated });
  } catch (error) {
    console.error("addAnswer error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
