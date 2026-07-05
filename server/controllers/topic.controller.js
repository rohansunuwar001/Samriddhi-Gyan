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
    
    // For each topic, compute stats dynamically from matching courses in database
    const enrichedTopics = await Promise.all(
      topics.map(async (topic) => {
        const searchRegex = new RegExp(topic.name.trim(), "i");
        const courses = await Course.find({
          isPublished: true,
          $or: [
            { topics: topic.name },
            { category: topic.name },
            { title: { $regex: searchRegex } },
          ],
        }).select("enrolledStudents courseIncludes ratings").lean();

        let numLearners = 0;
        let handsOnPracticeCount = 0;
        let totalRatingSum = 0;
        let ratedCoursesCount = 0;

        courses.forEach((c) => {
          numLearners += c.enrolledStudents?.length || 0;
          handsOnPracticeCount += c.courseIncludes?.codingExercises || 0;
          if (c.ratings > 0) {
            totalRatingSum += c.ratings;
            ratedCoursesCount++;
          }
        });

        const avgRating =
          ratedCoursesCount > 0
            ? Number((totalRatingSum / ratedCoursesCount).toFixed(1))
            : topic.rating || 0;

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
    let topic = await Topic.findOne({ slug }).lean();
    let courses = [];
    let cert = null;

    if (topic) {
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
          ],
        })
          .populate("creator", "name photoUrl headline")
          .lean();
      }

      let numLearners = 0;
      let handsOnPracticeCount = 0;
      let totalRatingSum = 0;
      let ratedCoursesCount = 0;

      courses.forEach((c) => {
        numLearners += c.enrolledStudents?.length || 0;
        handsOnPracticeCount += c.courseIncludes?.codingExercises || 0;
        if (c.ratings > 0) {
          totalRatingSum += c.ratings;
          ratedCoursesCount++;
        }
      });

      topic.numLearners = numLearners;
      topic.handsOnPracticeCount = handsOnPracticeCount;
      topic.rating =
        ratedCoursesCount > 0
          ? Number((totalRatingSum / ratedCoursesCount).toFixed(1))
          : topic.rating || 0;
    } else {
      // Fallback: search Category by slug
      const categoryDoc = await Category.findOne({ slug }).lean();
      if (!categoryDoc) {
        return res.status(404).json({ success: false, message: "Topic or Category not found" });
      }

      // If category is found, fetch children AND grandchildren (up to 2 levels deep)
      const children = await Category.find({ parent: categoryDoc._id }).lean();
      const grandchildren = children.length
        ? await Category.find({ parent: { $in: children.map(c => c._id) } }).lean()
        : [];
      const categoryNames = [
        categoryDoc.name,
        ...children.map(s => s.name),
        ...grandchildren.map(s => s.name),
      ];

      // Query published courses
      courses = await Course.find({
        isPublished: true,
        category: { $in: categoryNames },
      })
        .populate("creator", "name photoUrl headline")
        .lean();

      let numLearners = 0;
      let handsOnPracticeCount = 0;
      let totalRatingSum = 0;
      let ratedCoursesCount = 0;

      courses.forEach((c) => {
        numLearners += c.enrolledStudents?.length || 0;
        handsOnPracticeCount += c.courseIncludes?.codingExercises || 0;
        if (c.ratings > 0) {
          totalRatingSum += c.ratings;
          ratedCoursesCount++;
        }
      });

      // Create a virtual topic object
      topic = {
        name: categoryDoc.name,
        slug: categoryDoc.slug,
        type: "topic",
        description: `Explore top-rated online courses in ${categoryDoc.name}. Master new skills with curated paths and hands-on practice.`,
        bannerTitle: `${categoryDoc.name} Courses`,
        logoUrl: "",
        numLearners,
        handsOnPracticeCount,
        rating: ratedCoursesCount > 0 ? Number((totalRatingSum / ratedCoursesCount).toFixed(1)) : 0,
        relatedTopics: [...children.map(s => s.name), ...grandchildren.map(s => s.name)],
        parentCategory: "",
      };
    }

    // Fetch top rated reviews (rating >= 4) for courses under this topic/category
    const courseIds = courses.map(c => c._id);
    const reviews = await Review.find({
      course: { $in: courseIds },
      rating: { $gte: 4 }
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .populate("user", "name photoUrl")
      .populate("course", "title")
      .lean();

    return res.status(200).json({ success: true, topic, courses, reviews, certification: cert });
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
