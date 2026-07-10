import { CarouselSlide } from "../models/carouselSlide.model.js";
import { CompanyLogo } from "../models/companyLogo.model.js";
import { PromoBanner } from "../models/promoBanner.model.js";
import DiscountBanner from "../models/discountBanner.model.js";

// --- Discount Banner Service Functions ---

export const getActiveDiscountBannerService = async () => {
  return await DiscountBanner.findOne({ isActive: true }).sort({ updatedAt: -1 });
};

// --- Carousel Slide Service Functions ---

export const getCarouselSlidesService = async (onlyActive = false) => {
  const query = onlyActive ? { isActive: true } : {};
  return await CarouselSlide.find(query).sort({ order: 1, createdAt: -1 });
};

export const createCarouselSlideService = async (slideData) => {
  return await CarouselSlide.create(slideData);
};

export const updateCarouselSlideService = async (id, slideData) => {
  return await CarouselSlide.findByIdAndUpdate(id, slideData, { returnDocument: 'after' });
};

export const deleteCarouselSlideService = async (id) => {
  return await CarouselSlide.findByIdAndDelete(id);
};

// --- Company Logo Service Functions ---

export const getCompanyLogosService = async (onlyActive = false) => {
  const query = onlyActive ? { isActive: true } : {};
  return await CompanyLogo.find(query).sort({ order: 1, createdAt: -1 });
};

export const createCompanyLogoService = async (logoData) => {
  return await CompanyLogo.create(logoData);
};

export const updateCompanyLogoService = async (id, logoData) => {
  return await CompanyLogo.findByIdAndUpdate(id, logoData, { returnDocument: 'after' });
};

export const deleteCompanyLogoService = async (id) => {
  return await CompanyLogo.findByIdAndDelete(id);
};

// --- Promo Banner Service Functions ---

export const getPromoBannersService = async (onlyActive = false, category = "") => {
  const query = onlyActive ? { isActive: true } : {};
  const banners = await PromoBanner.find(query).sort({ createdAt: -1 });

  if (onlyActive) {
    if (category) {
      const matched = banners.find(
        (b) => b.categoryName && b.categoryName.trim().toLowerCase() === category.trim().toLowerCase()
      );
      if (matched) {
        // Put matched banner at the beginning
        return [matched, ...banners.filter((b) => b._id.toString() !== matched._id.toString())];
      }
    }
    // Fallback to the general banner (empty categoryName) if no category match or no category provided
    const generalBanner = banners.find((b) => !b.categoryName || b.categoryName.trim() === "");
    if (generalBanner) {
      return [generalBanner, ...banners.filter((b) => b._id.toString() !== generalBanner._id.toString())];
    }
  }
  return banners;
};

export const createPromoBannerService = async (promoData) => {
  return await PromoBanner.create(promoData);
};

export const updatePromoBannerService = async (id, promoData) => {
  return await PromoBanner.findByIdAndUpdate(id, promoData, { returnDocument: 'after' });
};

export const deletePromoBannerService = async (id) => {
  return await PromoBanner.findByIdAndDelete(id);
};
