import Category from '../models/category.model.js';
import { slugify } from '../utils/slugify.js';
import { upsertSearchSuggestion } from '../helpers/searchSuggestion.helper.js';

const buildCategoryTree = (categories) => {
  const byParent = new Map();

  categories.forEach((category) => {
    const parentId = category.parent?._id?.toString() || category.parent?.toString() || 'root';
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push(category);
  });

  const attachChildren = (category) => ({
    ...category,
    children: (byParent.get(category._id.toString()) || []).map(attachChildren),
  });

  return (byParent.get('root') || []).map(attachChildren);
};

const getPopulatedCategories = async () => {
  const categories = await Category.find({})
    .populate('parent', 'name slug parent')
    .sort({ name: 1 })
    .lean();

  return {
    categories,
    categoryTree: buildCategoryTree(categories),
  };
};

export const createCategory = async (req, res) => {
  try {
    const { name, parent = null } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    let parentCategory = null;
    if (parent) {
      parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({ success: false, message: 'Parent category not found.' });
      }
      if (parentCategory.parent) {
        return res.status(400).json({ success: false, message: 'Only one child level is supported. Select a parent category, not a child category.' });
      }
    }

    const slug = slugify(trimmedName);
    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
    }

    const newCategory = await Category.create({
      name: trimmedName,
      slug,
      parent: parentCategory?._id || null,
    });

    await upsertSearchSuggestion(trimmedName);

    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const payload = await getPopulatedCategories();
    res.status(200).json({ success: true, ...payload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Category name cannot be empty.' });
      }

      const slug = slugify(trimmedName);
      const duplicate = await Category.findOne({ slug, _id: { $ne: category._id } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
      }

      category.name = trimmedName;
      category.slug = slug;
    }

    if (parent !== undefined) {
      if (!parent) {
        category.parent = null;
      } else {
        if (parent === category._id.toString()) {
          return res.status(400).json({ success: false, message: 'A category cannot be its own parent.' });
        }

        const childCount = await Category.countDocuments({ parent: category._id });
        if (childCount > 0) {
          return res.status(400).json({ success: false, message: 'A parent category with children cannot be moved under another parent.' });
        }

        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
          return res.status(404).json({ success: false, message: 'Parent category not found.' });
        }
        if (parentCategory.parent) {
          return res.status(400).json({ success: false, message: 'Only one child level is supported. Select a parent category, not a child category.' });
        }

        category.parent = parentCategory._id;
      }
    }

    await category.save();

    if (name !== undefined) {
      await upsertSearchSuggestion(category.name);
    }

    const updatedCategory = await Category.findById(category._id).populate('parent', 'name slug parent');
    res.status(200).json({ success: true, category: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const childCount = await Category.countDocuments({ parent: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({ success: false, message: 'Delete child categories before deleting this parent category.' });
    }

    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
