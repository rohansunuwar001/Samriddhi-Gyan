// server/controllers/combinedSearch.controller.js
//
// Powers the "Explore related topics" click-through: a single endpoint that
// returns both matching courses and matching articles for a given topic/category
// name, so the frontend can render one combined results page.

import { Course } from "../models/course.model.js";
import Article from "../models/article.model.js";
import Category from "../models/category.model.js";

/**
 * @desc    Get courses + articles that match a given topic/category name
 * @route   GET /api/search/combined?topic=Node.js
 * @access  Public
 */
export const getCombinedSearchResults = async (req, res) => {
  try {
    const { topic } = req.query;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: "A 'topic' query parameter is required." });
    }

    const cleanedTopic = topic.trim();

    // Find the matching Category doc first — articles link to categories by
    // ObjectId, not by name, so we need the id to query Article.category.
    const category = await Category.findOne({ name: cleanedTopic });

    const [courses, articles] = await Promise.all([
      // Courses store topics as a plain string array — direct match.
      Course.find({
        isPublished: true,
        topics: cleanedTopic,
      })
        .select("title slug thumbnail price ratings numOfReviews category")
        .limit(20)
        .lean(),

      // Articles only match if a Category with this exact name exists.
      category
        ? Article.find({ category: category._id })
            .populate("author", "name avatar")
            .populate("category", "name slug")
            .select("title slug featuredImage author category createdAt")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
        : Promise.resolve([]),
    ]);

    return res.status(200).json({
      success: true,
      topic: cleanedTopic,
      courses,
      articles,
    });
  } catch (error) {
    console.error("getCombinedSearchResults error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during combined search." });
  }
};