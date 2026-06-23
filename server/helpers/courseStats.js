import { Course } from "../models/course.model.js";
import { Section } from "../models/section.model.js";

;

export const updateCourseStats = async (courseId) => {
  const sections = await Section.find({ course: courseId }).populate("lectures");

  let courseDuration = 0;
  let totalLectures = 0;

  for (const section of sections) {
    const sectionDuration = section.lectures.reduce(
      (sum, lecture) => sum + (lecture.durationInSeconds || 0),
      0
    );

    totalLectures += section.lectures.length;
    courseDuration += sectionDuration;

    await Section.findByIdAndUpdate(section._id, {
      totalDurationInSeconds: sectionDuration,
    });
  }

  await Course.findByIdAndUpdate(courseId, {
    totalDurationInSeconds: courseDuration,
    totalLectures,
  });
};