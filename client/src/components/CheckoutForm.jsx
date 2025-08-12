// components/CheckoutForm.js

import { createOrder } from '@/features/api/orderApiService';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';

const CheckoutForm = () => {
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const stripe = useStripe();
  const elements = useElements();

  // Helper function to handle eSewa form submission
  const handleEsewaPayment = (esewaData) => {
    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'); // Use eSewa's test or live URL

    for (const key in esewaData) {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', key);
      input.setAttribute('value', esewaData[key]);
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit(); // This will redirect the user to the eSewa payment page
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    // Replace with your actual cart logic
    const courseIdsInCart = ['course_id_1', 'course_id_2'];

    try {
      // 1. Create the pending order on your backend
      const response = await createOrder({
        courseIds: courseIdsInCart,
        paymentMethod: paymentMethod,
      });

      // 2. Handle the response based on the payment method
      if (paymentMethod === 'Stripe') {
        if (!stripe || !elements || !response.clientSecret) {
          throw new Error('Stripe is not ready or client secret is missing.');
        }

        // 3. Confirm the payment with Stripe using the clientSecret
        const result = await stripe.confirmCardPayment(response.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });

        if (result.error) {
          setError(result.error.message);
        } else if (result.paymentIntent.status === 'succeeded') {
          // Payment succeeded! You can redirect the user to a success page.
          // Your backend webhook will handle enrollment creation.
          window.location.href = '/payment-success';
        }

      } else if (paymentMethod === 'eSewa') {
        if (!response.esewaData) {
            throw new Error('eSewa payment data is missing.');
        }
        // 4. Redirect to eSewa by submitting a form
        handleEsewaPayment(response.esewaData);
      }

    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Checkout</h2>
      
      {/* Payment Method Selection */}
      <div>
        <label>
          <input type="radio" value="Stripe" checked={paymentMethod === 'Stripe'} onChange={() => setPaymentMethod('Stripe')} />
          Pay with Card (Stripe)
        </label>
        <label>
          <input type="radio" value="eSewa" checked={paymentMethod === 'eSewa'} onChange={() => setPaymentMethod('eSewa')} />
          Pay with eSewa
        </label>
      </div>

      {/* Stripe Card Element (only show if Stripe is selected) */}
      {paymentMethod === 'Stripe' && (
        <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc' }}>
          <CardElement />
        </div>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : `Pay Now with ${paymentMethod}`}
      </button>
    </form>
  );
};

export default CheckoutForm;