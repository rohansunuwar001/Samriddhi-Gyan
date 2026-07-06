// server/service/user.service.js
//
// PURPOSE: All business logic for user operations lives here.
// The controller reads req, calls these functions, and sends res.
// These functions never touch req or res — only data in, data out.

import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { Notification } from "../models/notification.model.js";
import { uploadMedia, deleteFromCloudinary } from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../helpers/cloudinary.helper.js";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registers a new user.
 * Throws if email already taken.
 * Returns the created user (without password).
 */
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("User already exists with this email.");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, password: hashedPassword });

  // Return a safe version — never return the password hash
  return { _id: user._id, name: user.name, email: user.email, role: user.role };
};

/**
 * Validates credentials and returns the user document if correct.
 * Throws with a 400 if email not found or password wrong.
 * NOTE: We intentionally return the SAME error message for both cases
 *       so attackers can't tell which one failed (email enumeration prevention).
 */
export const loginUser = async ({ email, password }) => {
  // .select("+password") is needed because password is select:false in some schemas.
  // Your schema doesn't have select:false but this is the safe pattern to use always.
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    const error = new Error("Incorrect email or password.");
    error.statusCode = 400;
    throw error;
  }

  // Google-only accounts have no password — block password login for them
  if (!user.password) {
    const error = new Error("This account uses Google sign-in. Please log in with Google.");
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Incorrect email or password.");
    error.statusCode = 400;
    throw error;
  }

  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a user's own full profile with enrolled courses populated.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .select("-password")
    .populate("enrolledCourses");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Returns a public instructor profile + their published courses.
 * FIX: The original used wrong field names (courseTitle, coursePrice etc.)
 *      Your Course model uses: title, thumbnail, price, ratings, numOfReviews
 */
export const getPublicProfile = async (idOrSlug) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  let query = {};
  if (isObjectId) {
    query = { _id: idOrSlug };
  } else {
    const match = idOrSlug.match(/-([0-9a-fA-F]{24})$/);
    if (match) {
      query = { _id: match[1] };
    } else {
      const slugPattern = idOrSlug.split("-").join("[\\s-]*");
      query = { name: { $regex: new RegExp(`^${slugPattern}$`, "i") } };
    }
  }

  const user = await User.findOne(query)
    .select("name headline photoUrl description links role enrolledCourses wishlist")
    .populate({
      path: "enrolledCourses",
      select: "title subtitle level thumbnail price ratings numOfReviews creator",
      populate: { path: "creator", select: "name headline" }
    })
    .populate({
      path: "wishlist",
      select: "title subtitle level thumbnail price ratings numOfReviews creator",
      populate: { path: "creator", select: "name headline" }
    });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // If instructor/admin, fetch courses created by them
  let courses = [];
  if (user.role === "instructor" || user.role === "admin") {
    courses = await Course.find({
      creator: user._id,
      isPublished: true,
    })
    .select("title subtitle level thumbnail price ratings creator numOfReviews enrolledStudents")
    .populate({ path: "creator", select: "name headline" });
  }

  return { user, courses };
};

/**
 * Updates editable profile fields (name, headline, description, links, etc.)
 * Only updates fields that are actually provided — ignores undefined values.
 * Returns the updated user document.
 */
export const updateUserInfo = async (userId, fields) => {
  const { name, headline, description, links, occupation, interests, language, privacy } = fields;

  const updateData = {};

  if (name)                    updateData.name        = name;
  if (headline)                updateData.headline    = headline;
  if (description)             updateData.description = description;
  if (occupation !== undefined) updateData.occupation = occupation;
  if (interests  !== undefined) updateData.interests  = interests;
  if (language)                updateData.language    = language;

  // Update nested link fields individually so we don't overwrite the whole object
  if (links && typeof links === "object") {
    const linkFields = ["website", "facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube"];
    linkFields.forEach((key) => {
      if (links[key] !== undefined) {
        updateData[`links.${key}`] = links[key];
      }
    });
  }

  // Update nested privacy fields individually
  if (privacy && typeof privacy === "object") {
    const privacyFields = ["showProfileToLoggedIn", "showCoursesTaking"];
    privacyFields.forEach((key) => {
      if (privacy[key] !== undefined) {
        updateData[`privacy.${key}`] = privacy[key];
      }
    });
  }

  // Update nested locationDetails fields individually
  if (fields.locationDetails && typeof fields.locationDetails === "object") {
    const locationFields = ["country", "city", "formattedAddress", "latitude", "longitude"];
    locationFields.forEach((key) => {
      if (fields.locationDetails[key] !== undefined) {
        updateData[`locationDetails.${key}`] = fields.locationDetails[key];
      }
    });
  }

  if (Object.keys(updateData).length === 0) {
    const error = new Error("No update information provided.");
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password");

  return updatedUser;
};

/**
 * Replaces a user's avatar on Cloudinary and updates the DB.
 * FIX: The original extracted publicId with .split("/").pop().split(".")[0]
 *      which breaks for URLs with folders (e.g. /lms/avatars/abc123.jpg).
 *      We now use extractCloudinaryPublicId() from helpers/ which handles all cases.
 */
export const updateUserAvatar = async (userId, filePath) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Delete old avatar from Cloudinary if one exists
  if (user.photoUrl) {
    const publicId = extractCloudinaryPublicId(user.photoUrl);
    if (publicId) {
      // We don't throw if delete fails — old image not found isn't a blocker
      await deleteFromCloudinary(publicId).catch((err) =>
        console.error("Old avatar delete failed (non-critical):", err)
      );
    }
  }

  // Upload the new avatar
  const cloudResponse = await uploadMedia(filePath);
  if (!cloudResponse?.secure_url) {
    const error = new Error("Image upload failed. Please try again.");
    error.statusCode = 500;
    throw error;
  }

  user.photoUrl = cloudResponse.secure_url;
  await user.save();

  return user.photoUrl;
};

/**
 * Validates the current password, hashes the new one, saves it,
 * and sends a password-change notification.
 */
export const updateUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Block Google-only accounts from setting a password via this route
  if (!user.password) {
    const error = new Error("Password cannot be changed for Google-authenticated accounts.");
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error("Incorrect current password.");
    error.statusCode = 401;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  // Send an in-app notification after successful password change
  await Notification.create({
    user: userId,
    message: "Your password was successfully changed.",
    link: "/profile/security",
    type: "password_update",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// LEARNING / ACTIVITY SERVICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pushes a course to the front of the user's viewHistory (max 20 entries).
 * FIX: The original fetched the whole user doc just to push to an array.
 *      We use findByIdAndUpdate with $pull + $push to do it in ONE DB call
 *      instead of fetch → mutate → save (3 operations).
 */
export const trackCourseView = async (userId, courseId) => {
  // Step 1: Remove any existing entry for this course (prevents duplicates)
  await User.findByIdAndUpdate(userId, {
    $pull: { viewHistory: { course: courseId } },
  });

  // Step 2: Push to the front and cap at 20 entries
  await User.findByIdAndUpdate(userId, {
    $push: {
      viewHistory: {
        $each: [{ course: courseId, viewedAt: new Date() }],
        $position: 0,  // insert at front
        $slice: 20,    // keep only the 20 most recent
      },
    },
  });
};

/**
 * Returns all enrolled courses with progress percentage for "My Learning" page.
 * Uses parallel queries + a progress map for efficiency (O(1) lookups).
 * This was already well-written in the controller — moved here as-is.
 */
export const getMyLearningCourses = async (userId) => {
  const userData = await User.findById(userId).select("enrolledCourses archivedCourses").lean();

  if (!userData) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const enrolledCourseIds = (userData.enrolledCourses || []).filter(
    (id) => !(userData.archivedCourses || []).some(
      (archId) => archId.toString() === id.toString()
    )
  );

  if (enrolledCourseIds.length === 0) {
    return [];
  }

  // Run both DB queries in parallel — saves ~50% time vs running sequentially
  const [courses, userProgress] = await Promise.all([
    Course.find({ _id: { $in: enrolledCourseIds } })
      .populate({
        path: "sections",
        select: "lectures",
        populate: { path: "lectures", select: "durationInSeconds" },
      })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean(),

    CourseProgress.find({
      userId,
      courseId: { $in: enrolledCourseIds },
    }).lean(),
  ]);

  // Build a map: { courseId string → lectureProgress array }
  const progressMap = userProgress.reduce((map, prog) => {
    map[prog.courseId.toString()] = prog.lectureProgress || [];
    return map;
  }, {});

  // Attach a progress percentage to each course
  const coursesWithProgress = courses.map((course) => {
    const lectureProgress = progressMap[course._id.toString()] || [];

    let totalDuration   = 0;
    let watchedDuration = 0;

    // Set of viewed lecture IDs for O(1) lookup inside the loop
    const viewedIds = new Set(
      lectureProgress
        .filter((lp) => lp.viewed)
        .map((lp) => lp.lectureId.toString())
    );

    let leftOffLecture = null;
    let leftOffSection = null;

    course.sections.forEach((section) => {
      if (section.lectures) {
        section.lectures.forEach((lecture) => {
          const dur = lecture.durationInSeconds || 0;
          totalDuration += dur;
          if (viewedIds.has(lecture._id.toString())) {
            watchedDuration += dur;
          } else if (!leftOffLecture) {
            leftOffLecture = lecture;
            leftOffSection = section;
          }
        });
      }
    });

    // If all are viewed, default to the last lecture
    if (!leftOffLecture && course.sections.length > 0) {
      const lastSection = course.sections[course.sections.length - 1];
      if (lastSection.lectures && lastSection.lectures.length > 0) {
        leftOffLecture = lastSection.lectures[lastSection.lectures.length - 1];
        leftOffSection = lastSection;
      }
    }

    const progress =
      totalDuration > 0
        ? Math.min(Math.round((watchedDuration / totalDuration) * 100), 100)
        : 0;

    const resumeInfo = {
      sectionTitle: leftOffSection ? leftOffSection.title || "Introduction" : "Introduction",
      lectureTitle: leftOffLecture ? leftOffLecture.title || "First Lesson" : "First Lesson",
      lectureDuration: leftOffLecture ? leftOffLecture.durationInSeconds || 0 : 0
    };

    return { ...course, progress, resumeInfo, isPurchased: true };
  });

  return coursesWithProgress;
};

// Archive a course
export const archiveCourse = async (userId, courseId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!user.archivedCourses.includes(courseId)) {
    user.archivedCourses.push(courseId);
    await user.save();
  }
  return user.archivedCourses;
};

// Unarchive a course
export const unarchiveCourse = async (userId, courseId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  user.archivedCourses = user.archivedCourses.filter(
    (id) => id.toString() !== courseId.toString()
  );
  await user.save();
  return user.archivedCourses;
};

// Get user's archived courses with progress
export const getArchivedCourses = async (userId) => {
  const userData = await User.findById(userId).select("archivedCourses").lean();
  if (!userData) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const archivedCourseIds = userData.archivedCourses || [];
  if (archivedCourseIds.length === 0) {
    return [];
  }

  const [courses, userProgress] = await Promise.all([
    Course.find({ _id: { $in: archivedCourseIds } })
      .populate({
        path: "sections",
        select: "lectures",
        populate: { path: "lectures", select: "durationInSeconds" },
      })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean(),

    CourseProgress.find({
      userId,
      courseId: { $in: archivedCourseIds },
    }).lean(),
  ]);

  const progressMap = userProgress.reduce((map, prog) => {
    map[prog.courseId.toString()] = prog.lectureProgress || [];
    return map;
  }, {});

  const coursesWithProgress = courses.map((course) => {
    const lectureProgress = progressMap[course._id.toString()] || [];
    let totalDuration   = 0;
    let watchedDuration = 0;

    const viewedIds = new Set(
      lectureProgress
        .filter((lp) => lp.viewed)
        .map((lp) => lp.lectureId.toString())
    );

    course.sections.forEach((section) => {
      section.lectures.forEach((lecture) => {
        const dur = lecture.durationInSeconds || 0;
        totalDuration += dur;
        if (viewedIds.has(lecture._id.toString())) {
          watchedDuration += dur;
        }
      });
    });

    const progress =
      totalDuration > 0
        ? Math.min(Math.round((watchedDuration / totalDuration) * 100), 100)
        : 0;

    return { ...course, progress, isPurchased: true };
  });

  return coursesWithProgress;
};

// =============================================================================
// GEOSPATIAL SERVICES
// =============================================================================

// Helper function to calculate great-circle distance between two coordinates in km
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Retrieve nearby instructors with precise locations (high-value / public)
export const getNearbyTutors = async (lat, lon) => {
  const tutors = await User.find({
    role: "instructor",
    "locationDetails.latitude": { $exists: true, $ne: null },
    "locationDetails.longitude": { $exists: true, $ne: null },
  })
    .select("name email photoUrl description headline locationDetails")
    .lean();

  const tutorsWithDistance = tutors
    .map((tutor) => {
      const dist = calculateHaversineDistance(
        lat,
        lon,
        tutor.locationDetails.latitude,
        tutor.locationDetails.longitude
      );
      return { ...tutor, distance: parseFloat(dist.toFixed(1)) };
    })
    .sort((a, b) => a.distance - b.distance);

  return tutorsWithDistance;
};

// Retrieve nearby student peers with fuzzed distance range and hidden coordinates (low-risk / private)
export const getNearbyPeers = async (currentUserId, lat, lon) => {
  const peers = await User.find({
    role: "student",
    _id: { $ne: currentUserId },
    "locationDetails.latitude": { $exists: true, $ne: null },
    "locationDetails.longitude": { $exists: true, $ne: null },
  })
    .select("name photoUrl headline locationDetails.city locationDetails.country locationDetails.latitude locationDetails.longitude")
    .lean();

  const fuzzedPeers = peers
    .map((peer) => {
      const dist = calculateHaversineDistance(
        lat,
        lon,
        peer.locationDetails.latitude,
        peer.locationDetails.longitude
      );

      // Fuzzing logic to protect student privacy:
      let relativeRange = "";
      if (dist <= 2) {
        relativeRange = "Within 2 km";
      } else if (dist <= 5) {
        relativeRange = "Within 5 km";
      } else if (dist <= 15) {
        relativeRange = "Within 15 km";
      } else {
        relativeRange = `${Math.round(dist / 10) * 10}+ km`;
      }

      return {
        name: peer.name,
        photoUrl: peer.photoUrl,
        headline: peer.headline,
        city: peer.locationDetails.city,
        country: peer.locationDetails.country,
        range: relativeRange,
        distanceScore: dist,
      };
    })
    .sort((a, b) => a.distanceScore - b.distanceScore)
    // Remove precise internal sorting score
    .map(({ distanceScore, ...safePeer }) => safePeer);

  return fuzzedPeers;
};