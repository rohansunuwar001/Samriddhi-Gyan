
import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
// your schema

export const getCourseProgressPercent = async (courseId, userId) => {
  // Fetch course total lectures count
  const course = await Course.findById(courseId).select("totalLectures").lean();
  if (!course || !course.totalLectures) return 0;

  // Fetch user's lecture progress for the course
  const progress = await CourseProgress.findOne({ userId, courseId }).lean();
  if (!progress || !progress.lectureProgress) return 0;

  // Count viewed lectures
  const viewedCount = progress.lectureProgress.filter(lp => lp.viewed).length;

  // Calculate progress percentage
  const percent = (viewedCount / course.totalLectures) * 100;

  return Math.min(Math.max(percent, 0), 100);
};
