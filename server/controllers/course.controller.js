// server/controllers/course.controller.js
//
// PURPOSE: HTTP layer controller for course operations using OOP BaseController.

import { BaseController } from "../core/base.controller.js";
import { getEnrolledIds } from "../helpers/courseFilter.helper.js";
import { validateRequiredFields } from "../helpers/validate.helper.js";
import { Course } from "../models/course.model.js";
import { courseService } from "../service/course.service.js";
import { sanitizeTopics } from "../helpers/topic.helper.js";
import axios from "axios";

const parseFormDataBody = (body) => {
  const parsed = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "topics" || key === "topics[]") {
      continue; // Handled specially below to avoid duplication/clobbering
    }

    if (key.endsWith("[]")) {
      const cleanKey = key.slice(0, -2);
      if (!parsed[cleanKey]) parsed[cleanKey] = [];
      if (Array.isArray(value)) parsed[cleanKey] = value;
      else parsed[cleanKey].push(value);
    } else if (key.includes("[") && key.endsWith("]")) {
      const openBrac = key.indexOf("[");
      const rootKey = key.slice(0, openBrac);
      const subKey = key.slice(openBrac + 1, -1);
      if (!parsed[rootKey]) parsed[rootKey] = {};
      parsed[rootKey][subKey] = value;
    } else {
      if ((key === "relatedCertificates" || key === "sections") && typeof value === "string") {
        try {
          parsed[key] = JSON.parse(value);
        } catch (_) {
          parsed[key] = value;
        }
      } else {
        parsed[key] = value;
      }
    }
  }

  // Handle topics reliably from topics, topics[], or both
  if (body.topics !== undefined || body["topics[]"] !== undefined) {
    const raw = [];
    if (body.topics !== undefined) raw.push(body.topics);
    if (body["topics[]"] !== undefined) raw.push(body["topics[]"]);
    parsed.topics = sanitizeTopics(raw);
  }

  return parsed;
};

export class CourseController extends BaseController {
  constructor(service = courseService) {
    super();
    this.service = service;
  }

  createCourse = async (req, res) => {
    try {
      const course = await this.service.createCourse({
        userId: req.user._id,
        courseData: req.body,
      });
      return this.sendSuccess(res, { course }, "Course created successfully. Embedding will be generated automatically.", 201);
    } catch (error) {
      console.error("createCourse error:", error.message);
      return this.sendError(res, error.message, error.statusCode || 500);
    }
  };

  editCourse = async (req, res) => {
    try {
      const fields = parseFormDataBody(req.body);
      const course = await this.service.editCourse(req.params.courseId, fields, req.files);
      return this.sendSuccess(res, { course }, "Course updated successfully.");
    } catch (error) {
      console.error("editCourse error:", error);
      return this.sendError(res, error.message, error.statusCode || 500);
    }
  };

  removeCourse = async (req, res) => {
    try {
      await this.service.removeCourse(req.params.courseId);
      return this.sendSuccess(res, {}, "Course removed successfully.");
    } catch (error) {
      console.error("removeCourse error:", error.message);
      return this.sendError(res, error.message, error.statusCode || 500);
    }
  };

  deletePromoVideo = async (req, res) => {
    try {
      const course = await this.service.removePromoVideo(req.params.courseId);
      return this.sendSuccess(res, { course }, "Promotional video deleted successfully.");
    } catch (error) {
      console.error("deletePromoVideo error:", error.message);
      return this.sendError(res, error.message, error.statusCode || 500);
    }
  };

  webhookPromoComplete = async (req, res) => {
    try {
      const { courseId } = req.params;
      const { videoUrl, thumbnail, durationInSeconds, status, error } = req.body;
      const internalSecret = req.headers["x-internal-secret"];
      const expectedSecret = process.env.INTERNAL_SECRET_KEY || "transcoder_internal_secret_change_me";

      if (internalSecret && internalSecret !== expectedSecret) {
        return this.sendError(res, "Unauthorized internal webhook caller", 401);
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return this.sendError(res, "Course not found", 404);
      }

      const update = {};
      if (status === "ready") {
        update.promoVideoStatus = "ready";
        update.promoVideoProgress = 100;
        if (videoUrl) update.promoVideoUrl = videoUrl;
        if (thumbnail) update.promoVideoThumbnail = thumbnail;
      } else if (status === "failed") {
        update.promoVideoStatus = "failed";
        update.promoVideoProgress = 0;
      }

      await Course.findByIdAndUpdate(courseId, update);
      console.log(`[webhookPromoComplete] Course ${courseId} updated with promo video status: ${status} (url: ${videoUrl || 'none'})`);
      return this.sendSuccess(res, {}, "Webhook processed successfully.");
    } catch (err) {
      console.error("[webhookPromoComplete] Error:", err.message);
      return this.sendError(res, err.message, 500);
    }
  };

  togglePublishCourse = async (req, res) => {
    try {
      const { statusMessage } = await this.service.togglePublishCourse(req.params.courseId, req.query.publish);
      return this.sendSuccess(res, {}, statusMessage);
    } catch (error) {
      console.error("togglePublishCourse error:", error.message);
      return this.sendError(res, error.message, error.statusCode || 500);
    }
  };

  getPublishedCourse = async (req, res) => {
    try {
      const userId = req.user?._id ?? null;
      const enrolledIds = await getEnrolledIds(req);
      const courses = await this.service.getPublishedCourses(userId, enrolledIds);
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("getPublishedCourse error:", error.message);
      return this.sendError(res, "Failed to get published courses.", 500);
    }
  };

  getCourseById = async (req, res) => {
    try {
      const userId = req.user?._id || null;
      const course = await this.service.getCourseById(req.params.courseId, userId);

      // If promotional video is processing, poll video-server for live progress
      if (course && course.promoVideoStatus === "processing") {
        const videoServerUrl = process.env.VIDEO_SERVER_URL || "http://localhost:8081";
        try {
          const { data } = await axios.get(`${videoServerUrl}/api/v1/jobs/promo-${req.params.courseId}/status`, { timeout: 1200 });
          if (data?.success && data?.job) {
            course.promoVideoProgress = data.job.progress || course.promoVideoProgress;
            if (data.job.status === "ready" && data.job.videoUrl) {
              course.promoVideoStatus = "ready";
              course.promoVideoUrl = data.job.videoUrl;
              course.promoVideoThumbnail = data.job.thumbnail || course.promoVideoThumbnail;
              course.promoVideoProgress = 100;
              await Course.findByIdAndUpdate(req.params.courseId, {
                promoVideoStatus: "ready",
                promoVideoUrl: data.job.videoUrl,
                promoVideoThumbnail: data.job.thumbnail || course.promoVideoThumbnail,
                promoVideoProgress: 100,
              });
            }
          }
        } catch (_) {}
      }

      return this.sendSuccess(res, { course });
    } catch (error) {
      console.error("getCourseById error:", error.message);
      return this.sendError(res, error.message, error.statusCode || 500);
    }
  };

  getCreatorCourses = async (req, res) => {
    try {
      const courses = await this.service.getCreatorCourses(req.user._id);
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("getCreatorCourses error:", error.message);
      return this.sendError(res, "Failed to fetch courses.", 500);
    }
  };

  getSearchResults = async (req, res) => {
    try {
      const enrolledIds = await getEnrolledIds(req);
      const result = await this.service.getSearchResults(req.query.q, enrolledIds);
      return res.status(200).json(result);
    } catch (error) {
      console.error("getSearchResults error:", error.message);
      return this.sendError(res, "Server error during search.", 500);
    }
  };

  searchCourse = async (req, res) => {
    try {
      const { query, categories, sortByPrice } = req.query;
      const enrolledIds = await getEnrolledIds(req);
      const courses = await this.service.searchCourse({
        query,
        categories: categories ? (Array.isArray(categories) ? categories : [categories]) : [],
        sortByPrice,
        enrolledIds,
      });
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("searchCourse error:", error.message);
      return this.sendError(res, "Failed to search courses.", 500);
    }
  };

  getCoursesWithEnrolledStudents = async (req, res) => {
    try {
      const courses = await this.service.getCoursesWithStudents(req.user._id);
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("getCoursesWithEnrolledStudents error:", error.message);
      return this.sendError(res, "Failed to fetch courses.", 500);
    }
  };

  getCoursesWithEnrolledStudentsAndReviews = async (req, res) => {
    try {
      const courses = await this.service.getCoursesWithStudentsAndReviews(req.user._id);
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("getCoursesWithEnrolledStudentsAndReviews error:", error.message);
      return this.sendError(res, "Failed to fetch courses.", 500);
    }
  };

  getPaidCoursesWithEnrolledStudentsAndPayments = async (req, res) => {
    try {
      const courses = await this.service.getPaidCoursesWithPayments(req.user._id);
      return this.sendSuccess(res, { courses });
    } catch (error) {
      console.error("getPaidCoursesWithEnrolledStudentsAndPayments error:", error.message);
      return this.sendError(res, "Failed to fetch paid courses.", 500);
    }
  };

  getCourseAnalytics = async (req, res) => {
    try {
      const analytics = await this.service.getCourseAnalytics(req.user._id);
      const { getSubscriptionPayouts } = await import("../utils/subscriptionPayout.js");
      const payoutsData = await getSubscriptionPayouts();
      const subscriptionRevenue = payoutsData.payouts[req.user._id.toString()] || 0;

      return res.status(200).json({
        success: true,
        analytics,
        subscriptionRevenue,
      });
    } catch (error) {
      console.error("getCourseAnalytics error:", error.message);
      return this.sendError(res, "Failed to fetch analytics.", 500);
    }
  };

  getTrendingSuggestions = async (req, res) => {
    try {
      const suggestions = await this.service.getTrendingSuggestions();
      return this.sendSuccess(res, { suggestions });
    } catch (error) {
      console.error("getTrendingSuggestions error:", error.message);
      return this.sendError(res, "Failed to fetch trending suggestions.", 500);
    }
  };

  bulkUploadCourseVideos = async (req, res) => {
    try {
      const { courseId } = req.params;
      if (!req.files || req.files.length === 0) {
        return this.sendError(res, "No video files provided", 400);
      }

      const { videos } = await this.service.saveBulkVideos(courseId, req.files);

      return this.sendSuccess(res, { videos }, "Bulk videos uploaded successfully.");
    } catch (error) {
      console.error("bulkUploadCourseVideos error:", error);
      return this.sendError(res, "Failed to upload bulk videos.", 500);
    }
  };

  listAllCoursesBrief = async (req, res) => {
    try {
      const list = await Course.find({ isPublished: true }).select("_id title category").sort({ title: 1 }).lean();
      return this.sendSuccess(res, { courses: list });
    } catch (error) {
      console.error("listAllCoursesBrief error:", error);
      return this.sendError(res, "Failed to fetch courses.", 500);
    }
  };
}

export const courseController = new CourseController();

export const createCourse = courseController.createCourse;
export const editCourse = courseController.editCourse;
export const removeCourse = courseController.removeCourse;
export const deletePromoVideo = courseController.deletePromoVideo;
export const webhookPromoComplete = courseController.webhookPromoComplete;
export const togglePublishCourse = courseController.togglePublishCourse;
export const getPublishedCourse = courseController.getPublishedCourse;
export const getCourseById = courseController.getCourseById;
export const getCreatorCourses = courseController.getCreatorCourses;
export const getSearchResults = courseController.getSearchResults;
export const searchCourse = courseController.searchCourse;
export const getCoursesWithEnrolledStudents = courseController.getCoursesWithEnrolledStudents;
export const getCoursesWithEnrolledStudentsAndReviews = courseController.getCoursesWithEnrolledStudentsAndReviews;
export const getPaidCoursesWithEnrolledStudentsAndPayments = courseController.getPaidCoursesWithEnrolledStudentsAndPayments;
export const getCourseAnalytics = courseController.getCourseAnalytics;
export const getTrendingSuggestions = courseController.getTrendingSuggestions;
export const bulkUploadCourseVideos = courseController.bulkUploadCourseVideos;
export const listAllCoursesBrief = courseController.listAllCoursesBrief;