// src/pages/cart/Cart.jsx

import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2, Heart, Tag, Star, ArrowRight } from "lucide-react";
import { useGetCartQuery, useRemoveFromCartMutation } from "@/features/api/cartApi";
import { useValidateCouponMutation } from "@/features/api/couponApi";
import { useState } from "react";
import YouMightAlsoLike from "../Courses/YouMightAlsoLike";

const Cart = () => {
  const navigate = useNavigate();
  const { data, isLoading: isCartLoading, isError } = useGetCartQuery();
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation();
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }

    try {
      const res = await validateCoupon({
        code: couponCode.trim(),
        amount: subtotal,
      }).unwrap();

      const validData = res.data || res;
      setAppliedCoupon(validData);
      toast.success(res.message || "Coupon applied successfully!");
      setCouponCode("");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Invalid or expired coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed.");
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
        Couldn&apos;t load your cart. Please try again later.
      </div>
    );
  }

  const cart = data?.cart || [];
  const cartCertifications = data?.cartCertifications || [];
  const totalItems = cart.length + cartCertifications.length;

  const coursesSubtotal = cart.reduce((acc, c) => acc + (c.price?.current ?? 0), 0);
  const certsSubtotal = cartCertifications.reduce((acc, c) => acc + (c.examPrice ?? 0), 0);
  const subtotal = coursesSubtotal + certsSubtotal;

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.coupon?.discountType === "percentage") {
      couponDiscount = Math.round((subtotal * appliedCoupon.coupon.discountValue) / 100);
      if (appliedCoupon.coupon.maxDiscountAmount && couponDiscount > appliedCoupon.coupon.maxDiscountAmount) {
        couponDiscount = appliedCoupon.coupon.maxDiscountAmount;
      }
    } else if (appliedCoupon.coupon?.discountType === "fixed") {
      couponDiscount = Math.min(appliedCoupon.coupon.discountValue, subtotal);
    } else if (appliedCoupon.discountAmount) {
      couponDiscount = Math.min(appliedCoupon.discountAmount, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal - couponDiscount);

  const coursesOriginalTotal = cart.reduce(
    (acc, c) => acc + (c.price?.original ?? c.price?.current ?? 0),
    0
  );
  const certsOriginalTotal = cartCertifications.reduce((acc, c) => acc + (c.examPrice ?? 0), 0);
  const originalTotal = coursesOriginalTotal + certsOriginalTotal;

  const discountPct =
    originalTotal > finalTotal && originalTotal > 0
      ? Math.round(100 - (finalTotal / originalTotal) * 100)
      : 0;

  const renderStars = (rating = 0, size = "h-3.5 w-3.5") => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index + 1 <= Math.round(rating);
        return (
          <Star
            key={index}
            className={`${size} ${
              filled ? "fill-[#b4690e] text-[#b4690e]" : "text-gray-300"
            }`}
          />
        );
      })}
    </div>
  );

  const handleRemove = async (courseId) => {
    try {
      await removeFromCart({ courseId }).unwrap();
      toast.success("Course removed from cart.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove course.");
    }
  };

  const handleRemoveCertification = async (certificationId) => {
    try {
      await removeFromCart({ certificationId }).unwrap();
      toast.success("Exam voucher removed from cart.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove exam voucher.");
    }
  };

  return (
    <div className="bg-white text-[#2d2f31] min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-8 lg:px-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#2d2f31] mb-2">Shopping Cart</h1>
        <p className="text-base font-bold text-[#2d2f31] mb-8">
          {totalItems} Item{totalItems !== 1 ? "s" : ""} in Cart
        </p>

        {totalItems === 0 ? (
          <div className="text-center py-20 flex flex-col justify-center items-center bg-[#f7f9fa] rounded border border-[#d1d7dc]">
            <ShoppingCart className="h-20 w-20 text-[#6a6f73] mb-6" />
            <h2 className="text-2xl font-extrabold text-[#2d2f31] mb-2">Your cart is empty</h2>
            <p className="text-[#6a6f73] mb-8 text-base">
              Looks like you haven&apos;t added any items to your cart yet.
            </p>
            <Link to="/courses">
              <Button className="h-12 px-8 bg-[#a435f0] text-white hover:bg-[#8710d8] font-bold text-base rounded-none">
                Keep shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">
            {/* Left Side: Course List */}
            <div className="border-t border-[#d1d7dc] divide-y divide-[#d1d7dc]">
              {cart.map((course) => {
                const current = course.price?.current ?? 0;
                const original = course.price?.original ?? 0;
                const hasDiscount = original > current;
                const itemDiscount = hasDiscount
                  ? Math.round(100 - (current / original) * 100)
                  : 0;

                const ratingValue = course.ratings ?? course.rating ?? 4.5;
                const reviewsCount = course.numOfReviews ?? course.numRatings ?? 2500;
                const instructorName = course.creator?.name ?? course.instructor?.name ?? "Instructor";
                const totalHours = course.totalDurationInSeconds 
                  ? Math.round(course.totalDurationInSeconds / 3600) 
                  : 45;
                const totalLectures = course.totalLectures ?? 120;
                const courseLevel = course.level ?? "All Levels";

                return (
                  <div
                    key={course._id}
                    className="flex flex-col md:flex-row items-start justify-between gap-6 py-6"
                  >
                    {/* Course Card Details */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <img
                        src={course.thumbnail || "/placeholder.jpg"}
                        alt={course.title}
                        className="w-32 h-20 md:w-36 md:h-24 object-cover border border-[#d1d7dc] flex-shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <Link
                          to={`/course-detail/${course._id}`}
                          className="font-bold text-[#2d2f31] text-base leading-snug hover:text-[#5624d0] line-clamp-2"
                        >
                          {course.title}
                        </Link>
                        <p className="text-xs text-[#6a6f73]">
                          By {instructorName}
                        </p>

                        {/* Rating, hours, lectures */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs">
                          {course.isBestseller && (
                            <span className="bg-[#ecebfa] text-[#2d2f31] font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                              Bestseller
                            </span>
                          )}
                          <span className="text-[#b4690e] font-extrabold">{ratingValue.toFixed(1)}</span>
                          {renderStars(ratingValue)}
                          <span className="text-[#6a6f73]">({reviewsCount.toLocaleString()} ratings)</span>
                        </div>

                        <div className="text-xs text-[#6a6f73] flex flex-wrap gap-2 pt-1">
                          <span>{totalHours} total hours</span>
                          <span>•</span>
                          <span>{totalLectures} lectures</span>
                          <span>•</span>
                          <span>{courseLevel}</span>
                        </div>

                        {/* Premium check badge */}
                        <div className="pt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#ecebfa] text-[#5624d0]">
                            Premium
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex md:flex-col items-center md:items-end gap-4 text-xs font-bold text-[#5624d0] md:min-w-[120px]">
                      <button
                        onClick={() => handleRemove(course._id)}
                        disabled={isRemoving}
                        className="hover:text-[#3b189f] underline"
                      >
                        Remove
                      </button>
                      <button className="hover:text-[#3b189f] underline">
                        Save for Later
                      </button>
                      <button className="hover:text-[#3b189f] underline">
                        Move to Wishlist
                      </button>
                    </div>

                    {/* Price panel */}
                    <div className="text-right flex-shrink-0 md:min-w-[100px]">
                      <div className="flex items-center justify-end gap-1.5 text-[#5624d0] font-extrabold text-lg">
                        <span>Rs {current.toLocaleString()}</span>
                        <Tag className="h-4 w-4" />
                      </div>
                      {hasDiscount && (
                        <div className="space-y-0.5">
                          <span className="text-sm text-[#6a6f73] line-through block">
                            Rs {original.toLocaleString()}
                          </span>
                          <span className="text-xs text-[#2d2f31] block">
                            {itemDiscount}% off
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {cartCertifications.map((cert) => {
                const current = cert.examPrice ?? 0;
                const issuerName = cert.issuer?.name ?? "Professional Board";
                const badge = cert.badgeUrl || "/placeholder.jpg";

                return (
                  <div
                    key={cert._id}
                    className="flex flex-col md:flex-row items-start justify-between gap-6 py-6"
                  >
                    {/* Certification Card Details */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <img
                        src={badge}
                        alt={cert.name}
                        className="w-20 h-20 object-contain border border-[#d1d7dc] flex-shrink-0 bg-slate-50 p-2 rounded-xl"
                      />
                      <div className="min-w-0 space-y-1">
                        <Link
                          to={`/certification/${cert.slug}`}
                          className="font-bold text-[#2d2f31] text-base leading-snug hover:text-[#5624d0] line-clamp-2"
                        >
                          {cert.name} Exam Voucher
                        </Link>
                        <p className="text-xs text-[#6a6f73]">
                          Issuer: {issuerName}
                        </p>
                        <div className="text-xs text-[#6a6f73] flex flex-wrap gap-2 pt-1">
                          <span>Verified Credential</span>
                          <span>•</span>
                          <span>Official Exam Attempt</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex md:flex-col items-center md:items-end gap-4 text-xs font-bold text-[#5624d0] md:min-w-[120px]">
                      <button
                        onClick={() => handleRemoveCertification(cert._id)}
                        disabled={isRemoving}
                        className="hover:text-[#3b189f] underline"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Price panel */}
                    <div className="text-right flex-shrink-0 md:min-w-[100px]">
                      <div className="flex items-center justify-end gap-1.5 text-[#5624d0] font-extrabold text-lg">
                        <span>Rs {current.toLocaleString()}</span>
                        <Tag className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Side: Order Summary Sidebar */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="text-[#2d2f31]">
                  <p className="text-base font-bold text-[#6a6f73]">Total:</p>
                  <p className="text-4xl font-extrabold mt-1">Rs {finalTotal.toLocaleString()}</p>
                  {couponDiscount > 0 && (
                    <p className="text-sm font-semibold text-[#38755b] mt-1">
                      Coupon savings: Rs {couponDiscount.toLocaleString()}
                    </p>
                  )}
                  {discountPct > 0 && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[#6a6f73] line-through text-base">
                        Rs {originalTotal.toLocaleString()}
                      </span>
                      <span className="text-[#2d2f31] text-sm">
                        {discountPct}% off
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full h-14 bg-[#a435f0] text-white hover:bg-[#8710d8] font-bold text-lg rounded-none flex items-center justify-center gap-2 shadow-none transition-colors"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </Button>

                <p className="text-xs text-[#6a6f73] text-center">
                  You won&apos;t be charged yet
                </p>
              </div>

              <hr className="border-[#d1d7dc]" />

              {/* Promotions Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-[#2d2f31]">Promotions</h3>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between border border-[#38755b] bg-[#e6f4ea] px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1e4620]">
                        {appliedCoupon.coupon?.code || appliedCoupon.code}
                      </span>
                      <span className="font-medium text-[#2e6930]">Applied!</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="grid grid-cols-[1fr_80px] gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter Coupon"
                      className="h-10 border border-[#2d2f31] bg-white px-3 text-sm uppercase outline-none focus:border-[#5624d0]"
                    />
                    <Button
                      type="submit"
                      disabled={isValidatingCoupon}
                      className="h-10 bg-white border border-[#2d2f31] text-[#2d2f31] hover:bg-[#f7f9fa] font-bold text-sm rounded-none shadow-none"
                    >
                      {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recommended list */}
      <div className="border-t border-[#d1d7dc] bg-[#f7f9fa] py-12 mt-12">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-10">
          <YouMightAlsoLike excludeIds={cart.map((c) => c._id)} />
        </div>
      </div>
    </div>
  );
};

export default Cart;
