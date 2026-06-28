// server/helpers/validate.helper.js
//
// PURPOSE: Removes the repeated `if (!field) return res.status(400)...` pattern
// from every controller. Instead, call validateRequiredFields() at the top
// of any controller function and it throws a clean error if anything is missing.
//
// Lives in helpers/ because it's tied to your app's error-handling pattern.
// A truly generic "check if string is empty" would live in utils/ — but this
// one throws structured errors that match YOUR controller try/catch pattern.

/**
 * Throws a 400 error if any of the provided fields are missing or empty.
 *
 * @param {Object} fields - Key/value pairs to check. Key = field name, value = the value.
 *
 * @example
 * // In a controller or service:
 * validateRequiredFields({ name, email, password });
 * // If `email` is missing, throws: Error("email is required.")
 *
 * @example
 * validateRequiredFields({ currentPassword, newPassword });
 */
export const validateRequiredFields = (fields) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");

    if (isEmpty) {
      const error = new Error(`${fieldName} is required.`);
      error.statusCode = 400;
      throw error;
    }
  }
};

/**
 * Validates that a password meets minimum requirements.
 * Call this before hashing during register or password change.
 *
 * Rules:
 *  - At least 8 characters
 *  - At least one number
 *  - At least one letter
 *
 * @param {string} password
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    const error = new Error("Password must be at least 8 characters long.");
    error.statusCode = 400;
    throw error;
  }
  if (!/[a-zA-Z]/.test(password)) {
    const error = new Error("Password must contain at least one letter.");
    error.statusCode = 400;
    throw error;
  }
  if (!/[0-9]/.test(password)) {
    const error = new Error("Password must contain at least one number.");
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Validates an email address format.
 * Throws a 400 error if the format is invalid.
 *
 * @param {string} email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    const error = new Error("Please provide a valid email address.");
    error.statusCode = 400;
    throw error;
  }
};