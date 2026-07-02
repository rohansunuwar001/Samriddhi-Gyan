import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: ['1m', '3m', '6m', '12m']
    },
    planName: {
        type: String,
        required: true
    },
    durationMonths: {
        type: Number,
        required: true
    },
    priceNpr: {
        type: Number,
        required: true
    },
    discountNpr: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
