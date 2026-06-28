// server/helpers/generateOrderId.helper.js
//
// PURPOSE: Generates a unique, human-readable order ID for your LMS.
// Lives in helpers/ because it's specific to YOUR app's domain (orders).
// Generic tools (like date formatters) go in utils/ instead.
//
// Example output: "LMS-ORD-A1B2C3D4"

import { v4 as uuidv4 } from "uuid";

export const generateOrderId = () => {
  // Takes the first segment of a UUID (8 hex chars) and uppercases it.
  // e.g. uuid "f47ac10b-58cc-..." → "LMS-ORD-F47AC10B"
  // This matches the pattern already used in your Stripe and eSewa controllers.
  return `LMS-ORD-${uuidv4().split("-")[0].toUpperCase()}`;
};