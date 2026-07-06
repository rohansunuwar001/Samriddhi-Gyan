import { CourseProgress } from "../models/courseProgress.model.js";
import { SubscriptionPurchase } from "../models/subscriptionPurchase.model.js";

/**
 * Calculates total subscription sales, the instructor revenue pool (15%),
 * and individual instructor payouts based on a Weighted Payout Decay model.
 * Factors in course quality ratings, user course completion ratios, and content age decay.
 */
export const getSubscriptionPayouts = async () => {
  // 1. Calculate total subscription revenue
  const completedSubs = await SubscriptionPurchase.find({ status: "completed" });
  const totalSubSales = completedSubs.reduce((sum, s) => sum + s.amount, 0);
  const instructorPool = totalSubSales * 0.15;
  const adminSubShare = totalSubSales * 0.85;

  // 2. Fetch all CourseProgress populated with Course details and Creator details
  const allProgress = await CourseProgress.find()
    .populate({
      path: "courseId",
      select: "creator ratings createdAt totalLectures",
      populate: {
        path: "creator",
        select: "name email",
      },
    })
    .populate({
      path: "lectureProgress.lectureId",
      select: "durationInSeconds",
    });

  let totalWeightedSeconds = 0;
  const instructorWeightedSecondsMap = {}; // creatorId -> weighted seconds watched

  for (const prog of allProgress) {
    if (!prog.courseId || !prog.courseId.creator) continue;
    const creatorId = prog.courseId.creator._id.toString();

    // Calculate rating multiplier (Weight: Quality check)
    let ratingMult = 1.0;
    const rating = prog.courseId.ratings || 0;
    if (rating >= 4.5) ratingMult = 1.5;
    else if (rating >= 4.0) ratingMult = 1.2;
    else if (rating < 3.0) ratingMult = 0.5;

    // Calculate completion ratio (Weight: Engagement check)
    const totalLectures = prog.courseId.totalLectures || 1;
    const viewedLectures = (prog.lectureProgress || []).filter(lp => lp.viewed).length;
    const completionRatio = Math.min(1.0, viewedLectures / totalLectures);

    // Calculate annual age decay (Weight: Freshness check)
    const ageInYears = (Date.now() - new Date(prog.courseId.createdAt)) / (365.25 * 24 * 60 * 60 * 1000);
    const decayFactor = Math.exp(-0.2 * ageInYears); // lambda = 0.2

    // Apply multipliers to duration
    let progressWeightedSeconds = 0;
    for (const lp of prog.lectureProgress) {
      if (lp.viewed && lp.lectureId) {
        const duration = lp.lectureId.durationInSeconds || 0;
        progressWeightedSeconds += duration * ratingMult * completionRatio * decayFactor;
      }
    }

    totalWeightedSeconds += progressWeightedSeconds;
    instructorWeightedSecondsMap[creatorId] = (instructorWeightedSecondsMap[creatorId] || 0) + progressWeightedSeconds;
  }

  // 3. Compute payouts per instructor proportionally based on weighted seconds
  const payouts = {};
  const instructorSharesMap = {}; // creatorId -> { name, email, seconds, shareRatio, amount }
  
  if (totalWeightedSeconds > 0) {
    for (const prog of allProgress) {
      if (!prog.courseId || !prog.courseId.creator) continue;
      const creator = prog.courseId.creator;
      const creatorId = creator._id.toString();
      const weightedSeconds = instructorWeightedSecondsMap[creatorId] || 0;
      const ratio = weightedSeconds / totalWeightedSeconds;
      const amount = Number((ratio * instructorPool).toFixed(2));

      instructorSharesMap[creatorId] = {
        instructorId: creatorId,
        name: creator.name,
        email: creator.email,
        weightedSecondsWatched: Number(weightedSeconds.toFixed(1)),
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
    totalWeightedSeconds: Number(totalWeightedSeconds.toFixed(1)),
    instructorShares: Object.values(instructorSharesMap),
    payouts,
  };
};
