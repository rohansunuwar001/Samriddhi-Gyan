// server/helpers/generateOrderId.helper.js
//
// PURPOSE: Generates a unique, human-readable order ID for your LMS.
// Lives in helpers/ because it's specific to YOUR app's domain (orders).
// Generic tools (like date formatters) go in utils/ instead.
//
// Example output: "LMS-ORD-A1B2C3D4"

import crypto from "crypto";

export const generateOrderId = () => {
  return `LMS-ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};