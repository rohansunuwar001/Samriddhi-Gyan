import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";
import {
  createCertificate,
  getMyCertificates,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
  issueCertificates,
  getIssuedForTemplate,
  getCourseStudents,
  verifyCertificate,
  getMyReceivedCertificates,
} from "../controllers/certificate.controller.js";

const router = express.Router();

// ── Public verify (no auth needed) ──────────────────────────────────────────
router.get("/verify/:certId", verifyCertificate);

// ── Authenticated routes ─────────────────────────────────────────────────────
router.use(isAuthenticated);

// Student: get certificates they've received
router.get("/received", getMyReceivedCertificates);

// Instructor / Admin only
router.use(authorizeRoles("instructor", "admin"));

const imageUpload = upload.fields([
  { name: "organizationLogo", maxCount: 1 },
  { name: "authorizedSignature", maxCount: 1 },
  { name: "officialSeal", maxCount: 1 },
]);

// CRUD on templates
router.post("/", imageUpload, createCertificate);
router.get("/my", getMyCertificates);
router.get("/:id", getCertificateById);
router.put("/:id", imageUpload, updateCertificate);
router.delete("/:id", deleteCertificate);

// Issuing & student list
router.get("/:id/students", getCourseStudents);
router.get("/:id/issued", getIssuedForTemplate);
router.post("/:id/issue", issueCertificates);

export default router;
