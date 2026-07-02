// src/helpers/courseFilter.helper.js
//
// Single source of truth for resolving a requesting user's enrolled course IDs.
// Import getEnrolledIds() in any controller that needs to exclude purchased
// courses from its results (published, trending, featured, etc.).

import { CoursePurchase } from "../models/coursePurchase.model.js";

/**
 * Resolve the set of course IDs that the requesting user has already purchased.
 *
 * Works from two sources, in priority order:
 *   1. `req.user.enrolledCourses`  — populated by the auth middleware; fast, no
 *      extra DB round-trip.  Each entry may be an ObjectId, a plain string, or a
 *      populated course object — all are normalised to strings.
 *   2. CoursePurchase collection   — fallback for cases where enrolledCourses is
 *      absent or stale (e.g. guest-to-user upgrade, data-migration windows).
 *
 * @param   {import('express').Request} req
 * @returns {Promise<string[]>}  Array of course-ID strings (may be empty for guests).
 */
export const getEnrolledIds = async (req) => {
  const userId = req.user?._id ?? null;

  // ── Guest / unauthenticated ──────────────────────────────────────────────────
  if (!userId) return [];

  const ids = new Set();

  // ── Step 1: Add enrolledCourses from user object ─────────────────────────────
  const attached = req.user?.enrolledCourses;
  if (Array.isArray(attached)) {
    attached.forEach((entry) => {
      if (typeof entry === "string") ids.add(entry);
      else if (entry?._id) ids.add(entry._id.toString());
      else if (entry) ids.add(entry.toString());
    });
  }

  // ── Step 2: Add subscription courses if active ───────────────────────────────
  if (req.user?.subscription?.status === "active") {
    const { Course } = await import("../models/course.model.js");
    const subCourses = await Course.find({ includedInSubscription: true, isPublished: true })
      .select("_id")
      .lean();
    subCourses.forEach((c) => ids.add(c._id.toString()));
  }

  // ── Step 3: Fallback if Set is empty ─────────────────────────────────────────
  if (ids.size === 0) {
    const purchases = await CoursePurchase.find({
      userId,
      status: "completed",
    })
      .select("courses.courseId")
      .lean();

    for (const purchase of purchases) {
      for (const { courseId } of purchase.courses ?? []) {
        if (courseId) ids.add(courseId.toString());
      }
    }
  }

  return [...ids];
};

/**
 * Build a Mongoose query condition that excludes the user's purchased courses.
 *
 * Usage:
 *   const excludeFilter = await buildEnrollmentExcludeFilter(req);
 *   const courses = await Course.find({ isPublished: true, ...excludeFilter });
 *
 * @param   {import('express').Request} req
 * @returns {Promise<{ _id?: { $nin: string[] } }>}
 *          An object ready to spread into a Mongoose filter.
 *          Returns `{}` (no-op) for guests so guest queries are unaffected.
 */
export const buildEnrollmentExcludeFilter = async (req) => {
  const enrolledIds = await getEnrolledIds(req);
  if (enrolledIds.length === 0) return {};          // guest — no filter needed
  return { _id: { $nin: enrolledIds } };
};