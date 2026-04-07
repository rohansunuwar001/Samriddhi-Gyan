import jwt from "jsonwebtoken";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";

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
    // NEW: Define the population for sections and lectures needed for progress calculation
    const populateProgressData = {
        path: 'sections',
        select: 'lectures',
        populate: {
            path: 'lectures',
            select: 'durationInSeconds',
        },
    };

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
        const popular = await Course.find({ isPublished: true }).sort({ enrolledStudents: -1 }).limit(5).populate(populateCreator).lean();
        const popularWithBadge = popular.map((course) => ({ ...course, showRecommendationBadge: (course.enrolledStudents?.length || 0) > 0 || course.rating >= 4.5 || course.isRecommended === true, }));
        return res.json({ message: "You haven't enrolled in any courses yet. Here are some popular ones.", recommendedCourses: popularWithBadge, });
      }

      // Build category + tag filters
      const categories = [ ...new Set(enrolledCourses.map((c) => c.category).filter(Boolean)), ];
      const enrolledTags = [ ...new Set(enrolledCourses.flatMap((c) => c.tags || [])), ];

      let candidateQuery = { isPublished: true, _id: { $nin: enrolledCourseIds }, $or: [], };
      if (categories.length > 0) candidateQuery.$or.push({ category: { $in: categories } });
      if (enrolledTags.length > 0) candidateQuery.$or.push({ tags: { $in: enrolledTags } });
      if (candidateQuery.$or.length === 0) delete candidateQuery.$or;

      // UPDATED: Added populateProgressData to fetch lecture durations
      let candidateCourses = await Course.find(candidateQuery).populate(populateCreator).populate(populateProgressData).lean();

      // Fallback to popular if no candidates
      if (!candidateCourses || candidateCourses.length === 0) {
        // UPDATED: Also add populateProgressData to the fallback query
        candidateCourses = await Course.find({ isPublished: true, _id: { $nin: enrolledCourseIds }, }).sort({ enrolledStudents: -1 }).limit(50).populate(populateCreator).populate(populateProgressData).lean();
      }

      // Collaborative filtering
      const similarUsers = await User.find({ _id: { $ne: userId }, enrolledCourses: { $in: enrolledCourseIds }, }).select("enrolledCourses");
      const collaborativeCourseIdSet = new Set();
      for (const su of similarUsers) { (su.enrolledCourses || []).forEach((cid) => { const idStr = cid.toString(); if (!enrolledCourseIds.includes(idStr)) collaborativeCourseIdSet.add(idStr); }); }
      const collaborativeCourseIds = Array.from(collaborativeCourseIdSet);

      let collaborativeCourses = [];
      if (collaborativeCourseIds.length > 0) {
        // Also add populateProgressData to the collaborative query
        collaborativeCourses = await Course.find({ _id: { $in: collaborativeCourseIds }, isPublished: true, }).populate(populateCreator).populate(populateProgressData).lean();
      }

      // Merge and de-duplicate candidates
      const allCandidates = [ ...candidateCourses, ...collaborativeCourses.filter( (c) => !candidateCourses.find((x) => x._id.toString() === c._id.toString()) ), ];
      const uniqueById = new Map();
      allCandidates.forEach((c) => { uniqueById.set(c._id.toString(), c); });
      const uniqueCandidates = Array.from(uniqueById.values());

      // Score candidates
      const enrolledTagSet = new Set(enrolledTags.map((t) => String(t)));
      const scored = uniqueCandidates.map((course) => {
        let score = 0;
        if (categories.includes(course.category)) score += 0.5;
        const overlap = (course.tags || []).filter((t) => enrolledTagSet.has(String(t)) ).length;
        if (overlap > 0) score += 0.3;
        score += ((course.enrolledStudents?.length || 0) / 10000) * 0.2;
        return { ...course, score };
      });

      //  Get IDs of all candidate courses to fetch their progress at once.
      const candidateCourseIds = scored.map(c => c._id);

      //  Fetch all relevant progress documents in a single, efficient query.
      const progressDocs = await CourseProgress.find({
        userId,
        courseId: { $in: candidateCourseIds }
      }).lean();
      
      // Create a Map for instant O(1) progress lookups.
      const progressMap = progressDocs.reduce((map, prog) => {
        map[prog.courseId.toString()] = prog.lectureProgress || [];
        return map;
      }, {});

      // Enrich the scored courses with progress and other info using the fast lookup map.
      const enriched = scored.map(course => {
        const lectureProgress = progressMap[course._id.toString()] || [];
        const viewedLectureIds = new Set(lectureProgress.filter(lp => lp.viewed).map(lp => lp.lectureId.toString()));

        let totalDuration = 0;
        let watchedDuration = 0;

        (course.sections || []).forEach(section => {
          (section.lectures || []).forEach(lecture => {
            const duration = lecture.durationInSeconds || 0;
            totalDuration += duration;
            if (viewedLectureIds.has(lecture._id.toString())) {
              watchedDuration += duration;
            }
          });
        });
        
        const percent = totalDuration > 0 ? Math.round((watchedDuration / totalDuration) * 100) : 0;

        return {
          ...course,
          progress: Math.min(percent, 100),
          isPurchased: enrolledCourseIds.includes(course._id.toString()),
          showRecommendationBadge: (course.enrolledStudents?.length || 0) > 1 || (course.rating || 0) >= 4.5 || course.isRecommended === true,
        };
      });
      const ranked = enriched.sort((a, b) => b.score - a.score).slice(0, 5);

      if (!ranked || ranked.length === 0) {
        const popular = await Course.find({ isPublished: true, _id: { $nin: enrolledCourseIds }, }).sort({ enrolledStudents: -1 }).limit(5).populate(populateCreator).lean();
        const popularWithBadge = popular.map((course) => ({ ...course, showRecommendationBadge: (course.enrolledStudents?.length || 0) > 0 || course.rating >= 4.5 || course.isRecommended === true, }));
        return res.json({ message: "No personalized recommendations found; here are popular courses.", recommendedCourses: popularWithBadge, });
      }

      return res.json({ message: "Personalized recommendations (category/tag + collaborative)", recommendedCourses: ranked, });
    }

    // Guest user => show popular (This part is fine as is)
    const popular = await Course.find({ isPublished: true }).sort({ enrolledStudents: -1 }).limit(5).populate(populateCreator).lean();
    const popularWithBadge = popular.map((course) => ({ ...course, showRecommendationBadge: (course.enrolledStudents?.length || 0) > 0 || course.rating >= 4.5 || course.isRecommended === true, }));
    return res.json({ message: "Here are some popular courses you may like.", recommendedCourses: popularWithBadge, });

  } catch (error) {
    console.error("Recommendation controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};