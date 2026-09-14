// server/service/cms.service.js

import { CarouselSlide } from "../models/carouselSlide.model.js";
import { CompanyLogo } from "../models/companyLogo.model.js";
import { PromoBanner } from "../models/promoBanner.model.js";
import DiscountBanner from "../models/discountBanner.model.js";
import GetOfferPromo from "../models/getOfferPromo.model.js";
import SubscriptionNavbar from "../models/subscriptionNavbar.model.js";
import { BaseService } from "../core/base.service.js";

export class CMSService extends BaseService {
  constructor() {
    super(null);
  }

  // --- Discount Banner ---
  async getDiscountBanners() {
    return await DiscountBanner.find().sort({ createdAt: -1 });
  }

  async getActiveDiscountBanner() {
    return await DiscountBanner.findOne({ isActive: true }).sort({ updatedAt: -1 });
  }

  async createDiscountBanner(bannerData) {
    if (bannerData.isActive === true || bannerData.isActive === "true") {
      await DiscountBanner.updateMany({}, { isActive: false });
    }
    return await DiscountBanner.create(bannerData);
  }

  async updateDiscountBanner(id, bannerData) {
    if (bannerData.isActive === true || bannerData.isActive === "true") {
      await DiscountBanner.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    return await DiscountBanner.findByIdAndUpdate(id, bannerData, { new: true });
  }

  async deleteDiscountBanner(id) {
    return await DiscountBanner.findByIdAndDelete(id);
  }

  // --- Get Offer Promo ---
  async getGetOfferPromos() {
    return await GetOfferPromo.find().sort({ createdAt: -1 });
  }

  async getActiveGetOfferPromo() {
    return await GetOfferPromo.findOne({ isActive: true }).sort({ updatedAt: -1 });
  }

  async createGetOfferPromo(promoData) {
    if (promoData.isActive === true || promoData.isActive === "true") {
      await GetOfferPromo.updateMany({}, { isActive: false });
    }
    return await GetOfferPromo.create(promoData);
  }

  async updateGetOfferPromo(id, promoData) {
    if (promoData.isActive === true || promoData.isActive === "true") {
      await GetOfferPromo.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    return await GetOfferPromo.findByIdAndUpdate(id, promoData, { new: true });
  }

  async deleteGetOfferPromo(id) {
    return await GetOfferPromo.findByIdAndDelete(id);
  }

  // --- Subscription Navbar ---
  async getSubscriptionNavbars() {
    return await SubscriptionNavbar.find().sort({ createdAt: -1 });
  }

  async getActiveSubscriptionNavbar() {
    return await SubscriptionNavbar.findOne({ isActive: true }).sort({ updatedAt: -1 });
  }

  async createSubscriptionNavbar(navData) {
    if (navData.isActive === true || navData.isActive === "true") {
      await SubscriptionNavbar.updateMany({}, { isActive: false });
    }
    return await SubscriptionNavbar.create(navData);
  }

  async updateSubscriptionNavbar(id, navData) {
    if (navData.isActive === true || navData.isActive === "true") {
      await SubscriptionNavbar.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    return await SubscriptionNavbar.findByIdAndUpdate(id, navData, { new: true });
  }

  async deleteSubscriptionNavbar(id) {
    return await SubscriptionNavbar.findByIdAndDelete(id);
  }

  // --- Carousel Slide ---
  async getCarouselSlides(onlyActive = false) {
    const query = onlyActive ? { isActive: true } : {};
    return await CarouselSlide.find(query).sort({ order: 1, createdAt: -1 });
  }

  async createCarouselSlide(slideData) {
    return await CarouselSlide.create(slideData);
  }

  async updateCarouselSlide(id, slideData) {
    return await CarouselSlide.findByIdAndUpdate(id, slideData, { new: true });
  }

  async deleteCarouselSlide(id) {
    return await CarouselSlide.findByIdAndDelete(id);
  }

  // --- Company Logo ---
  async getCompanyLogos(onlyActive = false) {
    const query = onlyActive ? { isActive: true } : {};
    return await CompanyLogo.find(query).sort({ order: 1, createdAt: -1 });
  }

  async createCompanyLogo(logoData) {
    return await CompanyLogo.create(logoData);
  }

  async updateCompanyLogo(id, logoData) {
    return await CompanyLogo.findByIdAndUpdate(id, logoData, { new: true });
  }

  async deleteCompanyLogo(id) {
    return await CompanyLogo.findByIdAndDelete(id);
  }

  // --- Promo Banner ---
  async getPromoBanners(onlyActive = false, category = "") {
    const query = onlyActive ? { isActive: true } : {};
    const banners = await PromoBanner.find(query).sort({ createdAt: -1 });

    if (onlyActive) {
      if (category) {
        const matched = banners.find(
          (b) => b.categoryName && b.categoryName.trim().toLowerCase() === category.trim().toLowerCase()
        );
        if (matched) {
          return [matched, ...banners.filter((b) => b._id.toString() !== matched._id.toString())];
        }
      }
      const generalBanner = banners.find((b) => !b.categoryName || b.categoryName.trim() === "");
      if (generalBanner) {
        return [generalBanner, ...banners.filter((b) => b._id.toString() !== generalBanner._id.toString())];
      }
    }
    return banners;
  }

  async createPromoBanner(promoData) {
    return await PromoBanner.create(promoData);
  }

  async updatePromoBanner(id, promoData) {
    return await PromoBanner.findByIdAndUpdate(id, promoData, { new: true });
  }

  async deletePromoBanner(id) {
    return await PromoBanner.findByIdAndDelete(id);
  }
}

export const cmsService = new CMSService();

// Backward-compatible named exports
export const getDiscountBannersService = cmsService.getDiscountBanners.bind(cmsService);
export const getActiveDiscountBannerService = cmsService.getActiveDiscountBanner.bind(cmsService);
export const createDiscountBannerService = cmsService.createDiscountBanner.bind(cmsService);
export const updateDiscountBannerService = cmsService.updateDiscountBanner.bind(cmsService);
export const deleteDiscountBannerService = cmsService.deleteDiscountBanner.bind(cmsService);

export const getGetOfferPromosService = cmsService.getGetOfferPromos.bind(cmsService);
export const getActiveGetOfferPromoService = cmsService.getActiveGetOfferPromo.bind(cmsService);
export const createGetOfferPromoService = cmsService.createGetOfferPromo.bind(cmsService);
export const updateGetOfferPromoService = cmsService.updateGetOfferPromo.bind(cmsService);
export const deleteGetOfferPromoService = cmsService.deleteGetOfferPromo.bind(cmsService);

export const getSubscriptionNavbarsService = cmsService.getSubscriptionNavbars.bind(cmsService);
export const getActiveSubscriptionNavbarService = cmsService.getActiveSubscriptionNavbar.bind(cmsService);
export const createSubscriptionNavbarService = cmsService.createSubscriptionNavbar.bind(cmsService);
export const updateSubscriptionNavbarService = cmsService.updateSubscriptionNavbar.bind(cmsService);
export const deleteSubscriptionNavbarService = cmsService.deleteSubscriptionNavbar.bind(cmsService);

export const getCarouselSlidesService = cmsService.getCarouselSlides.bind(cmsService);
export const createCarouselSlideService = cmsService.createCarouselSlide.bind(cmsService);
export const updateCarouselSlideService = cmsService.updateCarouselSlide.bind(cmsService);
export const deleteCarouselSlideService = cmsService.deleteCarouselSlide.bind(cmsService);

export const getCompanyLogosService = cmsService.getCompanyLogos.bind(cmsService);
export const createCompanyLogoService = cmsService.createCompanyLogo.bind(cmsService);
export const updateCompanyLogoService = cmsService.updateCompanyLogo.bind(cmsService);
export const deleteCompanyLogoService = cmsService.deleteCompanyLogo.bind(cmsService);

export const getPromoBannersService = cmsService.getPromoBanners.bind(cmsService);
export const createPromoBannerService = cmsService.createPromoBanner.bind(cmsService);
export const updatePromoBannerService = cmsService.updatePromoBanner.bind(cmsService);
export const deletePromoBannerService = cmsService.deletePromoBanner.bind(cmsService);
