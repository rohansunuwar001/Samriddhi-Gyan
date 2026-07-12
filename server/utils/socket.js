import { Server } from "socket.io";

export let io = null;
export const userSocketMap = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

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

  return io;
};
