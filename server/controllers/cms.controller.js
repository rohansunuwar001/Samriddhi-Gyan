import DiscountBanner from "../models/discountBanner.model.js";
import GetOfferPromo from "../models/getOfferPromo.model.js";
import SubscriptionNavbar from "../models/subscriptionNavbar.model.js";

// Helper function to deactivate all other banners/promos of the same model type if the current one is set to active.
const handleActivation = async (Model, activeId) => {
  await Model.updateMany({ _id: { $ne: activeId } }, { isActive: false });
};

// ==========================================
// 1. DISCOUNT BANNER CONTROLLERS
// ==========================================

export const createDiscountBanner = async (req, res) => {
  try {
    const { text, linkText, linkUrl, isActive, bgColor, textColor } = req.body;

    const banner = await DiscountBanner.create({
      text,
      linkText,
      linkUrl,
      isActive,
      bgColor,
      textColor
    });

    if (isActive) {
      await handleActivation(DiscountBanner, banner._id);
    }

    return res.status(201).json({
      success: true,
      message: "Discount banner created successfully.",
      banner
    });
  } catch (error) {
    console.error("Error creating discount banner:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create discount banner."
    });
  }
};

export const getDiscountBanners = async (req, res) => {
  try {
    const banners = await DiscountBanner.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      banners
    });
  } catch (error) {
    console.error("Error getting discount banners:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch discount banners."
    });
  }
};

export const updateDiscountBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, linkText, linkUrl, isActive, bgColor, textColor } = req.body;

    const banner = await DiscountBanner.findByIdAndUpdate(
      id,
      { text, linkText, linkUrl, isActive, bgColor, textColor },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Discount banner not found."
      });
    }

    if (isActive) {
      await handleActivation(DiscountBanner, banner._id);
    }

    return res.status(200).json({
      success: true,
      message: "Discount banner updated successfully.",
      banner
    });
  } catch (error) {
    console.error("Error updating discount banner:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update discount banner."
    });
  }
};

export const deleteDiscountBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await DiscountBanner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Discount banner not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Discount banner deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting discount banner:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete discount banner."
    });
  }
};

export const getActiveDiscountBanner = async (req, res) => {
  try {
    const banner = await DiscountBanner.findOne({ isActive: true });
    return res.status(200).json({
      success: true,
      banner: banner || null
    });
  } catch (error) {
    console.error("Error getting active banner:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active banner."
    });
  }
};

// ==========================================
// 2. GET OFFER PROMO CONTROLLERS
// ==========================================

export const createGetOfferPromo = async (req, res) => {
  try {
    const { badgeText, title, description, buttonText, buttonUrl, finePrint, isActive } = req.body;

    const promo = await GetOfferPromo.create({
      badgeText,
      title,
      description,
      buttonText,
      buttonUrl,
      finePrint,
      isActive
    });

    if (isActive) {
      await handleActivation(GetOfferPromo, promo._id);
    }

    return res.status(201).json({
      success: true,
      message: "Promo offer created successfully.",
      promo
    });
  } catch (error) {
    console.error("Error creating promo offer:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create promo offer."
    });
  }
};

export const getGetOfferPromos = async (req, res) => {
  try {
    const promos = await GetOfferPromo.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      promos
    });
  } catch (error) {
    console.error("Error getting promo offers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch promo offers."
    });
  }
};

export const updateGetOfferPromo = async (req, res) => {
  try {
    const { id } = req.params;
    const { badgeText, title, description, buttonText, buttonUrl, finePrint, isActive } = req.body;

    const promo = await GetOfferPromo.findByIdAndUpdate(
      id,
      { badgeText, title, description, buttonText, buttonUrl, finePrint, isActive },
      { new: true, runValidators: true }
    );

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo offer not found."
      });
    }

    if (isActive) {
      await handleActivation(GetOfferPromo, promo._id);
    }

    return res.status(200).json({
      success: true,
      message: "Promo offer updated successfully.",
      promo
    });
  } catch (error) {
    console.error("Error updating promo offer:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update promo offer."
    });
  }
};

export const deleteGetOfferPromo = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await GetOfferPromo.findByIdAndDelete(id);

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promo offer not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promo offer deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting promo offer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete promo offer."
    });
  }
};

export const getActiveGetOfferPromo = async (req, res) => {
  try {
    const promo = await GetOfferPromo.findOne({ isActive: true });
    return res.status(200).json({
      success: true,
      promo: promo || null
    });
  } catch (error) {
    console.error("Error getting active promo offer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active promo offer."
    });
  }
};

// ==========================================
// 3. SUBSCRIPTION NAVBAR CONTROLLERS
// ==========================================

export const createSubscriptionNavbar = async (req, res) => {
  try {
    const { planName, pricingText, buttonText, buttonUrl, isActive } = req.body;

    const nav = await SubscriptionNavbar.create({
      planName,
      pricingText,
      buttonText,
      buttonUrl,
      isActive
    });

    if (isActive) {
      await handleActivation(SubscriptionNavbar, nav._id);
    }

    return res.status(201).json({
      success: true,
      message: "Subscription navbar configuration created successfully.",
      navbar: nav
    });
  } catch (error) {
    console.error("Error creating subscription navbar configuration:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create subscription navbar configuration."
    });
  }
};

export const getSubscriptionNavbars = async (req, res) => {
  try {
    const navbars = await SubscriptionNavbar.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      navbars
    });
  } catch (error) {
    console.error("Error getting subscription navbars:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription navbar configurations."
    });
  }
};

export const updateSubscriptionNavbar = async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, pricingText, buttonText, buttonUrl, isActive } = req.body;

    const nav = await SubscriptionNavbar.findByIdAndUpdate(
      id,
      { planName, pricingText, buttonText, buttonUrl, isActive },
      { new: true, runValidators: true }
    );

    if (!nav) {
      return res.status(404).json({
        success: false,
        message: "Subscription navbar configuration not found."
      });
    }

    if (isActive) {
      await handleActivation(SubscriptionNavbar, nav._id);
    }

    return res.status(200).json({
      success: true,
      message: "Subscription navbar configuration updated successfully.",
      navbar: nav
    });
  } catch (error) {
    console.error("Error updating subscription navbar configuration:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update subscription navbar configuration."
    });
  }
};

export const deleteSubscriptionNavbar = async (req, res) => {
  try {
    const { id } = req.params;
    const nav = await SubscriptionNavbar.findByIdAndDelete(id);

    if (!nav) {
      return res.status(404).json({
        success: false,
        message: "Subscription navbar configuration not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription navbar configuration deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting subscription navbar configuration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subscription navbar configuration."
    });
  }
};

export const getActiveSubscriptionNavbar = async (req, res) => {
  try {
    const navbar = await SubscriptionNavbar.findOne({ isActive: true });
    return res.status(200).json({
      success: true,
      navbar: navbar || null
    });
  } catch (error) {
    console.error("Error getting active subscription navbar:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active subscription navbar configuration."
    });
  }
};
