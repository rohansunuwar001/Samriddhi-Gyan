// server/controllers/esewa.controller.js
//
// FIX: Your current esewa.controller.js NEVER calls completeOrder() from
// purchase.service.js. It does the enrollment manually but NEVER calls
// createNotification. That's why notification is not saved to DB at all.
//
// This is the root cause — the refactored esewa controller was never applied.
// Replace your current esewa.controller.js with this file.

import crypto from "crypto";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";
import { createPendingOrder, completeOrder } from "../service/purchase.service.js";

export const initializePayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: "No courses selected!" });
    }

    const { order, totalAmount } = await createPendingOrder({
      userId,
      courseIds,
      paymentMethod: "eSewa",
    });

    const paymentInitiate = await getEsewaPaymentHash({
      amount: totalAmount,
      transaction_uuid: order._id,
    });

    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      paymentInitiate,
      payment_url: `${process.env.BACKEND_URI}/api/v1/buy/generate-esewa-form?amount=${totalAmount}&transaction_uuid=${order._id}`,
    });
  } catch (error) {
    console.error("eSewa initializePayment error:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const completePayment = async (req, res) => {
  const { data } = req.query;
  let purchase = null;

  try {
    const paymentInfo = await verifyEsewaPayment(data);
    const purchaseId = paymentInfo.decodedData.transaction_uuid;
    const refId = paymentInfo.decodedData.transaction_code;

    purchase = await CoursePurchase.findById(purchaseId);

    if (!purchase) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
    }

    if (purchase.status === "completed") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-success?orderId=${purchase.orderId}`
      );
    }

    // Save eSewa ref ID then call completeOrder which handles:
    // enrollment + cart/wishlist clear + notification (DB + socket)
    purchase.paymentDetails.eSewaRefId = refId;
    await completeOrder(purchase); // ← THIS WAS MISSING in your current file

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-success?method=esewa&orderId=${purchase.orderId}`
    );
  } catch (error) {
    console.error("[completePayment] ERROR:", error);

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

export const fillEsewaForm = async (req, res) => {
  const { amount, transaction_uuid } = req.query;
  const paymentHash = await getEsewaPaymentHash({ amount, transaction_uuid });
  const nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`);

  res.send(`
    <html>
      <body>
        <form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
          <input type="hidden" name="amount"                    value="${amount}" />
          <input type="hidden" name="tax_amount"                value="0" />
          <input type="hidden" name="total_amount"              value="${amount}" />
          <input type="hidden" name="transaction_uuid"          value="${transaction_uuid}" />
          <input type="hidden" name="product_code"              value="${process.env.ESEWA_PRODUCT_CODE}" />
          <input type="hidden" name="product_service_charge"    value="0" />
          <input type="hidden" name="product_delivery_charge"   value="0" />
          <input type="hidden" name="success_url"               value="${process.env.BACKEND_URI}/api/v1/buy/complete-payment" />
          <input type="hidden" name="failure_url"               value="${process.env.BACKEND_URI}/api/v1/buy/payment-failed" />
          <input type="hidden" name="signed_field_names"        value="total_amount,transaction_uuid,product_code" />
          <input type="hidden" name="signature"                 value="${paymentHash.signature}" />
        </form>
        <script type="text/javascript" nonce="${nonce}">
          document.getElementById("esewaForm").submit();
        </script>
      </body>
    </html>
  `);
};