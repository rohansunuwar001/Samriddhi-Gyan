import { Assignment } from "../models/assignment.model.js";
import { Course } from "../models/course.model.js";
import { Submission } from "../models/submission.model.js";

/**
 * Creates a new assignment for a course (Instructors/Admins only)
 * @route POST /api/v1/assignment/
 */
export const createAssignment = async (req, res) => {
  try {
    const { title, description, type, courseId, sectionId, requiredStructures, maxPoints, deadline } = req.body;
    const userId = req.user._id;

    if (!title || !description || !type || !courseId || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Title, description, type, courseId, and deadline are required fields."
      });
    }

    if (!["coding", "essay"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'coding' or 'essay'."
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    // Verify user is the course creator or instructor
    const isCreator = course.creator.toString() === userId.toString();
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create assignments for this course."
      });
    }

    const assignment = await Assignment.create({
      title,
      description,
      type,
      courseId,
      sectionId: sectionId || null,
      requiredStructures: Array.isArray(requiredStructures) ? requiredStructures : [],
      maxPoints: Number(maxPoints) || 100,
      deadline: new Date(deadline)
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully.",
      assignment
    });
  } catch (error) {
    console.error("createAssignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating assignment."
    });
  }
};

/**
 * Lists all assignments for a course
 * @route GET /api/v1/assignment/course/:courseId
 */
export const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const assignments = await Assignment.find({ courseId })
      .populate("sectionId", "title")
      .sort({ deadline: 1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId
    }).lean();

    const assignmentsWithSub = assignments.map((asm) => {
      const sub = submissions.find(
        (s) => s.assignmentId.toString() === asm._id.toString()
      );
      return {
        ...asm,
        submission: sub || null
      };
    });

    return res.status(200).json({
      success: true,
      assignments: assignmentsWithSub
    });
  } catch (error) {
    console.error("getCourseAssignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching assignments."
    });
  }
};
