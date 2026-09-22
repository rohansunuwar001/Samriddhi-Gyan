import mongoose from "mongoose";
import { CertificationIssuer } from "../models/certificationIssuer.model.js";
import { Certification } from "../models/certification.model.js";
import { ExamRegistration } from "../models/examRegistration.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { Course } from "../models/course.model.js";
import { Certificate } from "../models/certificate.model.js";
import { nanoid } from "nanoid";
import stripePackage from "stripe";
import { uploadMedia } from "../utils/cloudinary.js";
import Category from "../models/category.model.js";
import crypto from "crypto";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";
import { slugify } from "../utils/slugify.js";

const sanitizeObjectId = (val) => {
  if (!val) return null;
  if (typeof val === "object" && val._id) val = val._id;
  return mongoose.Types.ObjectId.isValid(val) ? val : null;
};

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

// Helper to check suggested course completion status
const isCourseCompleted = async (userId, courseId) => {
  try {
    const [progress, course] = await Promise.all([
      CourseProgress.findOne({ userId, courseId }).lean(),
      Course.findById(courseId).populate("sections").lean(),
    ]);

    if (!course) return false;
    if (progress && progress.completed) return true;

    // Direct calculation fallback
    if (!progress) return false;
    const totalLectures = (course.sections || []).reduce(
      (sum, sec) => sum + (sec.lectures?.length || 0),
      0
    );
    const viewedCount = (progress.lectureProgress || []).filter((lp) => lp.viewed).length;
    return totalLectures > 0 && viewedCount === totalLectures;
  } catch (err) {
    console.error("isCourseCompleted error:", err);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// parent categories (CertificationIssuer) CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const createIssuer = async (req, res) => {
  try {
    const { name, type, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Issuer name is required." });

    const issuer = await CertificationIssuer.create({ name, type, description });
    return res.status(201).json({ success: true, issuer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllIssuers = async (req, res) => {
  try {
    const issuers = await CertificationIssuer.find().sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, issuers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateIssuer = async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const issuer = await CertificationIssuer.findByIdAndUpdate(
      req.params.id,
      { name, type, description },
      { new: true }
    );
    if (!issuer) return res.status(404).json({ success: false, message: "Issuer not found." });
    return res.status(200).json({ success: true, issuer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteIssuer = async (req, res) => {
  try {
    const issuer = await CertificationIssuer.findByIdAndDelete(req.params.id);
    if (!issuer) return res.status(404).json({ success: false, message: "Issuer not found." });
    return res.status(200).json({ success: true, message: "Issuer deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// child certifications (Certification) CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const createCertification = async (req, res) => {
  try {
    const {
      name,
      issuer,
      badgeUrl,
      description,
      categoryFilterParent,
      categoryFilterChild,
      categoryFilterSubChild,
      examPrice,
      certificatePrice,
      passingScore,
      totalMarks,
      passMarks,
      grades,
      duration,
      questions,
    } = req.body;

    const validIssuer = sanitizeObjectId(issuer);
    const validParentCat = sanitizeObjectId(categoryFilterParent);
    const validChildCat = sanitizeObjectId(categoryFilterChild);
    const validSubChildCat = sanitizeObjectId(categoryFilterSubChild);

    if (!name?.trim() || !validIssuer || !validParentCat) {
      return res.status(400).json({
        success: false,
        message: "Certification Name, Parent Issuer, and Prep Course Parent Category are required.",
      });
    }

    let parsedQuestions = [];
    if (questions) {
      if (typeof questions === "string") {
        try {
          parsedQuestions = JSON.parse(questions);
        } catch (err) {
          parsedQuestions = [];
        }
      } else if (Array.isArray(questions)) {
        parsedQuestions = questions;
      }
    }

    let finalBadgeUrl = badgeUrl || "";
    if (req.files && req.files.badgeImage && req.files.badgeImage[0]) {
      const file = req.files.badgeImage[0];
      const result = await uploadMedia(file.path);
      if (result?.secure_url) {
        finalBadgeUrl = result.secure_url;
      }
    }

    const certification = await Certification.create({
      name: name.trim(),
      issuer: validIssuer,
      badgeUrl: finalBadgeUrl,
      description: description || "",
      categoryFilterParent: validParentCat,
      categoryFilterChild: validChildCat,
      categoryFilterSubChild: validSubChildCat,
      examPrice: Number(examPrice) || 0,
      certificatePrice: Number(certificatePrice) || 0,
      passingScore: Number(passingScore) || 70,
      totalMarks: Number(totalMarks) || 100,
      passMarks: Number(passMarks) || 40,
      grades: grades || "A, B, C, Pass",
      duration: Number(duration) || 90,
      questions: parsedQuestions,
    });

    return res.status(201).json({ success: true, certification });
  } catch (error) {
    console.error("createCertification error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A certification with this name already exists.",
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Failed to create certification." });
  }
};

export const getAllCertifications = async (req, res) => {
  try {
    const certifications = await Certification.find()
      .populate("issuer", "name type")
      .populate("categoryFilterParent", "name slug")
      .populate("categoryFilterChild", "name slug")
      .populate("categoryFilterSubChild", "name slug")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, certifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCertificationBySlug = async (req, res) => {
  try {
    const cert = await Certification.findOne({ slug: req.params.slug })
      .populate("issuer", "name type")
      .populate("categoryFilterParent", "name slug")
      .populate("categoryFilterChild", "name slug")
      .populate("categoryFilterSubChild", "name slug")
      .lean();

    if (!cert) return res.status(404).json({ success: false, message: "Certification not found." });

    // Gather names of categories that we should fetch courses for
    let targetCategoryNames = [];
    const categoriesToQuery = [];
    if (cert.categoryFilterParent) categoriesToQuery.push(cert.categoryFilterParent._id || cert.categoryFilterParent);
    if (cert.categoryFilterChild) categoriesToQuery.push(cert.categoryFilterChild._id || cert.categoryFilterChild);
    if (cert.categoryFilterSubChild) categoriesToQuery.push(cert.categoryFilterSubChild._id || cert.categoryFilterSubChild);

    const resolvedCategories = await Category.find({ _id: { $in: categoriesToQuery } }).lean();

    const parentCat = resolvedCategories.find(c => String(c._id) === String(cert.categoryFilterParent?._id || cert.categoryFilterParent));
    const childCat = resolvedCategories.find(c => String(c._id) === String(cert.categoryFilterChild?._id || cert.categoryFilterChild));
    const subChildCat = resolvedCategories.find(c => String(c._id) === String(cert.categoryFilterSubChild?._id || cert.categoryFilterSubChild));

    if (subChildCat) {
      targetCategoryNames.push(subChildCat.name);
    } else if (childCat) {
      targetCategoryNames.push(childCat.name);
      const subCats = await Category.find({ parent: childCat._id }).select("name").lean();
      subCats.forEach(sc => targetCategoryNames.push(sc.name));
    } else if (parentCat) {
      targetCategoryNames.push(parentCat.name);
      const children = await Category.find({ parent: parentCat._id }).select("_id name").lean();
      for (const child of children) {
        targetCategoryNames.push(child.name);
        const grandchildren = await Category.find({ parent: child._id }).select("name").lean();
        grandchildren.forEach(gc => targetCategoryNames.push(gc.name));
      }
    }

    // Fetch all courses that belong to this category tree
    const relatedPrepCourses = await Course.find({
      category: { $in: targetCategoryNames },
      isPublished: true,
    })
      .populate("creator", "name photoUrl")
      .select("title thumbnail price enrolledStudents creator ratings level category")
      .lean();

    // If logged in, fetch student progress and registration ticket
    let completed = false;
    let registration = null;
    let isReapplying = false;
    let attemptNumber = 1;
    const basePrice = cert.examPrice || 0;
    let checkoutAmount = basePrice;

    if (req.user) {
      // Check if student completed AT LEAST ONE of the related courses
      for (const course of relatedPrepCourses) {
        const isCompleted = await isCourseCompleted(req.user._id, course._id);
        if (isCompleted) {
          completed = true;
          break;
        }
      }

      const finishedAttemptsCount = await ExamRegistration.countDocuments({
        student: req.user._id,
        certification: cert._id,
        examStatus: "completed",
      });

      isReapplying = finishedAttemptsCount > 0;
      attemptNumber = finishedAttemptsCount + 1;
      checkoutAmount = isReapplying ? Math.round(basePrice * 0.75) : basePrice;

      registration = await ExamRegistration.findOne({
        student: req.user._id,
        certification: cert._id,
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    const candidatesCount = await ExamRegistration.countDocuments({
      certification: cert._id,
      paymentStatus: "completed",
    });

    return res.status(200).json({
      success: true,
      certification: cert,
      courseCompleted: completed,
      registration,
      isReapplying,
      attemptNumber,
      checkoutAmount,
      candidatesCount,
      relatedCourses: relatedPrepCourses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCertification = async (req, res) => {
  try {
    const {
      name,
      issuer,
      badgeUrl,
      description,
      categoryFilterParent,
      categoryFilterChild,
      categoryFilterSubChild,
      examPrice,
      certificatePrice,
      passingScore,
      totalMarks,
      passMarks,
      grades,
      duration,
      questions,
    } = req.body;

    const validIssuer = sanitizeObjectId(issuer);
    const validParentCat = sanitizeObjectId(categoryFilterParent);
    const validChildCat = sanitizeObjectId(categoryFilterChild);
    const validSubChildCat = sanitizeObjectId(categoryFilterSubChild);

    let parsedQuestions = [];
    if (questions) {
      if (typeof questions === "string") {
        try {
          parsedQuestions = JSON.parse(questions);
        } catch (err) {
          parsedQuestions = [];
        }
      } else if (Array.isArray(questions)) {
        parsedQuestions = questions;
      }
    }

    let finalBadgeUrl = badgeUrl;
    if (req.files && req.files.badgeImage && req.files.badgeImage[0]) {
      const file = req.files.badgeImage[0];
      const result = await uploadMedia(file.path);
      if (result?.secure_url) {
        finalBadgeUrl = result.secure_url;
      }
    }

    const updateData = {
      badgeUrl: finalBadgeUrl,
      description: description || "",
      categoryFilterParent: validParentCat,
      categoryFilterChild: validChildCat,
      categoryFilterSubChild: validSubChildCat,
      examPrice: Number(examPrice) || 0,
      certificatePrice: Number(certificatePrice) || 0,
      passingScore: Number(passingScore) || 70,
      totalMarks: Number(totalMarks) || 100,
      passMarks: Number(passMarks) || 40,
      grades: grades || "A, B, C, Pass",
      duration: Number(duration) || 90,
      questions: parsedQuestions,
    };

    if (name?.trim()) {
      updateData.name = name.trim();
      updateData.slug = slugify(name.trim());
    }
    if (validIssuer) {
      updateData.issuer = validIssuer;
    }

    const cert = await Certification.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!cert) return res.status(404).json({ success: false, message: "Certification not found." });
    return res.status(200).json({ success: true, certification: cert });
  } catch (error) {
    console.error("updateCertification error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A certification with this name already exists.",
      });
    }
    return res.status(500).json({ success: false, message: error.message || "Failed to update certification." });
  }
};

export const deleteCertification = async (req, res) => {
  try {
    const cert = await Certification.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ success: false, message: "Certification not found." });
    return res.status(200).json({ success: true, message: "Certification deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Student Exam registrations & mock submissions
// ─────────────────────────────────────────────────────────────────────────────

export const getRegistrations = async (req, res) => {
  try {
    const query = {};
    if (req.user.role !== "admin" && req.user.role !== "instructor") {
      query.student = req.user._id;
    }
    const list = await ExamRegistration.find(query)
      .populate("student", "name email photoUrl")
      .populate("certification", "name slug badgeUrl description amount examDuration questionsCount")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, registrations: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const mockRegisterExam = async (req, res) => {
  try {
    const { certId } = req.body;
    const userId = req.user._id;

    if (!certId) return res.status(400).json({ success: false, message: "certId is required." });

    const cert = await Certification.findById(certId).lean();
    if (!cert) return res.status(404).json({ success: false, message: "Certification not found." });

    let reg = await ExamRegistration.findOne({ student: userId, certification: certId });
    if (reg) {
      reg.paymentStatus = "completed";
      await reg.save();
    } else {
      reg = await ExamRegistration.create({
        student: userId,
        certification: certId,
        paymentStatus: "completed",
        examStatus: "registered",
      });
    }

    return res.status(200).json({ success: true, registration: reg });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitExam = async (req, res) => {
  try {
    const { answers } = req.body; // e.g. [0, 2, 1, 3] representing chosen answers
    const userId = req.user._id;

    const reg = await ExamRegistration.findOne({
      _id: req.params.regId,
      student: userId,
    }).populate("certification");

    if (!reg) {
      return res.status(404).json({ success: false, message: "Exam registration record not found." });
    }

    const questions = reg.certification.questions || [];
    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: "No questions configured for this exam." });
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers && answers[idx] !== undefined && answers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= reg.certification.passingScore;

    reg.score = score;
    reg.passed = passed;
    reg.examStatus = "completed";
    reg.completionDate = new Date();

    if (passed) {
      const year = new Date().getFullYear();
      const rand = nanoid(6).toUpperCase();
      reg.certificateId = `SG-EXAM-${year}-${rand}`;

      // Automatically generate a downloadable certificate inside Certificate collection!
      // This allows them to see and verify it just like course completion certificates.
      const course = reg.certification.suggestedCourse
        ? await Course.findById(reg.certification.suggestedCourse).lean()
        : null;

      await Certificate.create({
        instructor: course?.creator || userId,
        course: reg.certification.suggestedCourse || null,
        isTemplate: false,
        issuedTo: userId,
        recipientName: req.user.name,
        certificateTitle: "Certificate of Excellence",
        certificateStatement: `This is to certify that ${req.user.name} has successfully completed the coursework and passed the official examination to earn the credential of:`,
        courseName: reg.certification.name,
        completionDate: new Date(),
        certificateId: reg.certificateId,
        verificationUrl: `/verify/${reg.certificateId}`,
        instructorName: "Samriddhi Gyan Examiner Board",
      });
    }

    await reg.save();

    return res.status(200).json({
      success: true,
      score,
      passed,
      certificateId: reg.certificateId,
    });
  } catch (error) {
    console.error("submitExam error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// eSewa payment methods for exams
// ─────────────────────────────────────────────────────────────────────────────

export const initializeExamEsewa = async (req, res) => {
  try {
    const { certId } = req.body;
    const userId = req.user._id;

    if (!certId) {
      return res.status(400).json({ success: false, message: "certId is required." });
    }

    const cert = await Certification.findById(certId).lean();
    if (!cert) {
      return res.status(404).json({ success: false, message: "Certification not found." });
    }

    // Check if they are already actively registered (not yet completed)
    const activeReg = await ExamRegistration.findOne({
      student: userId,
      certification: certId,
      paymentStatus: "completed",
      examStatus: { $ne: "completed" },
    });

    if (activeReg) {
      return res.status(400).json({
        success: false,
        message: "You are already registered and have an active voucher/ticket for this exam.",
      });
    }

    // Check attempt history of completed exams
    const finishedCount = await ExamRegistration.countDocuments({
      student: userId,
      certification: certId,
      examStatus: "completed",
    });

    const isReapplying = finishedCount > 0;
    const attemptNumber = finishedCount + 1;
    const basePrice = cert.examPrice || 0;
    const finalAmount = isReapplying ? Math.round(basePrice * 0.75) : basePrice;

    // Create a pending registration ticket
    const order = await ExamRegistration.create({
      student: userId,
      certification: certId,
      paymentStatus: "pending",
      examStatus: "registered",
      amountPaid: finalAmount,
      paymentMethod: "eSewa",
      attemptNumber: attemptNumber,
    });

    const paymentInitiate = await getEsewaPaymentHash({
      amount: finalAmount,
      transaction_uuid: order._id.toString(),
    });

    return res.status(200).json({
      success: true,
      message: "Exam payment initiated successfully via eSewa",
      paymentInitiate,
      payment_url: `${process.env.BACKEND_URI}/api/v1/certifications/generate-esewa-form?amount=${finalAmount}&transaction_uuid=${order._id}`,
    });
  } catch (error) {
    console.error("initializeExamEsewa error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fillExamEsewaForm = async (req, res) => {
  try {
    const { amount, transaction_uuid } = req.query;
    const paymentHash = await getEsewaPaymentHash({ amount, transaction_uuid });
    const nonce = crypto.randomBytes(16).toString("base64");

    res.setHeader("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`);

    res.send(`
      <html>
        <body>
          <form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
            <input type="hidden" name="amount"                    value="${amount}" />
            <input type="hidden" name="tax_amount"                value="0" />
            <input type="hidden" name="total_amount"              value="${amount}" />
            <input type="hidden" name="transaction_uuid"          value="${transaction_uuid}" />
            <input type="hidden" name="product_code"              value="${process.env.ESEWA_PRODUCT_CODE}" />
            <input type="hidden" name="product_service_charge"    value="0" />
            <input type="hidden" name="product_delivery_charge"   value="0" />
            <input type="hidden" name="success_url"               value="${process.env.BACKEND_URI}/api/v1/certifications/complete-esewa-payment" />
            <input type="hidden" name="failure_url"               value="${process.env.BACKEND_URI}/api/v1/certifications/failed-esewa-payment" />
            <input type="hidden" name="signed_field_names"        value="total_amount,transaction_uuid,product_code" />
            <input type="hidden" name="signature"                 value="${paymentHash.signature}" />
          </form>
          <script type="text/javascript" nonce="${nonce}">
            document.getElementById("esewaForm").submit();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("fillExamEsewaForm error:", error);
    res.status(500).send("Error generating eSewa payment form: " + error.message);
  }
};

export const completeExamEsewaPayment = async (req, res) => {
  const { data } = req.query;
  let reg = null;
  try {
    const paymentInfo = await verifyEsewaPayment(data);
    const regId = paymentInfo.decodedData.transaction_uuid;
    const refId = paymentInfo.decodedData.transaction_code;

    reg = await ExamRegistration.findById(regId).populate("certification");
    if (!reg) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
    }

    if (reg.paymentStatus === "completed") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/certification/${reg.certification.slug}?payment=success`
      );
    }

    reg.paymentStatus = "completed";
    reg.examStatus = "registered";
    reg.transactionId = refId;
    await reg.save();

    return res.redirect(
      `${process.env.FRONTEND_URL}/certification/${reg.certification.slug}?payment=success`
    );
  } catch (error) {
    console.error("completeExamEsewaPayment error:", error);
    if (reg && reg.paymentStatus === "pending") {
      await ExamRegistration.findByIdAndDelete(reg._id);
    }
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
  }
};

export const failedExamEsewaPayment = async (req, res) => {
  const { transaction_uuid } = req.query;
  let slug = "";
  try {
    if (transaction_uuid) {
      const reg = await ExamRegistration.findById(transaction_uuid).populate("certification");
      if (reg) {
        slug = reg.certification?.slug || "";
        await ExamRegistration.findByIdAndDelete(transaction_uuid);
      }
    }
  } catch (error) {
    console.error("failedExamEsewaPayment error:", error);
  }
  return res.redirect(
    `${process.env.FRONTEND_URL}/certification/${slug}?payment=failed`
  );
};
