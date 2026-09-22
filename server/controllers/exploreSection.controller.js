import ExploreSectionItem from "../models/exploreSection.model.js";

// GET /api/v1/explore-sections - Public endpoint for Navbar Explore Menu
export const getPublicExploreSections = async (req, res) => {
  try {
    const items = await ExploreSectionItem.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("getPublicExploreSections error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching explore sections",
      error: error.message,
    });
  }
};

// GET /api/v1/explore-sections/admin - Admin endpoint to list all items
export const getAllExploreSectionsAdmin = async (req, res) => {
  try {
    const items = await ExploreSectionItem.find({})
      .sort({ section: 1, order: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("getAllExploreSectionsAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching admin explore sections",
      error: error.message,
    });
  }
};

// POST /api/v1/explore-sections - Admin create item
export const createExploreSectionItem = async (req, res) => {
  try {
    const {
      section,
      title,
      badgeOrIcon,
      order,
      isActive,
      column2Header,
      column2Items,
    } = req.body;

    if (!section || !["featured", "goal"].includes(section)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section. Must be 'featured' or 'goal'.",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required.",
      });
    }

    const newItem = new ExploreSectionItem({
      section,
      title: title.trim(),
      badgeOrIcon: badgeOrIcon || "",
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      column2Header: column2Header ? column2Header.trim() : "",
      column2Items: Array.isArray(column2Items) ? column2Items : [],
    });

    await newItem.save();

    return res.status(201).json({
      success: true,
      message: "Explore menu item created successfully",
      item: newItem,
    });
  } catch (error) {
    console.error("createExploreSectionItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating explore section item",
      error: error.message,
    });
  }
};

// PUT /api/v1/explore-sections/:id - Admin update item
export const updateExploreSectionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      section,
      title,
      badgeOrIcon,
      order,
      isActive,
      column2Header,
      column2Items,
    } = req.body;

    const item = await ExploreSectionItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Explore section item not found",
      });
    }

    if (section && ["featured", "goal"].includes(section)) {
      item.section = section;
    }
    if (title && title.trim()) {
      item.title = title.trim();
    }
    if (badgeOrIcon !== undefined) {
      item.badgeOrIcon = badgeOrIcon;
    }
    if (order !== undefined) {
      item.order = Number(order);
    }
    if (isActive !== undefined) {
      item.isActive = Boolean(isActive);
    }
    if (column2Header !== undefined) {
      item.column2Header = column2Header.trim();
    }
    if (Array.isArray(column2Items)) {
      item.column2Items = column2Items;
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Explore menu item updated successfully",
      item,
    });
  } catch (error) {
    console.error("updateExploreSectionItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating explore section item",
      error: error.message,
    });
  }
};

// DELETE /api/v1/explore-sections/:id - Admin delete item
export const deleteExploreSectionItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ExploreSectionItem.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Explore section item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Explore menu item deleted successfully",
    });
  } catch (error) {
    console.error("deleteExploreSectionItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting explore section item",
      error: error.message,
    });
  }
};
