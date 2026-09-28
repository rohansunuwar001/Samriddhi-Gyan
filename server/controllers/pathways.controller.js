import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { User } from "../models/user.model.js";

export const getCourseSequencing = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select("_id title prerequisites")
      .lean();

    const inDegree = {};
    const adj = {};

    courses.forEach((c) => {
      const id = c._id.toString();
      inDegree[id] = 0;
      adj[id] = [];
    });

    courses.forEach((c) => {
      const u = c._id.toString();
      const prereqs = c.prerequisites || [];
      prereqs.forEach((pId) => {
        const v = pId.toString();
        if (adj[v]) {
          adj[v].push(u);
          inDegree[u]++;
        }
      });
    });

    const queue = [];
    courses.forEach((c) => {
      const id = c._id.toString();
      if (inDegree[id] === 0) {
        queue.push(id);
      }
    });

    const sequence = [];

    while (queue.length > 0) {
      const u = queue.shift();
      sequence.push(u);

      const neighbors = adj[u] || [];
      neighbors.forEach((v) => {
        inDegree[v]--;
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      });
    }

    if (sequence.length !== courses.length) {
      return res.status(400).json({
        success: false,
        message: "Cycle detected! Prerequisite configuration contains a circular loop."
      });
    }

    const sortedCourses = sequence.map((id) =>
      courses.find((c) => c._id.toString() === id)
    );

    return res.status(200).json({
      success: true,
      sequence: sortedCourses
    });

  } catch (error) {
    console.error("getCourseSequencing error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCareerRoadmap = async (req, res) => {
  try {
    const { targetCategory } = req.query;
    const userId = req.user?._id;

    if (!targetCategory) {
      return res.status(400).json({ success: false, message: "A 'targetCategory' is required." });
    }

    const allCourses = await Course.find({ isPublished: true })
      .select("_id title category prerequisites totalDurationInSeconds")
      .lean();

    let completedCourseIds = new Set();
    if (userId) {
      const user = await User.findById(userId).select("enrolledCourses").lean();
      if (user) {
        completedCourseIds = new Set((user.enrolledCourses || []).map(id => id.toString()));
      }
    }

    const graph = {};
    const h = {};

    allCourses.forEach((c) => {
      const id = c._id.toString();
      graph[id] = {
        id,
        title: c.title,
        category: c.category,
        duration: c.totalDurationInSeconds || 3600,
        prereqs: (c.prerequisites || []).map(p => p.toString())
      };

      h[id] = c.category.toLowerCase() === targetCategory.toLowerCase() ? 0 : 18000;
    });

    const startNodes = allCourses.filter(c => {
      const id = c._id.toString();
      const prereqs = c.prerequisites || [];
      return prereqs.length === 0 || prereqs.every(p => completedCourseIds.has(p.toString()));
    }).map(c => c._id.toString());

    if (startNodes.length === 0 && allCourses.length > 0) {
      startNodes.push(allCourses[0]._id.toString());
    }

    const openSet = startNodes.map(id => {
      const course = graph[id];
      const g = completedCourseIds.has(id) ? 0 : course.duration;
      const f = g + h[id];
      return { node: id, g, f, path: [id] };
    });

    let bestPath = [];
    let searchLimit = 500;

    while (openSet.length > 0 && searchLimit-- > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const curr = openSet.shift();

      const course = graph[curr.node];
      
      const isPrereqForOtherInCat = allCourses.some(c => {
        const inSameCat = c.category.toLowerCase() === targetCategory.toLowerCase();
        const hasPrereq = (c.prerequisites || []).map(p => p.toString()).includes(curr.node);
        return inSameCat && hasPrereq;
      });

      if (course && course.category.toLowerCase() === targetCategory.toLowerCase() && !isPrereqForOtherInCat) {
        bestPath = curr.path;
        break;
      }

      const neighbors = allCourses.filter(c => {
        const prereqs = (c.prerequisites || []).map(p => p.toString());
        return prereqs.includes(curr.node);
      });

      neighbors.forEach((n) => {
        const nId = n._id.toString();
        const neighborCourse = graph[nId];
        if (!curr.path.includes(nId)) {
          const stepCost = completedCourseIds.has(nId) ? 0 : (neighborCourse?.duration || 3600);
          const gScore = curr.g + stepCost;
          const fScore = gScore + h[nId];
          openSet.push({ node: nId, g: gScore, f: fScore, path: [...curr.path, nId] });
        }
      });
    }

    const resolvedPath = bestPath.map(id => {
      const c = graph[id];
      return {
        _id: id,
        title: c?.title,
        category: c?.category,
        durationInHours: Number(((c?.duration || 0) / 3600).toFixed(1)),
        isCompleted: completedCourseIds.has(id)
      };
    });

    return res.status(200).json({
      success: true,
      targetCategory,
      path: resolvedPath
    });

  } catch (error) {
    console.error("getCareerRoadmap error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCourseFrictionAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("sections").populate({
      path: "sections",
      populate: { path: "lectures", select: "_id title" }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const lectures = [];
    (course.sections || []).forEach((sec) => {
      (sec.lectures || []).forEach((lec) => {
        lectures.push({ id: lec._id.toString(), title: lec.title });
      });
    });

    if (lectures.length === 0) {
      return res.status(200).json({ success: true, frictionStates: [] });
    }

    const progresses = await CourseProgress.find({ courseId }).lean();
    const studentCount = progresses.length;

    const stateTransitions = Array.from({ length: lectures.length }, () => ({
      progressNext: 0,
      rewatchSelf: 0,
      dropoutExit: 0,
      totalTransitions: 0
    }));

    progresses.forEach((prog) => {
      const lp = prog.lectureProgress || [];
      const viewedSet = new Set(lp.filter(item => item.viewed).map(item => item.lectureId.toString()));

      for (let i = 0; i < lectures.length; i++) {
        const lecId = lectures[i].id;
        const currentViewed = viewedSet.has(lecId);

        if (currentViewed) {
          stateTransitions[i].totalTransitions += 1;

          if (i + 1 < lectures.length) {
            const nextLecId = lectures[i + 1].id;
            const nextViewed = viewedSet.has(nextLecId);

            if (nextViewed) {
              stateTransitions[i].progressNext += 1;
            } else {
              stateTransitions[i].dropoutExit += 0.7;
              stateTransitions[i].rewatchSelf += 0.3;
            }
          } else {
            stateTransitions[i].progressNext += 1;
          }
        } else {
          if (i > 0 && viewedSet.has(lectures[i - 1].id)) {
            stateTransitions[i - 1].dropoutExit += 1;
            stateTransitions[i - 1].totalTransitions += 1;
          }
        }
      }
    });

    const frictionStates = lectures.map((lec, idx) => {
      const t = stateTransitions[idx];
      const sum = t.totalTransitions || 1;

      const pNext = t.progressNext / sum;
      const pRewatch = t.rewatchSelf / sum;
      const pExit = t.dropoutExit / sum;

      return {
        lectureId: lec.id,
        title: lec.title,
        position: idx + 1,
        totalTries: t.totalTransitions,
        probabilities: {
          progressToNext: Number(pNext.toFixed(2)),
          rewatchThis: Number(pRewatch.toFixed(2)),
          dropoutExit: Number(pExit.toFixed(2))
        },
        frictionLevel: pExit >= 0.4 ? "High" : (pExit >= 0.15 ? "Medium" : "Low")
      };
    });

    return res.status(200).json({
      success: true,
      studentCount,
      frictionStates
    });

  } catch (error) {
    console.error("getCourseFrictionAnalytics error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
