import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import app from "./app.js";


dotenv.config({});

connectDB();

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Socket.IO logic
export const userSocketMap = {};

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User connected: ${userId}`);
  }
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const userIdToRemove = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );
    if (userIdToRemove) {
      delete userSocketMap[userIdToRemove];
      console.log(`User disconnected: ${userIdToRemove}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});