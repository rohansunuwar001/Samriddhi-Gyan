import { Course } from "../models/course.model.js";
import Topic from "../models/topic.model.js";
import Category from "../models/category.model.js";
import { slugify } from "../utils/slugify.js";

export const createTopic = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      bannerTitle,
      logoUrl,
      numLearners,
      handsOnPracticeCount,
      rating,
      relatedTopics,
      parentCategory,
    } = req.body;
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: "Topic name is required." });
    }

    const slug = slugify(trimmedName);
    const existing = await Topic.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: "A topic with this name already exists." });
    }

    const topic = await Topic.create({
      name: trimmedName,
      slug,
      type: type || "topic",
      description: description || "",
      bannerTitle: bannerTitle || "",
      logoUrl: logoUrl || "",
      numLearners: Number(numLearners || 0),
      handsOnPracticeCount: Number(handsOnPracticeCount || 0),
      rating: Number(rating || 4.5),
      relatedTopics: Array.isArray(relatedTopics) ? relatedTopics : [],
      parentCategory: parentCategory || "",
    });

    res.status(201).json({ success: true, topic });
  } catch (error) {
    console.error("createTopic error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find({}).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, topics });
  } catch (error) {
    console.error("getAllTopics error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTopicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let topic = await Topic.findOne({ slug }).lean();
    let courses = [];

    if (topic) {
      const searchRegex = new RegExp(topic.name.trim(), "i");
      courses = await Course.find({
        isPublished: true,
        $or: [
          { topics: topic.name },
          { category: topic.name },
          { title: { $regex: searchRegex } },
        ],
      })
        .populate("creator", "name photoUrl headline")
        .lean();
    } else {
      // Fallback: search Category by slug
      const categoryDoc = await Category.findOne({ slug }).lean();
      if (!categoryDoc) {
        return res.status(404).json({ success: false, message: "Topic or Category not found" });
      }

      // If category is found, check if it has subcategories
      const subcategories = await Category.find({ parent: categoryDoc._id }).lean();
      const categoryNames = [categoryDoc.name, ...subcategories.map(s => s.name)];

      // Query published courses
      courses = await Course.find({
        isPublished: true,
        category: { $in: categoryNames },
      })
        .populate("creator", "name photoUrl headline")
        .lean();

      // Create a virtual topic object
      topic = {
        name: categoryDoc.name,
        slug: categoryDoc.slug,
        type: "topic",
        description: `Explore top-rated online courses in ${categoryDoc.name}. Master new skills with curated paths and hands-on practice.`,
        bannerTitle: `${categoryDoc.name} Courses`,
        logoUrl: "",
        numLearners: 1245890,
        handsOnPracticeCount: 450,
        rating: 4.6,
        relatedTopics: subcategories.map(s => s.name),
        parentCategory: "",
      };
    }

    return res.status(200).json({ success: true, topic, courses });
  } catch (error) {
    console.error("getTopicBySlug error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found." });
    }

    const {
      name,
      type,
      description,
      bannerTitle,
      logoUrl,
      numLearners,
      handsOnPracticeCount,
      rating,
      relatedTopics,
      parentCategory,
    } = req.body;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: "Topic name cannot be empty." });
      }
      const slug = slugify(trimmedName);
      const duplicate = await Topic.findOne({ slug, _id: { $ne: topic._id } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: "A topic with this name already exists." });
      }
      topic.name = trimmedName;
      topic.slug = slug;
    }

    if (type !== undefined) topic.type = type;
    if (description !== undefined) topic.description = description;
    if (bannerTitle !== undefined) topic.bannerTitle = bannerTitle;
    if (logoUrl !== undefined) topic.logoUrl = logoUrl;
    if (numLearners !== undefined) topic.numLearners = Number(numLearners || 0);
    if (handsOnPracticeCount !== undefined) topic.handsOnPracticeCount = Number(handsOnPracticeCount || 0);
    if (rating !== undefined) topic.rating = Number(rating || 4.5);
    if (relatedTopics !== undefined) topic.relatedTopics = Array.isArray(relatedTopics) ? relatedTopics : [];
    if (parentCategory !== undefined) topic.parentCategory = parentCategory;

    await topic.save();
    res.status(200).json({ success: true, topic });
  } catch (error) {
    console.error("updateTopic error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found." });
    }
    res.status(200).json({ success: true, message: "Topic deleted successfully." });
  } catch (error) {
    console.error("deleteTopic error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
