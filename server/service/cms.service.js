import { CarouselSlide } from "../models/carouselSlide.model.js";
import { CompanyLogo } from "../models/companyLogo.model.js";
import { PromoBanner } from "../models/promoBanner.model.js";
import DiscountBanner from "../models/discountBanner.model.js";
import GetOfferPromo from "../models/getOfferPromo.model.js";
import SubscriptionNavbar from "../models/subscriptionNavbar.model.js";

// --- Discount Banner Service Functions ---

export const getDiscountBannersService = async () => {
  return await DiscountBanner.find().sort({ createdAt: -1 });
};

export const getActiveDiscountBannerService = async () => {
  return await DiscountBanner.findOne({ isActive: true }).sort({ updatedAt: -1 });
};

export const createDiscountBannerService = async (bannerData) => {
  if (bannerData.isActive === true || bannerData.isActive === "true") {
    await DiscountBanner.updateMany({}, { isActive: false });
  }
  return await DiscountBanner.create(bannerData);
};

export const updateDiscountBannerService = async (id, bannerData) => {
  if (bannerData.isActive === true || bannerData.isActive === "true") {
    await DiscountBanner.updateMany({ _id: { $ne: id } }, { isActive: false });
  }
  return await DiscountBanner.findByIdAndUpdate(id, bannerData, { new: true });
};

export const deleteDiscountBannerService = async (id) => {
  return await DiscountBanner.findByIdAndDelete(id);
};

// --- Get Offer Promo Service Functions ---

export const getGetOfferPromosService = async () => {
  return await GetOfferPromo.find().sort({ createdAt: -1 });
};

export const getActiveGetOfferPromoService = async () => {
  return await GetOfferPromo.findOne({ isActive: true }).sort({ updatedAt: -1 });
};

export const createGetOfferPromoService = async (promoData) => {
  if (promoData.isActive === true || promoData.isActive === "true") {
    await GetOfferPromo.updateMany({}, { isActive: false });
  }
  return await GetOfferPromo.create(promoData);
};

export const updateGetOfferPromoService = async (id, promoData) => {
  if (promoData.isActive === true || promoData.isActive === "true") {
    await GetOfferPromo.updateMany({ _id: { $ne: id } }, { isActive: false });
  }
  return await GetOfferPromo.findByIdAndUpdate(id, promoData, { new: true });
};

export const deleteGetOfferPromoService = async (id) => {
  return await GetOfferPromo.findByIdAndDelete(id);
};

// --- Subscription Navbar Service Functions ---

export const getSubscriptionNavbarsService = async () => {
  return await SubscriptionNavbar.find().sort({ createdAt: -1 });
};

export const getActiveSubscriptionNavbarService = async () => {
  return await SubscriptionNavbar.findOne({ isActive: true }).sort({ updatedAt: -1 });
};

export const createSubscriptionNavbarService = async (navData) => {
  if (navData.isActive === true || navData.isActive === "true") {
    await SubscriptionNavbar.updateMany({}, { isActive: false });
  }
  return await SubscriptionNavbar.create(navData);
};

export const updateSubscriptionNavbarService = async (id, navData) => {
  if (navData.isActive === true || navData.isActive === "true") {
    await SubscriptionNavbar.updateMany({ _id: { $ne: id } }, { isActive: false });
  }
  return await SubscriptionNavbar.findByIdAndUpdate(id, navData, { new: true });
};

export const deleteSubscriptionNavbarService = async (id) => {
  return await SubscriptionNavbar.findByIdAndDelete(id);
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
  return await CarouselSlide.findByIdAndUpdate(id, slideData, { new: true });
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
  return await CompanyLogo.findByIdAndUpdate(id, logoData, { new: true });
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
  return await PromoBanner.findByIdAndUpdate(id, promoData, { new: true });
};

export const deletePromoBannerService = async (id) => {
  return await PromoBanner.findByIdAndDelete(id);
};
