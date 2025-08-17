import { CourseProgress } from "../models/courseProgress.model.js";
import { Course } from "../models/course.model.js";
import { createNotification } from "../service/notification.service.js";
import { User } from "../models/user.model.js";


export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

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
    const userId = req.user._id;

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
      const userId = req.user._id;
  
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


  export const getMyLearningCourses = async (req, res) => {
  try {
    const userId = req.user._id;

    // --- Step 1: Get all IDs of courses the user is enrolled in ---
    const user = await User.findById(userId).select("enrolledCourses").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const enrolledCourseIds = user.enrolledCourses;

    // --- Step 2: Fetch all course details and all progress documents in parallel ---
    const [courses, userProgress] = await Promise.all([
      // Query 1: Get full details for every course the user is enrolled in.
      Course.find({ _id: { $in: enrolledCourseIds } })
        .populate({
          path: 'sections',
          select: 'lectures', // We only need the lectures array from sections
          populate: {
            path: 'lectures',
            select: 'durationInSeconds', // We only need duration from lectures
          },
        })
        .populate({ path: 'creator', select: 'name photoUrl' }) // For the course card
        .lean(), // Use .lean() for better performance as we are only reading data.

      // Query 2: Get all progress documents for this user.
      CourseProgress.find({ userId }).lean(),
    ]);

    // --- Step 3: Map progress to each course in application memory (very fast) ---
    const coursesWithProgress = courses.map((course) => {
      // Find the corresponding progress document for the current course.
      const progressDoc = userProgress.find(p => p.courseId.equals(course._id));

      let totalDuration = 0;
      let watchedDuration = 0;

      // Calculate the total duration of the course
      course.sections.forEach(section => {
        section.lectures.forEach(lecture => {
          totalDuration += lecture.durationInSeconds || 0;
        });
      });

      // If a progress document exists, calculate the watched duration
      if (progressDoc && progressDoc.lectureProgress) {
        // Create a Set of viewed lecture IDs for fast lookups
        const viewedLectureIds = new Set(
          progressDoc.lectureProgress
            .filter(lp => lp.viewed)
            .map(lp => lp.lectureId.toString())
        );

        course.sections.forEach(section => {
          section.lectures.forEach(lecture => {
            if (viewedLectureIds.has(lecture._id.toString())) {
              watchedDuration += lecture.durationInSeconds || 0;
            }
          });
        });
      }
      
      // Calculate the final percentage
      const percent = totalDuration > 0
          ? Math.round((watchedDuration / totalDuration) * 100)
          : 0;
      
      return {
        ...course,
        progress: Math.min(percent, 100), // Add the calculated progress, capping at 100
      };
    });
    
    // --- Step 4: Send the complete data to the frontend ---
    return res.status(200).json({
      success: true,
      courses: coursesWithProgress,
    });

  } catch (error) {
    console.error("Error fetching my learning courses:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};