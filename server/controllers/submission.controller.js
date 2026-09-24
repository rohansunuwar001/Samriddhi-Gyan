import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import { extractTextFromFile } from "../utils/textExtractor.js";
import { parseCodeToAST, validateAST } from "../utils/astValidator.js";
import { checkPlagiarism } from "../utils/plagiarismChecker.js";

/**
 * Handles a student submitting an assignment file (uploads and auto-extracts/validates text)
 * @route POST /api/v1/assignment/submit/:assignmentId
 */
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No submission file uploaded."
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found."
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;

    // 1. Extract plain text content from document (pdf, docx, txt, coding files)
    let extractedText = "";
    try {
      extractedText = await extractTextFromFile(filePath, fileName);
    } catch (err) {
      console.warn("Text extraction failed:", err.message);
    }

    // 2. Perform AST validation if it's a coding assignment
    let astValid = null;
    if (assignment.type === "coding" && extractedText) {
      try {
        const ast = parseCodeToAST(extractedText);
        astValid = validateAST(ast, assignment.requiredStructures || []);
      } catch (err) {
        astValid = false; // Failed to parse -> syntactically invalid
      }
    }

    // 3. Create or update student submission
    let submission = await Submission.findOne({ assignmentId, studentId });

    if (submission) {
      // Overwrite/Update existing submission
      submission.fileUrl = filePath;
      submission.fileName = fileName;
      submission.fileType = fileType;
      submission.extractedText = extractedText;
      submission.astValid = astValid;
      submission.grade = null; // Reset grade on resubmission
      submission.feedback = "";
      submission.status = "submitted";
      await submission.save();
    } else {
      // Create new submission
      submission = await Submission.create({
        assignmentId,
        studentId,
        fileUrl: filePath,
        fileName,
        fileType,
        extractedText,
        astValid
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment submitted successfully.",
      submission
    });
  } catch (error) {
    console.error("submitAssignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during assignment submission."
    });
  }
};

/**
 * Lists all submissions for an assignment (Instructor only)
 * @route GET /api/v1/assignment/submissions/:assignmentId
 */
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found."
      });
    }

    const submissions = await Submission.find({ assignmentId })
      .populate("studentId", "name email photoUrl")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error("getAssignmentSubmissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching submissions."
    });
  }
};

/**
 * Grades a student submission and triggers LSH Plagiarism check against other class submissions
 * @route POST /api/v1/assignment/grade/:submissionId
 */
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, threshold } = req.body;

    const submission = await Submission.findById(submissionId)
      .populate("studentId", "name email");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found."
      });
    }

    // 1. Run MinHash / LSH Plagiarism check against other students' submissions for the same assignment
    const otherSubmissions = await Submission.find({
      assignmentId: submission.assignmentId,
      studentId: { $ne: submission.studentId }
    }).populate("studentId", "name");

    const refDocs = otherSubmissions.map((sub) => ({
      id: sub.studentId ? sub.studentId.name : `Student-${sub._id}`,
      text: sub.extractedText || ""
    }));

    const checkThreshold = typeof threshold === "number" ? threshold : 0.4;
    let plagiarismMatches = [];

    if (submission.extractedText && refDocs.length > 0) {
      try {
        plagiarismMatches = checkPlagiarism(submission.extractedText, refDocs, checkThreshold);
      } catch (err) {
        console.warn("Plagiarism checker error:", err.message);
      }
    }

    // 2. Save grade, feedback, and LSH plagiarism results
    submission.grade = typeof grade === "number" ? grade : submission.grade;
    submission.feedback = typeof feedback === "string" ? feedback : submission.feedback;
    submission.plagiarismMatches = plagiarismMatches;
    submission.status = "graded";
    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Submission graded and scanned for plagiarism.",
      submission
    });
  } catch (error) {
    console.error("gradeSubmission error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error grading assignment."
    });
  }
};

/**
 * Lists all submissions across all assignments for a specific course (Instructor/Admin only)
 * @route GET /api/v1/assignment/submissions/course/:courseId
 */
export const getCourseSubmissions = async (req, res) => {
  try {
    const { courseId } = req.params;

    const assignments = await Assignment.find({ courseId }).select("_id title type maxPoints deadline");
    const assignmentIds = assignments.map((a) => a._id);

    const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
      .populate("studentId", "name email photoUrl")
      .populate("assignmentId", "title type maxPoints deadline requiredStructures")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error("getCourseSubmissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching course submissions."
    });
  }
};

/**
 * Retrieves a single submission with full details for checking/grading
 * @route GET /api/v1/assignment/submission/:submissionId
 */
export const getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
      .populate("studentId", "name email photoUrl")
      .populate("assignmentId", "title description type maxPoints deadline requiredStructures courseId")
      .lean();

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found."
      });
    }

    return res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    console.error("getSubmissionById error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching submission details."
    });
  }
};

