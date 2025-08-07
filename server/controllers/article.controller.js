// --- FIX: Corrected typos in import paths ---


import Article from "../models/article.model.js";
import Author from "../models/author.model.js";
import Category from "../models/category.model.js";


// CREATE a new article
export const createArticle = async (req, res) => {
  try {
    const { title, featuredImage, content, author, category, popular } = req.body;

    // Validate that author and category IDs exist
    const authorExists = await Author.findById(author);
    const categoryExists = await Category.findById(category);

    if (!authorExists || !categoryExists) {
      return res.status(404).json({ message: 'Author or Category not found.' });
    }

    const newArticle = new Article({ title, featuredImage, content, author, category, popular });
    await newArticle.save(); // The pre-save hook in your model will automatically create the slug
    res.status(201).json({ success: true, article: newArticle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while creating article.', error: error.message });
  }
};

// READ all articles (for the main blog page)
export const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({})
      .populate('author', 'name avatar') // Only get author's name and avatar
      .populate('category', 'name slug')   // Only get category's name and slug
      .sort({ createdAt: -1 }) // Show newest first
      .select('title slug category author popular createdAt'); // Select only needed fields for list view

    res.status(200).json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching articles.', error: error.message });
  }
};

// READ a single article by SLUG (for the detailed view)
export const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug })
      .populate('author', 'name avatar bio') // Get full author details for bio box
      .populate('category', 'name slug');

    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching article.', error: error.message });
  }
};

// --- IMPROVEMENT: Refactored to trigger pre-save hooks for slug updates ---
// UPDATE an article by ID
export const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    // Update the fields from the request body
    Object.assign(article, req.body);

    // Calling .save() will trigger the pre('save') hook in your model,
    // which automatically updates the slug if the title has changed.
    const updatedArticle = await article.save();

    res.status(200).json({ success: true, article: updatedArticle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while updating article.', error: error.message });
  }
};

// DELETE an article by ID
export const deleteArticle = async (req, res) => {
  try {
    const deletedArticle = await Article.findByIdAndDelete(req.params.id);
    if (!deletedArticle) {
      return res.status(404).json({ message: 'Article not found.' });
    }
    res.status(200).json({ success: true, message: 'Article deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while deleting article.', error: error.message });
  }
};