// import { sendMail } from "../lib/email-sender/sendOrderMail.js";
import crypto from "crypto";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";
import { User } from "../models/user.model.js";

export const initializePayment = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found!" });

    // Create a new course purchase record
    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending",
    });
    await newPurchase.save(); // ✅ Save it before using

    // Generate eSewa payment hash
    const paymentInitiate = await getEsewaPaymentHash({
      amount: course.coursePrice,
      transaction_uuid: course._id,
    });

    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      paymentInitiate: paymentInitiate,
      payment_url: `${process.env.BACKEND_URI}/api/v1/buy/generate-esewa-form?amount=${course.coursePrice}&transaction_uuid=${newPurchase._id}`,
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
    const createOrder = await CoursePurchase.findById(
      paymentInfo.decodedData.transaction_uuid
    );
    if (!createOrder) {
      return res.status(500).json({
        success: false,
        message: "Order not found",
      });
    }
    await CoursePurchase.findByIdAndUpdate(
      paymentInfo.decodedData.transaction_uuid,
      {
        status: "completed",
        paymentId: paymentInfo.decodedData.transaction_code,
      }
    );
    const coursePurchase = await CoursePurchase.findById(
      paymentInfo.decodedData.transaction_uuid
    );
    if (!coursePurchase) {
      throw new Error("CoursePurchase not found");
    }

    await User.findByIdAndUpdate(coursePurchase.userId, {
      $addToSet: {
        enrolledCourses: coursePurchase.courseId,
      },
    });

    res.redirect(`http://localhost:5173/my-learning`);
    // await sendMail({
    //   to: `lazyfox916@gmail.com`,
    //   subject: "Payment Completed",
    //   html: `
    //   <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    //     <h1 style="color: #4CAF50;">Payment Completed</h1>
    //     <p>Dear Admin,</p>
    //     <p>We are pleased to inform you that a payment has been successfully completed for the following order:</p>
    //     <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    //       <tr style="background-color: #f2f2f2;">
    //         <th style="padding: 10px; border: 1px solid #ddd;">Detail</th>
    //         <th style="padding: 10px; border: 1px solid #ddd;">Value</th>
    //       </tr>
    //       <tr>
    //         <td style="padding: 10px; border: 1px solid #ddd;">Transaction ID</td>
    //         <td style="padding: 10px; border: 1px solid #ddd;">${paymentData.transactionId}</td>
    //       </tr>
    //       <tr>
    //         <td style="padding: 10px; border: 1px solid #ddd;">PIDX</td>
    //         <td style="padding: 10px; border: 1px solid #ddd;">${paymentData.pidx}</td>
    //       </tr>
    //       <tr>
    //         <td style="padding: 10px; border: 1px solid #ddd;">Order ID</td>
    //         <td style="padding: 10px; border: 1px solid #ddd;">${paymentData.productId}</td>
    //       </tr>
    //       <tr>
    //         <td style="padding: 10px; border: 1px solid #ddd;">Order Name</td>
    //         <td style="padding: 10px; border: 1px solid #ddd;">XXX</td>
    //       </tr>
    //        <tr>
    //         <td style="padding: 10px; border: 1px solid #ddd;">Amount</td>
    //         <td style="padding: 10px; border: 1px solid #ddd;">${paymentData.amount}</td>
    //       </tr>
    //        <tr>
    //         <td style="padding: 10px; border: 1px solid #ddd;">Payment Method</td>
    //         <td style="padding: 10px; border: 1px solid #ddd;">Esewa</td>
    //       </tr>
    //     </table>
    //     <p>Thank you for your prompt action.</p>
    //     <p style="color: #555;">Regards,</p>
    //     <p style="font-weight: bold;">Prabin Shretsha</p>
    //   </div>
    //   `,
    // });
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