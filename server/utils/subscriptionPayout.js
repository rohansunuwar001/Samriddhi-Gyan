import { CourseProgress } from "../models/courseProgress.model.js";
import { SubscriptionPurchase } from "../models/subscriptionPurchase.model.js";

/**
 * Calculates total subscription sales, the instructor revenue pool (15%),
 * total lecture minutes consumed, and individual instructor payouts based on share of minutes.
 */
export const getSubscriptionPayouts = async () => {
  // 1. Calculate total subscription revenue
  const completedSubs = await SubscriptionPurchase.find({ status: "completed" });
  const totalSubSales = completedSubs.reduce((sum, s) => sum + s.amount, 0);
  const instructorPool = totalSubSales * 0.15;
  const adminSubShare = totalSubSales * 0.85;

  // 2. Fetch all CourseProgress populated with Course details and Lecture durations
  const allProgress = await CourseProgress.find()
    .populate({
      path: "courseId",
      select: "creator",
      populate: {
        path: "creator",
        select: "name email",
      },
    })
    .populate({
      path: "lectureProgress.lectureId",
      select: "durationInSeconds",
    });

  let totalCatalogSeconds = 0;
  const instructorSecondsMap = {}; // creatorId -> seconds watched

  for (const prog of allProgress) {
    if (!prog.courseId || !prog.courseId.creator) continue;
    const creatorId = prog.courseId.creator._id.toString();

    for (const lp of prog.lectureProgress) {
      if (lp.viewed && lp.lectureId) {
        const duration = lp.lectureId.durationInSeconds || 0;
        totalCatalogSeconds += duration;
        instructorSecondsMap[creatorId] = (instructorSecondsMap[creatorId] || 0) + duration;
      }
    }
  }

  // 3. Compute payouts per instructor proportionally
  const payouts = {};
  const instructorSharesMap = {}; // creatorId -> { name, email, seconds, shareRatio, amount }
  
  if (totalCatalogSeconds > 0) {
    for (const prog of allProgress) {
      if (!prog.courseId || !prog.courseId.creator) continue;
      const creator = prog.courseId.creator;
      const creatorId = creator._id.toString();
      const seconds = instructorSecondsMap[creatorId] || 0;
      const ratio = seconds / totalCatalogSeconds;
      const amount = Number((ratio * instructorPool).toFixed(2));

      instructorSharesMap[creatorId] = {
        instructorId: creatorId,
        name: creator.name,
        email: creator.email,
        secondsWatched: seconds,
        shareRatio: ratio,
        amount,
      };
      payouts[creatorId] = amount;
    }
  }

  return {
    totalSubSales,
    instructorPool,
    adminSubShare,
    totalCatalogSeconds,
    instructorShares: Object.values(instructorSharesMap),
    payouts,
  };
};
