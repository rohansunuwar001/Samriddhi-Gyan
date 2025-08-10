import crypto from "crypto";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../utils/esewa.js";
import { User } from "../models/user.model.js";
import { createNotification } from "../service/notification.service.js";


export const initializePayment = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found!" });

    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending",
    });
    await newPurchase.save();

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
    
    const coursePurchase = await CoursePurchase.findByIdAndUpdate(
      paymentInfo.decodedData.transaction_uuid,
      {
        status: "completed",
        paymentId: paymentInfo.decodedData.transaction_code,
      },
      { new: true } // Return the updated document
    ).populate('courseId'); // Populate to get course details for the notification

    if (!coursePurchase) {
      // You might want to redirect to a failure page here
      return res.status(404).json({ success: false, message: "Order not found after update." });
    }

    // Enroll the user in the course
    await User.findByIdAndUpdate(coursePurchase.userId, {
      $addToSet: {
        enrolledCourses: coursePurchase.courseId._id,
      },
    });

    // --- 2. TRIGGER THE NOTIFICATION HERE ---
    const course = coursePurchase.courseId;
    if (course) {
      await createNotification(
          coursePurchase.userId,
          `You have successfully enrolled in "${course.courseTitle}"!`,
          `/course-progress/${course._id}`,
          'course_enrollment'
      );
    }

    res.redirect(`${process.env.FRONTEND_URL}/my-learning`);
  } catch (error) {
    console.log(error);
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