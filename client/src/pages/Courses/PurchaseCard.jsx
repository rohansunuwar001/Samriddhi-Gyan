// file: src/components/PurchaseCard.jsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAddToCartMutation, useGetCartQuery } from "@/features/api/cartApi";
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
import { toast } from "sonner";

const PurchaseCard = ({ course }) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("subscription");
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

  const { data: cartData, isLoading: isCartDataLoading } = useGetCartQuery();
  const { data: wishlistData, isLoading: isWishlistDataLoading } =
    useGetWishlistQuery();

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

  const currentPrice = course.price?.current ?? 0;
  const originalPrice = course.price?.original ?? 0;
  const discountPercent =
    originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;
  const subscriptionPrice = Math.max(
    Math.round((currentPrice || 750) * 0.75),
    1
  );

  const handleCartClick = async () => {
    if (isCourseInCart) {
      navigate("/cart");
      return;
    }

    try {
      await addToCart(course._id).unwrap();
      toast.success("Course added to cart!");
      navigate("/cart");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add to cart.");
    }
  };

  const handleBuyNow = async () => {
    if (!isCourseInCart) {
      try {
        await addToCart(course._id).unwrap();
      } catch (err) {
        toast.error(err?.data?.message || "Failed to add to cart.");
        return;
      }
    }

    navigate("/cart");
  };

  const handleWishlistClick = async () => {
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
      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[3px] ${
        checked ? "border-[#5624d0]" : "border-[#2d2f31]"
      }`}
    >
      {checked && <span className="h-3.5 w-3.5 rounded-full bg-[#5624d0]" />}
    </span>
  );

  const renderPriceLine = ({ subscription = false, large = true } = {}) => {
    const price = subscription ? subscriptionPrice : currentPrice;

    return (
      <div className="mt-1 flex flex-wrap items-baseline gap-2 text-[#2d2f31]">
        {subscription && <span className="text-xl font-extrabold">From</span>}
        <span className={large ? "text-3xl font-extrabold" : "text-2xl font-extrabold"}>
          Rs{price.toLocaleString()}
        </span>
        {originalPrice > price && (
          <span className="text-lg text-[#6a6f73] line-through">
            Rs{originalPrice.toLocaleString()}
          </span>
        )}
        {subscription ? (
          <span className="text-lg text-[#6a6f73]">/month</span>
        ) : (
          discountPercent > 0 && (
            <span className="text-lg text-[#6a6f73]">{discountPercent}% off</span>
          )
        )}
      </div>
    );
  };

  const renderTimer = () =>
    discountPercent > 0 && (
      <p className="mt-2 flex items-center gap-1 text-sm font-bold text-[#b4690e]">
        <Clock3 className="h-4 w-4" />
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
        className="group relative block w-full cursor-pointer text-left"
      >
        <img
          src={course.thumbnail}
          alt={course.title}
          className="aspect-video w-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 transition-colors group-hover:bg-black/45">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#2d2f31] shadow-md">
            <PlayCircle className="h-12 w-12 fill-current" />
          </span>
          <p className="mt-4 text-xl font-extrabold text-white">
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
      className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md border border-[#6d28d9] text-[#6d28d9] hover:bg-[#f5f0ff] disabled:opacity-70"
      onClick={handleWishlistClick}
      disabled={
        isWishlistDataLoading || isAddingToWishlist || isRemovingFromWishlist
      }
    >
      {isAddingToWishlist || isRemovingFromWishlist ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Heart className={`h-6 w-6 ${isCourseInWishlist ? "fill-current" : ""}`} />
      )}
    </button>
  );

  const renderSubscriptionDetails = () => (
    <div className="space-y-3 text-base text-[#6a6f73]">
      <div className="flex items-center gap-4">
        <BookOpenCheck className="h-5 w-5 text-[#2d2f31]" />
        <span>Access to top-rated courses</span>
      </div>
      <div className="flex items-center gap-4">
        <Tag className="h-5 w-5 text-[#2d2f31]" />
        <span>Cancel anytime</span>
      </div>
      <div className="flex items-center gap-4">
        <Info className="h-5 w-5 text-[#2d2f31]" />
        <button
          type="button"
          className="font-extrabold text-[#5624d0] underline"
        >
          Learn more
        </button>
      </div>
    </div>
  );

  const renderCouponBox = () => (
    <div className="space-y-3 bg-[#f7f9fa] p-7">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-lg font-extrabold text-[#6a6f73] underline"
        >
          Apply Coupon
        </button>
        <div className="flex items-center gap-4 text-[#2d2f31]">
          <Gift className="h-6 w-6" />
          <Share2 className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_96px] gap-3">
        <input
          type="text"
          placeholder="Enter Coupon"
          className="h-12 rounded border border-[#8a8d91] bg-white px-4 text-base outline-none focus:border-[#5624d0]"
        />
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-md border-[#6d28d9] text-lg font-extrabold text-[#6d28d9] hover:bg-[#f5f0ff]"
        >
          Apply
        </Button>
      </div>

      <div className="flex h-12 items-center justify-between rounded border border-[#8a8d91] bg-white px-4 text-base">
        <span className="font-medium text-[#6a6f73]">MT260629G1</span>
        <span className="font-medium text-[#38755b]">Applied!</span>
      </div>
    </div>
  );

  const renderSubscriptionSelected = () => (
    <>
      <button
        type="button"
        className="block w-full p-7 text-left"
        onClick={() => setSelectedPlan("subscription")}
      >
        <div className="grid grid-cols-[32px_1fr] gap-4">
          {renderRadio(true)}
          <div>
            <p className="text-lg text-[#6a6f73]">Subscribe and save</p>
            {renderPriceLine({ subscription: true, large: false })}
          </div>
        </div>
      </button>

      <div className="space-y-5 px-7 pb-7">
        {renderSubscriptionDetails()}
        <Button
          type="button"
          className="h-14 w-full rounded-md bg-[#6d28d9] text-lg font-extrabold text-white hover:bg-[#5b21b6]"
          onClick={handleCartClick}
          disabled={isCartDataLoading || isAddingToCart}
        >
          {isAddingToCart ? <Loader2 className="animate-spin" /> : "Start subscription"}
        </Button>
      </div>

      <button
        type="button"
        className="block w-full border-y border-[#d1d7dc] p-7 text-left hover:bg-[#f7f9fa]"
        onClick={() => setSelectedPlan("individual")}
      >
        <div className="grid grid-cols-[32px_1fr] gap-4">
          {renderRadio(false)}
          <div>
            <p className="text-lg text-[#6a6f73]">Buy individual course</p>
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
      <button
        type="button"
        className="block w-full p-7 text-left"
        onClick={() => setSelectedPlan("individual")}
      >
        <div className="grid grid-cols-[32px_1fr] gap-4">
          {renderRadio(true)}
          <div>
            <p className="text-lg text-[#6a6f73]">Buy individual course</p>
            {renderPriceLine()}
            {renderTimer()}
          </div>
        </div>
      </button>

      <div className="space-y-4 px-7 pb-7 text-base text-[#6a6f73]">
        <div className="flex items-center gap-4">
          <BadgeCheck className="h-5 w-5 text-[#2d2f31]" />
          <span>30-day money-back guarantee</span>
        </div>
        <div className="flex items-center gap-4">
          <InfinityIcon className="h-5 w-5 text-[#2d2f31]" />
          <span>Full lifetime access</span>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            className="h-14 flex-1 rounded-md bg-[#6d28d9] text-lg font-extrabold text-white hover:bg-[#5b21b6]"
            onClick={handleCartClick}
            disabled={isCartDataLoading || isAddingToCart}
          >
            {isAddingToCart ? <Loader2 className="animate-spin" /> : "Go to cart"}
          </Button>
          {renderWishlistButton()}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-14 w-full rounded-md border-[#6d28d9] text-lg font-extrabold text-[#6d28d9] hover:bg-[#f5f0ff]"
          onClick={handleBuyNow}
          disabled={isCartDataLoading || isAddingToCart}
        >
          Buy now
        </Button>
      </div>

      <button
        type="button"
        className="block w-full border-y border-[#d1d7dc] p-7 text-left hover:bg-[#f7f9fa]"
        onClick={() => setSelectedPlan("subscription")}
      >
        <div className="grid grid-cols-[32px_1fr] gap-4">
          {renderRadio(false)}
          <div>
            <p className="text-lg text-[#6a6f73]">Subscribe and save</p>
            {renderPriceLine({ subscription: true, large: false })}
          </div>
        </div>
      </button>

      {renderCouponBox()}
    </>
  );

  return (
    <aside className="overflow-hidden border border-[#d1d7dc] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.16)] transition-all duration-200">
      {renderPreview()}

      {isPurchased ? (
        <div className="space-y-5 p-7 text-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="font-bold text-gray-800">
              You have access to this course
            </p>
          </div>
          <Button
            type="button"
            className="h-12 w-full rounded-md bg-purple-700 text-base font-semibold hover:bg-purple-800"
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
