import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/instructor.controller.js";

const dashboardRouter = Router();
dashboardRouter.route("/analytics/dashboard").get(getDashboardAnalytics);

export default dashboardRouter;