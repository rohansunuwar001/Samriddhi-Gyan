// server/service/user.service.js
//
// PURPOSE: Business logic for user operations implemented via OOP class hierarchy.

import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { Notification } from "../models/notification.model.js";
import { uploadMedia, deleteFromCloudinary } from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../helpers/cloudinary.helper.js";
import { BaseService } from "../core/base.service.js";

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

export class UserService extends BaseService {
  constructor() {
    super(User);
  }

  /**
   * Registers a new user.
   */
  async registerUser({ name, email, password, locationDetails }) {
    const existingUser = await this.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists with this email.");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.create({
      name,
      email,
      password: hashedPassword,
      locationDetails,
    });

    return { _id: user._id, name: user.name, email: user.email, role: user.role };
  }

  /**
   * Validates credentials and returns the user document if correct.
   */
  async loginUser({ email, password }) {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      const error = new Error("Incorrect email or password.");
      error.statusCode = 400;
      throw error;
    }

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
  }

  /**
   * Returns a user's own full profile with enrolled courses populated.
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId)
      .select("-password")
      .populate("enrolledCourses");

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Returns a public instructor profile + their published courses.
   */
  async getPublicProfile(idOrSlug) {
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
  }

  /**
   * Updates editable profile fields.
   */
  async updateUserInfo(userId, fields) {
    const { name, headline, description, links, occupation, interests, language, privacy } = fields;
    const updateData = {};

    if (name)                     updateData.name        = name;
    if (headline)                 updateData.headline    = headline;
    if (description)              updateData.description = description;
    if (occupation !== undefined)  updateData.occupation = occupation;
    if (interests  !== undefined)  updateData.interests  = interests;
    if (language)                 updateData.language    = language;

    if (links && typeof links === "object") {
      const linkFields = ["website", "facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube"];
      linkFields.forEach((key) => {
        if (links[key] !== undefined) updateData[`links.${key}`] = links[key];
      });
    }

    if (privacy && typeof privacy === "object") {
      const privacyFields = ["showProfileToLoggedIn", "showCoursesTaking"];
      privacyFields.forEach((key) => {
        if (privacy[key] !== undefined) updateData[`privacy.${key}`] = privacy[key];
      });
    }

    if (fields.locationDetails && typeof fields.locationDetails === "object") {
      const locationFields = ["country", "city", "formattedAddress", "latitude", "longitude"];
      locationFields.forEach((key) => {
        if (fields.locationDetails[key] !== undefined) updateData[`locationDetails.${key}`] = fields.locationDetails[key];
      });
    }

    if (Object.keys(updateData).length === 0) {
      const error = new Error("No update information provided.");
      error.statusCode = 400;
      throw error;
    }

    return await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");
  }

  /**
   * Replaces a user's avatar on Cloudinary and updates the DB.
   */
  async updateUserAvatar(userId, filePath) {
    const user = await this.findById(userId);
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    if (user.photoUrl) {
      const publicId = extractCloudinaryPublicId(user.photoUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch((err) =>
          console.error("Old avatar delete failed (non-critical):", err)
        );
      }
    }

    const cloudResponse = await uploadMedia(filePath);
    if (!cloudResponse?.secure_url) {
      const error = new Error("Image upload failed. Please try again.");
      error.statusCode = 500;
      throw error;
    }

    user.photoUrl = cloudResponse.secure_url;
    await user.save();

    return user.photoUrl;
  }

  /**
   * Validates current password and updates password.
   */
  async updateUserPassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

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

    await Notification.create({
      user: userId,
      message: "Your password was successfully changed.",
      link: "/profile/security",
      type: "password_update",
    });
  }

  /**
   * Pushes a course to the front of user's view history.
   */
  async trackCourseView(userId, courseId) {
    await User.findByIdAndUpdate(userId, {
      $pull: { viewHistory: { course: courseId } },
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        viewHistory: {
          $each: [{ course: courseId, viewedAt: new Date() }],
          $position: 0,
          $slice: 20,
        },
      },
    });
  }

  /**
   * Returns enrolled courses with progress for My Learning page.
   */
  async getMyLearningCourses(userId) {
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

    if (enrolledCourseIds.length === 0) return [];

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

    const progressMap = userProgress.reduce((map, prog) => {
      map[prog.courseId.toString()] = prog.lectureProgress || [];
      return map;
    }, {});

    return courses.map((course) => {
      const lectureProgress = progressMap[course._id.toString()] || [];
      let totalDuration   = 0;
      let watchedDuration = 0;

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
  }

  async archiveCourse(userId, courseId) {
    const user = await this.findById(userId);
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
  }

  async unarchiveCourse(userId, courseId) {
    const user = await this.findById(userId);
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
  }

  async getArchivedCourses(userId) {
    const userData = await User.findById(userId).select("archivedCourses").lean();
    if (!userData) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    const archivedCourseIds = userData.archivedCourses || [];
    if (archivedCourseIds.length === 0) return [];

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

    return courses.map((course) => {
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
  }

  async getNearbyTutors(lat, lon) {
    const tutors = await User.find({
      role: "instructor",
      "locationDetails.latitude": { $exists: true, $ne: null },
      "locationDetails.longitude": { $exists: true, $ne: null },
    })
      .select("name email photoUrl description headline locationDetails")
      .lean();

    return tutors
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
  }

  async getNearbyPeers(currentUserId, lat, lon) {
    const peers = await User.find({
      role: "student",
      _id: { $ne: currentUserId },
      "locationDetails.latitude": { $exists: true, $ne: null },
      "locationDetails.longitude": { $exists: true, $ne: null },
    })
      .select("name photoUrl headline locationDetails.city locationDetails.country locationDetails.latitude locationDetails.longitude")
      .lean();

    return peers
      .map((peer) => {
        const dist = calculateHaversineDistance(
          lat,
          lon,
          peer.locationDetails.latitude,
          peer.locationDetails.longitude
        );

        let relativeRange = "";
        if (dist <= 2) relativeRange = "Within 2 km";
        else if (dist <= 5) relativeRange = "Within 5 km";
        else if (dist <= 15) relativeRange = "Within 15 km";
        else relativeRange = `${Math.round(dist / 10) * 10}+ km`;

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
      .map(({ distanceScore, ...safePeer }) => safePeer);
  }

  /**
   * Permanently deletes a user's account, removing avatar from Cloudinary,
   * and cleaning up notifications, course progress, and personal data.
   */
  async deleteAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    // Clean up avatar from Cloudinary if present
    if (user.photoUrl) {
      const publicId = extractCloudinaryPublicId(user.photoUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (err) {
          console.error("Failed to delete avatar during account deletion:", err.message);
        }
      }
    }

    // Clean up user notifications, progress, and user document
    await Promise.all([
      Notification.deleteMany({ user: userId }),
      CourseProgress.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    return { message: "Account and associated personal data successfully deleted." };
  }
}

// Export singleton instance
export const userService = new UserService();

// Backward-compatible individual function exports
export const registerUser = userService.registerUser.bind(userService);
export const loginUser = userService.loginUser.bind(userService);
export const getUserProfile = userService.getUserProfile.bind(userService);
export const getPublicProfile = userService.getPublicProfile.bind(userService);
export const updateUserInfo = userService.updateUserInfo.bind(userService);
export const updateUserAvatar = userService.updateUserAvatar.bind(userService);
export const updateUserPassword = userService.updateUserPassword.bind(userService);
export const trackCourseView = userService.trackCourseView.bind(userService);
export const getMyLearningCourses = userService.getMyLearningCourses.bind(userService);
export const archiveCourse = userService.archiveCourse.bind(userService);
export const unarchiveCourse = userService.unarchiveCourse.bind(userService);
export const getArchivedCourses = userService.getArchivedCourses.bind(userService);
export const getNearbyTutors = userService.getNearbyTutors.bind(userService);
export const getNearbyPeers = userService.getNearbyPeers.bind(userService);
export const deleteAccount = userService.deleteAccount.bind(userService);