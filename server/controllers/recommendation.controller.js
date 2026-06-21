import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import jwt from "jsonwebtoken";
import { buildUserVectorFromEnrolled, cosineSimilarity } from "../utils/embedding.js";  // adjust path to wherever cosineSimilarity/buildUserVectorFromEnrolled actually live

const populateCreator = { path: "creator", select: "name email photoUrl" };

/**
 * Returns the most popular published courses, sorted by *actual* enrollment
 * count (not the broken `.sort({ enrolledStudents: -1 })` on an array field).
 */
async function getPopularCourses(filter, limit) {
  const popularIds = await Course.aggregate([
    { $match: filter },
    {
      $addFields: {
        studentCount: { $size: { $ifNull: ["$enrolledStudents", []] } },
      },
    },
    { $sort: { studentCount: -1 } },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);

  const ids = popularIds.map((p) => p._id);
  if (ids.length === 0) return [];

  const courses = await Course.find({ _id: { $in: ids } })
    .populate(populateCreator)
    .lean();

  // Aggregation order isn't preserved by $in, so re-sort to match it.
  const orderMap = new Map(ids.map((id, idx) => [id.toString(), idx]));
  courses.sort(
    (a, b) => orderMap.get(a._id.toString()) - orderMap.get(b._id.toString())
  );

  return courses;
}

function withRecommendationBadge(course) {
  return {
    ...course,
    showRecommendationBadge:
      (course.enrolledStudents?.length || 0) > 0 ||
      (course.ratings || 0) >= 4.5 ||
      course.isRecommended === true,
  };
}

/**
 * Featured courses, tabbed: "popular" (all-time popularity), "new" (most
 * recently published, with Hot & New / Highest Rated / New badges computed
 * per-course), and "intermediate" (level = Intermediate or Advanced).
 */
export const getFeaturedCourses = async (req, res) => {
  try {
    const tab = req.query.tab || "popular";
    const limit = 5;

    if (tab === "new") {
      const courses = await Course.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate(populateCreator)
        .lean();

      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const courseIds = courses.map((c) => c._id);

      // Which of these new courses already had a completed purchase in the last 7 days?
      const recentPurchaseAgg = await CoursePurchase.aggregate([
        { $match: { status: "completed", createdAt: { $gte: since7 } } },
        { $unwind: "$courses" },
        { $match: { "courses.courseId": { $in: courseIds } } },
        { $group: { _id: "$courses.courseId" } },
      ]);
      const hotIds = new Set(recentPurchaseAgg.map((c) => c._id.toString()));

      const topRating = Math.max(0, ...courses.map((c) => c.ratings || 0));

      const enriched = courses.map((course) => {
        const isHot = hotIds.has(course._id.toString());
        const isTopRated = topRating > 0 && course.ratings === topRating;
        const isNew = course.createdAt >= since30;

        let featuredTag = null;
        if (isHot) featuredTag = "Hot & New";
        else if (isTopRated) featuredTag = "Highest Rated";
        else if (isNew) featuredTag = "New";

        return { ...course, featuredTag };
      });

      return res.json({ message: "New courses", featuredCourses: enriched });
    }

    if (tab === "intermediate") {
      const courses = await Course.find({
        isPublished: true,
        level: { $in: ["Intermediate", "Advanced"] },
      })
        .sort({ ratings: -1 })
        .limit(limit)
        .populate(populateCreator)
        .lean();

      return res.json({
        message: "Intermediate & advanced courses",
        featuredCourses: courses,
      });
    }

    // default: "popular"
    const popular = await getPopularCourses({ isPublished: true }, limit);
    return res.json({ message: "Most popular courses", featuredCourses: popular });
  } catch (error) {
    console.error("Featured courses controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Trending courses: primarily driven by completed purchases (Stripe + eSewa,
 * both live in CoursePurchase) within the last 7 days. If not enough recent
 * purchase activity exists (e.g. a new platform), falls back to recent course
 * views to fill remaining slots, then to all-time popularity if there's no
 * recent activity at all.
 */
export const getTrendingCourses = async (req, res) => {
  try {
    const limit = 8;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    // --- Primary signal: recent completed purchases ---
    const purchaseAgg = await CoursePurchase.aggregate([
      { $match: { status: "completed", createdAt: { $gte: since } } },
      { $unwind: "$courses" },
      { $group: { _id: "$courses.courseId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    let trendingIds = purchaseAgg.map((p) => p._id);
    const trendingSource = new Map(
      trendingIds.map((id) => [id.toString(), "purchases"])
    );

    // --- Fallback signal: recent views, only to fill remaining slots ---
    if (trendingIds.length < limit) {
      const remaining = limit - trendingIds.length;

      const viewAgg = await User.aggregate([
        { $unwind: "$viewHistory" },
        { $match: { "viewHistory.viewedAt": { $gte: since } } },
        { $match: { "viewHistory.course": { $nin: trendingIds } } },
        { $group: { _id: "$viewHistory.course", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: remaining },
      ]);

      viewAgg.forEach((v) => {
        trendingIds.push(v._id);
        trendingSource.set(v._id.toString(), "views");
      });
    }

    // --- Final fallback: no recent activity at all → show all-time popular ---
    if (trendingIds.length === 0) {
      const popular = await getPopularCourses({ isPublished: true }, limit);
      return res.json({
        message: "Not enough recent activity yet — showing popular courses.",
        trendingCourses: popular.map(withRecommendationBadge),
      });
    }

    const courses = await Course.find({
      _id: { $in: trendingIds },
      isPublished: true,
    })
      .populate(populateCreator)
      .lean();

    // $in doesn't preserve order — re-sort to match the ranked trending order
    const orderMap = new Map(trendingIds.map((id, idx) => [id.toString(), idx]));
    courses.sort(
      (a, b) => orderMap.get(a._id.toString()) - orderMap.get(b._id.toString())
    );

    const enriched = courses.map((course) => ({
      ...withRecommendationBadge(course),
      trendingSource: trendingSource.get(course._id.toString()) || "purchases",
    }));

    return res.json({
      message: "Trending in the last 7 days",
      trendingCourses: enriched,
    });
  } catch (error) {
    console.error("Trending controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getRecommendedCourses = async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers?.authorization?.split?.(" ")?.[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        userId = decoded?.userId;
      } catch (err) {
        console.warn("Token invalid/expired — proceeding as guest");
      }
    }

    // Guest user
    if (!userId) {
      const popular = await getPopularCourses({ isPublished: true }, 8);
      return res.json({
        message: "Here are some popular courses you may like.",
        recommendedCourses: popular.map(withRecommendationBadge),
      });
    }

    const user = await User.findById(userId).populate({
      path: "enrolledCourses",
      select: "title description tags category subtitle level embedding",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const enrolledCourses = user.enrolledCourses || [];
    const enrolledCourseIds = enrolledCourses.map((c) => c._id.toString());

    // No enrolled courses → show popular
    if (enrolledCourses.length === 0) {
      const popular = await getPopularCourses({ isPublished: true }, 8);
      return res.json({
        message:
          "You haven't enrolled in any courses yet. Here are some popular ones.",
        recommendedCourses: popular.map(withRecommendationBadge),
      });
    }

    // Build category + tag filters
    const categories = [
      ...new Set(enrolledCourses.map((c) => c.category).filter(Boolean)),
    ];
    const enrolledTags = [
      ...new Set(enrolledCourses.flatMap((c) => c.tags || [])),
    ];

    let candidateQuery = {
      isPublished: true,
      _id: { $nin: enrolledCourseIds },
      $or: [],
    };
    if (categories.length > 0)
      candidateQuery.$or.push({ category: { $in: categories } });
    if (enrolledTags.length > 0)
      candidateQuery.$or.push({ tags: { $in: enrolledTags } });
    if (candidateQuery.$or.length === 0) delete candidateQuery.$or;

    let candidateCourses = await Course.find(candidateQuery)
      .populate(populateCreator)
      .lean();

    // Fallback to popular if no candidates
    if (!candidateCourses || candidateCourses.length === 0) {
      candidateCourses = await getPopularCourses(
        { isPublished: true, _id: { $nin: enrolledCourseIds } },
        50
      );
    }

    // Collaborative filtering
    const similarUsers = await User.find({
      _id: { $ne: userId },
      enrolledCourses: { $in: enrolledCourseIds },
    }).select("enrolledCourses");

    const collaborativeCourseIdSet = new Set();
    for (const su of similarUsers) {
      (su.enrolledCourses || []).forEach((cid) => {
        const idStr = cid.toString();
        if (!enrolledCourseIds.includes(idStr))
          collaborativeCourseIdSet.add(idStr);
      });
    }
    const collaborativeCourseIds = Array.from(collaborativeCourseIdSet);

    let collaborativeCourses = [];
    if (collaborativeCourseIds.length > 0) {
      collaborativeCourses = await Course.find({
        _id: { $in: collaborativeCourseIds },
        isPublished: true,
      })
        .populate(populateCreator)
        .lean();
    }

    // Merge and de-duplicate candidates
    const allCandidates = [
      ...candidateCourses,
      ...collaborativeCourses.filter(
        (c) =>
          !candidateCourses.find((x) => x._id.toString() === c._id.toString())
      ),
    ];
    const uniqueById = new Map();
    allCandidates.forEach((c) => {
      uniqueById.set(c._id.toString(), c);
    });
    const uniqueCandidates = Array.from(uniqueById.values());

    // Build the user's semantic vector from their enrolled courses' embeddings.
    // Falls back to null (embeddingScore = 0 for everyone) if no embeddings exist yet.
    const userVector = await buildUserVectorFromEnrolled(enrolledCourses);

    // Score candidates: category + tag + popularity + embedding similarity
    const enrolledTagSet = new Set(enrolledTags.map((t) => String(t)));
    const scored = uniqueCandidates.map((course) => {
      let score = 0;
      if (categories.includes(course.category)) score += 0.3;

      const overlap = (course.tags || []).filter((t) =>
        enrolledTagSet.has(String(t))
      ).length;
      if (overlap > 0) score += 0.2;

      score += ((course.enrolledStudents?.length || 0) / 10000) * 0.1;

      const embeddingScore = userVector
        ? cosineSimilarity(userVector, course.embedding)
        : 0;
      score += embeddingScore * 0.4;

      return { ...course, score, embeddingScore };
    });

    const ranked = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((course) => ({
        ...course,
        progress: 0,
        isPurchased: false,
        ...withRecommendationBadge(course),
      }));

    if (!ranked || ranked.length === 0) {
      const popular = await getPopularCourses(
        { isPublished: true, _id: { $nin: enrolledCourseIds } },
        8
      );
      return res.json({
        message: "No personalized recommendations found; here are popular courses.",
        recommendedCourses: popular.map(withRecommendationBadge),
      });
    }

    return res.json({
      message: "Personalized recommendations (category/tag + collaborative + embeddings)",
      recommendedCourses: ranked,
    });
  } catch (error) {
    console.error("Recommendation controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};