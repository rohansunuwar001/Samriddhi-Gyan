import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

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

// Auto-generate a unique slug from the title using the shared slugify utility.
// This keeps slug formatting identical across courses, articles, authors, and categories.
articleSchema.pre("validate", async function () {
  if (this.isNew || this.isModified("title")) {
    const baseSlug = slugify(this.title);
    let candidate = baseSlug;
    let suffix = 1;

    const Article = this.constructor;

    while (
      await Article.exists({
        slug: candidate,
        _id: { $ne: this._id },
      })
    ) {
      suffix++;
      candidate = `${baseSlug}-${suffix}`;
    }

    this.slug = candidate;
  }
});

const Article = mongoose.model('Article', articleSchema);

export default Article;