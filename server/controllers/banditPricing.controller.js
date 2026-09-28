import mongoose from "mongoose";

const banditPricingSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
    unique: true
  },
  arms: [
    {
      discountPercent: { type: Number, required: true },
      trials: { type: Number, default: 1 },
      successes: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true });

const BanditPricing = mongoose.model("BanditPricing", banditPricingSchema);

function sampleBeta(alpha, beta) {
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);

  const u1 = Math.random() || 0.0001;
  const u2 = Math.random() || 0.0001;
  const normalRand = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  const sample = mean + normalRand * stdDev;
  return Math.min(1.0, Math.max(0.0, sample));
}

export const getCourseDiscount = async (req, res) => {
  try {
    const { courseId } = req.params;

    let pricing = await BanditPricing.findOne({ courseId });

    if (!pricing) {
      pricing = await BanditPricing.create({
        courseId,
        arms: [
          { discountPercent: 0, trials: 1, successes: 0 },
          { discountPercent: 10, trials: 1, successes: 0 },
          { discountPercent: 20, trials: 1, successes: 0 },
          { discountPercent: 30, trials: 1, successes: 0 }
        ]
      });
    }

    let bestArm = pricing.arms[0];
    let maxSample = -1;

    pricing.arms.forEach((arm) => {
      const sample = sampleBeta(arm.successes + 1, arm.trials - arm.successes + 1);
      if (sample > maxSample) {
        maxSample = sample;
        bestArm = arm;
      }
    });

    bestArm.trials += 1;
    await pricing.save();

    return res.status(200).json({
      success: true,
      courseId,
      discountPercent: bestArm.discountPercent,
      message: `Selected discount tier: ${bestArm.discountPercent}%`
    });

  } catch (error) {
    console.error("getCourseDiscount error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const recordBanditPurchase = async (req, res) => {
  try {
    const { courseId, discountPercent } = req.body;

    const discount = Number(discountPercent);
    const pricing = await BanditPricing.findOne({ courseId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Pricing data not found for course." });
    }

    const arm = pricing.arms.find(a => a.discountPercent === discount);
    if (arm) {
      arm.successes += 1;
      await pricing.save();
      return res.status(200).json({ success: true, message: "Purchase conversion recorded." });
    }

    return res.status(400).json({ success: false, message: "Discount arm match failed." });

  } catch (error) {
    console.error("recordBanditPurchase error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
