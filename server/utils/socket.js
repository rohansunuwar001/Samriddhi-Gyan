// server/utils/socket.js

import { Server } from "socket.io";

export class SocketManager {
  constructor() {
    this.io = null;
    this.userSocketMap = {};
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [process.env.FRONTEND_URL],
        credentials: true,
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log(`[SocketManager] Connected: ${socket.id}`);
      const userId = socket.handshake.query.userId;
      if (userId && userId !== "undefined") {
        this.userSocketMap[userId] = socket.id;
        console.log(`[SocketManager] User mapped: ${userId}`);
      }

      socket.on("disconnect", () => {
        console.log(`[SocketManager] Disconnected: ${socket.id}`);
        const userIdToRemove = Object.keys(this.userSocketMap).find(
          (key) => this.userSocketMap[key] === socket.id
        );
        if (userIdToRemove) {
          delete this.userSocketMap[userIdToRemove];
          console.log(`[SocketManager] User unmapped: ${userIdToRemove}`);
        }
      });
    });

    return this.io;
  }

  getSocketId(userId) {
    return this.userSocketMap[userId];
  }

  emitToUser(userId, event, data) {
    const socketId = this.getSocketId(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

export const socketManager = new SocketManager();

export const initSocket = (server) => socketManager.initialize(server);
export const userSocketMap = socketManager.userSocketMap;
export let io = null;
// Proxy getter to allow dynamic access to io instance
Object.defineProperty(globalThis, "__socket_io__", {
  get: () => socketManager.io,
});
