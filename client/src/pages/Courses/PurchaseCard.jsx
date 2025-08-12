import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, PlayCircle, Heart, Loader2 } from 'lucide-react'; // Added Heart, Loader2
import PropTypes from 'prop-types';
import { useGetCartQuery, useAddToCartMutation } from '@/features/api/cartApi';
import { 
    useGetWishlistQuery, 
    useAddToWishlistMutation,
    useRemoveFromWishlistMutation // Import the remove mutation
} from '@/features/api/wishlistApi';
import { useNavigate } from 'react-router-dom'; // To redirect to cart
import { toast } from 'sonner'; // For better user feedback
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";

const PurchaseCard = ({ course }) => {
    const navigate = useNavigate();

    // --- 1. FETCH GLOBAL STATE ---
    // Get the full cart and wishlist data. RTK Query caches this efficiently.
    const { data: cartData, isLoading: isCartDataLoading } = useGetCartQuery();
    const { data: wishlistData, isLoading: isWishlistDataLoading } = useGetWishlistQuery();
    const { data: purchaseData, isLoading: isPurchaseLoading } = useGetCourseDetailWithStatusQuery(course._id);

    // --- 2. DEFINE ALL NEEDED MUTATIONS ---
    const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
    const [addToWishlist, { isLoading: isAddingToWishlist }] = useAddToWishlistMutation();
    const [removeFromWishlist, { isLoading: isRemovingFromWishlist }] = useRemoveFromWishlistMutation();

    // --- 3. DERIVE BUTTON STATE FROM THE FETCHED DATA ---
    // These booleans are the single source of truth for the button states.
    const isCourseInCart = cartData?.cart?.some(item => item._id === course._id);
    const isCourseInWishlist = wishlistData?.wishlist?.some(item => item._id === course._id);
    const purchaseStatus = purchaseData?.purchaseStatus;
    const allowReview = purchaseData?.allowReview;

    // --- 4. CREATE SMART HANDLERS ---
    const handleCartClick = async () => {
        // If already in cart, navigate to the cart page.
        if (isCourseInCart) {
            navigate('/cart');
            return;
        }
        // Otherwise, add it.
        try {
            await addToCart(course._id).unwrap();
            toast.success('Course added to cart!');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to add to cart.');
        }
    };

    const handleWishlistClick = async () => {
        // This is now a toggle button.
        if (isCourseInWishlist) {
            // If already in wishlist, remove it.
            try {
                await removeFromWishlist(course._id).unwrap();
                toast.success('Removed from wishlist.');
            } catch (err) {
                toast.error(err?.data?.message || 'Failed to remove from wishlist.');
            }
        } else {
            // Otherwise, add it.
            try {
                await addToWishlist(course._id).unwrap();
                toast.success('Added to wishlist!');
            } catch (err) {
                toast.error(err?.data?.message || 'Failed to add to wishlist.');
            }
        }
    };

    // Price calculation logic (no changes)
    const currentPrice = course.price?.current ?? 0;
    const originalPrice = course.price?.original ?? 0;
    const hasDiscount = originalPrice > currentPrice;
    const discount = hasDiscount
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    return (
        <Card className="shadow-lg lg:sticky lg:top-6">
            <div className="relative group">
                <img src={course.thumbnail} alt={course.title} className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <PlayCircle className="h-16 w-16 text-white" />
                    <p className="text-white mt-2 font-semibold">Preview this course</p>
                </div>
            </div>
            <CardContent className="p-4 space-y-4">
                {/* Only show price and hours left if NOT purchased */}
                {purchaseStatus !== "completed" && (
                    <>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">Rs{currentPrice}</span>
                            {hasDiscount && (
                                <>
                                    <span className="text-gray-500 line-through">Rs{originalPrice}</span>
                                    <span className="font-semibold">{discount}% off</span>
                                </>
                            )}
                        </div>
                        <div className="text-red-600 flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4"/>
                            <span className="font-semibold">10 hours</span> left at this price!
                        </div>
                    </>
                )}

                <div className="flex flex-col gap-2">
                    {isPurchaseLoading ? (
                        <Button className="w-full h-12 text-lg" disabled>
                            <Loader2 className="animate-spin" />
                        </Button>
                    ) : purchaseStatus === "completed" ? (
                        <>
                            <Button
                              type="button"
                              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                              onClick={() => navigate(`/course-detail/${course._id}/content`)}
                            >
                              Continue Course
                            </Button>
                           
                        </>
                    ) : (
                        <>
                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                                onClick={handleCartClick}
                                disabled={isCartDataLoading || isAddingToCart}
                            >
                                {isAddingToCart ? <Loader2 className="animate-spin" /> : isCourseInCart ? 'Go to Cart' : 'Add to Cart'}
                            </Button>
                            <Button
                                variant={isCourseInWishlist ? "default" : "outline"}
                                className="w-full h-12 text-lg flex items-center gap-2"
                                onClick={handleWishlistClick}
                                disabled={isWishlistDataLoading || isAddingToWishlist || isRemovingFromWishlist}
                            >
                                {isAddingToWishlist || isRemovingFromWishlist ? <Loader2 className="animate-spin" /> : <Heart className={`h-5 w-5 ${isCourseInWishlist ? 'fill-white' : ''}`} />}
                                {isCourseInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                            </Button>
                        </>
                    )}
                </div>

                <p className="text-center text-xs text-gray-500">30-Day Money-Back Guarantee</p>
            </CardContent>
        </Card>
    );
};

// Updated PropTypes to be less strict as data might be loading
PurchaseCard.propTypes = {
    course: PropTypes.shape({
        _id: PropTypes.string,
        thumbnail: PropTypes.string,
        title: PropTypes.string,
        price: PropTypes.shape({
            current: PropTypes.number,
            original: PropTypes.number,
        }),
    }).isRequired,
};

export default PurchaseCard;