import http from "http";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import app from "./app.js";
import { scheduleOrderCleanup } from "./scripts/cleanupPendingOrders.script.js";
import { cleanupOrphanedUploads } from "./utils/cleanupOrphanedUploads.js";
import { cleanupStaleHLS } from "./utils/cleanupStaleHLS.js";
import { initSocket, io, userSocketMap } from "./utils/socket.js";


dotenv.config({});

const server = http.createServer(app);

initSocket(server);

export { io, userSocketMap };

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();
    cleanupOrphanedUploads();
    cleanupStaleHLS();
    scheduleOrderCleanup();
    server.listen(PORT, () => {
      console.log(`Server listening at port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to MongoDB error:", error);
    process.exit(1);
  }
};

startServer();