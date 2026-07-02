import { Router } from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";
import {
  initializeSubscription,
  completeSubscription,
  fillSubscriptionEsewaForm,
  getPlans,
  updatePlans,
  getAllSubscriptions
} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();

// Student-facing subscription plans
subscriptionRouter.get("/plans", getPlans);

// Subscription checkout redirection and verification callbacks
subscriptionRouter.post("/buy", isAuthenticated, initializeSubscription);
subscriptionRouter.get("/complete", completeSubscription);
subscriptionRouter.get("/form", fillSubscriptionEsewaForm);

// Admin-facing logs and pricing settings
subscriptionRouter.put("/plans", isAuthenticated, authorizeRoles("admin"), updatePlans);
subscriptionRouter.get("/all", isAuthenticated, authorizeRoles("admin"), getAllSubscriptions);

export default subscriptionRouter;
