// server/service/course.service.js
//
// PURPOSE: All DB logic for courses lives here.
// Controllers read req → call these → send res.
// These functions never touch req or res.

import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { User } from "../models/user.model.js";
import { Section } from "../models/section.model.js";
import { Lecture } from "../models/lecture.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import Category from "../models/category.model.js";
import Topic from "../models/topic.model.js";
import { uploadMedia, deleteFromCloudinary } from "../utils/cloudinary.js";
import { createEmbeddingForText, cosineSimilarity } from "../utils/embedding.js";
import { extractCloudinaryPublicId } from "../helpers/cloudinary.helper.js";
import { upsertSearchSuggestion } from "../helpers/searchSuggestion.helper.js";

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
// ─────────────────────────────────────────────────────────────────────────────
// Validate that every requested topic matches an existing Category.name.
// Topics are restricted to the admin-managed Category list — no auto-creation —
// so "Explore related topics" always cross-links cleanly to real blog categories.
// Throws a 400 error listing any invalid topic names.
// ─────────────────────────────────────────────────────────────────────────────
const normalizeTopicName = (value) => value?.trim().toLowerCase();

const removeDuplicateCategoryTopics = (topics, category) => {
  if (!Array.isArray(topics) || topics.length === 0) return [];

  const categoryName = normalizeTopicName(category);
  const seen = new Set();

  return topics
    .map((topic) => topic?.trim())
    .filter(Boolean)
    .filter((topic) => {
      const normalizedTopic = normalizeTopicName(topic);
      if (!normalizedTopic || normalizedTopic === categoryName || seen.has(normalizedTopic)) {
        return false;
      }

      seen.add(normalizedTopic);
      return true;
    });
};

const getCategoryDisplayInfo = async (categoryName) => {
  if (!categoryName) return { categoryDetails: null, categoryHierarchy: [] };

  const category = await Category.findOne({ name: categoryName })
    .populate('parent', 'name slug')
    .lean();

  if (!category) {
    return { categoryDetails: null, categoryHierarchy: [categoryName] };
  }

  const categoryHierarchy = category.parent
    ? [category.parent.name, category.name]
    : [category.name];

  return { categoryDetails: category, categoryHierarchy };
};

const attachCategoryDisplayInfo = async (course) => {
  if (!course) return course;
  const categoryInfo = await getCategoryDisplayInfo(course.category);
  return { ...course, ...categoryInfo };
};

const validateTopics = async (topics, category) => {
  const cleaned = removeDuplicateCategoryTopics(topics, category);
  if (cleaned.length === 0) return [];

  const [matchingCategories, matchingTopics] = await Promise.all([
    Category.find({ name: { $in: cleaned } }).select("name"),
    Topic.find({ name: { $in: cleaned } }).select("name")
  ]);

  const validNames = new Set([
    ...matchingCategories.map((c) => c.name),
    ...matchingTopics.map((t) => t.name)
  ]);

  const invalid = cleaned.filter((t) => !validNames.has(t));

  if (invalid.length > 0) {
    const error = new Error(
      `These topics don't match any existing category or topic: ${invalid.join(", ")}. Please create the topic first or choose from the existing list.`
    );
    error.statusCode = 400;
    throw error;
  }

  return cleaned;
};

export const createCourse = async ({ userId, courseData }) => {
  const { title, category, price, language, level, subtitle, description, learnings, topics } = courseData;

  if (
    !title ||
    !category ||
    price?.original === undefined ||
    price?.original === null ||
    price?.current === undefined ||
    price?.current === null
  ) {
    const error = new Error("Title, category, and a full price object (original, current) are required.");
    error.statusCode = 400;
    throw error;
  }

  const validatedTopics = await validateTopics(topics, category);

  const course = await Course.create({
    title,
    category,
    language: language || "English",
    level: level || "All Levels",
    price,
    subtitle,
    description,
    learnings,
    topics: validatedTopics,
    creator: userId,
  });

  // Sync into search suggestions so the new course title shows up in autocomplete.
  await upsertSearchSuggestion(title);

  return course;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. EDIT COURSE
// FIX: Uses extractCloudinaryPublicId() — the original .split().pop() broke
//      for Cloudinary URLs with folder paths.
// ─────────────────────────────────────────────────────────────────────────────
export const editCourse = async (courseId, fields, files) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found!");
    error.statusCode = 404;
    throw error;
  }

  // Parse files from upload.fields
  let thumbnailFile = null;
  let promoVideoFile = null;
  if (files) {
    if (files.courseThumbnail && files.courseThumbnail[0]) {
      thumbnailFile = files.courseThumbnail[0];
    }
    if (files.coursePromoVideo && files.coursePromoVideo[0]) {
      promoVideoFile = files.coursePromoVideo[0];
    }
  }

  // Handle thumbnail replacement
  if (thumbnailFile) {
    if (course.thumbnail) {
      const publicId = extractCloudinaryPublicId(course.thumbnail);
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

  // Handle promo video transcode to HLS in background
  if (promoVideoFile) {
    course.promoVideoStatus = "processing";
    course.promoVideoUrl = ""; // reset url
    await course.save();

    // IMPORTANT: resolve to absolute path so ffmpeg can find the file
    // Multer sometimes gives a relative path (e.g. "uploads\abc123").
    // path.resolve() converts it to an absolute path from process.cwd().
    const rawPath = path.resolve(promoVideoFile.path);
    const outputDir = path.join(process.cwd(), "public", "hls", `promo-${courseId}`);

    // Remove old HLS output dir if it exists (re-upload scenario)
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    // Transcode in background
    import("../utils/transcoder.js").then(({ transcodeToHLS, extractThumbnail }) => {
      transcodeToHLS(rawPath, outputDir, async (pct) => {
        console.log(`[Promo Transcoder] Course ${courseId} transcode progress: ${pct}%`);
        try {
          await Course.findByIdAndUpdate(courseId, { promoVideoProgress: pct });
        } catch (err) {
          console.error("Failed to update transcode progress:", err.message);
        }
      })
      .then(async () => {
        const backendUrl = process.env.BACKEND_URI || "http://localhost:8080";
        const masterUrl = `${backendUrl}/hls/promo-${courseId}/master.m3u8`;
        const thumbnailFilename = "thumbnail.jpg";
        const thumbnailDest = path.join(outputDir, thumbnailFilename);
        let promoVideoThumbnail = "";
        try {
          await extractThumbnail(rawPath, thumbnailDest);
          promoVideoThumbnail = `${backendUrl}/hls/promo-${courseId}/${thumbnailFilename}`;
          console.log(`[Promo Transcoder] Thumbnail extracted successfully: ${promoVideoThumbnail}`);
        } catch (thumbErr) {
          console.error("[Promo Transcoder] Failed to extract thumbnail:", thumbErr.message);
        }

        await Course.findByIdAndUpdate(courseId, {
          promoVideoStatus: "ready",
          promoVideoUrl: masterUrl,
          promoVideoThumbnail: promoVideoThumbnail,
          promoVideoProgress: 100
        });
        console.log(`[Promo Transcoder] Course ${courseId} transcode ready: ${masterUrl}`);
        try { fs.rmSync(rawPath, { force: true }); } catch(_) {}
      })
      .catch(async (err) => {
        console.error(`[Promo Transcoder] Course ${courseId} transcode failed:`, err.message);
        await Course.findByIdAndUpdate(courseId, {
          promoVideoStatus: "failed"
        });
        try { fs.rmSync(rawPath, { force: true }); } catch(_) {}
      });
    }).catch(err => {
      console.error("Failed to load HLS transcoder:", err);
    });
  }

  const textFields = ["title", "subtitle", "description", "category", "language", "level", "learnings", "requirements", "whoIsThisFor", "enrollmentType", "primaryTopic"];
  textFields.forEach((key) => {
    if (fields[key] !== undefined) course[key] = fields[key];
  });

  if (fields.sections !== undefined) {
    try {
      course.sections = typeof fields.sections === "string" ? JSON.parse(fields.sections) : fields.sections;
    } catch (err) {
      console.error("Failed to parse sections array:", err);
    }
  }

  if (fields.includedInSubscription !== undefined) {
    course.includedInSubscription = fields.includedInSubscription === true || fields.includedInSubscription === "true";
  }

  if (fields.relatedCertificates !== undefined) {
    try {
      course.relatedCertificates = typeof fields.relatedCertificates === "string"
        ? JSON.parse(fields.relatedCertificates)
        : fields.relatedCertificates;
    } catch (err) {
      console.error("Failed to parse relatedCertificates:", err);
    }
  }

  // Validate topics against the existing Category list before applying.
  if (fields.topics !== undefined) {
    course.topics = await validateTopics(fields.topics, fields.category ?? course.category);
  } else if (fields.category !== undefined) {
    course.topics = removeDuplicateCategoryTopics(course.topics, course.category);
  }

  // Handle structured courseIncludes (replaces old free-text includes[])
  if (fields.courseIncludes) {
    const ci = fields.courseIncludes;
    const existing = course.courseIncludes || {};
    course.courseIncludes = {
      codingExercises:       Number(ci.codingExercises       ?? existing.codingExercises       ?? 0),
      articles:              Number(ci.articles              ?? existing.articles              ?? 0),
      downloadableResources: Number(ci.downloadableResources ?? existing.downloadableResources ?? 0),
      hasMobileAccess: ci.hasMobileAccess !== undefined
        ? ci.hasMobileAccess === true || ci.hasMobileAccess === "true"
        : (existing.hasMobileAccess ?? true),
      hasCertificate: ci.hasCertificate !== undefined
        ? ci.hasCertificate === true || ci.hasCertificate === "true"
        : (existing.hasCertificate ?? true),
    };
  }

  if (fields.price) {
    if (fields.price.original !== undefined && fields.price.original !== null) course.price.original = fields.price.original;
    if (fields.price.current !== undefined && fields.price.current !== null)  course.price.current  = fields.price.current;
  }

  if (fields.videoLibrary) {
    try {
      const parsed = typeof fields.videoLibrary === "string" ? JSON.parse(fields.videoLibrary) : fields.videoLibrary;
      course.videoLibrary = [...(course.videoLibrary || []), ...parsed];
    } catch (err) {
      console.error("Failed to parse videoLibrary:", err);
    }
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
// 3b. DELETE PROMO VIDEO
// ─────────────────────────────────────────────────────────────────────────────
export const removePromoVideo = async (courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found!");
    error.statusCode = 404;
    throw error;
  }

  // Delete HLS output directory if exists
  const outputDir = path.join(process.cwd(), "public", "hls", `promo-${courseId}`);
  if (fs.existsSync(outputDir)) {
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to delete promo video HLS directory:", err.message);
    }
  }

  // Update DB fields
  course.promoVideoUrl = "";
  course.promoVideoStatus = "none";
  course.promoVideoProgress = 0;
  course.promoVideoThumbnail = "";
  await course.save();

  return course;
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
    return await Promise.all(
      courses.map(async (course) => attachCategoryDisplayInfo({ ...course, isPurchased: false, progress: 0 }))
    );
  }
 
  // Logged-in users: attach real progress.
  // isPurchased is always false here because enrolled courses were filtered out above,
  // but we keep the field so the API shape stays consistent.
  const enriched = await Promise.all(
    courses.map(async (course) => {
      const progress = await getCourseProgressPercent(course._id, userId);
      return attachCategoryDisplayInfo({ ...course, isPurchased: false, progress });
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
    .populate("creator", "name headline photoUrl role")
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
  course.topics = removeDuplicateCategoryTopics(course.topics, course.category);

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

  return attachCategoryDisplayInfo(course);
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
export const getSearchResults = async (query, enrolledIds = []) => {
  if (!query || query.trim() === "") return { suggestions: [], courses: [] };

  const queryEmbedding = await createEmbeddingForText(query.trim());
  if (!queryEmbedding) throw new Error("Failed to generate embedding for query.");

  const findCriteria = {
    isPublished: true,
    embedding: { $exists: true, $ne: [] },
  };

  if (Array.isArray(enrolledIds) && enrolledIds.length > 0) {
    findCriteria._id = { $nin: enrolledIds.map((id) => new mongoose.Types.ObjectId(id)) };
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
export const searchCourse = async ({ query, categories, sortByPrice, enrolledIds = [] }) => {
  const searchCriteria = {
    isPublished: true,
    $or: [
      { title:    { $regex: query || "", $options: "i" } },
      { subtitle: { $regex: query || "", $options: "i" } },
      { category: { $regex: query || "", $options: "i" } },
    ],
  };

  if (categories?.length > 0) searchCriteria.category = { $in: categories };

  if (Array.isArray(enrolledIds) && enrolledIds.length > 0) {
    searchCriteria._id = { $nin: enrolledIds.map((id) => new mongoose.Types.ObjectId(id)) };
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
      return sum + (item?.instructorShare || 0);
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

export const getTrendingSuggestions = async () => {
  const suggestions = await SearchSuggestion.find({}).limit(10).lean();
  return suggestions.map((s) => s.term);
};

export const saveBulkVideos = async (courseId, files) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Course not found!");
    error.statusCode = 404;
    throw error;
  }

  const backendUrl = process.env.BACKEND_URI || "http://localhost:10000";
  const newVideos = files.map((file) => {
    // Normalize path separators to forward slashes for URLs
    const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");
    const videoUrl = `${backendUrl}/${relativePath}`;
    return {
      filename: file.originalname,
      sizeBytes: file.size,
      url: videoUrl,
      durationInSeconds: 300, // Default duration mock
      createdAt: new Date(),
    };
  });

  course.videoLibrary.push(...newVideos);
  await course.save();
  return { course, videos: newVideos };
};