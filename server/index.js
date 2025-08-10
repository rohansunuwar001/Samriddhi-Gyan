// --- ADD THESE IMPORTS ---
import http from 'http';
import { Server } from 'socket.io';
// --- END OF ADDITIONS ---

import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from 'express-session';
import morgan from "morgan";
import passport from "passport";
import connectDB from "./database/db.js";
import { configurePassport } from "./database/passport-config.js";
import aiRoutes from "./routes/ai.route.js";
import articleRouter from "./routes/article.route.js";
import authorRouter from "./routes/author.route.js";
import cartRouter from "./routes/cart.route.js";
import categoryRoutes from './routes/category.route.js';
import courseRoute from "./routes/course.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import esewaRoute from "./routes/esewa.route.js";
import dashboardRouter from "./routes/instructor.dashboard.js";
import lectureRouter from "./routes/lecture.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import reviewRouter from "./routes/review.route.js";
import searchRouter from "./routes/searchSug.routes.js";
import sectionRouter from "./routes/section.route.js";
import userRoute from "./routes/user.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import notificationRouter from './routes/notification.route.js';

// --- ADD THIS IMPORT for notification routes (you will create this file next) ---

dotenv.config({});

// call database connection here
connectDB();
const app = express();

// --- CHANGE THIS: Create an HTTP server from your Express app ---
const server = http.createServer(app);

// --- ADD THIS: Initialize Socket.IO and attach it to the HTTP server ---
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// This map will store online users: { userId: socketId }
export const userSocketMap = {};

// --- ADD THIS: Socket.IO connection logic ---
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Get userId passed from the frontend client
    const userId = socket.handshake.query.userId;

    // If a userId is provided, map it to the socket ID
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
        console.log(`User connected: ${userId}`);
    }

    // Handle when a user disconnects
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        // Find the user ID associated with the disconnected socket and remove it from the map
        const userIdToRemove = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
        if (userIdToRemove) {
            delete userSocketMap[userIdToRemove];
            console.log(`User disconnected: ${userIdToRemove}`);
        }
    });
});

// default middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));

// apis
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/buy", esewaRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/ai", aiRoutes);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/authors', authorRouter);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/articles', articleRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use('/api/v1', sectionRouter);
app.use("/api/v1", lectureRouter);
app.use("/api/v1/instructor", dashboardRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/cart", cartRouter)

// --- ADD THIS: The new route for handling notifications ---
app.use("/api/v1/notifications", notificationRouter);


// --- CHANGE THIS: Use the 'server' object to listen, not the 'app' object ---
server.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});