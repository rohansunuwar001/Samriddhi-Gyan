// src/components/Cart.jsx

import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { useGetCartQuery, useRemoveFromCartMutation } from "@/features/api/cartApi";
import { useCreateCheckoutSessionMutation, useCreateStripeCheckoutSessionMutation } from "@/features/api/purchaseApi";
import { useState } from "react";

// Helper: Handles eSewa form submission


const Cart = () => {
  // RTK Query hooks
  const { data, isLoading: isCartLoading, isError } = useGetCartQuery();
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation();

  // Use the correct purchaseApi hooks
  const [createEsewaSession] = useCreateCheckoutSessionMutation();
  const [createStripeSession] = useCreateStripeCheckoutSessionMutation();

  // Track which payment is loading
  const [loadingMethod, setLoadingMethod] = useState(null);

  // Remove course from cart
  const handleRemove = async (courseId) => {
    try {
      await removeFromCart(courseId).unwrap();
      toast.success("Course removed from cart.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove course.");
    }
  };

  // Checkout handler for Stripe/eSewa
  const handleProceedToCheckout = async (paymentMethod) => {
    if (!data?.cart || data.cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    const courseIds = data.cart.map(item => item._id);
    toast.info("Preparing your order, please wait...");
    setLoadingMethod(paymentMethod);
    try {
      if (paymentMethod === 'Stripe') {
        const response = await createStripeSession(courseIds).unwrap();
        if (response.url) {
          window.location.href = response.url;
        } else {
          toast.error("Could not process Stripe payment. Please try again.");
        }
      } else if (paymentMethod === 'eSewa') {
        const response = await createEsewaSession(courseIds).unwrap();
        if (response.payment_url) {
          window.location.href = response.payment_url;
        } else {
          toast.error("Could not process eSewa payment. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error(error?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setLoadingMethod(null);
    }
  };

  // Render logic
  if (isCartLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-10">
        Error loading cart. Please try again later.
      </div>
    );
  }

  const { cart } = data;
  const subtotal = cart.reduce((acc, course) => acc + (course.price?.current ?? 0), 0);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">
        Shopping Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
      </h1>
      {cart.length === 0 ? (
        <div className="text-center min-h-[400px] flex flex-col justify-center items-center bg-gray-50 rounded-lg">
          <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven`t added anything to your cart yet.</p>
          <Link to="/courses"><Button>Explore Courses</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ul className="lg:col-span-2 space-y-4">
            {cart.map((course) => (
              <li key={course._id} className="flex items-start justify-between border rounded-lg p-4 bg-white">
                <div className="flex items-start space-x-4">
                  <img src={course.thumbnail || '/placeholder.jpg'} alt={course.title} className="w-28 h-20 object-cover rounded-md" />
                  <div>
                    <Link to={`/course-detail/${course._id}`} className="font-semibold text-lg hover:text-blue-600">{course.title}</Link>
                    <p className="text-sm text-gray-500">By {course.instructor?.name || 'Instructor'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50 px-0 h-auto py-1 mt-2"
                      disabled={isRemoving}
                      onClick={() => handleRemove(course._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
                <p className="font-semibold text-lg">Rs{(course.price?.current ?? 0).toFixed(2)}</p>
              </li>
            ))}
          </ul>
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-24 bg-white">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="flex justify-between mb-2 text-gray-600">
                <span>Subtotal</span>
                <span>Rs{subtotal.toFixed(2)}</span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>Rs{subtotal.toFixed(2)}</span>
              </div>
              <div className="space-y-3">
                <p className="text-center text-sm font-medium text-gray-600">Choose a payment method:</p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={() => handleProceedToCheckout('eSewa')}
                  disabled={loadingMethod === 'eSewa' || loadingMethod === 'Stripe'}
                >
                  {loadingMethod === 'eSewa' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Pay with eSewa
                </Button>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="lg"
                  onClick={() => handleProceedToCheckout('Stripe')}
                  disabled={loadingMethod === 'Stripe' || loadingMethod === 'eSewa'}
                >
                  {loadingMethod === 'Stripe' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Pay with Card (Stripe)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;