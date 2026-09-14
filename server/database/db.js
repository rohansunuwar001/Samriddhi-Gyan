// server/database/db.js

import mongoose from "mongoose";

export class DatabaseManager {
  constructor(uri = process.env.MONGO_URI) {
    this.uri = uri;
    this.isConnected = false;
  }

  /**
   * Establishes Mongoose database connection with lifecycle logging and clear diagnostics.
   */
  async connect() {
    if (this.isConnected) {
      console.log("[DatabaseManager] Connection already established.");
      return;
    }
    try {
      const targetUri = this.uri || process.env.MONGO_URI;
      const conn = await mongoose.connect(targetUri);
      this.isConnected = true;
      console.log(`[DatabaseManager] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      if (error.message && error.message.includes("ECONNREFUSED")) {
        console.error("\n[DatabaseManager] CRITICAL: Could not connect to MongoDB server (ECONNREFUSED).");
        console.error("[DatabaseManager] Ensure your local MongoDB service is running (e.g. Run 'net start MongoDB' as Administrator or start mongod).\n");
      } else {
        console.error("[DatabaseManager] Connection error:", error.message);
      }
      throw error;
    }
  }

  /**
   * Disconnects Mongoose connection gracefully.
   */
  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("[DatabaseManager] MongoDB Disconnected.");
    }
  }
}

export const dbManager = new DatabaseManager();

// Backward-compatible export
const connectDB = () => dbManager.connect();
export default connectDB;