import { Enrollment } from "../models/enrollment.model.js";
import { Order } from "../models/order.model.js";

// --- 1. CREATE ENROLLMENT (INTERNAL USE) ---
// PURPOSE: To be called by your Order/Payment controller after a payment is successfully verified.
// This function is NOT a public API endpoint.
// ENHANCEMENT: Now prevents creating duplicate enrollments if a user re-purchases a course.

export const createEnrollmentAfterPayment = async (orderId) => {
  try {
    // 1. Find the completed order
    const order = await Order.findById(orderId);
    if (!order || order.status !== "completed") {
      console.error(`Order ${orderId} not found or not completed. Cannot create enrollment.`);
      return;
    }

    const userId = order.userId;

    // 2. Prevent Duplicate Enrollments: Find courses the user is already enrolled in from this order.
    const courseIdsInOrder = order.courses.map(item => item.courseId);
    const existingEnrollments = await Enrollment.find({ 
        userId: userId, 
        courseId: { $in: courseIdsInOrder } 
    }).select('courseId');
    
    const existingCourseIds = new Set(existingEnrollments.map(e => e.courseId.toString()));

    // 3. Filter out courses the user is already enrolled in.
    const enrollmentsToCreate = [];
    for (const item of order.courses) {
      if (!existingCourseIds.has(item.courseId.toString())) {
        enrollmentsToCreate.push({
          userId: userId,
          courseId: item.courseId,
          orderId: order._id,
          completedLectures: [], // Start with empty progress
        });
      }
    }
    
    // 4. Create new enrollments, if any.
    if (enrollmentsToCreate.length > 0) {
      await Enrollment.insertMany(enrollmentsToCreate);
      console.log(`Successfully created ${enrollmentsToCreate.length} new enrollments for order ${orderId}.`);
    } else {
      console.log(`No new enrollments to create for order ${orderId}. User was already enrolled in all purchased courses.`);
    }

  } catch (error) {
    // In a production app, you might add this failed job to a retry queue.
    console.error(`Critical Error: Failed to create enrollments for order ${orderId}.`, error);
  }
};

// --- 2. GET ALL ENROLLMENTS FOR THE LOGGED-IN USER ---
// PURPOSE: To populate the user's "My Courses" dashboard page.
// API ENDPOINT: GET /api/enrollments/my-courses

export const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const enrollments = await Enrollment.find({ userId: userId })
      .sort({ createdAt: -1 }) // Show most recent first
      .populate({
        path: "courseId",
        select: "title subtitle thumbnail creator ratings", // Fields for the dashboard card
        populate: {
          path: "creator",
          select: "name", // Get the creator's name
        },
      });

    // The 'progressPercentage' virtual field is automatically calculated on each enrollment.
    res.status(200).json({
      success: true,
      data: enrollments,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// --- 3. GET A SINGLE ENROLLMENT'S FULL DETAILS ---
// PURPOSE: To load the course player UI when a user starts or resumes a course.
// API ENDPOINT: GET /api/enrollments/:enrollmentId

export const getSingleEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    // Securely find the enrollment ensuring it belongs to the logged-in user.
    const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId: userId })
      .populate({
        path: "courseId",
        populate: {
          path: "sections",
          select: "title lectures", // Populate sections within the course
          populate: {
            path: "lectures",
            select: "title durationInSeconds isPreview", // Populate lectures within each section
          },
        },
      });

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found or you do not have access." });
    }

    // The 'progressPercentage' virtual field is automatically available here.
    res.status(200).json({
      success: true,
      data: enrollment,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// --- 4. UPDATE LECTURE PROGRESS ---
// PURPOSE: The core progress-updating function to mark a lecture as complete or incomplete.
// API ENDPOINT: PUT /api/enrollments/:enrollmentId/progress

export const updateLectureProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { lectureId, isCompleted } = req.body; // Expects a boolean
    const userId = req.user.id;

    if (!lectureId || typeof isCompleted !== "boolean") {
      return res.status(400).json({ success: false, message: "A lectureId and a boolean 'isCompleted' status are required." });
    }

    // Use $addToSet to add a lecture (prevents duplicates) and $pull to remove it.
    const updateOperator = isCompleted ? "$addToSet" : "$pull";

    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: enrollmentId, userId: userId },
      {
        [updateOperator]: { completedLectures: lectureId },
        $set: { lastViewedLecture: lectureId }, // Always update the last viewed lecture
      },
      { new: true } // Return the updated document
    ).populate("courseId", "totalLectures"); // Populate for progress calculation

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }

    // After updating, check if the course is now fully complete or needs to be "un-completed".
    const courseIsNowComplete = isCompleted && (enrollment.completedLectures.length === enrollment.courseId.totalLectures);

    if (courseIsNowComplete && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    } else if (!isCompleted && enrollment.completedAt) {
      // If a lecture was marked incomplete, remove the completion date.
      enrollment.completedAt = null;
    }
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Progress updated successfully.",
      data: { // Send back the latest progress data for the UI to update
        progressPercentage: enrollment.progressPercentage,
        completedAt: enrollment.completedAt,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};