// server/service/purchase.service.js

import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { generateOrderId } from "../helpers/Generateorderid.helper.js";
import { createNotification } from "./notification.service.js";
import { Certification } from "../models/certification.model.js";
import { ExamRegistration } from "../models/examRegistration.model.js";
import { BaseService } from "../core/base.service.js";

export class PurchaseService extends BaseService {
  constructor() {
    super(CoursePurchase);
  }

  async createPendingOrder({ userId, courseIds = [], certificationIds = [], paymentMethod }) {
    const courses = courseIds.length > 0
      ? await Course.find({ _id: { $in: courseIds } }).select("title thumbnail price")
      : [];

    if (courseIds.length > 0 && courses.length !== courseIds.length) {
      const error = new Error("One or more courses not found!");
      error.statusCode = 404;
      throw error;
    }

    const purchaseCourses = courses.map((course) => {
      const price = course.price.current;
      const instructorShare = Number((price * 0.37).toFixed(2));
      const adminShare = Number((price * 0.63).toFixed(2));
      return {
        courseId: course._id,
        priceAtPurchase: price,
        instructorShare,
        adminShare,
      };
    });

    const certifications = certificationIds.length > 0
      ? await Certification.find({ _id: { $in: certificationIds } }).select("name badgeUrl examPrice")
      : [];

    if (certificationIds.length > 0 && certifications.length !== certificationIds.length) {
      const error = new Error("One or more certifications not found!");
      error.statusCode = 404;
      throw error;
    }

    const purchaseCertifications = await Promise.all(
      certifications.map(async (cert) => {
        const finishedCount = await ExamRegistration.countDocuments({
          student: userId,
          certification: cert._id,
          examStatus: "completed",
        });
        const isReapplying = finishedCount > 0;
        const basePrice = cert.examPrice || 0;
        const finalPrice = isReapplying ? Math.round(basePrice * 0.75) : basePrice;

        return {
          certificationId: cert._id,
          priceAtPurchase: finalPrice,
        };
      })
    );

    const totalCourseAmount = purchaseCourses.reduce((sum, item) => sum + item.priceAtPurchase, 0);
    const totalCertAmount = purchaseCertifications.reduce((sum, item) => sum + item.priceAtPurchase, 0);
    const totalAmount = totalCourseAmount + totalCertAmount;

    if (certificationIds.length === 0 && courseIds.length > 0) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingPendingOrder = await CoursePurchase.findOne({
        userId,
        status: "pending",
        paymentMethod,
        createdAt: { $gte: oneDayAgo },
        "courses.courseId": { $all: courseIds },
        certifications: { $size: 0 },
      });

      if (existingPendingOrder) {
        return {
          order: existingPendingOrder,
          courses,
          totalAmount,
          purchaseCourses,
          purchaseCertifications: [],
          reused: true,
        };
      }
    }

    const order = await this.create({
      orderId: generateOrderId(),
      userId,
      courses: purchaseCourses,
      certifications: purchaseCertifications,
      totalAmount,
      paymentMethod,
      status: "pending",
      paymentDetails: {},
    });

    return { order, courses, totalAmount, purchaseCourses, purchaseCertifications, reused: false };
  }

  async completeOrder(purchase) {
    if (purchase.status === "completed") return purchase;

    purchase.status = "completed";
    await purchase.save();

    const courseIds = (purchase.courses || []).map((c) => c.courseId);
    const certItems = purchase.certifications || [];

    if (courseIds.length > 0) {
      const courseDetails = await Course.find({ _id: { $in: courseIds } })
        .select("title")
        .lean();
      const courseTitles = courseDetails.map((c) => c.title).join('", "');

      await User.findByIdAndUpdate(purchase.userId, {
        $addToSet: { enrolledCourses: { $each: courseIds } },
        $pull: {
          cart: { $in: courseIds },
          wishlist: { $in: courseIds },
        },
      });

      await Course.updateMany(
        { _id: { $in: courseIds } },
        { $addToSet: { enrolledStudents: purchase.userId } }
      );

      await createNotification(
        purchase.userId,
        `Your purchase was successful! You are now enrolled in: "${courseTitles}".`,
        "/my-learning",
        "course_enrollment"
      );
    }

    if (certItems.length > 0) {
      const certIds = certItems.map((c) => c.certificationId);

      await User.findByIdAndUpdate(purchase.userId, {
        $pull: { cartCertifications: { $in: certIds } },
      });

      for (const certItem of certItems) {
        const certId = certItem.certificationId;
        const pricePaid = certItem.priceAtPurchase;

        const cert = await Certification.findById(certId).lean();
        if (cert) {
          const finishedCount = await ExamRegistration.countDocuments({
            student: purchase.userId,
            certification: certId,
            examStatus: "completed",
          });
          const attemptNumber = finishedCount + 1;

          let reg = await ExamRegistration.findOne({
            student: purchase.userId,
            certification: certId,
            paymentStatus: "pending",
          });

          if (reg) {
            reg.paymentStatus = "completed";
            reg.examStatus = "registered";
            reg.amountPaid = pricePaid;
            reg.paymentMethod = purchase.paymentMethod;
            reg.attemptNumber = attemptNumber;
            await reg.save();
          } else {
            await ExamRegistration.create({
              student: purchase.userId,
              certification: certId,
              paymentStatus: "completed",
              examStatus: "registered",
              amountPaid: pricePaid,
              paymentMethod: purchase.paymentMethod,
              attemptNumber: attemptNumber,
            });
          }

          await createNotification(
            purchase.userId,
            `Your purchase was successful! Exam voucher for "${cert.name}" is now active.`,
            `/certification/${cert.slug}`,
            "exam_registration"
          );
        }
      }
    }

    return purchase;
  }

  async failOrder(purchaseId) {
    return await this.updateById(purchaseId, { status: "failed" });
  }

  async getOrderByOrderId(orderId) {
    return await CoursePurchase.findOne({ orderId })
      .populate("userId", "name email photoUrl")
      .populate("courses.courseId", "title thumbnail price");
  }

  async getAllCompletedPurchases() {
    return await CoursePurchase.find({ status: "completed" })
      .populate("userId", "name email photoUrl")
      .populate("courses.courseId", "title thumbnail")
      .sort({ createdAt: -1 });
  }

  async hasUserPurchasedCourse(userId, courseId) {
    const purchase = await CoursePurchase.findOne({
      userId,
      "courses.courseId": courseId,
      status: "completed",
    });
    return !!purchase;
  }
}

export const purchaseService = new PurchaseService();

export const createPendingOrder = purchaseService.createPendingOrder.bind(purchaseService);
export const completeOrder = purchaseService.completeOrder.bind(purchaseService);
export const failOrder = purchaseService.failOrder.bind(purchaseService);
export const getOrderByOrderId = purchaseService.getOrderByOrderId.bind(purchaseService);
export const getAllCompletedPurchases = purchaseService.getAllCompletedPurchases.bind(purchaseService);
export const hasUserPurchasedCourse = purchaseService.hasUserPurchasedCourse.bind(purchaseService);
