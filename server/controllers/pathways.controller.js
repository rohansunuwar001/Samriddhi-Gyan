import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { User } from "../models/user.model.js";

// ============================================================================
// 1. DAG & Topological Course Prerequisite Sorting
// ============================================================================

/**
 * Computes a valid topological learning order of published courses.
 * Flags circular dependencies (cycles) if found.
 * @route GET /api/pathways/sequencing
 */
export const getCourseSequencing = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select("_id title prerequisites")
      .lean();

    const inDegree = {};
    const adj = {};

    // Initialize structures
    courses.forEach((c) => {
      const id = c._id.toString();
      inDegree[id] = 0;
      adj[id] = [];
    });

    // Populate in-degrees and adjacency lists
    courses.forEach((c) => {
      const u = c._id.toString();
      const prereqs = c.prerequisites || [];
      prereqs.forEach((pId) => {
        const v = pId.toString();
        // If the prerequisite is also a published course
        if (adj[v]) {
          adj[v].push(u); // Direction: prerequisite v -> course u
          inDegree[u]++;
        }
      });
    });

    // Queue nodes with in-degree 0 (no prerequisites)
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

    // Resolve course documents in sorted order
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

// ============================================================================
// 2. A* Pathfinding for Career Roadmap Planning
// ============================================================================

/**
 * Computes the optimal A* learning path from user's current baseline to target category.
 * @route GET /api/pathways/career-roadmap
 */
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

    // Get user's completed courses
    let completedCourseIds = new Set();
    if (userId) {
      const user = await User.findById(userId).select("enrolledCourses").lean();
      if (user) {
        completedCourseIds = new Set((user.enrolledCourses || []).map(id => id.toString()));
      }
    }

    // Map graph nodes
    const graph = {};
    const h = {}; // Heuristic: cost to target category

    allCourses.forEach((c) => {
      const id = c._id.toString();
      graph[id] = {
        id,
        title: c.title,
        category: c.category,
        duration: c.totalDurationInSeconds || 3600,
        prereqs: (c.prerequisites || []).map(p => p.toString())
      };

      // Heuristic: If course is already in the target category, h(n) = 0.
      // Else, h(n) = 5 hours (18000s) representing expected remaining workload.
      h[id] = c.category.toLowerCase() === targetCategory.toLowerCase() ? 0 : 18000;
    });

    // Start set: Find courses with no prerequisites or those user has completed
    const startNodes = allCourses.filter(c => {
      const id = c._id.toString();
      const prereqs = c.prerequisites || [];
      return prereqs.length === 0 || prereqs.every(p => completedCourseIds.has(p.toString()));
    }).map(c => c._id.toString());

    if (startNodes.length === 0 && allCourses.length > 0) {
      startNodes.push(allCourses[0]._id.toString()); // Fallback
    }

    // Open set for A* search: array of { node, g, f, path }
    const openSet = startNodes.map(id => {
      const course = graph[id];
      const g = completedCourseIds.has(id) ? 0 : course.duration;
      const f = g + h[id];
      return { node: id, g, f, path: [id] };
    });

    let bestPath = [];
    let searchLimit = 500; // Prevent infinite loops

    while (openSet.length > 0 && searchLimit-- > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const curr = openSet.shift();

      const course = graph[curr.node];
      
      // A course is only the final target if it is in the category AND not a prerequisite for another course in that category
      const isPrereqForOtherInCat = allCourses.some(c => {
        const inSameCat = c.category.toLowerCase() === targetCategory.toLowerCase();
        const hasPrereq = (c.prerequisites || []).map(p => p.toString()).includes(curr.node);
        return inSameCat && hasPrereq;
      });

      if (course && course.category.toLowerCase() === targetCategory.toLowerCase() && !isPrereqForOtherInCat) {
        bestPath = curr.path;
        break;
      }

      // Find neighbors: courses that require the current course
      const neighbors = allCourses.filter(c => {
        const prereqs = (c.prerequisites || []).map(p => p.toString());
        return prereqs.includes(curr.node);
      });

      neighbors.forEach((n) => {
        const nId = n._id.toString();
        const neighborCourse = graph[nId];
        if (!curr.path.includes(nId)) {
          // If student already completed the neighbor, cost addition is 0
          const stepCost = completedCourseIds.has(nId) ? 0 : (neighborCourse?.duration || 3600);
          const gScore = curr.g + stepCost;
          const fScore = gScore + h[nId];
          openSet.push({ node: nId, g: gScore, f: fScore, path: [...curr.path, nId] });
        }
      });
    }

    // Resolve course details for the final path
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

// ============================================================================
// 3. Markov Chain Progression Friction Bottleneck Analytics
// ============================================================================

/**
 * Calculates drop-off and re-watch friction parameters on a course progression chain.
 * @route GET /api/pathways/friction/:courseId
 */
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

    // Flatten all lectures in order
    const lectures = [];
    (course.sections || []).forEach((sec) => {
      (sec.lectures || []).forEach((lec) => {
        lectures.push({ id: lec._id.toString(), title: lec.title });
      });
    });

    if (lectures.length === 0) {
      return res.status(200).json({ success: true, frictionStates: [] });
    }

    // Fetch progress logs for this course across all students
    const progresses = await CourseProgress.find({ courseId }).lean();
    const studentCount = progresses.length;

    // Track state movements
    // States: 0 to N-1 correspond to lectures. State N is "Exit/Drop-out".
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

          // Check next state movement
          if (i + 1 < lectures.length) {
            const nextLecId = lectures[i + 1].id;
            const nextViewed = viewedSet.has(nextLecId);

            if (nextViewed) {
              stateTransitions[i].progressNext += 1;
            } else {
              // Viewed current but not next -> either exited or rewatching current
              // If they spent time but didn't finish, we model 70% as exit, 30% as rewatch
              stateTransitions[i].dropoutExit += 0.7;
              stateTransitions[i].rewatchSelf += 0.3;
            }
          } else {
            // Last lecture
            stateTransitions[i].progressNext += 1; // Completed course
          }
        } else {
          // If they haven't viewed the current lecture but completed others later (skip)
          // Or if they dropped out before this lecture
          if (i > 0 && viewedSet.has(lectures[i - 1].id)) {
            // Exit occurred at the previous node
            stateTransitions[i - 1].dropoutExit += 1;
            stateTransitions[i - 1].totalTransitions += 1;
          }
        }
      }
    });

    // Format output transition probabilities
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
