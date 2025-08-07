import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Author name is required.'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Author slug is required.'],
    unique: true,
    lowercase: true,
    // A slug is a URL-friendly version of the name, e.g., "jennifer-kim"
  },
  avatar: {
    type: String, // URL to the author's profile picture
    required: [true, 'Author avatar is required.'],
  },
  bio: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

const Author = mongoose.model('Author', authorSchema);

export default Author;