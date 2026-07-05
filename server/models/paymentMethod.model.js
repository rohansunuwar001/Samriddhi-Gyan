import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['esewa', 'card'],
    required: true,
  },
  esewaId: {
    type: String,
    trim: true,
  },
  cardholderName: {
    type: String,
    trim: true,
  },
  cardNumber: {
    type: String,
    trim: true,
  },
  expiryDate: {
    type: String,
    trim: true,
  },
  cardType: {
    type: String,
    default: 'Card',
  }
}, { timestamps: true });

export const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
