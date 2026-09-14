// server/controllers/cms.controller.js

import { BaseController } from "../core/base.controller.js";
import { cmsService } from "../service/cms.service.js";

export class CMSController extends BaseController {
  constructor(service = cmsService) {
    super();
    this.service = service;
  }

  // --- Discount Banner ---
  getDiscountBanners = async (req, res) => {
    try {
      const banners = await this.service.getDiscountBanners();
      return this.sendSuccess(res, { banners });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  getActiveDiscountBanner = async (req, res) => {
    try {
      const banner = await this.service.getActiveDiscountBanner();
      return this.sendSuccess(res, { banner: banner || null });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  createDiscountBanner = async (req, res) => {
    try {
      const banner = await this.service.createDiscountBanner(req.body);
      return this.sendSuccess(res, { banner }, "Banner created successfully", 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  updateDiscountBanner = async (req, res) => {
    try {
      const { id } = req.params;
      const banner = await this.service.updateDiscountBanner(id, req.body);
      if (!banner) {
        return this.sendError(res, "Banner not found", 404);
      }
      return this.sendSuccess(res, { banner }, "Banner updated successfully");
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  deleteDiscountBanner = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteDiscountBanner(id);
      return this.sendSuccess(res, {}, "Banner deleted successfully");
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  // --- Get Offer Promo ---
  getGetOfferPromos = async (req, res) => {
    try {
      const promos = await this.service.getGetOfferPromos();
      return this.sendSuccess(res, { promos });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  getActiveGetOfferPromo = async (req, res) => {
    try {
      const promo = await this.service.getActiveGetOfferPromo();
      return this.sendSuccess(res, { promo: promo || null });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  createGetOfferPromo = async (req, res) => {
    try {
      const promo = await this.service.createGetOfferPromo(req.body);
      return this.sendSuccess(res, { promo }, "Offer promo created successfully", 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  updateGetOfferPromo = async (req, res) => {
    try {
      const { id } = req.params;
      const promo = await this.service.updateGetOfferPromo(id, req.body);
      if (!promo) {
        return this.sendError(res, "Offer promo not found", 404);
      }
      return this.sendSuccess(res, { promo }, "Offer promo updated successfully");
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  deleteGetOfferPromo = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteGetOfferPromo(id);
      return this.sendSuccess(res, {}, "Offer promo deleted successfully");
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  // --- Subscription Navbar ---
  getSubscriptionNavbars = async (req, res) => {
    try {
      const navbars = await this.service.getSubscriptionNavbars();
      return this.sendSuccess(res, { navbars });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  getActiveSubscriptionNavbar = async (req, res) => {
    try {
      const navbar = await this.service.getActiveSubscriptionNavbar();
      return this.sendSuccess(res, { navbar: navbar || null });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  createSubscriptionNavbar = async (req, res) => {
    try {
      const navbar = await this.service.createSubscriptionNavbar(req.body);
      return this.sendSuccess(res, { navbar }, "Subscription navbar created successfully", 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  updateSubscriptionNavbar = async (req, res) => {
    try {
      const { id } = req.params;
      const navbar = await this.service.updateSubscriptionNavbar(id, req.body);
      if (!navbar) {
        return this.sendError(res, "Subscription navbar not found", 404);
      }
      return this.sendSuccess(res, { navbar }, "Subscription navbar updated successfully");
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  deleteSubscriptionNavbar = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteSubscriptionNavbar(id);
      return this.sendSuccess(res, {}, "Subscription navbar deleted successfully");
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  // --- Carousel Slide ---
  getCarouselSlides = async (req, res) => {
    try {
      const onlyActive = req.query.active === "true";
      const slides = await this.service.getCarouselSlides(onlyActive);
      return this.sendSuccess(res, { slides });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  createCarouselSlide = async (req, res) => {
    try {
      const slide = await this.service.createCarouselSlide(req.body);
      return this.sendSuccess(res, { slide }, "Slide created successfully", 201);
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  updateCarouselSlide = async (req, res) => {
    try {
      const { id } = req.params;
      const slide = await this.service.updateCarouselSlide(id, req.body);
      if (!slide) {
        return this.sendError(res, "Slide not found", 444);
      }
      return this.sendSuccess(res, { slide }, "Slide updated successfully");
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  deleteCarouselSlide = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteCarouselSlide(id);
      return this.sendSuccess(res, {}, "Slide deleted successfully");
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  // --- Company Logo ---
  getCompanyLogos = async (req, res) => {
    try {
      const onlyActive = req.query.active === "true";
      const logos = await this.service.getCompanyLogos(onlyActive);
      return this.sendSuccess(res, { logos });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  createCompanyLogo = async (req, res) => {
    try {
      const logo = await this.service.createCompanyLogo(req.body);
      return this.sendSuccess(res, { logo }, "Logo added successfully", 201);
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  updateCompanyLogo = async (req, res) => {
    try {
      const { id } = req.params;
      const logo = await this.service.updateCompanyLogo(id, req.body);
      if (!logo) {
        return this.sendError(res, "Logo not found", 444);
      }
      return this.sendSuccess(res, { logo }, "Logo updated successfully");
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  deleteCompanyLogo = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deleteCompanyLogo(id);
      return this.sendSuccess(res, {}, "Logo deleted successfully");
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  // --- Promo Banner ---
  getPromoBanners = async (req, res) => {
    try {
      const onlyActive = req.query.active === "true";
      const { category } = req.query;
      const banners = await this.service.getPromoBanners(onlyActive, category);
      return this.sendSuccess(res, { banners });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  };

  createPromoBanner = async (req, res) => {
    try {
      const banner = await this.service.createPromoBanner(req.body);
      return this.sendSuccess(res, { banner }, "Promo banner created successfully", 201);
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  updatePromoBanner = async (req, res) => {
    try {
      const { id } = req.params;
      const banner = await this.service.updatePromoBanner(id, req.body);
      if (!banner) {
        return this.sendError(res, "Promo banner not found", 444);
      }
      return this.sendSuccess(res, { banner }, "Promo banner updated successfully");
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };

  deletePromoBanner = async (req, res) => {
    try {
      const { id } = req.params;
      await this.service.deletePromoBanner(id);
      return this.sendSuccess(res, {}, "Promo banner deleted successfully");
    } catch (error) {
      return this.sendError(res, error.message, 555);
    }
  };
}

export const cmsController = new CMSController();

export const getDiscountBanners = cmsController.getDiscountBanners;
export const getActiveDiscountBanner = cmsController.getActiveDiscountBanner;
export const createDiscountBanner = cmsController.createDiscountBanner;
export const updateDiscountBanner = cmsController.updateDiscountBanner;
export const deleteDiscountBanner = cmsController.deleteDiscountBanner;

export const getGetOfferPromos = cmsController.getGetOfferPromos;
export const getActiveGetOfferPromo = cmsController.getActiveGetOfferPromo;
export const createGetOfferPromo = cmsController.createGetOfferPromo;
export const updateGetOfferPromo = cmsController.updateGetOfferPromo;
export const deleteGetOfferPromo = cmsController.deleteGetOfferPromo;

export const getSubscriptionNavbars = cmsController.getSubscriptionNavbars;
export const getActiveSubscriptionNavbar = cmsController.getActiveSubscriptionNavbar;
export const createSubscriptionNavbar = cmsController.createSubscriptionNavbar;
export const updateSubscriptionNavbar = cmsController.updateSubscriptionNavbar;
export const deleteSubscriptionNavbar = cmsController.deleteSubscriptionNavbar;

export const getCarouselSlides = cmsController.getCarouselSlides;
export const createCarouselSlide = cmsController.createCarouselSlide;
export const updateCarouselSlide = cmsController.updateCarouselSlide;
export const deleteCarouselSlide = cmsController.deleteCarouselSlide;

export const getCompanyLogos = cmsController.getCompanyLogos;
export const createCompanyLogo = cmsController.createCompanyLogo;
export const updateCompanyLogo = cmsController.updateCompanyLogo;
export const deleteCompanyLogo = cmsController.deleteCompanyLogo;

export const getPromoBanners = cmsController.getPromoBanners;
export const createPromoBanner = cmsController.createPromoBanner;
export const updatePromoBanner = cmsController.updatePromoBanner;
export const deletePromoBanner = cmsController.deletePromoBanner;
