// src/pages/cart/Checkout.jsx

import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, ShieldCheck } from "lucide-react";
import { useGetCartQuery } from "@/features/api/cartApi";
import {
  useCreateCheckoutSessionMutation,
  useCreateStripeCheckoutSessionMutation,
} from "@/features/api/purchaseApi";
import { useState, useEffect } from "react";

const Checkout = () => {
  const navigate = useNavigate();
  const { data, isLoading: isCartLoading, isError } = useGetCartQuery();
  const [createEsewaSession, { isLoading: isEsewaLoading }] = useCreateCheckoutSessionMutation();
  const [createStripeSession, { isLoading: isStripeLoading }] = useCreateStripeCheckoutSessionMutation();

  const [paymentMethod, setPaymentMethod] = useState("Stripe");
  const [country, setCountry] = useState("Nepal");

  const cart = data?.cart || [];

  // Redirect if cart is empty after loading
  useEffect(() => {
    if (!isCartLoading && cart.length === 0) {
      toast.error("Your cart is empty.");
      navigate("/cart");
    }
  }, [cart, isCartLoading, navigate]);

  const handlePay = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    const courseIds = cart.map((item) => item._id);
    toast.info("Preparing your payment redirect, please wait...");

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
      console.error("Payment session creation failed:", error);
      toast.error(error?.data?.message || "Payment initiation failed. Please try again.");
    }
  };

  if (isCartLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-10 text-red-500">
        Couldn&apos;t load checkout details. Please try again later.
      </div>
    );
  }

  const subtotal = cart.reduce((acc, c) => acc + (c.price?.current ?? 0), 0);
  const originalTotal = cart.reduce(
    (acc, c) => acc + (c.price?.original ?? c.price?.current ?? 0),
    0
  );
  const totalDiscount = originalTotal - subtotal;

  const isProcessing = isStripeLoading || isEsewaLoading;

  return (
    <div className="bg-white text-[#2d2f31] min-h-screen">
      {/* Top thin navbar link */}
      <div className="border-b border-[#d1d7dc]">
        <div className="mx-auto max-w-[1400px] px-6 py-4 flex justify-between items-center sm:px-8 lg:px-10">
          <Link to="/" className="focus:outline-none">
            <img src="/samriddhi_logo1.png" alt="Samriddhi Logo" width="82" height="34" />
          </Link>
          <Link to="/cart" className="text-sm font-bold text-[#5624d0] hover:text-[#3b189f]">
            Cancel
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-12 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 items-start">
          
          {/* Left Column: Details */}
          <div className="space-y-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Checkout</h1>

            {/* Billing Address Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Billing address</h2>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2d2f31] uppercase">Country</label>
                <div className="relative max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 text-base border border-[#2d2f31] bg-white text-[#2d2f31] focus:outline-none rounded-none appearance-none font-bold"
                  >
                    <option value="Nepal">Nepal</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-xs text-gray-500 font-bold">▼</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#6a6f73] leading-relaxed">
                Samriddhi Gyan is required by law to collect applicable transaction taxes for purchases made in certain tax jurisdictions.
              </p>
            </div>

            {/* Payment Method Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-[#d1d7dc] pb-3">
                <h2 className="text-2xl font-extrabold">Payment method</h2>
                <span className="text-xs text-[#6a6f73] flex items-center gap-1 font-bold">
                  <span className="text-[#38755b]">🔒</span> Secure and encrypted
                </span>
              </div>

              {/* Radio Group Selection */}
              <div className="border border-[#2d2f31] divide-y divide-[#d1d7dc]">
                {/* Stripe Radio */}
                <label className={`block p-5 cursor-pointer transition-colors ${paymentMethod === "Stripe" ? "bg-[#f7f9fa]" : "hover:bg-[#f7f9fa]"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        value="Stripe"
                        checked={paymentMethod === "Stripe"}
                        onChange={() => setPaymentMethod("Stripe")}
                        className="h-5 w-5 text-[#5624d0] border-[#2d2f31] focus:ring-[#5624d0]"
                      />
                      <span className="font-extrabold text-[#2d2f31] text-base">Stripe (Card Payment)</span>
                    </div>
                    {/* Card Logos */}
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="bg-[#f7f9fa] border border-[#d1d7dc] px-1.5 py-0.5 rounded text-[10px] font-extrabold text-[#6a6f73] tracking-wider">VISA</span>
                      <span className="bg-[#f7f9fa] border border-[#d1d7dc] px-1.5 py-0.5 rounded text-[10px] font-extrabold text-[#6a6f73] tracking-wider">MC</span>
                      <span className="bg-[#f7f9fa] border border-[#d1d7dc] px-1.5 py-0.5 rounded text-[10px] font-extrabold text-[#6a6f73] tracking-wider">AMEX</span>
                      <span className="bg-[#f7f9fa] border border-[#d1d7dc] px-1.5 py-0.5 rounded text-[10px] font-extrabold text-[#6a6f73] tracking-wider">JCB</span>
                    </div>
                  </div>
                  <div className="pl-8 pt-3 text-sm text-[#6a6f73]">
                    You will be redirected securely to Stripe payment gateway to input your card credentials.
                  </div>
                </label>

                {/* eSewa Radio */}
                <label className={`block p-5 cursor-pointer transition-colors ${paymentMethod === "eSewa" ? "bg-[#f7f9fa]" : "hover:bg-[#f7f9fa]"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        value="eSewa"
                        checked={paymentMethod === "eSewa"}
                        onChange={() => setPaymentMethod("eSewa")}
                        className="h-5 w-5 text-[#5624d0] border-[#2d2f31] focus:ring-[#5624d0]"
                      />
                      <span className="font-extrabold text-[#2d2f31] text-base">eSewa Pay</span>
                    </div>
                    {/* eSewa Logo Text */}
                    <span className="bg-[#60bb46] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">eSewa</span>
                  </div>
                  <div className="pl-8 pt-3 text-sm text-[#6a6f73]">
                    Pay instantly using your eSewa account credentials or eSewa mobile app.
                  </div>
                </label>
              </div>
            </div>

            {/* Order Details list */}
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold">Order details ({cart.length} course{cart.length !== 1 ? "s" : ""})</h2>
              <div className="divide-y divide-[#d1d7dc] border-t border-[#d1d7dc]">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between items-start gap-4 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={item.thumbnail} alt={item.title} className="w-16 h-10 object-cover border border-[#d1d7dc] flex-shrink-0" />
                      <span className="font-bold text-[#2d2f31] text-sm hover:text-[#5624d0] truncate block">
                        {item.title}
                      </span>
                    </div>
                    <span className="font-extrabold text-sm text-[#2d2f31] flex-shrink-0">
                      Rs {(item.price?.current ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="border border-[#d1d7dc] bg-[#f7f9fa] p-7">
            <h2 className="text-2xl font-extrabold mb-6">Order summary</h2>
            
            <div className="space-y-4 text-sm font-medium text-[#2d2f31]">
              <div className="flex justify-between">
                <span className="text-[#6a6f73]">Original Price:</span>
                <span>Rs {originalTotal.toLocaleString()}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-[#38755b]">
                  <span>Discounts:</span>
                  <span>-Rs {totalDiscount.toLocaleString()}</span>
                </div>
              )}
              <hr className="border-[#d1d7dc]" />
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-lg font-extrabold">Total:</span>
                <span className="text-3xl font-extrabold">Rs {subtotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-xs text-[#6a6f73]">
                By completing your purchase, you agree to these <Link to="/terms" className="text-[#5624d0] underline font-bold">Terms of Service</Link>.
              </p>
              
              <Button
                disabled={isProcessing}
                onClick={handlePay}
                className="w-full h-14 bg-[#a435f0] text-white hover:bg-[#8710d8] font-bold text-lg rounded-none transition-colors shadow-none"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  `Pay Rs ${subtotal.toLocaleString()}`
                )}
              </Button>
            </div>

            {/* Guarantee badge box */}
            <div className="mt-8 pt-6 border-t border-[#d1d7dc] text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 font-extrabold text-[#2d2f31] text-sm">
                <ShieldCheck className="h-5 w-5 text-[#5624d0]" />
                30-Day Money-Back Guarantee
              </div>
              <p className="text-xs text-[#6a6f73] leading-relaxed px-4">
                Not satisfied? Get a full refund within 30 days. Simple and straightforward!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
