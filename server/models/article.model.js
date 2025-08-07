import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required.'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Article slug is required.'],
    unique: true,
    lowercase: true,
    index: true, // Improves query performance for finding articles by slug
  },
  featuredImage: {
    type: String, // URL to the main image for the article
    required: [true, 'Featured image is required.'],
  },
  // The structured content for the article body
  content: [
    {
      type: {
        type: String,
        required: true,
        enum: ['heading', 'paragraph', 'list', 'image'], // Defines allowed content types
      },
      text: {
        type: String,
      },
      level: {
        type: Number, // For headings (e.g., 2 for <h2>, 3 for <h3>)
      },
      // You could add more fields for other types, e.g., 'items' for a list type
    }
  ],
  // --- RELATIONSHIPS ---
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author', // This creates a reference to a document in the 'Author' collection
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // This creates a reference to a document in the 'Category' collection
    required: true,
  },
  // --- METADATA ---
  popular: {
    type: Boolean,
    default: false,
  },
}, {
  // Using timestamps automatically gives you 'createdAt' and 'updatedAt'.
  // The 'updatedAt' field is perfect for your "Page Last Updated" feature.
  timestamps: true,
});

// Best Practice: Add a pre-save hook to auto-generate the slug from the title
// This ensures slugs are consistent.
articleSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')        // Replace spaces with hyphens
      .trim();
  }
  next();
});

const Article = mongoose.model('Article', articleSchema);

export default Article;