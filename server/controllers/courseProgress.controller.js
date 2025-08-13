import { CourseProgress } from "../models/courseProgress.model.js";
import { Course } from "../models/course.model.js";
import { createNotification } from "../service/notification.service.js";


export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // step-1 fetch the user course progress
    let courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    }).populate("courseId");

    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "sections",
        populate: {
          path: "lectures",
          select: "title videoUrl durationInSeconds isPreview", // add fields as needed
        },
        select: "title lectures totalDurationInSeconds",
      });

    if (!courseDetails) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Step-2 If no progress found, return course details with an empty progress
    if (!courseProgress) {
      return res.status(200).json({
        data: {
          courseDetails,
          progress: [],
          completed: false,
        },
      });
    }

    // Step-3 Return the user's course progress alog with course details
    return res.status(200).json({
      data: {
        courseDetails,
        progress: courseProgress.lectureProgress,
        completed: courseProgress.completed,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.id;

    let courseProgress = await CourseProgress.findOne({ courseId, userId });

    if (!courseProgress) {
      courseProgress = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lectureProgress: [],
      });
    }

    const lectureIndex = courseProgress.lectureProgress.findIndex(
      (lecture) => lecture.lectureId.toString() === lectureId
    );

    if (lectureIndex !== -1) {
      courseProgress.lectureProgress[lectureIndex].viewed = true;
    } else {
      courseProgress.lectureProgress.push({
        lectureId,
        viewed: true,
      });
    }

    // Calculate total lectures
    const courseDetails = await Course.findById(courseId)
      .populate({ path: "sections", select: "lectures title" });

    const totalLectures = courseDetails.sections.reduce(
      (sum, section) => sum + (section.lectures?.length || 0),
      0
    );

    const lectureProgressLength = courseProgress.lectureProgress.filter(
      (lectureProg) => lectureProg.viewed
    ).length;

    if (lectureProgressLength === totalLectures) {
      courseProgress.completed = true;
      await createNotification(
        userId,
        `Congratulations! You have completed the course "${courseDetails.title}".`,
        `/course-detail/${courseDetails._id}/content`,
        'course_completion'
      );
    }

    await courseProgress.save();

    return res.status(200).json({
      message: "Lecture progress updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });
    if (!courseProgress)
      return res.status(404).json({ message: "Course progress not found" });

    courseProgress.lectureProgress.map(
      (lectureProgress) => (lectureProgress.viewed = true)
    );
    courseProgress.completed = true;
    await courseProgress.save();
    return res.status(200).json({ message: "Course marked as completed." });
  } catch (error) {
    console.log(error);
  }
};

export const markAsInCompleted = async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.id;
  
      const courseProgress = await CourseProgress.findOne({ courseId, userId });
      if (!courseProgress)
        return res.status(404).json({ message: "Course progress not found" });
  
      courseProgress.lectureProgress.map(
        (lectureProgress) => (lectureProgress.viewed = false)
      );
      courseProgress.completed = false;
      await courseProgress.save();
      return res.status(200).json({ message: "Course marked as incompleted." });
    } catch (error) {
      console.log(error);
    }
  };
