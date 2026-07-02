import crypto from "crypto";
import { SubscriptionPurchase } from "../models/subscriptionPurchase.model.js";
import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { User } from "../models/user.model.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";

// 1. GET ALL SUBSCRIPTION PLANS (Self-seeding)
export const getPlans = async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find({}).sort({ durationMonths: 1 });
    
    // Seed default tiers if empty
    if (plans.length === 0) {
      const defaults = [
        { key: '1m', planName: '1 Month Plan', durationMonths: 1, priceNpr: 1000, discountNpr: 0 },
        { key: '3m', planName: '3 Months Plan', durationMonths: 3, priceNpr: 2800, discountNpr: 200 },
        { key: '6m', planName: '6 Months Plan', durationMonths: 6, priceNpr: 5400, discountNpr: 600 },
        { key: '12m', planName: '1 Year Plan', durationMonths: 12, priceNpr: 10000, discountNpr: 1500 }
      ];
      await SubscriptionPlan.insertMany(defaults);
      plans = await SubscriptionPlan.find({}).sort({ durationMonths: 1 });
    }

    return res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("getPlans error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch plans." });
  }
};

// 2. UPDATE SUBSCRIPTION PLANS (Admin only)
export const updatePlans = async (req, res) => {
  try {
    const { plans } = req.body; // Array of { key, priceNpr, discountNpr }
    
    if (!Array.isArray(plans)) {
      return res.status(400).json({ success: false, message: "Plans array is required." });
    }

    for (const planData of plans) {
      const { key, priceNpr, discountNpr } = planData;
      await SubscriptionPlan.findOneAndUpdate(
        { key },
        { priceNpr: Number(priceNpr), discountNpr: Number(discountNpr || 0) },
        { new: true }
      );
    }

    const updated = await SubscriptionPlan.find({}).sort({ durationMonths: 1 });
    return res.status(200).json({ success: true, message: "Subscription plans updated successfully", plans: updated });
  } catch (error) {
    console.error("updatePlans error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update plans." });
  }
};

// 3. INITIALIZE SUBSCRIPTION CHECKOUT
export const initializeSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planKey } = req.body;

    if (!planKey) {
      return res.status(400).json({ success: false, message: "Plan key is required." });
    }

    // Load configurations from DB
    const plan = await SubscriptionPlan.findOne({ key: planKey });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan tier not found." });
    }

    const netAmount = plan.priceNpr - plan.discountNpr;
    if (netAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid plan pricing configuration." });
    }

    // Generate unique order ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `SUB-ORD-${Date.now()}-${randomSuffix}`;

    // Create pending subscription transaction
    const order = await SubscriptionPurchase.create({
      orderId,
      userId,
      planName: plan.planName,
      amount: netAmount,
      durationMonths: plan.durationMonths,
      paymentMethod: "eSewa",
      status: "pending"
    });

    const paymentInitiate = await getEsewaPaymentHash({
      amount: netAmount,
      transaction_uuid: order._id,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription payment initiated successfully",
      paymentInitiate,
      payment_url: `${process.env.BACKEND_URI}/api/v1/subscription/form?amount=${netAmount}&transaction_uuid=${order._id}`,
    });
  } catch (error) {
    console.error("initializeSubscription error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to initialize payment." });
  }
};

// 4. COMPLETE PAYMENT VERIFICATION
export const completeSubscription = async (req, res) => {
  const { data } = req.query;
  let purchase = null;

  try {
    const paymentInfo = await verifyEsewaPayment(data);
    const purchaseId = paymentInfo.decodedData.transaction_uuid;
    const refId = paymentInfo.decodedData.transaction_code;

    purchase = await SubscriptionPurchase.findById(purchaseId);

    if (!purchase) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
    }

    if (purchase.status === "completed") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-success?method=subscription&orderId=${purchase.orderId}`
      );
    }

    // Update transaction purchase
    purchase.status = "completed";
    purchase.paymentDetails.eSewaRefId = refId;
    await purchase.save();

    // Activate the subscription on the User model
    const user = await User.findById(purchase.userId);
    if (user) {
      const now = new Date();
      const expirationDate = new Date();
      // Calculate dynamic expiration date based on duration
      expirationDate.setMonth(now.getMonth() + purchase.durationMonths);

      user.subscription = {
        status: "active",
        planName: purchase.planName,
        startsAt: now,
        expiresAt: expirationDate,
        paymentMethod: "eSewa"
      };

      await user.save();
    }

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-success?method=subscription&orderId=${purchase.orderId}`
    );
  } catch (error) {
    console.error("[completeSubscription] ERROR:", error);

    if (purchase && purchase.status === "pending") {
      purchase.status = "failed";
      await purchase.save();
    }

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-failed${
        purchase ? `?orderId=${purchase.orderId}` : ""
      }`
    );
  }
};

// 5. REDIRECT FORM RENDERER
export const fillSubscriptionEsewaForm = async (req, res) => {
  const { amount, transaction_uuid } = req.query;
  const paymentHash = await getEsewaPaymentHash({ amount, transaction_uuid });
  const nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`);

  res.send(`
    <html>
      <body>
        <form id="esewaSubForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
          <input type="hidden" name="amount"                    value="${amount}" />
          <input type="hidden" name="tax_amount"                value="0" />
          <input type="hidden" name="total_amount"              value="${amount}" />
          <input type="hidden" name="transaction_uuid"          value="${transaction_uuid}" />
          <input type="hidden" name="product_code"              value="${process.env.ESEWA_PRODUCT_CODE}" />
          <input type="hidden" name="product_service_charge"    value="0" />
          <input type="hidden" name="product_delivery_charge"   value="0" />
          <input type="hidden" name="success_url"               value="${process.env.BACKEND_URI}/api/v1/subscription/complete" />
          <input type="hidden" name="failure_url"               value="${process.env.BACKEND_URI}/api/v1/buy/payment-failed" />
          <input type="hidden" name="signed_field_names"        value="total_amount,transaction_uuid,product_code" />
          <input type="hidden" name="signature"                 value="${paymentHash.signature}" />
        </form>
        <script type="text/javascript" nonce="${nonce}">
          document.getElementById("esewaSubForm").submit();
        </script>
      </body>
    </html>
  `);
};

// 6. GET ALL SUBSCRIPTIONS LOG (Admin only)
export const getAllSubscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const subscriptions = await SubscriptionPurchase.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email photoUrl")
      .lean();

    const total = await SubscriptionPurchase.countDocuments({});

    return res.status(200).json({
      success: true,
      subscriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error("getAllSubscriptions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subscriptions." });
  }
};
