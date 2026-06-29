// server/service/course.service.js
//
// PURPOSE: All DB logic for courses lives here.
// Controllers read req → call these → send res.
// These functions never touch req or res.

import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { User } from "../models/user.model.js";
import { Section } from "../models/section.model.js";
import { Lecture } from "../models/lecture.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import { uploadMedia, deleteFromCloudinary } from "../utils/cloudinary.js";
import { createEmbeddingForText, cosineSimilarity } from "../utils/embedding.js";
import { extractCloudinaryPublicId } from "../helpers/cloudinary.helper.js";

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — not exported
// Calculates a user's progress % for one course using duration-based math.
// FIX: The original getCourseProgressPercent() was a dead stub that returned 0.
//      This is the real implementation used by getPublishedCourse and getCourseById.
// ─────────────────────────────────────────────────────────────────────────────
const getCourseProgressPercent = async (courseId, userId) => {
  const [courseData, progressDoc] = await Promise.all([
    Course.findById(courseId)
      .populate({
        path: "sections",
        select: "lectures",
        populate: { path: "lectures", select: "durationInSeconds" },
      })
      .lean(),
    CourseProgress.findOne({ courseId, userId }).lean(),
  ]);

  if (!courseData || !progressDoc) return 0;

  let totalDuration = 0;
  let watchedDuration = 0;

  const viewedIds = new Set(
    (progressDoc.lectureProgress || [])
      .filter((lp) => lp.viewed)
      .map((lp) => lp.lectureId.toString())
  );

  courseData.sections.forEach((section) => {
    section.lectures.forEach((lecture) => {
      const dur = lecture.durationInSeconds || 0;
      totalDuration += dur;
      if (viewedIds.has(lecture._id.toString())) watchedDuration += dur;
    });
  });

  return totalDuration > 0
    ? Math.min(Math.round((watchedDuration / totalDuration) * 100), 100)
    : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE COURSE
// ─────────────────────────────────────────────────────────────────────────────
export const createCourse = async ({ userId, courseData }) => {
  const { title, category, price, language, level, subtitle, description, learnings } = courseData;

  if (!title || !category || !price?.original || !price?.current) {
    const error = new Error("Title, category, and a full price object (original, current) are required.");
    error.statusCode = 400;
    throw error;
  }

  const course = await Course.create({
    title,
    category,
    language: language || "English",
    level: level || "All Levels",
    price,
    subtitle,
    description,
    learnings,
    creator: userId,
  });

  return course;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. EDIT COURSE
// FIX: Uses extractCloudinaryPublicId() — the original .split().pop() broke
//      for Cloudinary URLs with folder paths.
// ─────────────────────────────────────────────────────────────────────────────
export const editCourse = async (courseId, fields, thumbnailFile) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found!");
    error.statusCode = 404;
    throw error;
  }

  // Handle thumbnail replacement
  if (thumbnailFile) {
    if (course.thumbnail) {
      const publicId = extractCloudinaryPublicId(course.thumbnail); // ← FIXED
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }
    const uploaded = await uploadMedia(thumbnailFile.path);
    if (!uploaded?.secure_url) {
      const error = new Error("Thumbnail upload failed.");
      error.statusCode = 500;
      throw error;
    }
    course.thumbnail = uploaded.secure_url;
  }

  // Apply text field updates
  const textFields = ["title", "subtitle", "description", "category", "language", "level", "learnings", "requirements", "includes"];
  textFields.forEach((key) => {
    if (fields[key] !== undefined) course[key] = fields[key];
  });

  if (fields.price) {
    if (fields.price.original) course.price.original = fields.price.original;
    if (fields.price.current)  course.price.current  = fields.price.current;
  }

  return await course.save();
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. DELETE COURSE
// FIX: Uses extractCloudinaryPublicId() — original had same broken publicId bug.
// ─────────────────────────────────────────────────────────────────────────────
export const removeCourse = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found!");
    error.statusCode = 404;
    throw error;
  }

  if (course.thumbnail) {
    const publicId = extractCloudinaryPublicId(course.thumbnail); // ← FIXED
    if (publicId) await deleteFromCloudinary(publicId).catch((err) =>
      console.warn("Cloudinary thumbnail delete failed (non-critical):", err)
    );
  }

  await Course.findByIdAndDelete(courseId);
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. TOGGLE PUBLISH
// ─────────────────────────────────────────────────────────────────────────────
export const togglePublishCourse = async (courseId, publish) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found!");
    error.statusCode = 404;
    throw error;
  }

  course.isPublished = publish === "true";
  await course.save();

  return course.isPublished ? "Published" : "Unpublished";
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET PUBLISHED COURSES (with optional auth context)
// FIX: getCourseProgressPercent was a dead stub — now actually calculates progress.
// ─────────────────────────────────────────────────────────────────────────────
export const getPublishedCourses = async (userId = null, enrolledIds = []) => {
  // Build the DB filter — exclude purchased courses at query time
  const filter = {
    isPublished: true,
    ...(enrolledIds.length > 0 && { _id: { $nin: enrolledIds } }),
  };
 
  const courses = await Course.find(filter)
    .populate({ path: "creator", select: "name photoUrl" })
    .lean();
 
  if (!userId) {
    // Guest users — no progress info needed
    return courses.map((c) => ({ ...c, isPurchased: false, progress: 0 }));
  }
 
  // Logged-in users: attach real progress.
  // isPurchased is always false here because enrolled courses were filtered out above,
  // but we keep the field so the API shape stays consistent.
  const enriched = await Promise.all(
    courses.map(async (course) => {
      const progress = await getCourseProgressPercent(course._id, userId);
      return { ...course, isPurchased: false, progress };
    })
  );
 
  return enriched;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET SINGLE COURSE BY ID (with optional auth context)
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseById = async (courseId, userId = null) => {
  const course = await Course.findById(courseId)
    .populate({ path: "sections", populate: { path: "lectures" } })
    .populate("creator", "name headline photoUrl")
    .populate({ path: "reviews", populate: { path: "user", select: "name photoUrl" } })
    .lean();

  if (!course) {
    const error = new Error("Course not found!");
    error.statusCode = 404;
    throw error;
  }

  // Calculate totals from actual data (not stale DB values)
  let totalDuration = 0;
  let totalLectures = 0;

  course.sections.forEach((section) => {
    const sectionDur = section.lectures.reduce(
      (sum, lec) => sum + (lec.durationInSeconds || 0), 0
    );
    section.totalDurationInSeconds = sectionDur;
    totalDuration += sectionDur;
    totalLectures += section.lectures.length;
  });

  course.totalDurationInSeconds = totalDuration;
  course.totalLectures = totalLectures;

  // Default values for guest
  course.purchaseStatus = "not_purchased";
  course.allowReview   = false;
  course.progress      = 0;

  if (userId) {
    const purchase = await CoursePurchase.findOne({
      userId,
      "courses.courseId": courseId,
      status: "completed",
    });

    if (purchase) {
      course.purchaseStatus = "completed";
      course.allowReview    = true;
      course.progress       = await getCourseProgressPercent(courseId, userId);
    }
  }

  return course;
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET CREATOR'S OWN COURSES
// ─────────────────────────────────────────────────────────────────────────────
export const getCreatorCourses = async (userId) => {
  const courses = await Course.find({ creator: userId });
  return courses;
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. VECTOR SEARCH (semantic search with embeddings)
// ─────────────────────────────────────────────────────────────────────────────
export const getSearchResults = async (query, userId = null) => {
  if (!query || query.trim() === "") return { suggestions: [], courses: [] };

  const queryEmbedding = await createEmbeddingForText(query.trim());
  if (!queryEmbedding) throw new Error("Failed to generate embedding for query.");

  const findCriteria = {
    isPublished: true,
    embedding: { $exists: true, $ne: [] },
  };

  if (userId) {
    const user = await User.findById(userId).select("enrolledCourses").lean();
    const purchasedIds = user?.enrolledCourses || [];
    if (purchasedIds.length > 0) findCriteria._id = { $nin: purchasedIds };
  }

  const allCourses = await Course.find(findCriteria)
    .select("_id title subtitle category thumbnail creator embedding")
    .lean();

  const courses = allCourses
    .map((c) => ({ ...c, similarity: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .filter((c) => c.similarity > 0.3)
    .slice(0, 10);

  const searchRegex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const suggestionDocs = await SearchSuggestion.find({ term: searchRegex }).limit(8).lean();
  const suggestions = suggestionDocs.map((s) => s.term);

  return { suggestions, courses };
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. TEXT SEARCH + FILTER (the browse/search page)
// ─────────────────────────────────────────────────────────────────────────────
export const searchCourse = async ({ query, categories, sortByPrice, userId }) => {
  const searchCriteria = {
    isPublished: true,
    $or: [
      { title:    { $regex: query || "", $options: "i" } },
      { subtitle: { $regex: query || "", $options: "i" } },
      { category: { $regex: query || "", $options: "i" } },
    ],
  };

  if (categories?.length > 0) searchCriteria.category = { $in: categories };

  if (userId) {
    const user = await User.findById(userId).select("enrolledCourses").lean();
    const purchased = user?.enrolledCourses || [];
    if (purchased.length > 0) searchCriteria._id = { $nin: purchased };
  }

  const sortOptions = {};
  if (sortByPrice === "low")  sortOptions["price.current"] = 1;
  if (sortByPrice === "high") sortOptions["price.current"] = -1;

  const courses = await Course.find(searchCriteria)
    .populate({ path: "creator", select: "name photoUrl" })
    .sort(sortOptions)
    .lean();

  return courses;
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. INSTRUCTOR DASHBOARD QUERIES
// FIX: getPaidCourses had an N+1 query — CoursePurchase.find() inside a loop.
//      Now fetches all purchases in ONE query, then groups in memory.
// ─────────────────────────────────────────────────────────────────────────────
export const getCoursesWithStudents = async (instructorId) => {
  const courses = await Course.find({ creator: instructorId })
    .populate("enrolledStudents", "name email photoUrl")
    .lean();

  return courses.map((course) => ({
    courseId:      course._id,
    courseTitle:   course.title,
    enrolledCount: course.enrolledStudents?.length || 0,
    students:      course.enrolledStudents || [],
    price:         course.price,
    ratings:       course.ratings,
    numOfReviews:  course.numOfReviews,
    thumbnail:     course.thumbnail,
    category:      course.category,
    level:         course.level,
    creator:       course.creator,
  }));
};

export const getCoursesWithStudentsAndReviews = async (instructorId) => {
  const courses = await Course.find({ creator: instructorId })
    .populate("enrolledStudents", "name email photoUrl")
    .populate({ path: "reviews", populate: { path: "user", select: "name email photoUrl" } })
    .lean();

  return courses.map((course) => ({
    courseId:      course._id,
    courseTitle:   course.title,
    enrolledCount: course.enrolledStudents?.length || 0,
    students:      course.enrolledStudents || [],
    price:         course.price,
    ratings:       course.ratings,
    numOfReviews:  course.numOfReviews,
    thumbnail:     course.thumbnail,
    category:      course.category,
    level:         course.level,
    creator:       course.creator,
    reviews: (course.reviews || []).map((r) => ({
      reviewId: r._id,
      rating:   r.rating,
      comment:  r.comment,
      user:     r.user,
    })),
  }));
};

export const getPaidCoursesWithPayments = async (instructorId) => {
  const courses = await Course.find({
    creator: instructorId,
    "price.current": { $gt: 0 },
  })
    .populate("enrolledStudents", "name email photoUrl")
    .lean();

  const courseIds = courses.map((c) => c._id);

  // FIX: ONE query for all purchases instead of one per course (N+1 → 1)
  const allPurchases = await CoursePurchase.find({
    "courses.courseId": { $in: courseIds },
  })
    .populate("userId", "name email photoUrl")
    .populate("courses.courseId", "title")
    .lean();

  // Group purchases by courseId in memory
  const purchasesByCourse = allPurchases.reduce((map, purchase) => {
    purchase.courses.forEach((item) => {
      const id = item.courseId?._id?.toString() || item.courseId?.toString();
      if (!map[id]) map[id] = [];
      map[id].push(purchase);
    });
    return map;
  }, {});

  return courses.map((course) => {
    const coursePurchases = (purchasesByCourse[course._id.toString()] || []).map((p) => ({
      purchaseId:  p._id,
      user:        p.userId,
      status:      p.status,
      purchasedAt: p.createdAt,
      courses:     p.courses,
    }));

    return {
      courseId:      course._id,
      courseTitle:   course.title,
      price:         course.price,
      enrolledCount: course.enrolledStudents?.length || 0,
      students:      course.enrolledStudents || [],
      ratings:       course.ratings,
      numOfReviews:  course.numOfReviews,
      thumbnail:     course.thumbnail,
      category:      course.category,
      level:         course.level,
      creator:       course.creator,
      coursePurchases,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. ANALYTICS
// FIX: Same N+1 fix applied — fetch all purchases in one query, group in memory.
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseAnalytics = async (instructorId) => {
  const courses = await Course.find({ creator: instructorId })
    .populate("enrolledStudents", "name email photoUrl")
    .populate({ path: "reviews", populate: { path: "user", select: "name photoUrl" } })
    .lean();

  if (!courses.length) return [];

  const courseIds = courses.map((c) => c._id);

  // ONE query for all completed purchases across all instructor courses
  const allPurchases = await CoursePurchase.find({
    "courses.courseId": { $in: courseIds },
    status: "completed",
  })
    .populate("userId", "name email photoUrl")
    .populate("courses.courseId", "title")
    .lean();

  // Group by courseId in memory
  const purchasesByCourse = allPurchases.reduce((map, purchase) => {
    purchase.courses.forEach((item) => {
      const id = item.courseId?._id?.toString() || item.courseId?.toString();
      if (!map[id]) map[id] = [];
      map[id].push(purchase);
    });
    return map;
  }, {});

  return courses.map((course) => {
    const coursePurchases = purchasesByCourse[course._id.toString()] || [];

    const totalRevenue = coursePurchases.reduce((sum, purchase) => {
      const item = purchase.courses.find(
        (c) => c.courseId?._id?.toString() === course._id.toString()
      );
      return sum + (item?.priceAtPurchase || 0);
    }, 0);

    const ratings = (course.reviews || []).map((r) => r.rating).filter((r) => typeof r === "number");
    const avgRating = ratings.length > 0
      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
      : null;

    return {
      courseId:      course._id,
      courseTitle:   course.title,
      enrolledCount: course.enrolledStudents?.length || 0,
      totalRevenue,
      purchaseCount: coursePurchases.length,
      avgRating,
      ratings:       course.ratings,
      numOfReviews:  course.numOfReviews,
      price:         course.price,
      thumbnail:     course.thumbnail,
      category:      course.category,
      level:         course.level,
      creator:       course.creator,
      reviews:       course.reviews || [],
      coursePurchases: coursePurchases.map((p) => ({
        purchaseId:  p._id,
        user:        p.userId,
        status:      p.status,
        purchasedAt: p.createdAt,
        courses:     p.courses,
      })),
    };
  });
};