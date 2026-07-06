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
  const currentPrice =
    discountPercent > 0
      ? Math.round(originalPrice * (1 - discountPercent / 100))
      : (course.price?.current ?? 0);
  const subscriptionPrice = Math.max(
    Math.round((currentPrice || 750) * 0.75),
    1
  );

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
      navigate("/cart");
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

    navigate("/cart");
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
        onClick={() => {
          if (course.promoVideoStatus === "ready" && course.promoVideoUrl) {
            setIsPreviewOpen(true);
          } else {
            toast.info("No promotional preview video available for this course.");
          }
        }}
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
          onClick={() => navigate("/subscribe")}
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
          onClick={() => navigate("/subscribe")}
        >
          Start subscription
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
      {course?.includedInSubscription ? (
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
      ) : (
        <div className="p-7 text-left border-b border-[#d1d7dc]">
          <p className="text-lg font-extrabold text-[#2d2f31]">Buy individual course</p>
          {renderPriceLine()}
          {renderTimer()}
        </div>
      )}

      <div className="space-y-4 px-7 pb-7 text-base text-[#6a6f73] pt-4">
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

      {course?.includedInSubscription && (
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
              <p className="font-semibold text-sm">
                Administrator Mode
              </p>
              <p className="text-xs text-slate-500 font-light leading-relaxed">
                As an administrator, you cannot enroll, purchase, or subscribe to courses.
              </p>
            </div>
          </div>
        ) : isPurchased ? (
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
              className="absolute -top-9 right-0 text-white hover:text-gray-300 text-base font-light flex items-center gap-1"
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
