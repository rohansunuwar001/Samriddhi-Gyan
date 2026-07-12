import Author from "../models/author.model.js";
import { slugify } from "../utils/slugify.js";


// CREATE a new author
export const createAuthor = async (req, res) => {
  try {
    const { name, avatar, bio } = req.body;
    if (!name || !avatar) {
      return res.status(400).json({ message: 'Name and avatar are required.' });
    }

    const slug = slugify(name); // Generate a URL-friendly slug
    const authorExists = await Author.findOne({ slug });
    if (authorExists) {
      return res.status(409).json({ message: 'An author with this name already exists.' });
    }

    const newAuthor = new Author({ name, slug, avatar, bio });
    await newAuthor.save();
    res.status(201).json({ success: true, author: newAuthor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// READ all authors
export const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, authors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// READ a single author by ID
export const getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }
    res.status(200).json({ success: true, author });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// UPDATE an author by ID
export const updateAuthor = async (req, res) => {
  try {
    const { name, avatar, bio } = req.body;
    const updateData = { name, avatar, bio };
    if (name) {
      updateData.slug = slugify(name); // Update slug if name changes
    }

    const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updatedAuthor) {
      return res.status(404).json({ message: 'Author not found.' });
    }
    res.status(200).json({ success: true, author: updatedAuthor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// DELETE an author by ID
export const deleteAuthor = async (req, res) => {
  try {
    const deletedAuthor = await Author.findByIdAndDelete(req.params.id);
    if (!deletedAuthor) {
      return res.status(404).json({ message: 'Author not found.' });
    }
    // Note: This doesn't delete the author's articles. You might want to add logic
    // to re-assign or delete articles associated with this author.
    res.status(200).json({ success: true, message: 'Author deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};