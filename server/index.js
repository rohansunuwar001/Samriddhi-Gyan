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
import categoryRoutes from './routes/category.route.js';
import courseRoute from "./routes/course.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import esewaRoute from "./routes/esewa.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import searchRouter from "./routes/searchSug.routes.js";
import userRoute from "./routes/user.route.js";
import authorRouter from "./routes/author.route.js";
import reviewRouter from "./routes/review.route.js";
import sectionRouter from "./routes/section.route.js";
import lectureRouter from "./routes/lecture.route.js";
import dashboardRouter from "./routes/instructor.dashboard.js";

dotenv.config({});

// call database connection here
connectDB();
const app = express();

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Server listen at port ${PORT}`);
});
