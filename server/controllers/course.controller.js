// server/controllers/course.controller.js
//
// Controllers only: read req → call service → send res.
// No model imports. No Cloudinary. No bcrypt. All logic is in course.service.js.

import { getEnrolledIds } from "../helpers/courseFilter.helper.js";
import { validateRequiredFields } from "../helpers/validate.helper.js";
import {
  createCourse       as createCourseService,
  editCourse         as editCourseService,
  removeCourse       as removeCourseService,
  togglePublishCourse as togglePublishService,
  getPublishedCourses,
  getCourseById      as getCourseByIdService,
  getCreatorCourses  as getCreatorCoursesService,
  getSearchResults   as getSearchResultsService,
  searchCourse       as searchCourseService,
  getCoursesWithStudents,
  getCoursesWithStudentsAndReviews,
  getPaidCoursesWithPayments,
  getCourseAnalytics as getCourseAnalyticsService,
  getTrendingSuggestions as getTrendingSuggestionsService,
} from "../service/course.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const course = await createCourseService({
      userId: req.user._id,
      courseData: req.body,
    });
    return res.status(201).json({
      success: true,
      course,
      message: "Course created successfully. Embedding will be generated automatically.",
    });
  } catch (error) {
    console.error("createCourse error:", error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIT
// ─────────────────────────────────────────────────────────────────────────────
export const editCourse = async (req, res) => {
  try {
    const course = await editCourseService(req.params.courseId, req.body, req.file);
    return res.status(200).json({ success: true, course, message: "Course updated successfully." });
  } catch (error) {
    console.error("editCourse error:", error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────
export const removeCourse = async (req, res) => {
  try {
    await removeCourseService(req.params.courseId);
    return res.status(200).json({ success: true, message: "Course removed successfully." });
  } catch (error) {
    console.error("removeCourse error:", error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE PUBLISH
// ─────────────────────────────────────────────────────────────────────────────
export const togglePublishCourse = async (req, res) => {
  try {
    const statusMessage = await togglePublishService(req.params.courseId, req.query.publish);
    return res.status(200).json({ success: true, message: `Course is ${statusMessage}` });
  } catch (error) {
    console.error("togglePublishCourse error:", error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PUBLISHED COURSES (guest + auth)
// ─────────────────────────────────────────────────────────────────────────────
export const getPublishedCourse = async (req, res) => {
  try {
    const userId      = req.user?._id ?? null;
    const enrolledIds = await getEnrolledIds(req);     // ← resolve purchased IDs
    const courses     = await getPublishedCourses(userId, enrolledIds);  // ← pass them down
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("getPublishedCourse error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to get published courses." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE COURSE BY ID
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const course = await getCourseByIdService(req.params.courseId, userId);
    return res.status(200).json({ success: true, course });
  } catch (error) {
    console.error("getCourseById error:", error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CREATOR'S OWN COURSES
// ─────────────────────────────────────────────────────────────────────────────
export const getCreatorCourses = async (req, res) => {
  try {
    const courses = await getCreatorCoursesService(req.user._id);
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("getCreatorCourses error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch courses." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC SEARCH (vector / embedding based)
// ─────────────────────────────────────────────────────────────────────────────
export const getSearchResults = async (req, res) => {
  try {
    const result = await getSearchResultsService(req.query.q, req.user?._id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("getSearchResults error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during search." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TEXT SEARCH + FILTER (browse page)
// ─────────────────────────────────────────────────────────────────────────────
export const searchCourse = async (req, res) => {
  try {
    const { query, categories, sortByPrice } = req.query;
    const courses = await searchCourseService({
      query,
      categories: categories ? (Array.isArray(categories) ? categories : [categories]) : [],
      sortByPrice,
      userId: req.user?._id || null,
    });
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("searchCourse error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to search courses." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export const getCoursesWithEnrolledStudents = async (req, res) => {
  try {
    const courses = await getCoursesWithStudents(req.user._id);
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("getCoursesWithEnrolledStudents error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch courses." });
  }
};

export const getCoursesWithEnrolledStudentsAndReviews = async (req, res) => {
  try {
    const courses = await getCoursesWithStudentsAndReviews(req.user._id);
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("getCoursesWithEnrolledStudentsAndReviews error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch courses." });
  }
};

export const getPaidCoursesWithEnrolledStudentsAndPayments = async (req, res) => {
  try {
    const courses = await getPaidCoursesWithPayments(req.user._id);
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("getPaidCoursesWithEnrolledStudentsAndPayments error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch paid courses." });
  }
};

export const getCourseAnalytics = async (req, res) => {
  try {
    const analytics = await getCourseAnalyticsService(req.user._id);
    const { getSubscriptionPayouts } = await import("../utils/subscriptionPayout.js");
    const payoutsData = await getSubscriptionPayouts();
    const subscriptionRevenue = payoutsData.payouts[req.user._id.toString()] || 0;

    return res.status(200).json({
      success: true,
      analytics,
      subscriptionRevenue
    });
  } catch (error) {
    console.error("getCourseAnalytics error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics." });
  }
};

export const getTrendingSuggestions = async (req, res) => {
  try {
    const suggestions = await getTrendingSuggestionsService();
    return res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.error("getTrendingSuggestions error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch trending suggestions." });
  }
};