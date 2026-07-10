import express from "express";
import {
  getActiveDiscountBanner,
  getCarouselSlides,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  getCompanyLogos,
  createCompanyLogo,
  updateCompanyLogo,
  deleteCompanyLogo,
  getPromoBanners,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
} from "../controllers/cms.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Public routes (used to render on the guest landing homepage)
router.route("/active-discount-banner").get(getActiveDiscountBanner);
router.route("/carousel").get(getCarouselSlides);
router.route("/logos").get(getCompanyLogos);
router.route("/promo").get(getPromoBanners);

// Protected admin-only routes for Carousel management
router
  .route("/carousel")
  .post(isAuthenticated, authorizeRoles("admin"), createCarouselSlide);
router
  .route("/carousel/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateCarouselSlide)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteCarouselSlide);

// Protected admin-only routes for Company Logo management
router
  .route("/logos")
  .post(isAuthenticated, authorizeRoles("admin"), createCompanyLogo);
router
  .route("/logos/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateCompanyLogo)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteCompanyLogo);

// Protected admin-only routes for Promo Banner management
router
  .route("/promo")
  .post(isAuthenticated, authorizeRoles("admin"), createPromoBanner);
router
  .route("/promo/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updatePromoBanner)
  .delete(isAuthenticated, authorizeRoles("admin"), deletePromoBanner);

export default router;
