import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import morgan from "morgan";
import passport from "passport";
import aiRoutes from "./routes/ai.route.js";
import articleRouter from "./routes/article.route.js";
import authorRouter from "./routes/author.route.js";
import categoryRoutes from "./routes/category.route.js";
import courseRoute from "./routes/course.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import esewaRoute from "./routes/esewa.route.js";
import lectureRouter from "./routes/lecture.route.js";
import mediaRoute from "./routes/media.route.js";
import notificationRouter from "./routes/notification.route.js";
import purchaseCourseRoutes from "./routes/purchaseCourse.route.js";
import reviewRouter from "./routes/review.route.js";
import searchRouter from "./routes/searchSug.routes.js";
import sectionRouter from "./routes/section.route.js";
import userRoute from "./routes/user.route.js";
import dashboardRouter from "./routes/instructor.dashboard.js";
import cartRouter from "./routes/cart.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import { configurePassport } from "./database/passport-config.js"; // adjust path as needed
import recommendedRoutes from "./routes/recommended.route.js";
import adminRouter from "./routes/admin.route.js";
dotenv.config({});

const app = express();

// 1. Configure passport strategies
configurePassport();

// 2. Set up session middleware (required for passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

// --- Mount the webhook route BEFORE express.json() ---
app.use("/api/v1/purchase/webhook", express.raw({ type: "application/json" }), purchaseCourseRoutes);

// --- Default middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));

// --- Mount all other routes ---
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseCourseRoutes); // All purchase routes except webhook
app.use("/api/v1/buy", esewaRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/authors", authorRouter);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1", sectionRouter);
app.use("/api/v1", lectureRouter);
app.use("/api/v1/instructor", dashboardRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/recommendations", recommendedRoutes);
app.use("/api/v1/admin", adminRouter)
export default app;