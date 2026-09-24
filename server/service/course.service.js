// server/service/course.service.js
//
// PURPOSE: Business logic for course operations via OOP CourseService extending BaseService.

import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Certification } from "../models/certification.model.js";
import { CertificationIssuer } from "../models/certificationIssuer.model.js";
import { Review } from "../models/review.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { User } from "../models/user.model.js";
import { Section } from "../models/section.model.js";
import { Lecture } from "../models/lecture.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import Category from "../models/category.model.js";
import Topic from "../models/topic.model.js";
import axios from "axios";
import { uploadMedia, deleteFromCloudinary } from "../utils/cloudinary.js";
import { uploadHLSToB2, uploadRawFileToB2, deleteHLSFromB2, isB2Configured } from "../utils/b2Storage.js";
import { createEmbeddingForText, cosineSimilarity } from "../utils/embedding.js";
import { extractCloudinaryPublicId } from "../helpers/cloudinary.helper.js";
import { upsertSearchSuggestion } from "../helpers/searchSuggestion.helper.js";
import { BaseService } from "../core/base.service.js";
import { sanitizeTopics } from "../helpers/topic.helper.js";
import { updateCourseStats } from "../helpers/courseStats.helper.js";

const normalizeTopicName = (value) => value?.trim().toLowerCase();

const removeDuplicateCategoryTopics = (topics, category) => {
  const sanitized = sanitizeTopics(topics);
  if (sanitized.length === 0) return [];
  const categoryName = normalizeTopicName(category);
  const seen = new Set();

  return sanitized.filter((topic) => {
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

  let current = await Category.findOne({ name: categoryName })
    .populate('parent', 'name slug parent')
    .lean();

  if (!current) {
    return { categoryDetails: null, categoryHierarchy: [categoryName] };
  }

  const categoryDetails = current;
  const hierarchy = [current.name];

  while (current.parent) {
    const parentName = typeof current.parent === 'object' ? current.parent.name : null;
    const parentId = typeof current.parent === 'object' ? current.parent._id : current.parent;

    if (parentName) {
      hierarchy.unshift(parentName);
    }
    
    if (parentId) {
      current = await Category.findById(parentId).populate('parent', 'name slug parent').lean();
      if (!current) break;
    } else {
      break;
    }
  }

  return { categoryDetails, categoryHierarchy: hierarchy };
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
    for (const name of invalid) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      try {
        await Topic.create({
          name: name.trim(),
          slug,
          type: "topic",
          description: `Explore courses related to ${name}.`
        });
      } catch (err) {
        console.warn(`Auto-creating topic "${name}" failed:`, err.message);
      }
    }
  }

  return cleaned;
};

export class CourseService extends BaseService {
  constructor() {
    super(Course);
  }

  async createCourse({ userId, courseData }) {
    const { title, category, price, language, level, subtitle, description, learnings, topics } = courseData;

    if (!title || !category) {
      const error = new Error("Title and category are required.");
      error.statusCode = 400;
      throw error;
    }

    const coursePrice = price || { original: 0, current: 0 };
    const validatedTopics = await validateTopics(topics, category);

    const course = await this.create({
      title,
      category,
      language: language || "English",
      level: level || "All Levels",
      price: coursePrice,
      subtitle,
      description,
      learnings,
      topics: validatedTopics,
      creator: userId,
    });

    await upsertSearchSuggestion(title);
    return course;
  }

  async editCourse(courseId, fields, files) {
    const course = await this.findById(courseId);
    if (!course) {
      const error = new Error("Course not found!");
      error.statusCode = 404;
      throw error;
    }

    let thumbnailFile = null;
    let promoVideoFile = null;
    if (files) {
      if (files.courseThumbnail?.[0]) thumbnailFile = files.courseThumbnail[0];
      if (files.coursePromoVideo?.[0]) promoVideoFile = files.coursePromoVideo[0];
    }

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

    if (promoVideoFile) {
      // Clean up previous promo video if any from B2 and local directory
      await deleteHLSFromB2(`promo/promo-${courseId}`).catch(() => {});
      const previousOutputDir = path.join(process.cwd(), "public", "hls", `promo-${courseId}`);
      if (fs.existsSync(previousOutputDir)) {
        try { fs.rmSync(previousOutputDir, { recursive: true, force: true }); } catch (_) {}
      }

      course.promoVideoStatus = "processing";
      course.promoVideoUrl = "";
      course.promoVideoProgress = 5;
      await course.save();

      const rawPath = path.resolve(promoVideoFile.path);

      // Trigger asynchronous video-server pipeline
      (async () => {
        try {
          console.log(`[Promo Upload] Processing promotional video for course ${courseId}...`);
          const cleanName = path.basename(rawPath).replace(/[^a-zA-Z0-9._-]/g, "_");
          const rawKey = `raw-uploads/promo/${courseId}/${Date.now()}-${cleanName}`;

          // 1. Upload raw video file to Backblaze B2 (Class A PutObject)
          try {
            await uploadRawFileToB2(rawPath, rawKey);
          } catch (b2UploadErr) {
            console.warn(`[Promo Upload] B2 raw file upload warning: ${b2UploadErr.message}`);
          }

          // 2. Dispatch transcode job to dedicated video-server (port 8081)
          const videoServerUrl = process.env.VIDEO_SERVER_URL || "http://localhost:8081";
          console.log(`[Promo Upload] Dispatching transcoding job to ${videoServerUrl}...`);
          await axios.post(
            `${videoServerUrl}/api/v1/jobs/transcode`,
            {
              type: "promo",
              courseId,
              lectureId: `promo-${courseId}`,
              rawKey,
              rawLocalPath: rawPath,
            },
            { timeout: 10000 }
          );
          console.log(`[Promo Upload] Transcoder job accepted for course ${courseId}`);
        } catch (err) {
          console.error("[Promo Upload] Error dispatching promotional video to video-server:", err.message);
          await Course.findByIdAndUpdate(courseId, { promoVideoStatus: "failed", promoVideoProgress: 0 });
        }
      })();
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
      let parsed = fields.relatedCertificates;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (err) {
          parsed = [];
        }
      }
      if (Array.isArray(parsed)) {
        course.relatedCertificates = parsed
          .map((id) => (typeof id === "object" && id?._id ? id._id : id))
          .filter((id) => mongoose.Types.ObjectId.isValid(id));
        course.markModified("relatedCertificates");
      }
    }

    if (fields.topics !== undefined) {
      const sanitized = sanitizeTopics(fields.topics);
      course.topics = await validateTopics(sanitized, fields.category ?? course.category);
      course.markModified("topics");
    } else if (fields.category !== undefined) {
      course.topics = removeDuplicateCategoryTopics(course.topics, course.category);
      course.markModified("topics");
    }

    // Synchronize primaryTopic based on updated course.topics
    if (fields.primaryTopic !== undefined) {
      const cleanedPrimary = sanitizeTopics(fields.primaryTopic);
      course.primaryTopic = cleanedPrimary[0] || (typeof fields.primaryTopic === "string" ? fields.primaryTopic.trim() : "");
    }
    if (course.topics && course.topics.length > 0) {
      if (!course.primaryTopic || !course.topics.includes(course.primaryTopic)) {
        course.primaryTopic = course.topics[0];
      }
    } else {
      course.primaryTopic = "";
    }

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
      course.markModified("courseIncludes");
    }

    if (fields.price) {
      if (fields.price.original !== undefined && fields.price.original !== null && fields.price.original !== "") {
        course.price.original = Number(fields.price.original) || 0;
      }
      if (fields.price.current !== undefined && fields.price.current !== null && fields.price.current !== "") {
        course.price.current = Number(fields.price.current) || 0;
      }
    }

    const saved = await course.save();
    try {
      await updateCourseStats(course._id);
    } catch (statsErr) {
      console.warn("[editCourse] Failed to recalculate course stats:", statsErr.message);
    }
    return saved;
  }

  async removeCourse(courseId) {
    const course = await this.findById(courseId);
    if (!course) {
      const error = new Error("Course not found!");
      error.statusCode = 404;
      throw error;
    }

    if (course.thumbnail) {
      const publicId = extractCloudinaryPublicId(course.thumbnail);
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
    }

    // Clean up promo video from Backblaze B2 and local disk
    await deleteHLSFromB2(`promo/promo-${courseId}`);
    const promoDir = path.join(process.cwd(), "public", "hls", `promo-${courseId}`);
    if (fs.existsSync(promoDir)) {
      try { fs.rmSync(promoDir, { recursive: true, force: true }); } catch (_) {}
    }

    if (course.sections && course.sections.length > 0) {
      for (const sectionId of course.sections) {
        const section = await Section.findById(sectionId);
        if (section && section.lectures) {
          for (const lecId of section.lectures) {
            await deleteHLSFromB2(`lectures/${lecId}`);
            try {
              const lecHlsDir = path.join(process.cwd(), "public", "hls", lecId.toString());
              fs.rmSync(lecHlsDir, { recursive: true, force: true });
            } catch (_) {}
          }
          await Lecture.deleteMany({ _id: { $in: section.lectures } });
        }
      }
      await Section.deleteMany({ _id: { $in: course.sections } });
    }

    await this.deleteById(courseId);
  }

  async removePromoVideo(courseId) {
    const course = await this.findById(courseId);
    if (!course) {
      const error = new Error("Course not found!");
      error.statusCode = 404;
      throw error;
    }

    if (course.promoVideoUrl && course.promoVideoUrl.includes("cloudinary.com")) {
      const publicId = extractCloudinaryPublicId(course.promoVideoUrl);
      if (publicId) await deleteFromCloudinary(publicId, "video").catch(() => {});
    }

    await deleteHLSFromB2(`promo/promo-${courseId}`).catch(() => {});
    const outputDir = path.join(process.cwd(), "public", "hls", `promo-${courseId}`);
    if (fs.existsSync(outputDir)) {
      try { fs.rmSync(outputDir, { recursive: true, force: true }); } catch (_) {}
    }

    course.promoVideoUrl = "";
    course.promoVideoThumbnail = "";
    course.promoVideoStatus = "none";
    course.promoVideoProgress = 0;

    await course.save();
    return course;
  }

  async togglePublishCourse(courseId, publish) {
    const course = await this.findById(courseId);
    if (!course) {
      const error = new Error("Course not found!");
      error.statusCode = 404;
      throw error;
    }

    course.isPublished = publish === true || publish === "true";
    await course.save();

    const statusMessage = course.isPublished ? "Course published successfully." : "Course unpublished successfully.";
    return { course, statusMessage };
  }

  async getPublishedCourses(userId = null, enrolledIds = []) {
    // Build query — exclude courses the user already owns so they don't
    // appear on the "Explore All Courses" page for the purchasing user.
    const query = { isPublished: true };
    if (enrolledIds.length > 0) {
      query._id = { $nin: enrolledIds };
    }

    const courses = await Course.find(query)
      .populate({ path: "creator", select: "name photoUrl headline" })
      .populate("sections")
      .lean();

    return courses.map((course) => ({
      ...course,
      isPurchased: false, // all returned courses are not yet purchased by the user
    }));
  }

  async getCourseById(courseId, userId = null) {
    const isObjectId = mongoose.Types.ObjectId.isValid(courseId);
    const query = isObjectId
      ? { $or: [{ _id: courseId }, { slug: courseId }] }
      : { slug: courseId };

    const course = await Course.findOne(query)
      .populate({ path: "creator", select: "name photoUrl headline description" })
      .populate({ path: "sections", populate: { path: "lectures" } })
      .populate({ path: "relatedCertificates", populate: { path: "issuer", select: "name type" } })
      .lean();

    if (!course) {
      const error = new Error("Course not found.");
      error.statusCode = 404;
      throw error;
    }

    return attachCategoryDisplayInfo(course);
  }

  async getCreatorCourses(userId) {
    return await Course.find({ creator: userId })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean();
  }

  async getSearchResults(query, enrolledIds = []) {
    const courses = await Course.find({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { subtitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean();

    return courses.map((course) => ({
      ...course,
      isPurchased: enrolledIds.some((id) => id.toString() === course._id.toString()),
    }));
  }

  async searchCourse({ query, categories, sortByPrice, enrolledIds = [] }) {
    const searchCriteria = { isPublished: true };

    if (query) {
      searchCriteria.$or = [
        { title: { $regex: query, $options: "i" } },
        { subtitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ];
    }

    if (categories && categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    const sortOptions = {};
    if (sortByPrice === "low") {
      sortOptions["price.current"] = 1;
    } else if (sortByPrice === "high") {
      sortOptions["price.current"] = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl headline" })
      .sort(sortOptions)
      .lean();

    return courses.map((course) => ({
      ...course,
      isPurchased: enrolledIds.some((id) => id.toString() === course._id.toString()),
    }));
  }

  async getCoursesWithStudents(instructorId) {
    const courses = await Course.find({ creator: instructorId })
      .populate({ path: "enrolledStudents", select: "name email photoUrl" })
      .lean();

    return courses.map((course) => ({
      ...course,
      courseId: course._id,
      courseTitle: course.title,
      students: (course.enrolledStudents || []).map((s) => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        photoUrl: s.photoUrl,
      })),
    }));
  }

  async getCoursesWithStudentsAndReviews(instructorId) {
    const courses = await Course.find({ creator: instructorId })
      .populate({ path: "enrolledStudents", select: "name email photoUrl" })
      .lean();

    const courseIds = courses.map((c) => c._id);
    const reviews = await Review.find({ course: { $in: courseIds } })
      .populate("user", "name email photoUrl")
      .lean();

    const reviewsByCourse = reviews.reduce((acc, rev) => {
      const cId = rev.course?.toString();
      if (!acc[cId]) acc[cId] = [];
      acc[cId].push({
        reviewId: rev._id,
        rating: rev.rating,
        comment: rev.comment,
        reply: rev.reply,
        createdAt: rev.createdAt,
        user: rev.user || { name: "Anonymous", email: "" },
      });
      return acc;
    }, {});

    return courses.map((course) => ({
      ...course,
      courseId: course._id,
      courseTitle: course.title,
      students: course.enrolledStudents || [],
      reviews: reviewsByCourse[course._id.toString()] || [],
    }));
  }

  async getPaidCoursesWithPayments(instructorId) {
    const courses = await Course.find({
      creator: instructorId,
      "price.current": { $gt: 0 },
    }).lean();

    const courseIds = courses.map((c) => c._id.toString());

    const allPurchases = await CoursePurchase.find({
      status: "completed",
      "courses.courseId": { $in: courses.map((c) => c._id) },
    })
      .populate("userId", "name email photoUrl")
      .populate({ path: "courses.courseId", select: "_id title" })
      .lean();

    const purchasesByCourse = allPurchases.reduce((map, purchase) => {
      (purchase.courses || []).forEach((item) => {
        const id = item.courseId?._id?.toString() || item.courseId?.toString();
        if (courseIds.includes(id)) {
          if (!map[id]) map[id] = [];
          map[id].push({
            purchaseId: purchase._id || purchase.orderId,
            user: purchase.userId,
            status: purchase.status,
            purchasedAt: purchase.createdAt || purchase.purchasedAt,
            courses: purchase.courses,
          });
        }
      });
      return map;
    }, {});

    return courses.map((course) => ({
      ...course,
      courseId: course._id,
      courseTitle: course.title,
      coursePurchases: purchasesByCourse[course._id.toString()] || [],
    }));
  }

  async getCourseAnalytics(instructorId) {
    const courses = await Course.find({ creator: instructorId })
      .populate("reviews")
      .lean();

    const allPurchases = await CoursePurchase.find({ status: "completed" })
      .populate({ path: "courses.courseId", select: "_id title" })
      .populate("userId", "name email photoUrl")
      .lean();

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
  }

  async getTrendingSuggestions() {
    const suggestions = await SearchSuggestion.find({}).limit(10).lean();
    return suggestions.map((s) => s.term);
  }

  async saveBulkVideos(courseId, files) {
    const course = await this.findById(courseId);
    if (!course) {
      const error = new Error("Course not found!");
      error.statusCode = 404;
      throw error;
    }

    const backendUrl = process.env.BACKEND_URI || "http://localhost:10000";
    const newVideos = files.map((file) => {
      const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");
      const videoUrl = `${backendUrl}/${relativePath}`;
      return {
        filename: file.originalname,
        sizeBytes: file.size,
        url: videoUrl,
        durationInSeconds: 300,
        createdAt: new Date(),
      };
    });

    course.videoLibrary.push(...newVideos);
    await course.save();
    return { course, videos: newVideos };
  }
}

export const courseService = new CourseService();

export const createCourse = courseService.createCourse.bind(courseService);
export const editCourse = courseService.editCourse.bind(courseService);
export const removeCourse = courseService.removeCourse.bind(courseService);
export const removePromoVideo = courseService.removePromoVideo.bind(courseService);
export const togglePublishCourse = courseService.togglePublishCourse.bind(courseService);
export const getPublishedCourses = courseService.getPublishedCourses.bind(courseService);
export const getCourseById = courseService.getCourseById.bind(courseService);
export const getCreatorCourses = courseService.getCreatorCourses.bind(courseService);
export const getSearchResults = courseService.getSearchResults.bind(courseService);
export const searchCourse = courseService.searchCourse.bind(courseService);
export const getCoursesWithStudents = courseService.getCoursesWithStudents.bind(courseService);
export const getCoursesWithStudentsAndReviews = courseService.getCoursesWithStudentsAndReviews.bind(courseService);
export const getPaidCoursesWithPayments = courseService.getPaidCoursesWithPayments.bind(courseService);
export const getCourseAnalytics = courseService.getCourseAnalytics.bind(courseService);
export const getTrendingSuggestions = courseService.getTrendingSuggestions.bind(courseService);
export const saveBulkVideos = courseService.saveBulkVideos.bind(courseService);