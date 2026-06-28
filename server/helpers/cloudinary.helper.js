// server/helpers/cloudinary.helper.js
//
// PURPOSE: Domain-specific helpers for working with Cloudinary URLs.
// Lives in helpers/ because it knows about YOUR app's Cloudinary setup.
//
// WHY THIS EXISTS:
// The original user controller extracted the publicId like this:
//   user.photoUrl.split("/").pop().split(".")[0]
//
// This BREAKS for Cloudinary URLs with folders or version strings, e.g.:
//   https://res.cloudinary.com/demo/image/upload/v1312461204/lms/avatars/abc123.jpg
//   .split("/").pop()         → "abc123.jpg"       ✓ happens to work here
//
//   https://res.cloudinary.com/demo/image/upload/lms/avatars/abc123.jpg
//   .split("/").pop()         → "abc123.jpg"       ✗ WRONG — missing folder prefix
//   publicId should be        → "lms/avatars/abc123"
//
// Cloudinary's publicId is everything AFTER "/upload/" and BEFORE the file extension.

/**
 * Extracts the Cloudinary public_id from a full Cloudinary URL.
 *
 * Examples:
 *   Input:  "https://res.cloudinary.com/demo/image/upload/v1312461204/lms/avatars/abc123.jpg"
 *   Output: "lms/avatars/abc123"
 *
 *   Input:  "https://res.cloudinary.com/demo/image/upload/sample.jpg"
 *   Output: "sample"
 *
 * @param {string} url - The full Cloudinary secure_url
 * @returns {string|null} - The public_id, or null if the URL is not a valid Cloudinary URL
 */
export const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== "string") return null;

  // Find the "/upload/" marker — everything after it is the version + publicId + extension
  const uploadMarker = "/upload/";
  const uploadIndex = url.indexOf(uploadMarker);

  if (uploadIndex === -1) return null; // Not a Cloudinary URL

  // Get everything after "/upload/"
  // e.g. "v1312461204/lms/avatars/abc123.jpg"  or  "lms/avatars/abc123.jpg"
  let afterUpload = url.slice(uploadIndex + uploadMarker.length);

  // Strip the optional version prefix (v followed by digits and a slash)
  // e.g. "v1312461204/" → removed
  afterUpload = afterUpload.replace(/^v\d+\//, "");

  // Strip the file extension (.jpg, .png, .webp, etc.)
  // e.g. "lms/avatars/abc123.jpg" → "lms/avatars/abc123"
  const dotIndex = afterUpload.lastIndexOf(".");
  if (dotIndex !== -1) {
    afterUpload = afterUpload.slice(0, dotIndex);
  }

  return afterUpload || null;
};