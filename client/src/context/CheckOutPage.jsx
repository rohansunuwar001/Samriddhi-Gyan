// In your CheckoutPage.js or a parent component
import CheckoutForm from '@/components/CheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// import dotenv from 'dotenv';

// dotenv.config();
// Load Stripe with your public key from environment variables
const stripePromise = loadStripe("pk_test_51RIgZEFfN81sC9KsgLjL2LwBybaqW6ykr59vy0Z4cHi0UOsakY0vUBkYM5Vz3rCBbyqILMml5J5wBH8C0BGwUyhr00zh3OoFBz");

const CheckOutPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default CheckOutPage;