// server/scripts/cleanupPendingOrders.script.js
//
// PURPOSE: Marks CoursePurchase documents as "failed" if they have been
// stuck in "pending" status for more than 1 hour.
//
// This handles the case where:
//   - User started eSewa payment but closed the tab
//   - User was redirected back without completing payment
//   - Network error interrupted the payment flow
//
// HOW TO USE:
//   Option A — Run once manually from terminal:
//     node scripts/cleanupPendingOrders.script.js
//
//   Option B — Schedule it in your app.js to run every hour automatically:
//     import { scheduleOrderCleanup } from "./scripts/cleanupPendingOrders.script.js";
//     scheduleOrderCleanup(); // call this once when your server starts

import mongoose from "mongoose";

import dotenv from "dotenv";
import { CoursePurchase } from "../models/coursePurchase.model.js";

dotenv.config();

/**
 * Finds all orders stuck in "pending" for more than `thresholdMinutes`
 * and marks them as "failed".
 *
 * @param {number} thresholdMinutes - How old a pending order must be to be cleaned up (default: 60)
 * @returns {number} - How many orders were cleaned up
 */
export const cleanupStalePendingOrders = async (thresholdMinutes = 60) => {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

  const result = await CoursePurchase.updateMany(
    {
      status: "pending",
      createdAt: { $lt: cutoff }, // older than the threshold
    },
    {
      $set: { status: "failed" },
    }
  );

  console.log(
    `[Cleanup] Marked ${result.modifiedCount} stale pending order(s) as "failed".`
  );

  return result.modifiedCount;
};

/**
 * Schedules the cleanup to run automatically every hour while your server is running.
 * Call this once in app.js after your DB connects.
 *
 * @param {number} intervalMinutes - How often to run the cleanup (default: 60 minutes)
 */
export const scheduleOrderCleanup = (intervalMinutes = 60) => {
  const ms = intervalMinutes * 60 * 1000;

  // Run once immediately on startup to clean any leftovers from the last restart
  cleanupStalePendingOrders().catch((err) =>
    console.error("[Cleanup] Initial cleanup failed:", err)
  );

  // Then run on a schedule
  setInterval(() => {
    cleanupStalePendingOrders().catch((err) =>
      console.error("[Cleanup] Scheduled cleanup failed:", err)
    );
  }, ms);

  console.log(
    `[Cleanup] Stale order cleanup scheduled every ${intervalMinutes} minute(s).`
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL RUN (Option A)
// Only executes when you run this file directly from the terminal.
// Does NOT run when this file is imported by app.js.
// ─────────────────────────────────────────────────────────────────────────────
const isRunDirectly =
  process.argv[1] &&
  process.argv[1].includes("cleanupPendingOrders.script.js");

if (isRunDirectly) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("[Cleanup] Connected to DB. Running cleanup...");
      await cleanupStalePendingOrders();
      await mongoose.disconnect();
      console.log("[Cleanup] Done. Disconnected.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Cleanup] DB connection failed:", err);
      process.exit(1);
    });
}