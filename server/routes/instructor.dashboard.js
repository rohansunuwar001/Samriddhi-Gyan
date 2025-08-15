import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/instructor.controller.js";
import authorRouter from "./author.route.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/isAuthenticated.js";

const dashboardRouter = Router();
dashboardRouter.route("/analytics/dashboard").get(isAuthenticated,authorizeRoles("instructor"),getDashboardAnalytics);

export default dashboardRouter;