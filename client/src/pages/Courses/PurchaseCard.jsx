// file: src/components/PurchaseCard.jsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAddToCartMutation, useGetCartQuery } from "@/features/api/cartApi";
import { useValidateCouponMutation } from "@/features/api/couponApi";
import {
  useAddToWishlistMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from "@/features/api/wishlistApi";
import {
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Gift,
  Heart,
  Infinity as InfinityIcon,
  Info,
  Loader2,
  PlayCircle,
  Share2,
  Tag,
} from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import BolaVideoPlayer from "@/pages/admin/lecture/BolaVideoPlayer";

const PurchaseCard = ({ course }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((store) => store.auth);
  const isAdmin = user?.role === "admin";
  const [selectedPlan, setSelectedPlan] = useState(
    course?.includedInSubscription ? "subscription" : "individual"
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setSelectedPlan(course?.includedInSubscription ? "subscription" : "individual");
  }, [course?.includedInSubscription]);

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateCompactState = () => {
      setIsCompact(window.scrollY > 360);
    };

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateCompactState);
    };
  }, []);

  const { data: cartData, isLoading: isCartDataLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: wishlistData, isLoading: isWishlistDataLoading } =
    useGetWishlistQuery(undefined, { skip: !isAuthenticated });

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [addToWishlist, { isLoading: isAddingToWishlist }] =
    useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemovingFromWishlist }] =
    useRemoveFromWishlistMutation();

  const isCourseInCart = cartData?.cart?.some(
    (item) => item._id === course._id
  );
  const isCourseInWishlist = wishlistData?.wishlist?.some(
    (item) => item._id === course._id
  );
  const isPurchased =
    course.isEnrolled || course.purchaseStatus === "completed";

  const [banditDiscount, setBanditDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation();

  useEffect(() => {
    if (course?._id) {
      import("js-cookie").then(({ default: Cookies }) => {
        const cookieKey = `bandit_discount_${course._id}`;
        const cachedDiscount = Cookies.get(cookieKey);

        if (cachedDiscount !== undefined) {
          setBanditDiscount(Number(cachedDiscount));
        } else {
          const apiBase = import.meta.env.VITE_BASE_URL || "http://localhost:10000";
          fetch(`${apiBase}/api/v1/bandit-pricing/${course._id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && typeof data.discountPercent === "number") {
                setBanditDiscount(data.discountPercent);
                // Save chosen discount in guest cookies for 7 days to persist price integrity
                Cookies.set(cookieKey, data.discountPercent, { expires: 7 });
              }
            })
            .catch((err) => console.warn("Failed to fetch bandit pricing:", err.message));
        }
      });
    }
  }, [course?._id]);

  const originalPrice = course.price?.original ?? 0;
  const staticDiscount =
    originalPrice > (course.price?.current ?? 0)
      ? Math.round(((originalPrice - (course.price?.current ?? 0)) / originalPrice) * 100)
      : 0;

  const discountPercent = banditDiscount > 0 ? banditDiscount : staticDiscount;
  const baseCurrentPrice =
    discountPercent > 0
      ? Math.round(originalPrice * (1 - discountPercent / 100))
      : (course.price?.current ?? 0);

  // Apply real coupon discount if active
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.coupon?.discountType === "percentage") {
      const pct = appliedCoupon.coupon.discountValue;
      couponDiscountAmount = Math.round((baseCurrentPrice * pct) / 100);
      if (appliedCoupon.coupon.maxDiscountAmount && couponDiscountAmount > appliedCoupon.coupon.maxDiscountAmount) {
        couponDiscountAmount = appliedCoupon.coupon.maxDiscountAmount;
      }
    } else if (appliedCoupon.coupon?.discountType === "fixed") {
      couponDiscountAmount = Math.min(appliedCoupon.coupon.discountValue, baseCurrentPrice);
    } else if (appliedCoupon.discountAmount) {
      couponDiscountAmount = Math.min(appliedCoupon.discountAmount, baseCurrentPrice);
    }
  }

  const currentPrice = Math.max(0, baseCurrentPrice - couponDiscountAmount);
  const subscriptionPrice = Math.max(
    Math.round((currentPrice || 750) * 0.75),
    1
  );

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }

    try {
      const res = await validateCoupon({
        code: couponCode.trim(),
        courseId: course._id,
        amount: baseCurrentPrice,
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

  const handleCartClick = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add courses to your cart.");
      navigate("/login");
      return;
    }

    if (isCourseInCart) {
      navigate("/cart");
      return;
    }

    try {
      await addToCart(course._id).unwrap();
      toast.success("Course added to cart!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add to cart.");
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to buy this course.");
      navigate("/login");
      return;
    }

    if (!isCourseInCart) {
      try {
        await addToCart(course._id).unwrap();
      } catch (err) {
        toast.error(err?.data?.message || "Failed to add to cart.");
        return;
      }
    }

    navigate("/checkout");
  };

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add courses to your wishlist.");
      navigate("/login");
      return;
    }

    if (isCourseInWishlist) {
      try {
        await removeFromWishlist(course._id).unwrap();
        toast.success("Removed from wishlist.");
      } catch (err) {
        toast.error(err?.data?.message || "Failed to remove from wishlist.");
      }
    } else {
      try {
        await addToWishlist(course._id).unwrap();
        toast.success("Added to wishlist!");
      } catch (err) {
        toast.error(err?.data?.message || "Failed to add to wishlist.");
      }
    }
  };

  const renderRadio = (checked) => (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked ? "border-[#5624d0]" : "border-[#6a6f73]"
      }`}
    >
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-[#5624d0]" />}
    </span>
  );

  const renderPriceLine = ({ subscription = false, large = true } = {}) => {
    const price = subscription ? subscriptionPrice : currentPrice;

    return (
      <div className="mt-1 flex flex-wrap items-baseline gap-2 text-[#1c1d1f]">
        {subscription && <span className="text-[15px] font-semibold">From</span>}
        <span className={large ? "text-[24px] font-semibold" : "text-[20px] font-semibold"}>
          Rs.{price.toLocaleString()}
        </span>
        {originalPrice > price && (
          <span className="text-[14px] text-[#6a6f73] line-through font-light">
            Rs.{originalPrice.toLocaleString()}
          </span>
        )}
        {subscription ? (
          <span className="text-[14px] text-[#6a6f73] font-light">/month</span>
        ) : (
          discountPercent > 0 && (
            <span className="text-[14px] text-[#6a6f73] font-light">{discountPercent}% off</span>
          )
        )}
      </div>
    );
  };

  const renderTimer = () =>
    discountPercent > 0 && (
      <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#b4690e]">
        <Clock3 className="h-4 w-4 shrink-0" />
        2 days left at this price!
      </p>
    );

  const renderPreview = () => (
    <div
      className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isCompact
          ? "max-h-0 opacity-0 pointer-events-none"
          : "max-h-[300px] opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (course.promoVideoStatus === "ready" && course.promoVideoUrl) {
            setIsPreviewOpen(true);
          } else {
            toast.info("No promotional preview video available for this course.");
          }
        }}
        className="group relative block w-full cursor-pointer text-left focus:outline-none"
      >
        <img
          src={course.thumbnail}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#1c1d1f] shadow-lg transition-transform group-hover:scale-110">
            <PlayCircle className="h-10 w-10 fill-current text-[#1c1d1f]" />
          </span>
          <p className="mt-3 text-[15px] font-semibold text-white tracking-tight drop-shadow-sm">
            Preview this course
          </p>
        </div>
      </button>
    </div>
  );

  const renderWishlistButton = () => (
    <button
      type="button"
      aria-label={isCourseInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xs border border-[#1c1d1f] text-[#1c1d1f] hover:bg-gray-50 disabled:opacity-70 transition-colors"
      onClick={handleWishlistClick}
      disabled={
        isWishlistDataLoading || isAddingToWishlist || isRemovingFromWishlist
      }
    >
      {isAddingToWishlist || isRemovingFromWishlist ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart className={`h-5 w-5 ${isCourseInWishlist ? "fill-[#1c1d1f]" : ""}`} />
      )}
    </button>
  );

  const renderSubscriptionDetails = () => (
    <div className="space-y-2.5 text-[14px] text-[#2d2f31]">
      <div className="flex items-center gap-3">
        <BookOpenCheck className="h-4 w-4 text-[#2d2f31] shrink-0" />
        <span>Access to 28,000+ top-rated courses</span>
      </div>
      <div className="flex items-center gap-3">
        <Tag className="h-4 w-4 text-[#2d2f31] shrink-0" />
        <span>Cancel anytime</span>
      </div>
      <div className="flex items-center gap-3">
        <Info className="h-4 w-4 text-[#2d2f31] shrink-0" />
        <button
          type="button"
          onClick={() => navigate("/subscribe")}
          className="font-semibold text-[#5624d0] underline hover:text-[#401b9c]"
        >
          Learn more
        </button>
      </div>
    </div>
  );

  const renderCouponBox = () => (
    <div className="space-y-3 bg-[#f7f9fa] p-5 border-t border-[#d1d7dc]">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-[#1c1d1f]">
          Apply Coupon
        </span>
        <div className="flex items-center gap-3 text-[#2d2f31]">
          <button type="button" className="p-1 hover:text-[#5624d0] transition-colors" aria-label="Gift this course">
            <Gift className="h-5 w-5" />
          </button>
          <button type="button" className="p-1 hover:text-[#5624d0] transition-colors" aria-label="Share this course">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {appliedCoupon ? (
        <div className="flex h-11 items-center justify-between rounded-xs border border-[#38755b] bg-[#e6f4ea] px-3 text-[14px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1e4620]">
              {appliedCoupon.coupon?.code || appliedCoupon.code}
            </span>
            <span className="font-normal text-[#2e6930]">Applied!</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="text-[13px] font-medium text-red-600 hover:text-red-800 hover:underline"
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
            className="h-10 rounded-xs border border-[#8a8d91] bg-white px-3 text-[14px] uppercase outline-none focus:border-[#1c1d1f]"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={isValidatingCoupon}
            className="h-10 rounded-xs border-[#1c1d1f] text-[14px] font-semibold text-[#1c1d1f] hover:bg-gray-100"
          >
            {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </Button>
        </form>
      )}
    </div>
  );

  const renderSubscriptionSelected = () => (
    <>
      <button
        type="button"
        className="block w-full p-5 text-left focus:outline-none"
        onClick={() => setSelectedPlan("subscription")}
      >
        <div className="flex items-start gap-3">
          {renderRadio(true)}
          <div>
            <p className="text-[15px] font-semibold text-[#1c1d1f]">Subscribe and save</p>
            {renderPriceLine({ subscription: true, large: false })}
          </div>
        </div>
      </button>

      <div className="space-y-4 px-5 pb-5">
        {renderSubscriptionDetails()}
        <Button
          type="button"
          className="h-12 w-full rounded-xs bg-[#a435f0] text-[16px] font-semibold text-white hover:bg-[#8710d8] shadow-sm transition-colors"
          onClick={() => navigate("/subscribe")}
        >
          Start subscription
        </Button>
      </div>

      <button
        type="button"
        className="block w-full border-y border-[#d1d7dc] p-5 text-left hover:bg-[#f7f9fa] focus:outline-none transition-colors"
        onClick={() => setSelectedPlan("individual")}
      >
        <div className="flex items-start gap-3">
          {renderRadio(false)}
          <div>
            <p className="text-[15px] font-semibold text-[#1c1d1f]">Buy individual course</p>
            {renderPriceLine()}
            {renderTimer()}
          </div>
        </div>
      </button>

      {renderCouponBox()}
    </>
  );

  const renderIndividualSelected = () => (
    <>
      {course?.includedInSubscription ? (
        <button
          type="button"
          className="block w-full p-5 text-left focus:outline-none"
          onClick={() => setSelectedPlan("individual")}
        >
          <div className="flex items-start gap-3">
            {renderRadio(true)}
            <div>
              <p className="text-[15px] font-semibold text-[#1c1d1f]">Buy individual course</p>
              {renderPriceLine()}
              {renderTimer()}
            </div>
          </div>
        </button>
      ) : (
        <div className="p-5 text-left border-b border-[#d1d7dc]">
          <p className="text-[15px] font-semibold text-[#1c1d1f]">Buy individual course</p>
          {renderPriceLine()}
          {renderTimer()}
        </div>
      )}

      <div className="space-y-3.5 px-5 pb-5 text-[14px] text-[#2d2f31] pt-3">
        <div className="flex items-center gap-3">
          <BadgeCheck className="h-4 w-4 text-[#2d2f31] shrink-0" />
          <span>30-Day Money-Back Guarantee</span>
        </div>
        <div className="flex items-center gap-3">
          <InfinityIcon className="h-4 w-4 text-[#2d2f31] shrink-0" />
          <span>Full Lifetime Access</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            className="h-12 flex-1 rounded-xs bg-[#a435f0] text-[16px] font-semibold text-white hover:bg-[#8710d8] shadow-sm transition-colors"
            onClick={handleCartClick}
            disabled={isCartDataLoading || isAddingToCart}
          >
            {isAddingToCart ? (
              <Loader2 className="animate-spin" />
            ) : isCourseInCart ? (
              "Go to cart"
            ) : (
              "Add to cart"
            )}
          </Button>
          {renderWishlistButton()}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xs border-[#1c1d1f] text-[16px] font-semibold text-[#1c1d1f] hover:bg-gray-50 transition-colors"
          onClick={handleBuyNow}
          disabled={isCartDataLoading || isAddingToCart}
        >
          Buy now
        </Button>
      </div>

      {course?.includedInSubscription && (
        <button
          type="button"
          className="block w-full border-y border-[#d1d7dc] p-5 text-left hover:bg-[#f7f9fa] focus:outline-none transition-colors"
          onClick={() => setSelectedPlan("subscription")}
        >
          <div className="flex items-start gap-3">
            {renderRadio(false)}
            <div>
              <p className="text-[15px] font-semibold text-[#1c1d1f]">Subscribe and save</p>
              {renderPriceLine({ subscription: true, large: false })}
            </div>
          </div>
        </button>
      )}

      {renderCouponBox()}
    </>
  );

  return (
    <>
      <aside className="overflow-hidden border border-[#d1d7dc] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.16)] transition-all duration-200">
        {renderPreview()}

        {isAdmin ? (
          <div className="space-y-4 p-7 text-center">
            <div className="flex flex-col items-center justify-center gap-2 border border-violet-200 bg-violet-50/20 p-4 rounded text-violet-800">
              <Info className="h-6 w-6 text-[#5624d0]" />
              <p className="font-medium text-base">
                Administrator Mode
              </p>
              <p className="text-sm text-slate-500 font-extralight leading-relaxed">
                As an administrator, you cannot enroll, purchase, or subscribe to courses.
              </p>
            </div>
          </div>
        ) : isPurchased ? (
          <div className="space-y-5 p-7 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-gray-800">
                You have access to this course
              </p>
            </div>
            <Button
              type="button"
              className="h-12 w-full rounded-md bg-purple-700 text-lg font-medium hover:bg-purple-800"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/course-detail/${course._id}/content`);
              }}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Go to Course
            </Button>
          </div>
        ) : selectedPlan === "individual" ? (
          renderIndividualSelected()
        ) : (
          renderSubscriptionSelected()
        )}
      </aside>

      {/* ── HLS PROMO VIDEO PREVIEW MODAL ── */}
      {isPreviewOpen && course.promoVideoUrl && (
        <div
          onClick={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-black border border-[#3e4143] shadow-2xl"
          >
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-9 right-0 text-white hover:text-gray-300 text-lg font-extralight flex items-center gap-1"
            >
              Close ×
            </button>
            <div className="aspect-video w-full">
              <BolaVideoPlayer src={course.promoVideoUrl} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

PurchaseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    title: PropTypes.string,
    price: PropTypes.shape({
      current: PropTypes.number,
      original: PropTypes.number,
    }),
    isEnrolled: PropTypes.bool,
    purchaseStatus: PropTypes.string,
  }).isRequired,
};

export default PurchaseCard;
