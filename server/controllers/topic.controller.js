import { Course } from "../models/course.model.js";
import Topic from "../models/topic.model.js";
import Category from "../models/category.model.js";
import { Review } from "../models/review.model.js";
import { slugify } from "../utils/slugify.js";
import { Certification } from "../models/certification.model.js";

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
    const { q } = req.query;
    if (q !== undefined) {
      const queryStr = (q || "").trim();
      if (!queryStr) {
        return res.status(200).json({ success: true, topics: [] });
      }
      const sanitizedQuery = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const topics = await Topic.find({ name: new RegExp(sanitizedQuery, 'i') })
        .select("name slug")
        .sort({ name: 1 })
        .limit(10)
        .lean();
      return res.status(200).json({ success: true, topics });
    }

    const topics = await Topic.find({}).sort({ name: 1 }).lean();
    
    // For each topic, compute stats dynamically from matching courses & reviews in database
    const enrichedTopics = await Promise.all(
      topics.map(async (topic) => {
        const searchRegex = new RegExp(topic.name.trim(), "i");
        const courses = await Course.find({
          isPublished: true,
          $or: [
            { topics: topic.name },
            { category: topic.name },
            { categoryHierarchy: topic.name },
            { title: { $regex: searchRegex } },
          ],
        }).select("_id enrolledStudents courseIncludes").lean();

        let numLearners = 0;
        let handsOnPracticeCount = 0;
        const courseIds = courses.map((c) => c._id);

        courses.forEach((c) => {
          numLearners += c.enrolledStudents?.length || 0;
          handsOnPracticeCount += c.courseIncludes?.codingExercises || 0;
        });

        const reviews = await Review.find({ course: { $in: courseIds } }).select("rating").lean();
        const totalRatingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        const avgRating = reviews.length > 0
          ? Number((totalRatingSum / reviews.length).toFixed(1))
          : 0;

        return {
          ...topic,
          numLearners,
          handsOnPracticeCount,
          rating: avgRating,
        };
      })
    );

    res.status(200).json({ success: true, topics: enrichedTopics });
  } catch (error) {
    console.error("getAllTopics error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTopicBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Check if slug matches a Category
    const categoryDoc = await Category.findOne({ slug }).lean();
    if (categoryDoc) {
      // Level 0: Parent Category (e.g. "Development") -> 404
      if (!categoryDoc.parent) {
        return res.status(404).json({
          success: false,
          message: "Page not found. Parent categories do not have topic pages.",
          statusCode: 404,
        });
      }

      // Level 1: Child Category (e.g. "Backend Development") -> 404
      const parentDoc = await Category.findById(categoryDoc.parent).lean();
      if (!parentDoc || !parentDoc.parent) {
        return res.status(404).json({
          success: false,
          message: "Page not found. Child categories do not have topic pages.",
          statusCode: 404,
        });
      }

      // Level 2: Sub-child Category (e.g. "Express Js", "React", "Node Js") -> ALLOWED
      // Ensure a persistent Topic document exists in the Topic collection
      const existingTopic = await Topic.findOne({ slug });
      if (!existingTopic) {
        await Topic.create({
          name: categoryDoc.name,
          slug: categoryDoc.slug,
          type: "topic",
          parentCategory: parentDoc.name,
          bannerTitle: `${categoryDoc.name} Courses`,
          description: `Explore top-rated online courses in ${categoryDoc.name}. Master new skills with curated paths and hands-on practice.`,
          relatedTopics: [],
        });
      }
    }

    // 2. Fetch Topic
    let topic = await Topic.findOne({ slug }).lean();
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
        statusCode: 404,
      });
    }

    // Double-check: ensure Topic does not coincide with any Parent or Child category
    const topicCategory = await Category.findOne({ slug: topic.slug }).lean();
    if (topicCategory) {
      if (!topicCategory.parent) {
        return res.status(404).json({
          success: false,
          message: "Page not found. Parent categories do not have topic pages.",
          statusCode: 404,
        });
      }
      const parentCat = await Category.findById(topicCategory.parent).lean();
      if (!parentCat || !parentCat.parent) {
        return res.status(404).json({
          success: false,
          message: "Page not found. Child categories do not have topic pages.",
          statusCode: 404,
        });
      }
    }

    let courses = [];
    let cert = null;

    if (topic.type === "certification") {
      cert = await Certification.findOne({ name: new RegExp(`^${topic.name.trim()}$`, "i") })
        .populate("issuer", "name type")
        .populate("categoryFilterParent", "name slug")
        .populate("categoryFilterChild", "name slug")
        .populate("categoryFilterSubChild", "name slug")
        .lean();
    }

    if (cert) {
      let targetCategoryNames = [];
      const categoriesToQuery = [];
      if (cert.categoryFilterParent) categoriesToQuery.push(cert.categoryFilterParent._id || cert.categoryFilterParent);
      if (cert.categoryFilterChild) categoriesToQuery.push(cert.categoryFilterChild._id || cert.categoryFilterChild);
      if (cert.categoryFilterSubChild) categoriesToQuery.push(cert.categoryFilterSubChild._id || cert.categoryFilterSubChild);

      const resolvedCategories = await Category.find({ _id: { $in: categoriesToQuery } }).lean();

      const parentCat = resolvedCategories.find(c => String(c._id) === String(cert.categoryFilterParent?._id || cert.categoryFilterParent));
      const childCat = resolvedCategories.find(c => String(c._id) === String(cert.categoryFilterChild?._id || cert.categoryFilterChild));
      const subChildCat = resolvedCategories.find(c => String(c._id) === String(cert.categoryFilterSubChild?._id || cert.categoryFilterSubChild));

      if (subChildCat) {
        targetCategoryNames.push(subChildCat.name);
      } else if (childCat) {
        targetCategoryNames.push(childCat.name);
        const subCats = await Category.find({ parent: childCat._id }).select("name").lean();
        subCats.forEach(sc => targetCategoryNames.push(sc.name));
      } else if (parentCat) {
        targetCategoryNames.push(parentCat.name);
        const children = await Category.find({ parent: parentCat._id }).select("_id name").lean();
        for (const child of children) {
          targetCategoryNames.push(child.name);
          const grandchildren = await Category.find({ parent: child._id }).select("name").lean();
          grandchildren.forEach(gc => targetCategoryNames.push(gc.name));
        }
      }

      courses = await Course.find({
        category: { $in: targetCategoryNames },
        isPublished: true,
      })
        .populate("creator", "name photoUrl headline")
        .lean();
    } else {
      courses = await Course.find({
        isPublished: true,
        $or: [
          { topics: topic.name },
          { category: topic.name },
          { categoryHierarchy: topic.name },
          { title: { $regex: new RegExp(topic.name.trim(), "i") } },
        ],
      })
        .populate("creator", "name photoUrl headline")
        .lean();
    }

    const courseIds = courses.map((c) => c._id);
    const allReviews = await Review.find({
      course: { $in: courseIds },
    })
      .sort({ rating: -1, createdAt: -1 })
      .populate("user", "name photoUrl")
      .populate("course", "title")
      .lean();

    const reviewsByCourse = new Map();
    allReviews.forEach((r) => {
      const cId = r.course?._id?.toString() || r.course?.toString();
      if (cId) {
        if (!reviewsByCourse.has(cId)) reviewsByCourse.set(cId, []);
        reviewsByCourse.get(cId).push(r);
      }
    });

    let numLearners = 0;
    let handsOnPracticeCount = 0;
    let totalRatingSum = 0;
    let totalRatingsCount = 0;

    const enrichedCourses = courses.map((c) => {
      const cId = c._id.toString();
      const courseReviews = reviewsByCourse.get(cId) || [];
      const courseRatings = courseReviews.map((r) => r.rating);
      const avg = courseRatings.length
        ? Number((courseRatings.reduce((s, r) => s + r, 0) / courseRatings.length).toFixed(1))
        : 0;

      numLearners += c.enrolledStudents?.length || 0;
      handsOnPracticeCount += c.courseIncludes?.codingExercises || 0;

      if (courseRatings.length > 0) {
        totalRatingSum += courseRatings.reduce((s, r) => s + r, 0);
        totalRatingsCount += courseRatings.length;
      }

      return {
        ...c,
        ratings: courseRatings,
        avgRating: avg,
        reviewCount: courseRatings.length,
      };
    });

    topic.numLearners = numLearners;
    topic.handsOnPracticeCount = handsOnPracticeCount;
    topic.rating =
      totalRatingsCount > 0
        ? Number((totalRatingSum / totalRatingsCount).toFixed(1))
        : 0;

    const topReviews = allReviews.filter((r) => r.rating >= 4).slice(0, 6);

    return res.status(200).json({
      success: true,
      topic,
      courses: enrichedCourses,
      reviews: topReviews.length > 0 ? topReviews : allReviews.slice(0, 6),
      certification: cert,
    });
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
