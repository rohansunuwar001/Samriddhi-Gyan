import crypto from "crypto";
import { User } from "../models/user.model.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { v4 as uuidv4 } from "uuid";

export const initializePayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: "No courses selected!" });
    }

    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res.status(404).json({ message: "One or more courses not found!" });
    }

    const purchaseCourses = [];
    let totalAmount = 0;

    courses.forEach((course) => {
      purchaseCourses.push({
        courseId: course._id,
        priceAtPurchase: course.price.current,
      });
      totalAmount += course.price.current;
    });

    const orderId = `LMS-ORD-${uuidv4().split("-")[0].toUpperCase()}`;

    const newPurchase = new CoursePurchase({
      orderId,
      userId,
      courses: purchaseCourses,
      totalAmount,
      paymentMethod: "eSewa",
      status: "pending",
      paymentDetails: {},
    });
    await newPurchase.save();

    const paymentInitiate = await getEsewaPaymentHash({
      amount: totalAmount,
      transaction_uuid: newPurchase._id,
    });

    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      paymentInitiate,
      payment_url: `${process.env.BACKEND_URI}/api/v1/buy/generate-esewa-form?amount=${totalAmount}&transaction_uuid=${newPurchase._id}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const completePayment = async (req, res) => {
  const { data } = req.query;
  try {
    const paymentInfo = await verifyEsewaPayment(data);
    const purchaseId = paymentInfo.decodedData.transaction_uuid;
    const refId      = paymentInfo.decodedData.transaction_code;

    const purchase = await CoursePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(500).json({ success: false, message: "Order not found" });
    }

    // Update purchase status
    purchase.status = "completed";
    purchase.paymentDetails.eSewaRefId = refId;
    await purchase.save();

    const courseIds = purchase.courses.map((c) => c.courseId);

    // Add user to each course's enrolledStudents
    for (const courseId of courseIds) {
      await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { enrolledStudents: purchase.userId } },
        { new: true }
      );
    }

    // Add courses to user's enrolledCourses
    // FIX: $addToSet does NOT support $each — use $push with $each instead
    await User.findByIdAndUpdate(purchase.userId, {
      $push: { enrolledCourses: { $each: courseIds } },
    });

    res.redirect(`${process.env.FRONTEND_URL}/my-learning`);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const fillEsewaForm = async (req, res) => {
  const amount           = req.query.amount;
  const transaction_uuid = req.query.transaction_uuid;

  const paymentHash = await getEsewaPaymentHash({ amount, transaction_uuid });
  const nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`);

  res.send(`
    <html>
      <body>
        <form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
          <input type="hidden" name="amount" value="${amount}" />
          <input type="hidden" name="tax_amount" value="0" />
          <input type="hidden" name="total_amount" value="${amount}" />
          <input type="hidden" name="transaction_uuid" value="${transaction_uuid}" />
          <input type="hidden" name="product_code" value="${process.env.ESEWA_PRODUCT_CODE}" />
          <input type="hidden" name="product_service_charge" value="0" />
          <input type="hidden" name="product_delivery_charge" value="0" />
          <input type="hidden" name="success_url" value="${process.env.BACKEND_URI}/api/v1/buy/complete-payment" />
          <input type="hidden" name="failure_url" value="https://developer.esewa.com.np/failure" />
          <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
          <input type="hidden" name="signature" value="${paymentHash.signature}" />
        </form>
        <script type="text/javascript" nonce="${nonce}">
          document.getElementById("esewaForm").submit();
        </script>
      </body>
    </html>
  `);
};