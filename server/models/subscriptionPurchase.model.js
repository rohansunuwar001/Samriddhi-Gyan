import mongoose from "mongoose";

const subscriptionPurchaseSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planName: {
        type: String,
        required: true,
        default: 'Personal Plan'
    },
    amount: {
        type: Number,
        required: true
    },
    durationMonths: {
        type: Number,
        required: true,
        default: 1
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Stripe', 'eSewa']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentDetails: {
        stripeSessionId: {
            type: String,
            trim: true
        },
        eSewaRefId: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true
});

export const SubscriptionPurchase = mongoose.model('SubscriptionPurchase', subscriptionPurchaseSchema);
