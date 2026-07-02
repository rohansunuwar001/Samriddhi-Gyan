import mongoose from 'mongoose';

const getOfferPromoSchema = new mongoose.Schema({
  badgeText: {
    type: String,
    trim: true,
    default: 'Personal Plan',
  },
  title: {
    type: String,
    required: [true, 'Promo title is required.'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Promo description is required.'],
    trim: true,
  },
  buttonText: {
    type: String,
    default: 'Get the offer',
    trim: true,
  },
  buttonUrl: {
    type: String,
    default: '/subscribe',
    trim: true,
  },
  finePrint: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

const GetOfferPromo = mongoose.model('GetOfferPromo', getOfferPromoSchema);
export default GetOfferPromo;
