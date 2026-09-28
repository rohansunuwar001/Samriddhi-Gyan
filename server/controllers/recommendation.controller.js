
import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Review } from "../models/review.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { buildUserVectorFromEnrolled, cosineSimilarity } from "../utils/embedding.js";
import { getEnrolledIds } from "../helpers/courseFilter.helper.js";
import { SVD } from "../utils/svd.js";

const populateCreator = { path: "creator", select: "name email photoUrl role" };


async function getPopularCourses(filter, limit) {
  const queryFilter = { ...filter };
  if (queryFilter._id) {
    if (queryFilter._id.$nin) {
      queryFilter._id = {
        $nin: queryFilter._id.$nin.map((id) =>
          typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
        ),
      };
    } else if (queryFilter._id.$in) {
      queryFilter._id = {
        $in: queryFilter._id.$in.map((id) =>
          typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
        ),
      };
    }
  }

  const popularIds = await Course.aggregate([
    { $match: queryFilter },
    { $addFields: { studentCount: { $size: { $ifNull: ["$enrolledStudents", []] } } } },
    { $sort: { studentCount: -1 } },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);

  const ids = popularIds.map((p) => p._id);
  if (ids.length === 0) return [];

  const courses = await Course.find({ _id: { $in: ids } })
    .populate(populateCreator)
    .lean();

  const orderMap = new Map(ids.map((id, idx) => [id.toString(), idx]));
  courses.sort((a, b) => orderMap.get(a._id.toString()) - orderMap.get(b._id.toString()));

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


export const getFeaturedCourses = async (req, res) => {
  try {
    const tab = req.query.tab || "popular";
    const limit = 5;

    const enrolledCourseIds = await getEnrolledIds(req);

    if (tab === "new") {
      const courses = await Course.find({
        isPublished: true,
        _id: { $nin: enrolledCourseIds },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate(populateCreator)
        .lean();

      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const since7  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
      const courseIds = courses.map((c) => c._id);

      const recentPurchaseAgg = await CoursePurchase.aggregate([
        { $match: { status: "completed", createdAt: { $gte: since7 } } },
        { $unwind: "$courses" },
        { $match: { "courses.courseId": { $in: courseIds } } },
        { $group: { _id: "$courses.courseId" } },
      ]);
      const hotIds = new Set(recentPurchaseAgg.map((c) => c._id.toString()));
      const topRating = Math.max(0, ...courses.map((c) => c.ratings || 0));

      const enriched = courses.map((course) => {
        const isHot      = hotIds.has(course._id.toString());
        const isTopRated = topRating > 0 && course.ratings === topRating;
        const isNew      = course.createdAt >= since30;
        let featuredTag  = null;
        if (isHot)           featuredTag = "Hot & New";
        else if (isTopRated) featuredTag = "Highest Rated";
        else if (isNew)      featuredTag = "New";
        return { ...course, featuredTag };
      });

      return res.json({ message: "New courses", featuredCourses: enriched });
    }

    if (tab === "intermediate") {
      const courses = await Course.find({
        isPublished: true,
        level: { $in: ["Intermediate", "Advanced"] },
        _id: { $nin: enrolledCourseIds },
      })
        .sort({ ratings: -1 })
        .limit(limit)
        .populate(populateCreator)
        .lean();

      return res.json({ message: "Intermediate & advanced courses", featuredCourses: courses });
    }

    // default: "popular"
    const popular = await getPopularCourses(
      { isPublished: true, _id: { $nin: enrolledCourseIds } },
      limit
    );
    return res.json({ message: "Most popular courses", featuredCourses: popular });

  } catch (error) {
    console.error("Featured courses controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getTrendingCourses = async (req, res) => {
  try {
    const limit = 8;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

 
    const enrolledCourseIds = await getEnrolledIds(req);
    const enrolledObjectIds = enrolledCourseIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // --- Primary signal: recent completed purchases ---
    const purchaseAgg = await CoursePurchase.aggregate([
      { $match: { status: "completed", createdAt: { $gte: since } } },
      { $unwind: "$courses" },
      { $group: { _id: "$courses.courseId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit * 2 },
    ]);

    // Remove courses the user already owns from trending
    let trendingIds = purchaseAgg
      .map((p) => p._id)
      .filter((id) => id && !enrolledCourseIds.includes(id.toString()));

    const trendingSource = new Map(
      trendingIds.map((id) => [id.toString(), "purchases"])
    );

    // --- Fallback signal: recent views, only to fill remaining slots ---
    if (trendingIds.length < limit) {
      const remaining = limit - trendingIds.length;
      const trendingObjectIds = trendingIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      const viewAgg = await User.aggregate([
        { $unwind: "$viewHistory" },
        { $match: { "viewHistory.viewedAt": { $gte: since } } },
        {
          $match: {
            "viewHistory.course": {
              $nin: [...trendingObjectIds, ...enrolledObjectIds],
            },
          },
        },
        { $group: { _id: "$viewHistory.course", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: remaining },
      ]);

      viewAgg.forEach((v) => {
        if (v._id) {
          trendingIds.push(v._id);
          trendingSource.set(v._id.toString(), "views");
        }
      });
    }

    // Definitive cleanup: Filter out any enrolled course IDs from trendingIds in JS
    trendingIds = trendingIds.filter(
      (id) => id && !enrolledCourseIds.includes(id.toString())
    );

    // --- Final fallback: no recent activity → all-time popular (minus enrolled) ---
    if (trendingIds.length === 0) {
      const popular = await getPopularCourses(
        { isPublished: true, _id: { $nin: enrolledCourseIds } },
        limit
      );
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

    const orderMap = new Map(trendingIds.map((id, idx) => [id.toString(), idx]));
    courses.sort((a, b) => orderMap.get(a._id.toString()) - orderMap.get(b._id.toString()));

    const enriched = courses.map((course) => ({
      ...withRecommendationBadge(course),
      trendingSource: trendingSource.get(course._id.toString()) || "purchases",
    }));

    return res.json({ message: "Trending in the last 7 days", trendingCourses: enriched });

  } catch (error) {
    console.error("Trending controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ─── Recommended Courses ──────────────────────────────────────────────────────

export const getRecommendedCourses = async (req, res) => {
  try {
    const userId = req.user?._id ?? null;

    // Guest user — no token / not logged in
    if (!userId) {
      const popular = await getPopularCourses({ isPublished: true }, 8);
      return res.json({
        message: "Here are some popular courses you may like.",
        recommendedCourses: popular.map(withRecommendationBadge),
      });
    }

    // Resolve all enrolled/purchased course IDs (including subscription courses)
    const enrolledCourseIds = await getEnrolledIds(req);

    const user = await User.findById(userId).populate({
      path: "enrolledCourses",
      select: "title description tags category subtitle level embedding",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const enrolledCourses = user.enrolledCourses || [];

    // No enrolled courses → show popular (excluding any subscription courses)
    if (enrolledCourses.length === 0) {
      const popular = await getPopularCourses(
        { isPublished: true, _id: { $nin: enrolledCourseIds } },
        8
      );
      return res.json({
        message: "You haven't enrolled in any courses yet. Here are some popular ones.",
        recommendedCourses: popular.map(withRecommendationBadge),
      });
    }

    const categories   = [...new Set(enrolledCourses.map((c) => c.category).filter(Boolean))];
    const enrolledTags = [...new Set(enrolledCourses.flatMap((c) => c.tags || []))];

    let candidateQuery = {
      isPublished: true,
      _id: { $nin: enrolledCourseIds },
      $or: [],
    };
    if (categories.length > 0)   candidateQuery.$or.push({ category: { $in: categories } });
    if (enrolledTags.length > 0) candidateQuery.$or.push({ tags: { $in: enrolledTags } });
    if (candidateQuery.$or.length === 0) delete candidateQuery.$or;

    let candidateCourses = await Course.find(candidateQuery).populate(populateCreator).lean();

    if (!candidateCourses || candidateCourses.length === 0) {
      candidateCourses = await getPopularCourses(
        { isPublished: true, _id: { $nin: enrolledCourseIds } },
        50
      );
    }

    // Collaborative filtering (Candidates matching peer enrollments)
    const similarUsers = await User.find({
      _id: { $ne: userId },
      enrolledCourses: { $in: enrolledCourseIds },
    }).select("enrolledCourses");

    const collaborativeCourseIdSet = new Set();
    for (const su of similarUsers) {
      (su.enrolledCourses || []).forEach((cid) => {
        const idStr = cid.toString();
        if (!enrolledCourseIds.includes(idStr)) collaborativeCourseIdSet.add(idStr);
      });
    }

    let collaborativeCourses = [];
    if (collaborativeCourseIdSet.size > 0) {
      collaborativeCourses = await Course.find({
        _id: { $in: Array.from(collaborativeCourseIdSet) },
        isPublished: true,
      })
        .populate(populateCreator)
        .lean();
    }

    // Merge and de-duplicate
    const allCandidates = [
      ...candidateCourses,
      ...collaborativeCourses.filter(
        (c) => !candidateCourses.find((x) => x._id.toString() === c._id.toString())
      ),
    ];
    const uniqueById = new Map();
    allCandidates.forEach((c) => uniqueById.set(c._id.toString(), c));
    const uniqueCandidates = Array.from(uniqueById.values());

    const userVector     = await buildUserVectorFromEnrolled(enrolledCourses);
    const enrolledTagSet = new Set(enrolledTags.map((t) => String(t)));

    // --- Matrix Factorization (SVD Collaborative Rating Predictions) ---
    const ratingsDataset = [];

    // 1. Gather explicit review rating records
    const dbReviews = await Review.find().select("user course rating").lean();
    dbReviews.forEach((rev) => {
      if (rev.user && rev.course) {
        ratingsDataset.push({
          userId: rev.user.toString(),
          courseId: rev.course.toString(),
          rating: Number(rev.rating)
        });
      }
    });

    // 2. Gather user course progress logs to form implicit ratings
    const dbProgresses = await CourseProgress.find()
      .populate({ path: "courseId", select: "totalLectures" })
      .lean();
    dbProgresses.forEach((prog) => {
      if (prog.userId && prog.courseId) {
        const total = prog.courseId.totalLectures || 0;
        const viewed = (prog.lectureProgress || []).filter(lp => lp.viewed).length;
        const percent = total > 0 ? (viewed / total) * 100 : 0;
        // Map percent [0, 100] to implicit rating [3.0, 5.0]
        const implicit = 3.0 + 2.0 * (percent / 100);

        const hasExplicit = ratingsDataset.some(
          rd => rd.userId === prog.userId.toString() && rd.courseId === prog.courseId._id.toString()
        );
        if (!hasExplicit) {
          ratingsDataset.push({
            userId: prog.userId.toString(),
            courseId: prog.courseId._id.toString(),
            rating: implicit
          });
        }
      }
    });

    // 3. Gather plain course purchases/enrollments as standard 4.0 fallback rating
    const dbUsers = await User.find().select("enrolledCourses").lean();
    dbUsers.forEach((u) => {
      const uIdStr = u._id.toString();
      (u.enrolledCourses || []).forEach((ec) => {
        const cIdStr = ec.toString();
        const hasRating = ratingsDataset.some(
          rd => rd.userId === uIdStr && rd.courseId === cIdStr
        );
        if (!hasRating) {
          ratingsDataset.push({
            userId: uIdStr,
            courseId: cIdStr,
            rating: 4.0
          });
        }
      });
    });

    // Train local SVD model
    const svd = new SVD();
    svd.train(ratingsDataset);

    // Score candidates using weights: 20% Category + 10% Tags + 10% Popularity + 30% Embeddings + 30% SVD
    const scored = uniqueCandidates.map((course) => {
      let score = 0;
      if (categories.includes(course.category)) score += 0.2;

      const overlap = (course.tags || []).filter((t) => enrolledTagSet.has(String(t))).length;
      if (overlap > 0) score += 0.1;

      score += ((course.enrolledStudents?.length || 0) / 10000) * 0.1;

      const embeddingScore = userVector ? cosineSimilarity(userVector, course.embedding) : 0;
      score += embeddingScore * 0.3;

      // Predict user course rating via trained SVD model
      const predictedRating = svd.predict(userId, course._id);
      const svdScore = (predictedRating / 5) * 0.3; // Normalize to [0, 0.3]
      score += svdScore;

      return { ...course, score, embeddingScore, predictedRating };
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
      message: "Personalized recommendations (hybrid content + SVD matrix factorization)",
      recommendedCourses: ranked,
    });

  } catch (error) {
    console.error("Recommendation controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};