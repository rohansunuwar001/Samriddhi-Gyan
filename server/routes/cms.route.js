import express from "express";
import {
  getDiscountBanners,
  getActiveDiscountBanner,
  createDiscountBanner,
  updateDiscountBanner,
  deleteDiscountBanner,
  getGetOfferPromos,
  getActiveGetOfferPromo,
  createGetOfferPromo,
  updateGetOfferPromo,
  deleteGetOfferPromo,
  getSubscriptionNavbars,
  getActiveSubscriptionNavbar,
  createSubscriptionNavbar,
  updateSubscriptionNavbar,
  deleteSubscriptionNavbar,
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

// Public routes (used to render on the guest landing homepage / components)
router.route("/active-discount-banner").get(getActiveDiscountBanner);
router.route("/active-get-offer-promo").get(getActiveGetOfferPromo);
router.route("/active-subscription-navbar").get(getActiveSubscriptionNavbar);
router.route("/carousel").get(getCarouselSlides);
router.route("/logos").get(getCompanyLogos);
router.route("/promo").get(getPromoBanners);

// Protected admin-only routes for Discount Banner management
router
  .route("/discount-banners")
  .get(isAuthenticated, authorizeRoles("admin"), getDiscountBanners)
  .post(isAuthenticated, authorizeRoles("admin"), createDiscountBanner);
router
  .route("/discount-banners/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateDiscountBanner)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteDiscountBanner);

// Protected admin-only routes for Get Offer Promo management
router
  .route("/get-offer-promos")
  .get(isAuthenticated, authorizeRoles("admin"), getGetOfferPromos)
  .post(isAuthenticated, authorizeRoles("admin"), createGetOfferPromo);
router
  .route("/get-offer-promos/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateGetOfferPromo)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteGetOfferPromo);

// Protected admin-only routes for Subscription Navbar management
router
  .route("/subscription-navbars")
  .get(isAuthenticated, authorizeRoles("admin"), getSubscriptionNavbars)
  .post(isAuthenticated, authorizeRoles("admin"), createSubscriptionNavbar);
router
  .route("/subscription-navbars/:id")
  .put(isAuthenticated, authorizeRoles("admin"), updateSubscriptionNavbar)
  .delete(isAuthenticated, authorizeRoles("admin"), deleteSubscriptionNavbar);

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
