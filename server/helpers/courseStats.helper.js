import { Course } from "../models/course.model.js";
import { Section } from "../models/section.model.js";
import { Lecture } from "../models/lecture.model.js";

;

export const updateCourseStats = async (courseId) => {
  if (!courseId) return;

  const sections = await Section.find({ course: courseId }).populate("lectures");

  let courseDuration = 0;
  let totalLectures = 0;
  let downloadableResources = 0;
  let codingExercises = 0;
  let articles = 0;
  let hasCaptions = false;

  for (const section of sections) {
    const lectures = section.lectures || [];
    const sectionDuration = lectures.reduce(
      (sum, lecture) => sum + (lecture?.durationInSeconds || 0),
      0
    );

    totalLectures += lectures.length;
    courseDuration += sectionDuration;

    for (const lecture of lectures) {
      if (!lecture) continue;

      // 1. Downloadable resources count
      if (Array.isArray(lecture.resources)) {
        downloadableResources += lecture.resources.length;
      }

      // 2. Coding exercises / Labs count
      if (
        lecture.lab &&
        (lecture.lab.isActive || lecture.lab.title || lecture.lab.url || lecture.lab.pdfUrl)
      ) {
        codingExercises += 1;
      }

      // 3. Captions
      if (
        Array.isArray(lecture.captions) &&
        lecture.captions.length > 0 &&
        !lecture.captionsDisabled
      ) {
        hasCaptions = true;
      }

      // 4. Articles (text-only lectures without video)
      if (
        (!lecture.videoUrl || lecture.videoUrl === "") &&
        (lecture.description || lecture.transcript)
      ) {
        articles += 1;
      }
    }

    await Section.findByIdAndUpdate(section._id, {
      totalDurationInSeconds: sectionDuration,
    });
  }

  const existingCourse = await Course.findById(courseId).select("courseIncludes").lean();
  const existingCi = existingCourse?.courseIncludes || {};

  await Course.findByIdAndUpdate(courseId, {
    totalDurationInSeconds: courseDuration,
    totalLectures,
    "courseIncludes.codingExercises": codingExercises,
    "courseIncludes.downloadableResources": downloadableResources,
    "courseIncludes.articles": Math.max(articles, existingCi.articles || 0),
    "courseIncludes.hasCaptions": hasCaptions,
    "courseIncludes.hasMobileAccess": existingCi.hasMobileAccess !== false,
    "courseIncludes.hasCertificate": existingCi.hasCertificate !== false,
  });
};