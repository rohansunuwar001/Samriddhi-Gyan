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

  // ── Fast path: auth middleware already attached enrolledCourses ──────────────
  const attached = req.user?.enrolledCourses;
  if (Array.isArray(attached) && attached.length > 0) {
    return attached.map((entry) => {
      // Handle ObjectId | string | populated object
      if (typeof entry === "string") return entry;
      if (entry?._id) return entry._id.toString();
      return entry.toString();
    });
  }

  // ── Fallback: query CoursePurchase directly ──────────────────────────────────
  // Useful when enrolledCourses isn't populated on req.user (e.g. lightweight
  // auth middleware that only attaches _id + role).
  const purchases = await CoursePurchase.find({
    userId,
    status: "completed",
  })
    .select("courses.courseId")
    .lean();

  const ids = new Set();
  for (const purchase of purchases) {
    for (const { courseId } of purchase.courses ?? []) {
      if (courseId) ids.add(courseId.toString());
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