import mongoose from 'mongoose';

const discountBannerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Banner text is required.'],
    trim: true,
  },
  linkText: {
    type: String,
    trim: true,
  },
  linkUrl: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  bgColor: {
    type: String,
    default: '#dbf5f6',
  },
  textColor: {
    type: String,
    default: '#1c1d1f',
  }
}, {
  timestamps: true,
});

const DiscountBanner = mongoose.model('DiscountBanner', discountBannerSchema);
export default DiscountBanner;
