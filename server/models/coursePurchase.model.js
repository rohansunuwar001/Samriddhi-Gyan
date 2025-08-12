// src/models/order.model.js

import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
    // A unique, human-readable identifier for the order if you need one (e.g., LMS-ORD-1001)
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    // The user who is making the purchase
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // An array of the courses purchased in this single transaction
    courses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        // IMPORTANT: Lock the price at the moment of purchase.
        // This protects your records if you change the course price later.
        priceAtPurchase: {
            type: Number,
            required: true
        }
    }],
    // The final amount that was charged to the customer
    totalAmount: {
        type: Number,
        required: true
    },

    // --- Core Payment Gateway Logic ---
    
    // The gateway used for this transaction
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Stripe', 'eSewa'] // Add others like 'PayPal' if needed
    },
    // The overall status of the transaction
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    // A structured object to store specific transaction IDs from each gateway
    paymentDetails: {
        // Stripe's Checkout Session ID (e.g., "cs_...")
        stripeSessionId: {
            type: String,
            trim: true
        },
        // eSewa's reference ID (e.g., "000AGB1")
        eSewaRefId: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

export const CoursePurchase = mongoose.model('CoursePurchase', purchaseSchema);