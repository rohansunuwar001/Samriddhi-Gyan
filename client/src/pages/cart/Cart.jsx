// src/components/Cart.jsx

import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2, Heart, Tag, Star } from "lucide-react";
import { useGetCartQuery, useRemoveFromCartMutation } from "@/features/api/cartApi";
import {
  useCreateCheckoutSessionMutation,
  useCreateStripeCheckoutSessionMutation,
} from "@/features/api/purchaseApi";
import { useState } from "react";
import YouMightAlsoLike from "../Courses/YouMightAlsoLike";


const Cart = () => {
  // RTK Query hooks
  const { data, isLoading: isCartLoading, isError } = useGetCartQuery();
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation();

  // purchaseApi hooks
  const [createEsewaSession] = useCreateCheckoutSessionMutation();
  const [createStripeSession] = useCreateStripeCheckoutSessionMutation();

  // Track which payment method is loading
  const [loadingMethod, setLoadingMethod] = useState(null);

  // Coupon field
  const [showCouponField, setShowCouponField] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    // Hook this up to a real coupon-validation endpoint when one exists.
    toast.info("Coupon codes aren't supported yet.");
  };

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
    const courseIds = data.cart.map((item) => item._id);
    toast.info("Preparing your order, please wait...");
    setLoadingMethod(paymentMethod);
    try {
      if (paymentMethod === "Stripe") {
        const response = await createStripeSession(courseIds).unwrap();
        if (response.url) {
          window.location.href = response.url;
        } else {
          toast.error("Could not process Stripe payment. Please try again.");
        }
      } else if (paymentMethod === "eSewa") {
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

  // Loading state
  if (isCartLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-12 w-12 text-gray-400" />
      </div>
    );
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="text-center py-10 text-gray-600">
        Couldn&apos;t load your cart. Please try again later.
      </div>
    );
  }

  const { cart } = data;

  const subtotal = cart.reduce((acc, c) => acc + (c.price?.current ?? 0), 0);
  const originalTotal = cart.reduce(
    (acc, c) => acc + (c.price?.original ?? c.price?.current ?? 0),
    0
  );
  const discountPct =
    originalTotal > subtotal && originalTotal > 0
      ? Math.round(100 - (subtotal / originalTotal) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-1">Shopping Cart</h1>
      <p className="text-gray-500 mb-6">
        {cart.length} Course{cart.length !== 1 ? "s" : ""} in Cart
      </p>

      {cart.length === 0 ? (
        <div className="text-center min-h-[400px] flex flex-col justify-center items-center bg-gray-50 rounded-lg border">
          <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link to="/courses">
            <Button>Explore Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <ul className="divide-y border-b">
              {cart.map((course) => {
                const current = course.price?.current ?? 0;
                const original = course.price?.original;
                const hasDiscount = original && original > current;
                const itemDiscount = hasDiscount
                  ? Math.round(100 - (current / original) * 100)
                  : 0;

                return (
                  <li
                    key={course._id}
                    className="flex items-start justify-between gap-4 py-5"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <img
                        src={course.thumbnail || "/placeholder.jpg"}
                        alt={course.title}
                        className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/course-detail/${course._id}`}
                          className="font-semibold text-base leading-snug hover:text-violet-600 line-clamp-2"
                        >
                          {course.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          By {course.instructor?.name || "Instructor"}
                        </p>

                        {(course.bestseller || course.rating) && (
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {course.bestseller && (
                              <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                Bestseller
                              </span>
                            )}
                            {course.rating && (
                              <span className="flex items-center gap-1 text-sm text-amber-700">
                                <span className="font-semibold">{course.rating}</span>
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                {course.numRatings && (
                                  <span className="text-gray-400 text-xs">
                                    ({course.numRatings.toLocaleString()} ratings)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <button
                            onClick={() => handleRemove(course._id)}
                            disabled={isRemoving}
                            className="flex items-center gap-1 text-violet-600 hover:underline disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                          <button className="flex items-center gap-1 text-violet-600 hover:underline">
                            <Heart className="h-3.5 w-3.5" /> Move to wishlist
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg">Rs {current.toFixed(2)}</p>
                      {hasDiscount && (
                        <>
                          <p className="text-sm text-gray-400 line-through">
                            Rs {original.toFixed(2)}
                          </p>
                          <p className="text-xs text-violet-600 font-medium">
                            {itemDiscount}% off
                          </p>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-24 bg-white shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total:</p>
              <p className="text-3xl font-bold mb-1">Rs {subtotal.toFixed(2)}</p>
              {discountPct > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-400 line-through">
                    Rs {originalTotal.toFixed(2)}
                  </span>
                  <span className="text-sm text-violet-600 font-semibold">
                    {discountPct}% off
                  </span>
                </div>
              )}

              <div className="space-y-3 mt-4">
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  size="lg"
                  onClick={() => handleProceedToCheckout("eSewa")}
                  disabled={loadingMethod === "eSewa" || loadingMethod === "Stripe"}
                >
                  {loadingMethod === "eSewa" && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Pay with eSewa
                </Button>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="lg"
                  onClick={() => handleProceedToCheckout("Stripe")}
                  disabled={loadingMethod === "Stripe" || loadingMethod === "eSewa"}
                >
                  {loadingMethod === "Stripe" && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Pay with Card (Stripe)
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                You won&apos;t be charged yet
              </p>

              <hr className="my-5" />

              {showCouponField ? (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Promotions
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter Coupon"
                      className="flex-1 min-w-0 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-5"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCouponField(true)}
                  className="w-full border rounded-md py-2.5 text-sm font-semibold text-violet-700 border-violet-200 hover:bg-violet-50 flex items-center justify-center gap-2"
                >
                  <Tag className="h-4 w-4" /> Apply Coupon
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <YouMightAlsoLike excludeIds={cart.map((c) => c._id)} />
    </div>
  );
};

export default Cart;
