import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import morgan from "morgan";
import passport from "passport";
import { stripeWebhook } from "./controllers/coursePurchase.controller.js";
import { configurePassport } from "./database/passport-config.js"; // adjust path as needed
import adminRouter from "./routes/admin.route.js";
import blogImportRouter from "./routes/blogImport.route.js";
import aiRoutes from "./routes/ai.route.js";
import articleRouter from "./routes/article.route.js";
import authorRouter from "./routes/author.route.js";
import cartRouter from "./routes/cart.route.js";
import categoryRoutes from "./routes/category.route.js";
import combinedSearchRouter from "./routes/combinedsearch.route.js"; // ← ADDED
import courseRoute from "./routes/course.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import esewaRoute from "./routes/esewa.route.js";
import dashboardRouter from "./routes/instructor.dashboard.js";
import lectureRouter from "./routes/lecture.route.js";
import mediaRoute from "./routes/media.route.js";
import notificationRouter from "./routes/notification.route.js";
import purchaseCourseRoutes from "./routes/purchaseCourse.route.js";
import recommendedRoutes from "./routes/recommended.route.js";
import reviewRouter from "./routes/review.route.js";
import searchRouter from "./routes/searchSug.routes.js";
import topicRouter from "./routes/topic.route.js";
import sectionRouter from "./routes/section.route.js";
import userRoute from "./routes/user.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import flashcardRouter from "./routes/flashcard.route.js";
import questionRoute from "./routes/question.route.js";
import reminderRoute from "./routes/reminder.route.js";
import cmsRouter from "./routes/cms.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import paymentMethodRouter from "./routes/paymentMethod.route.js";
import certificateRouter from "./routes/certificate.route.js";
import certificationRouter from "./routes/certification.route.js";
import banditPricingRouter from "./routes/banditPricing.route.js";
import pathwaysRouter from "./routes/pathways.route.js";
import path from 'path';
import { fileURLToPath } from 'url';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve HLS segments as static files — add this near your other middleware
app.use('/hls', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
  next();
}, express.static(path.join(__dirname, 'public', 'hls')));

// Serve uploaded library/raw files as static files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// --- Mount the webhook route BEFORE express.json() ---
app.use("/api/v1/purchase/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// --- Default middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URI],
    credentials: true,
  })
);
app.use(morgan("dev"));

// --- Root route ---
app.get("/", (req, res) => {
  res.json({ 
    message: "Samriddhi Gyan API is running",
    version: "v1",
    endpoints: "/api/v1/*"
  });
});

// --- Mount all other routes ---

app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseCourseRoutes); // All purchase routes except webhook
app.use("/api/v1/buy", esewaRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/topic", topicRouter);
app.use("/api/v1/search-by-topic", combinedSearchRouter); // ← ADDED: GET /api/v1/search-by-topic?topic=Node.js
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
app.use("/api/v1/flashcard", flashcardRouter);
app.use("/api/v1/question", questionRoute);
app.use("/api/v1/reminder", reminderRoute);
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/admin", blogImportRouter); // POST /api/v1/admin/blog-import
app.use("/api/v1/cms", cmsRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/payment-methods", paymentMethodRouter);
app.use("/api/v1/certificate", certificateRouter);
app.use("/api/v1/certifications", certificationRouter);
app.use("/api/v1/bandit-pricing", banditPricingRouter);
app.use("/api/v1/pathways", pathwaysRouter);
export default app;