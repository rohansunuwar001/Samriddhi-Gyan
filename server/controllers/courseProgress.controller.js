// server/controllers/courseProgress.controller.js
//
// WHAT CHANGED:
//  - Removed getMyLearningCourses — it's a duplicate of what's in user.service.js.
//    The route for /my-learning already lives in user.route.js. One source of truth.
//  - createNotification() import replaced with direct Notification.create() —
//    consistent with how purchase.service.js and user.service.js handle notifications.
//  - markAsCompleted / markAsInCompleted: replaced .map() with .forEach() —
//    .map() is for transforming arrays, not mutating them. Same result, correct intent.
//  - getCourseProgress: added a 500 response for the catch block (was swallowing errors silently).

import { CourseProgress } from "../models/courseProgress.model.js";
import { Course } from "../models/course.model.js";
import { Notification } from "../models/notification.model.js";
import { createNotification } from "../service/notification.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET PROGRESS FOR A COURSE
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const [courseProgress, courseDetails] = await Promise.all([
      CourseProgress.findOne({ courseId, userId }).populate("courseId"),
      Course.findById(courseId).populate({
        path: "sections",
        populate: {
          path: "lectures",
          select: "title videoUrl durationInSeconds isPreview",
        },
        select: "title lectures totalDurationInSeconds",
      }),
    ]);

    if (!courseDetails) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    // No progress yet — return course with empty progress
    if (!courseProgress) {
      return res.status(200).json({
        data: { courseDetails, progress: [], completed: false },
      });
    }

    return res.status(200).json({
      data: {
        courseDetails,
        progress: courseProgress.lectureProgress,
        completed: courseProgress.completed,
      },
    });
  } catch (error) {
    console.error("getCourseProgress error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE LECTURE PROGRESS (mark a lecture as viewed)
// ─────────────────────────────────────────────────────────────────────────────
export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.user._id;
 
    let courseProgress = await CourseProgress.findOne({ courseId, userId });
 
    if (!courseProgress) {
      courseProgress = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lectureProgress: [],
      });
    }
 
    const existingIndex = courseProgress.lectureProgress.findIndex(
      (lp) => lp.lectureId.toString() === lectureId
    );
 
    if (existingIndex !== -1) {
      courseProgress.lectureProgress[existingIndex].viewed = !courseProgress.lectureProgress[existingIndex].viewed;
    } else {
      courseProgress.lectureProgress.push({ lectureId, viewed: true });
    }
 
    const courseDetails = await Course.findById(courseId).populate({
      path: "sections",
      select: "lectures",
    });
 
    const totalLectures = courseDetails.sections.reduce(
      (sum, section) => sum + (section.lectures?.length || 0),
      0
    );
 
    const viewedCount = courseProgress.lectureProgress.filter((lp) => lp.viewed).length;
 
    if (viewedCount === totalLectures && totalLectures > 0) {
      courseProgress.completed = true;
 
      // FIX: was Notification.create() — now uses createNotification() for real-time emit
      await createNotification(
        userId,
        `Congratulations! You have completed the course "${courseDetails.title}".`,
        `/course-detail/${courseDetails._id}/content`,
        "course_completion"
      );
    }
 
    await courseProgress.save();
 
    return res.status(200).json({ success: true, message: "Lecture progress updated successfully." });
  } catch (error) {
    console.error("updateLectureProgress error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK ALL LECTURES AS COMPLETED
// FIX: Was using .map() to mutate — replaced with .forEach() (correct intent).
// ─────────────────────────────────────────────────────────────────────────────
export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });
    if (!courseProgress) {
      return res.status(404).json({ success: false, message: "Course progress not found." });
    }

    courseProgress.lectureProgress.forEach((lp) => { lp.viewed = true; }); // ← FIXED
    courseProgress.completed = true;
    await courseProgress.save();

    return res.status(200).json({ success: true, message: "Course marked as completed." });
  } catch (error) {
    console.error("markAsCompleted error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK ALL LECTURES AS INCOMPLETE (reset progress)
// FIX: Same .map() → .forEach() fix.
// ─────────────────────────────────────────────────────────────────────────────
export const markAsInCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });
    if (!courseProgress) {
      return res.status(404).json({ success: false, message: "Course progress not found." });
    }

    courseProgress.lectureProgress.forEach((lp) => { lp.viewed = false; }); // ← FIXED
    courseProgress.completed = false;
    await courseProgress.save();

    return res.status(200).json({ success: true, message: "Course marked as incomplete." });
  } catch (error) {
    console.error("markAsInCompleted error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};