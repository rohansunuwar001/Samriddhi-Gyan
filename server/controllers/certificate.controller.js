// server/controllers/certificate.controller.js
//
// CRUD + issue + verify for instructor-generated certificates.

import { Certificate, CERTIFICATE_TITLES } from "../models/certificate.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { uploadMedia, deleteFromCloudinary } from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../helpers/cloudinary.helper.js";
import fs from "fs";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const safeUnlink = (path) => {
  if (path) try { fs.unlinkSync(path); } catch (_) {}
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TEMPLATE
// POST /api/v1/certificate
// ─────────────────────────────────────────────────────────────────────────────
export const createCertificate = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const {
      courseId,
      organizationName,
      certificateTitle,
      certificateStatement,
      courseName,
      completionDate,
      issueDate,
      duration,
      grade,
      instructorName,
      accreditation,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required." });
    }

    // Verify instructor owns the course
    const course = await Course.findOne({ _id: courseId, creator: instructorId }).lean();
    if (!course) {
      return res.status(403).json({ success: false, message: "Course not found or you are not the owner." });
    }

    let organizationLogo = "";
    let authorizedSignature = "";
    let officialSeal = "";

    // Upload images if provided
    if (req.files?.organizationLogo?.[0]) {
      const res2 = await uploadMedia(req.files.organizationLogo[0].path);
      organizationLogo = res2?.secure_url || "";
      safeUnlink(req.files.organizationLogo[0].path);
    }
    if (req.files?.authorizedSignature?.[0]) {
      const res2 = await uploadMedia(req.files.authorizedSignature[0].path);
      authorizedSignature = res2?.secure_url || "";
      safeUnlink(req.files.authorizedSignature[0].path);
    }
    if (req.files?.officialSeal?.[0]) {
      const res2 = await uploadMedia(req.files.officialSeal[0].path);
      officialSeal = res2?.secure_url || "";
      safeUnlink(req.files.officialSeal[0].path);
    }

    const certificate = await Certificate.create({
      instructor: instructorId,
      course: courseId,
      organizationName: organizationName || "Samriddhi Gyan",
      organizationLogo,
      certificateTitle: certificateTitle || "Certificate of Completion",
      certificateStatement:
        certificateStatement ||
        "This is to certify that the above-named individual has successfully completed the course.",
      courseName: courseName || course.title,
      completionDate,
      issueDate: issueDate || new Date(),
      duration,
      grade,
      instructorName: instructorName || req.user.name,
      accreditation,
      authorizedSignature,
      officialSeal,
      isTemplate: true,
    });

    return res.status(201).json({ success: true, certificate });
  } catch (error) {
    console.error("createCertificate error:", error);
    return res.status(500).json({ success: false, message: "Failed to create certificate." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY TEMPLATES
// GET /api/v1/certificate/my
// ─────────────────────────────────────────────────────────────────────────────
export const getMyCertificates = async (req, res) => {
  try {
    const templates = await Certificate.find({
      instructor: req.user._id,
      isTemplate: true,
    })
      .populate("course", "title thumbnail category")
      .sort({ createdAt: -1 })
      .lean();

    // Count how many times each template was issued
    const issuedCounts = await Certificate.aggregate([
      { $match: { instructor: req.user._id, isTemplate: false } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    issuedCounts.forEach(({ _id, count }) => (countMap[_id.toString()] = count));

    const templatesWithCount = templates.map((t) => ({
      ...t,
      issuedCount: countMap[t.course?._id?.toString()] || 0,
    }));

    return res.status(200).json({ success: true, certificates: templatesWithCount });
  } catch (error) {
    console.error("getMyCertificates error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch certificates." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE CERTIFICATE
// GET /api/v1/certificate/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getCertificateById = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("course", "title thumbnail category")
      .populate("instructor", "name photoUrl")
      .populate("issuedTo", "name email photoUrl")
      .lean();

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found." });
    }

    // Only instructor or recipient may view
    const isOwner = cert.instructor._id.toString() === req.user._id.toString();
    const isRecipient = cert.issuedTo?._id?.toString() === req.user._id.toString();
    if (!isOwner && !isRecipient) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    return res.status(200).json({ success: true, certificate: cert });
  } catch (error) {
    console.error("getCertificateById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch certificate." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE TEMPLATE
// PUT /api/v1/certificate/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found or not yours." });
    }

    const fields = [
      "organizationName", "certificateTitle", "certificateStatement",
      "courseName", "completionDate", "issueDate", "duration",
      "grade", "instructorName", "accreditation",
    ];
    fields.forEach((f) => { if (req.body[f] !== undefined) cert[f] = req.body[f]; });

    // Handle image replacements
    if (req.files?.organizationLogo?.[0]) {
      if (cert.organizationLogo) await deleteFromCloudinary(extractCloudinaryPublicId(cert.organizationLogo));
      const r = await uploadMedia(req.files.organizationLogo[0].path);
      cert.organizationLogo = r?.secure_url || "";
      safeUnlink(req.files.organizationLogo[0].path);
    }
    if (req.files?.authorizedSignature?.[0]) {
      if (cert.authorizedSignature) await deleteFromCloudinary(extractCloudinaryPublicId(cert.authorizedSignature));
      const r = await uploadMedia(req.files.authorizedSignature[0].path);
      cert.authorizedSignature = r?.secure_url || "";
      safeUnlink(req.files.authorizedSignature[0].path);
    }
    if (req.files?.officialSeal?.[0]) {
      if (cert.officialSeal) await deleteFromCloudinary(extractCloudinaryPublicId(cert.officialSeal));
      const r = await uploadMedia(req.files.officialSeal[0].path);
      cert.officialSeal = r?.secure_url || "";
      safeUnlink(req.files.officialSeal[0].path);
    }

    await cert.save();
    return res.status(200).json({ success: true, certificate: cert });
  } catch (error) {
    console.error("updateCertificate error:", error);
    return res.status(500).json({ success: false, message: "Failed to update certificate." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE TEMPLATE
// DELETE /api/v1/certificate/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found or not yours." });
    }

    // Delete Cloudinary assets
    for (const field of ["organizationLogo", "authorizedSignature", "officialSeal"]) {
      if (cert[field]) {
        await deleteFromCloudinary(extractCloudinaryPublicId(cert[field])).catch(() => {});
      }
    }

    await Certificate.deleteOne({ _id: cert._id });
    return res.status(200).json({ success: true, message: "Certificate deleted." });
  } catch (error) {
    console.error("deleteCertificate error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete certificate." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE CERTIFICATES TO STUDENTS
// POST /api/v1/certificate/:id/issue
// Body: { studentIds: ["id1", "id2", ...] }
// ─────────────────────────────────────────────────────────────────────────────
export const issueCertificates = async (req, res) => {
  try {
    const template = await Certificate.findOne({
      _id: req.params.id,
      instructor: req.user._id,
      isTemplate: true,
    }).populate("course", "title enrolledStudents");

    if (!template) {
      return res.status(404).json({ success: false, message: "Certificate template not found." });
    }

    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "studentIds array is required." });
    }

    // Fetch students
    const students = await User.find({ _id: { $in: studentIds } }).select("name email").lean();
    if (students.length === 0) {
      return res.status(400).json({ success: false, message: "No valid students found." });
    }

    // Check which students already have a certificate for this course
    const existing = await Certificate.find({
      course: template.course._id,
      isTemplate: false,
      issuedTo: { $in: studentIds },
    }).select("issuedTo").lean();
    const alreadyIssued = new Set(existing.map((e) => e.issuedTo.toString()));

    const toCreate = students.filter((s) => !alreadyIssued.has(s._id.toString()));

    const issued = await Certificate.insertMany(
      toCreate.map((student) => ({
        instructor: req.user._id,
        course: template.course._id,
        organizationName: template.organizationName,
        organizationLogo: template.organizationLogo,
        certificateTitle: template.certificateTitle,
        certificateStatement: template.certificateStatement,
        courseName: template.courseName || template.course.title,
        completionDate: template.completionDate || new Date(),
        issueDate: new Date(),
        duration: template.duration,
        grade: template.grade,
        instructorName: template.instructorName,
        accreditation: template.accreditation,
        authorizedSignature: template.authorizedSignature,
        officialSeal: template.officialSeal,
        isTemplate: false,
        issuedTo: student._id,
        recipientName: student.name,
      }))
    );

    return res.status(201).json({
      success: true,
      issued: issued.length,
      skipped: alreadyIssued.size,
      message: `${issued.length} certificate(s) issued. ${alreadyIssued.size} already had one.`,
    });
  } catch (error) {
    console.error("issueCertificates error:", error);
    return res.status(500).json({ success: false, message: "Failed to issue certificates." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ISSUED CERTIFICATES FOR A TEMPLATE
// GET /api/v1/certificate/:id/issued
// ─────────────────────────────────────────────────────────────────────────────
export const getIssuedForTemplate = async (req, res) => {
  try {
    const template = await Certificate.findOne({ _id: req.params.id, instructor: req.user._id });
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found." });
    }

    const issued = await Certificate.find({
      course: template.course,
      instructor: req.user._id,
      isTemplate: false,
    })
      .populate("issuedTo", "name email photoUrl")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, certificates: issued });
  } catch (error) {
    console.error("getIssuedForTemplate error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch issued certificates." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ENROLLED STUDENTS FOR A COURSE (helper for the Issue Modal)
// GET /api/v1/certificate/:id/students
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseStudents = async (req, res) => {
  try {
    const template = await Certificate.findOne({
      _id: req.params.id,
      instructor: req.user._id,
    }).populate({
      path: "course",
      select: "enrolledStudents title",
      populate: { path: "enrolledStudents", select: "name email photoUrl" },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found." });
    }

    const students = template.course?.enrolledStudents || [];

    // Mark which ones already received a certificate
    const already = await Certificate.find({
      course: template.course._id,
      isTemplate: false,
      issuedTo: { $in: students.map((s) => s._id) },
    }).select("issuedTo").lean();
    const alreadySet = new Set(already.map((a) => a.issuedTo.toString()));

    const annotated = students.map((s) => ({
      ...s,
      alreadyCertified: alreadySet.has(s._id.toString()),
    }));

    return res.status(200).json({ success: true, students: annotated });
  } catch (error) {
    console.error("getCourseStudents error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch students." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC VERIFY
// GET /api/v1/certificate/verify/:certId
// ─────────────────────────────────────────────────────────────────────────────
export const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certId, isTemplate: false })
      .populate("course", "title thumbnail")
      .populate("issuedTo", "name photoUrl")
      .populate("instructor", "name")
      .lean();

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found or invalid ID." });
    }

    return res.status(200).json({ success: true, certificate: cert });
  } catch (error) {
    console.error("verifyCertificate error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY RECEIVED CERTIFICATES (student view)
// GET /api/v1/certificate/received
// ─────────────────────────────────────────────────────────────────────────────
export const getMyReceivedCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ issuedTo: req.user._id, isTemplate: false })
      .populate("course", "title thumbnail category")
      .populate("instructor", "name photoUrl")
      .sort({ issueDate: -1 })
      .lean();

    return res.status(200).json({ success: true, certificates: certs });
  } catch (error) {
    console.error("getMyReceivedCertificates error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch certificates." });
  }
};

export { CERTIFICATE_TITLES as certTitles };
