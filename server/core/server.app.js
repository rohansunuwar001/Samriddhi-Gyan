// server/core/server.app.js

import http from "http";
import dotenv from "dotenv";
import connectDB from "../database/db.js";
import { initSocket } from "../utils/socket.js";
import { scheduleOrderCleanup } from "../scripts/cleanupPendingOrders.script.js";
import { cleanupOrphanedUploads } from "../utils/cleanupOrphanedUploads.js";
import { cleanupStaleHLS } from "../utils/cleanupStaleHLS.js";

export class ServerApp {
  constructor(appInstance, port = process.env.PORT || 10000) {
    this.app = appInstance;
    this.port = port;
    this.server = http.createServer(appInstance);
  }

  initializeSocket() {
    initSocket(this.server);
  }

  runBackgroundTasks() {
    cleanupOrphanedUploads();
    cleanupStaleHLS();
    scheduleOrderCleanup();
  }

  async start() {
    dotenv.config({});
    try {
      await connectDB();
      this.initializeSocket();
      this.runBackgroundTasks();

      return new Promise((resolve) => {
        this.server.listen(this.port, () => {
          console.log(`[ServerApp] Server listening at port ${this.port}`);
          resolve(this.server);
        });
      });
    } catch (error) {
      console.error("[ServerApp] Failed to start server due to MongoDB error:", error);
      process.exit(1);
    }
  }
}
