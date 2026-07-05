import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";
import loadUserIfAuthenticated from "../middlewares/loadUserIfAuthenticated.js";
import upload from "../utils/multer.js";
import {
  createIssuer,
  getAllIssuers,
  updateIssuer,
  deleteIssuer,
  createCertification,
  getAllCertifications,
  getCertificationBySlug,
  updateCertification,
  deleteCertification,
  getRegistrations,
  mockRegisterExam,
  submitExam,
  initializeExamEsewa,
  fillExamEsewaForm,
  completeExamEsewaPayment,
  failedExamEsewaPayment,
} from "../controllers/certification.controller.js";

const router = express.Router();
const cpUpload = upload.fields([{ name: "badgeImage", maxCount: 1 }]);

// ── Admin & Instructor CRUD Routes ────────────────────────────────────────────
router.get("/registrations", isAuthenticated, authorizeRoles("admin", "instructor"), getRegistrations);

// ── Public / Guest-Friendly Routes ──────────────────────────────────────────
router.get("/issuers", getAllIssuers);
router.get("/", getAllCertifications);
router.get("/generate-esewa-form", fillExamEsewaForm);
router.get("/complete-esewa-payment", completeExamEsewaPayment);
router.get("/failed-esewa-payment", failedExamEsewaPayment);
router.get("/:slug", loadUserIfAuthenticated, getCertificationBySlug);

// ── Authenticated Student Routes ─────────────────────────────────────────────
router.post("/register-mock", isAuthenticated, mockRegisterExam);
router.post("/submit/:regId", isAuthenticated, submitExam);
router.post("/initialize-esewa", isAuthenticated, initializeExamEsewa);

// Admin Category & Certification Management
router.post("/issuers", isAuthenticated, authorizeRoles("admin"), createIssuer);
router.put("/issuers/:id", isAuthenticated, authorizeRoles("admin"), updateIssuer);
router.delete("/issuers/:id", isAuthenticated, authorizeRoles("admin"), deleteIssuer);

router.post("/", isAuthenticated, authorizeRoles("admin"), cpUpload, createCertification);
router.put("/:id", isAuthenticated, authorizeRoles("admin"), cpUpload, updateCertification);
router.delete("/:id", isAuthenticated, authorizeRoles("admin"), deleteCertification);

export default router;
