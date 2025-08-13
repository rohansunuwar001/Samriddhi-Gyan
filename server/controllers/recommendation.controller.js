// co

import jwt from "jsonwebtoken";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { getCourseProgressPercent } from "../utils/progress.utils.js";

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

    const populateCreator = { path: "creator", select: "name email photoUrl" };

    // If user logged in
    if (userId) {
      const user = await User.findById(userId).populate({
        path: "enrolledCourses",
        select: "title description tags category",
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      const enrolledCourses = user.enrolledCourses || [];
      const enrolledCourseIds = enrolledCourses.map((c) => c._id.toString());

      // No enrolled courses → show popular
      if (enrolledCourses.length === 0) {
        const popular = await Course.find({ isPublished: true })
          .sort({ enrolledStudents: -1 })
          .limit(5)
          .populate(populateCreator)
          .lean();

        const popularWithBadge = popular.map((course) => ({
          ...course,
          showRecommendationBadge:
            (course.enrolledStudents?.length || 0) > 0 ||
            course.rating >= 4.5 ||
            course.isRecommended === true,
        }));

        return res.json({
          message:
            "You haven't enrolled in any courses yet. Here are some popular ones.",
          recommendedCourses: popularWithBadge,
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
        candidateCourses = await Course.find({
          isPublished: true,
          _id: { $nin: enrolledCourseIds },
        })
          .sort({ enrolledStudents: -1 })
          .limit(50)
          .populate(populateCreator)
          .lean();
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

      // Merge candidates + collaborative courses (remove duplicates)
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

      // Score candidates (simple category/tag + popularity system)
      const enrolledTagSet = new Set(enrolledTags.map((t) => String(t)));
      const scored = uniqueCandidates.map((course) => {
        let score = 0;

        // Category match
        if (categories.includes(course.category)) score += 0.5;

        // Tag overlap
        const overlap = (course.tags || []).filter((t) =>
          enrolledTagSet.has(String(t))
        ).length;
        if (overlap > 0) score += 0.3;

        // Popularity boost
        score += ((course.enrolledStudents?.length || 0) / 10000) * 0.2;

        return { ...course, score };
      });

      // Add progress + purchased info
      const enriched = [];
      for (const c of scored) {
        try {
          const progress = await getCourseProgressPercent(c._id, userId).catch(
            () => 0
          );
          c.progress = progress;
        } catch {
          c.progress = 0;
        }
        c.isPurchased = enrolledCourseIds.includes(String(c._id));

        c.showRecommendationBadge =
          (c.enrolledStudents?.length || 0) > 1 ||
          c.rating >= 4.5 ||
          c.isRecommended === true;

        enriched.push(c);
      }

      const ranked = enriched.sort((a, b) => b.score - a.score).slice(0, 5);

      if (!ranked || ranked.length === 0) {
        const popular = await Course.find({
          isPublished: true,
          _id: { $nin: enrolledCourseIds },
        })
          .sort({ enrolledStudents: -1 })
          .limit(5)
          .populate(populateCreator)
          .lean();

        const popularWithBadge = popular.map((course) => ({
          ...course,
          showRecommendationBadge:
            (course.enrolledStudents?.length || 0) > 0 ||
            course.rating >= 4.5 ||
            course.isRecommended === true,
        }));

        return res.json({
          message:
            "No personalized recommendations found; here are popular courses.",
          recommendedCourses: popularWithBadge,
        });
      }

      return res.json({
        message: "Personalized recommendations (category/tag + collaborative)",
        recommendedCourses: ranked,
      });
    }

    // Guest user → show popular
    const popular = await Course.find({ isPublished: true })
      .sort({ enrolledStudents: -1 })
      .limit(5)
      .populate(populateCreator)
      .lean();

    const popularWithBadge = popular.map((course) => ({
      ...course,
      showRecommendationBadge:
        (course.enrolledStudents?.length || 0) > 0 ||
        course.rating >= 4.5 ||
        course.isRecommended === true,
    }));

    return res.json({
      message: "Here are some popular courses you may like.",
      recommendedCourses: popularWithBadge,
    });
  } catch (error) {
    console.error("Recommendation controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
