import Category from '../models/category.model.js';
import { slugify } from '../utils/slugify.js';

// CREATE a new category
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }
    
    const slug = slugify(name);
    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
        return res.status(409).json({ message: 'A category with this name already exists.' });
    }

    const newCategory = new Category({ name, slug });
    await newCategory.save();
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// READ all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// UPDATE a category by ID
export const updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const updateData = { name };
        if (name) {
            updateData.slug = slugify(name);
        }
        
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(200).json({ success: true, category: updatedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// DELETE a category by ID
export const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(200).json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};