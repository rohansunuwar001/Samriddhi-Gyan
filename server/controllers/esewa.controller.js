// import { sendMail } from "../lib/email-sender/sendOrderMail.js";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { v4 as uuidv4 } from "uuid";

export const initializePayment = async (req, res) => {
  try {
    const userId = req.id;
    const { courseIds } = req.body; // Accepts array of courseIds

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: "No courses selected!" });
    }

    // Fetch all courses
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res.status(404).json({ message: "One or more courses not found!" });
    }

    // Prepare purchase details
    const purchaseCourses = [];
    let totalAmount = 0;

    courses.forEach((course) => {
      purchaseCourses.push({
        courseId: course._id,
        priceAtPurchase: course.price.current,
      });
      totalAmount += course.price.current;
    });

    // Generate unique orderId
    const orderId = `LMS-ORD-${uuidv4().split("-")[0].toUpperCase()}`;

    // Create a new course purchase record
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

    // Generate eSewa payment hash
    const paymentInitiate = await getEsewaPaymentHash({
      amount: totalAmount,
      transaction_uuid: newPurchase._id,
    });

    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      paymentInitiate: paymentInitiate,
      payment_url: `${process.env.BACKEND_URI}/api/v1/buy/generate-esewa-form?amount=${totalAmount}&transaction_uuid=${newPurchase._id}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const completePayment = async (req, res, next) => {
  const { data } = req.query;
  try {
    const paymentInfo = await verifyEsewaPayment(data);
    const purchaseId = paymentInfo.decodedData.transaction_uuid;
    const refId = paymentInfo.decodedData.transaction_code;

    const purchase = await CoursePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(500).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update purchase status and store eSewa refId
    purchase.status = "completed";
    purchase.paymentDetails.eSewaRefId = refId;
    await purchase.save();

    // Enroll user in all purchased courses
    for (const courseObj of purchase.courses) {
      await Course.findByIdAndUpdate(
        courseObj.courseId,
        { $addToSet: { enrolledStudents: purchase.userId } },
        { new: true }
      );
    }

     await User.findByIdAndUpdate(CoursePurchase.userId, {
      $addToSet: {
        enrolledCourses: CoursePurchase.courses.courseId,
      },
    });

    res.redirect(`http://localhost:5173/my-learning`);
    // Optionally, send email notification here
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const fillEsewaForm = async (req, res, next) => {
  const amount = req.query.amount;
  const transaction_uuid = req.query.transaction_uuid;

  const paymentHash = await getEsewaPaymentHash({ amount, transaction_uuid });

  const nonce = crypto.randomBytes(16).toString("base64");

  res.setHeader(
    "Content-Security-Policy",
    `script-src 'self' 'nonce-${nonce}'`
  );

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
          <input type="hidden" name="success_url" value="http://localhost:8080/api/v1/buy/complete-payment" />
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