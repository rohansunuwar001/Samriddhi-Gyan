import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required.'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Topic slug is required.'],
    unique: true,
    lowercase: true,
  },
  type: {
    type: String,
    enum: ['topic', 'certification'],
    default: 'topic',
  },
  description: {
    type: String,
    default: '',
  },
  bannerTitle: {
    type: String,
    default: '',
  },
  logoUrl: {
    type: String,
    default: '',
  },
  numLearners: {
    type: Number,
    default: 0,
  },
  handsOnPracticeCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  relatedTopics: {
    type: [String],
    default: [],
  },
  parentCategory: {
    type: String, // String matching a category or subcategory name, e.g. "Web Development" or "Amazon Web Services (AWS) Certifications"
    default: '',
  },
}, {
  timestamps: true,
});

// index on slug is already created by unique: true field definition above.

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
