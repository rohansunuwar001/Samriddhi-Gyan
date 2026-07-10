import {
  getCarouselSlidesService,
  createCarouselSlideService,
  updateCarouselSlideService,
  deleteCarouselSlideService,
  getCompanyLogosService,
  createCompanyLogoService,
  updateCompanyLogoService,
  deleteCompanyLogoService,
  getPromoBannersService,
  createPromoBannerService,
  updatePromoBannerService,
  deletePromoBannerService,
} from "../service/cms.service.js";

// --- Carousel Slide Controllers ---

export const getCarouselSlides = async (req, res) => {
  try {
    const onlyActive = req.query.active === "true";
    const slides = await getCarouselSlidesService(onlyActive);
    return res.status(200).json({ success: true, slides });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCarouselSlide = async (req, res) => {
  try {
    const slide = await createCarouselSlideService(req.body);
    return res.status(201).json({ success: true, message: "Slide created successfully", slide });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

export const updateCarouselSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await updateCarouselSlideService(id, req.body);
    if (!slide) {
      return res.status(444).json({ success: false, message: "Slide not found" });
    }
    return res.status(200).json({ success: true, message: "Slide updated successfully", slide });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

export const deleteCarouselSlide = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteCarouselSlideService(id);
    return res.status(200).json({ success: true, message: "Slide deleted successfully" });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

// --- Company Logo Controllers ---

export const getCompanyLogos = async (req, res) => {
  try {
    const onlyActive = req.query.active === "true";
    const logos = await getCompanyLogosService(onlyActive);
    return res.status(200).json({ success: true, logos });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompanyLogo = async (req, res) => {
  try {
    const logo = await createCompanyLogoService(req.body);
    return res.status(201).json({ success: true, message: "Logo added successfully", logo });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

export const updateCompanyLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const logo = await updateCompanyLogoService(id, req.body);
    if (!logo) {
      return res.status(444).json({ success: false, message: "Logo not found" });
    }
    return res.status(200).json({ success: true, message: "Logo updated successfully", logo });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

export const deleteCompanyLogo = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteCompanyLogoService(id);
    return res.status(200).json({ success: true, message: "Logo deleted successfully" });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

// --- Promo Banner Controllers ---

export const getPromoBanners = async (req, res) => {
  try {
    const onlyActive = req.query.active === "true";
    const { category } = req.query;
    const banners = await getPromoBannersService(onlyActive, category);
    return res.status(200).json({ success: true, banners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPromoBanner = async (req, res) => {
  try {
    const banner = await createPromoBannerService(req.body);
    return res.status(201).json({ success: true, message: "Promo banner created successfully", banner });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

export const updatePromoBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await updatePromoBannerService(id, req.body);
    if (!banner) {
      return res.status(444).json({ success: false, message: "Promo banner not found" });
    }
    return res.status(200).json({ success: true, message: "Promo banner updated successfully", banner });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};

export const deletePromoBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await deletePromoBannerService(id);
    return res.status(200).json({ success: true, message: "Promo banner deleted successfully" });
  } catch (error) {
    return res.status(555).json({ success: false, message: error.message });
  }
};
