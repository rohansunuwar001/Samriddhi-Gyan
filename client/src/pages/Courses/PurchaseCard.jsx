// file: src/components/PurchaseCard.jsx

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAddToCartMutation, useGetCartQuery } from "@/features/api/cartApi";
import {
  useAddToWishlistMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from "@/features/api/wishlistApi";
import { CheckCircle2, Heart, Loader2, PlayCircle } from "lucide-react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PurchaseCard = ({ course }) => {
  const navigate = useNavigate();

  // Data fetching hooks for global state (cart and wishlist)
  const { data: cartData, isLoading: isCartDataLoading } = useGetCartQuery();
  const { data: wishlistData, isLoading: isWishlistDataLoading } =
    useGetWishlistQuery();

  // Mutation hooks for performing actions
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [addToWishlist, { isLoading: isAddingToWishlist }] =
    useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemovingFromWishlist }] =
    useRemoveFromWishlistMutation();

  // Derive the component's state from props and fetched data
  const isCourseInCart = cartData?.cart?.some(
    (item) => item._id === course._id
  );
  const isCourseInWishlist = wishlistData?.wishlist?.some(
    (item) => item._id === course._id
  );
  const isPurchased =
    course.isEnrolled || course.purchaseStatus === "completed";

  // Action handlers
  const handleCartClick = async () => {
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

  // Price calculation
  const currentPrice = course.price?.current ?? 0;
  const originalPrice = course.price?.original ?? 0;

  return (
    <Card className="shadow-lg lg:sticky lg:top-24 rounded-lg overflow-hidden">
      <div className="relative group cursor-pointer">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-auto object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="h-16 w-16 text-white" />
          <p className="text-white mt-2 font-semibold">Preview this course</p>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        {isPurchased ? (
          // --- This is the view for users who OWN the course ---
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-gray-700">
                You have access to this course
              </p>
            </div>
            <Button
              // This is the CRITICAL FIX that prevents the page from reloading.
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
              onClick={(e) => {
    e.stopPropagation(); // Stop the event from bubbling
    console.log('Navigating to content page...'); // Confirm this log appears
    navigate(`/course-detail/${course._id}/content`);
  }}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Go to Course
            </Button>
          </div>
        ) : (
          // --- This is the view for users who have NOT bought the course ---
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">Rs{currentPrice}</span>
              {originalPrice > currentPrice && (
                <span className="text-gray-500 line-through">
                  Rs{originalPrice}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                onClick={handleCartClick}
                disabled={isCartDataLoading || isAddingToCart}
              >
                {isAddingToCart ? (
                  <Loader2 className="animate-spin" />
                ) : isCourseInCart ? (
                  "Go to Cart"
                ) : (
                  "Add to Cart"
                )}
              </Button>
              <Button
                type="button"
                variant={isCourseInWishlist ? "default" : "outline"}
                className="w-full h-12 text-lg flex items-center gap-2"
                onClick={handleWishlistClick}
                disabled={
                  isWishlistDataLoading ||
                  isAddingToWishlist ||
                  isRemovingFromWishlist
                }
              >
                {isAddingToWishlist || isRemovingFromWishlist ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Heart
                    className={`h-5 w-5 ${
                      isCourseInWishlist ? "fill-current" : ""
                    }`}
                  />
                )}
                {isCourseInWishlist ? "In Wishlist" : "Add to Wishlist"}
              </Button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-500">
          30-Day Money-Back Guarantee
        </p>
      </CardContent>
    </Card>
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
