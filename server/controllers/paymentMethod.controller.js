// server/controllers/paymentMethod.controller.js

import { PaymentMethod } from "../models/paymentMethod.model.js";

/**
 * GET /api/v1/payment-methods
 * Retrieve all saved payment methods for the authenticated user.
 */
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;
    const methods = await PaymentMethod.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, methods });
  } catch (error) {
    console.error("getPaymentMethods error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve payment methods" });
  }
};

/**
 * POST /api/v1/payment-methods
 * Save a new payment method (eSewa ID or Card details).
 */
export const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, esewaId, cardholderName, cardNumber, expiryDate } = req.body;

    if (!type || !['esewa', 'card'].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid payment method type" });
    }

    let payload = { user: userId, type };

    if (type === 'esewa') {
      if (!esewaId) {
        return res.status(400).json({ success: false, message: "eSewa ID is required" });
      }
      payload.esewaId = esewaId;
    } else {
      if (!cardholderName || !cardNumber || !expiryDate) {
        return res.status(400).json({ success: false, message: "Card details (name, number, expiry) are required" });
      }
      // Clean and mask the card number (e.g., **** **** **** 4242)
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 12) {
        return res.status(400).json({ success: false, message: "Invalid card number length" });
      }
      const lastFour = cleanNum.slice(-4);
      payload.cardNumber = `•••• •••• •••• ${lastFour}`;
      payload.cardholderName = cardholderName;
      payload.expiryDate = expiryDate;

      // Determine card type roughly
      if (cleanNum.startsWith('4')) {
        payload.cardType = 'Visa';
      } else if (cleanNum.startsWith('5')) {
        payload.cardType = 'Mastercard';
      } else {
        payload.cardType = 'Card';
      }
    }

    const newMethod = await PaymentMethod.create(payload);
    return res.status(201).json({ success: true, method: newMethod });
  } catch (error) {
    console.error("addPaymentMethod error:", error);
    return res.status(500).json({ success: false, message: "Failed to save payment method" });
  }
};

/**
 * DELETE /api/v1/payment-methods/:id
 * Delete a saved payment method.
 */
export const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const methodId = req.params.id;

    const method = await PaymentMethod.findById(methodId);
    if (!method) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    if (method.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this payment method" });
    }

    await PaymentMethod.findByIdAndDelete(methodId);
    return res.status(200).json({ success: true, message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("deletePaymentMethod error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete payment method" });
  }
};
