import { Router } from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  createDiscountBanner,
  getDiscountBanners,
  updateDiscountBanner,
  deleteDiscountBanner,
  getActiveDiscountBanner,
  createGetOfferPromo,
  getGetOfferPromos,
  updateGetOfferPromo,
  deleteGetOfferPromo,
  getActiveGetOfferPromo,
  createSubscriptionNavbar,
  getSubscriptionNavbars,
  updateSubscriptionNavbar,
  deleteSubscriptionNavbar,
  getActiveSubscriptionNavbar
} from "../controllers/cms.controller.js";

const cmsRouter = Router();

// Public routes for fetching currently active settings
cmsRouter.get("/active-discount-banner", getActiveDiscountBanner);
cmsRouter.get("/active-get-offer-promo", getActiveGetOfferPromo);
cmsRouter.get("/active-subscription-navbar", getActiveSubscriptionNavbar);

// Admin-only CRUD routes for Discount Banners
cmsRouter.route("/discount-banners")
  .post(isAuthenticated, authorizeRoles("admin"), createDiscountBanner)
  .get(isAuthenticated, authorizeRoles("admin"), getDiscountBanners);

cmsRouter.route("/discount-banners/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateDiscountBanner)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteDiscountBanner);

// Admin-only CRUD routes for Promo Offer Section
cmsRouter.route("/get-offer-promos")
  .post(isAuthenticated, authorizeRoles("admin"), createGetOfferPromo)
  .get(isAuthenticated, authorizeRoles("admin"), getGetOfferPromos);

cmsRouter.route("/get-offer-promos/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateGetOfferPromo)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteGetOfferPromo);

// Admin-only CRUD routes for Scroll-triggered Subscription Navbars
cmsRouter.route("/subscription-navbars")
  .post(isAuthenticated, authorizeRoles("admin"), createSubscriptionNavbar)
  .get(isAuthenticated, authorizeRoles("admin"), getSubscriptionNavbars);

cmsRouter.route("/subscription-navbars/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateSubscriptionNavbar)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteSubscriptionNavbar);

export default cmsRouter;
