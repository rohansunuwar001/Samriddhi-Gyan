import mongoose from 'mongoose';

const subscriptionNavbarSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: [true, 'Plan name is required.'],
    trim: true,
  },
  pricingText: {
    type: String,
    required: [true, 'Pricing text is required.'],
    trim: true,
  },
  buttonText: {
    type: String,
    default: 'Start subscription',
    trim: true,
  },
  buttonUrl: {
    type: String,
    default: '/subscribe',
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

const SubscriptionNavbar = mongoose.model('SubscriptionNavbar', subscriptionNavbarSchema);
export default SubscriptionNavbar;
