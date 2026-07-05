import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookOpen, Clock, Star, Users, Heart, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAddToCartMutation, useGetCartQuery } from "@/features/api/cartApi";
import {
  useAddToWishlistMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from "@/features/api/wishlistApi";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const Course = ({ course }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [popoverSide, setPopoverSide] = useState("right");
  const cardRef = useRef(null);
  const enterTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  const { data: cartData } = useGetCartQuery();
  const { data: wishlistData } = useGetWishlistQuery();
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const isCourseInCart = cartData?.cart?.some((item) => item._id === course._id);
  const isCourseInWishlist = wishlistData?.wishlist?.some((item) => item._id === course._id);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      if (spaceOnRight < 360) {
        setPopoverSide("left");
      } else {
        setPopoverSide("right");
      }
    }

    if (!showDetails) {
      enterTimeoutRef.current = setTimeout(() => {
        setShowDetails(true);
      }, 400);
    }
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

    leaveTimeoutRef.current = setTimeout(() => {
      setShowDetails(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const handleCartAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleWishlistAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const currentPrice = course.price?.current ?? course.coursePrice ?? 0;
  const originalPrice = course.price?.original ?? course.originalPrice ?? 0;
  const hasDiscount = originalPrice > currentPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const formatDuration = (seconds) => {
    if (!seconds) return "8 hours";
    if (typeof seconds === "string") return seconds;
    const hours = Math.round(seconds / 3600);
    return `${hours} hours`;
  };

  const formatUpdatedDate = (dateString) => {
    if (!dateString) return "Updated June 2026";
    const date = new Date(dateString);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `Updated ${month} ${year}`;
  };

  const bulletPoints = Array.isArray(course.learnings) && course.learnings.length > 0
    ? course.learnings.slice(0, 3)
    : [
        "Become a Full-Stack Web Developer with just one course.",
        "Build 16 web development projects for your portfolio.",
        "Learn the latest technologies including React, Node, and Web3."
      ];

  const ratingValue = course.ratings ?? course.rating ?? 4.5;
  const reviewsCount = course.numOfReviews ?? course.numRatings ?? 2500;
  const enrolledStudentsText = course.enrolledStudents 
    ? (Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : course.enrolledStudents) 
    : "1.2k";
  const instructorName = course.creator?.name ?? course.instructor?.name ?? "Instructor";
  const totalLectures = course.totalLectures ?? 12;
  const courseLevel = course.level ?? "All Levels";

  return (
    <Popover open={showDetails} onOpenChange={setShowDetails}>
      <PopoverAnchor asChild>
        <Link
          to={`/course-detail/${course._id}`}
          className="group block relative h-full"
          ref={cardRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Card className="overflow-visible rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
            <div className="relative overflow-hidden rounded-t-xl">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity duration-300"
              />
              {hasDiscount && (
                <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-sm font-normal">
                  {discountPercentage}% OFF
                </Badge>
              )}
              <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm font-normal">
                {courseLevel}
              </Badge>
            </div>
            
            <CardHeader className="px-4 pt-4 pb-2">
              <h3 className="font-normal text-xl leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {course.title}
              </h3>
            </CardHeader>
            
            <CardContent className="px-4 py-2 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-base font-light">
                    {ratingValue.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">({reviewsCount})</span>
                </div>
                
                <div className="flex items-center ml-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="ml-1 text-base text-gray-500">
                    {enrolledStudentsText} students
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-base line-clamp-2 mb-4">
                {course.subtitles || course.description || 'Master this subject with our comprehensive course designed for all skill levels.'}
              </p>
              
              <div className="flex items-center gap-3 text-base text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDuration(course.totalDurationInSeconds)}
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {totalLectures} lessons
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between w-full">
                <div>
                  {hasDiscount && (
                    <span className="text-gray-400 dark:text-gray-500 line-through text-base mr-2">
                      Rs{originalPrice}
                    </span>
                  )}
                  <span className="font-normal text-xl text-gray-900 dark:text-white">
                    Rs{currentPrice}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800">
                    <AvatarImage 
                      src={course.creator?.photoUrl || "https://github.com/shadcn.png"} 
                      alt={instructorName} 
                    />
                    <AvatarFallback>
                      {instructorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </CardFooter>
          </Card>
        </Link>
      </PopoverAnchor>

      {/* Popover Hover Card Details */}
      <PopoverContent
        side={popoverSide}
        align="start"
        sideOffset={16}
        className="z-50 w-[340px] rounded-none border border-[#d1d7dc] bg-white p-6 text-[#2d2f31] shadow-[0_4px_16px_rgba(0,0,0,0.15)] outline-none relative hidden lg:block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <PopoverPrimitive.Arrow className="fill-white stroke-[#d1d7dc] stroke-1" width={12} height={6} />

        <div className="space-y-4">
          <div>
            <h4 className="font-normal text-[#2d2f31] text-lg leading-snug line-clamp-3">
              {course.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {course.isBestseller && (
                <span className="bg-[#ecebfa] text-[#2d2f31] font-normal px-2 py-0.5 rounded text-[10px] uppercase">
                  Bestseller
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-normal bg-[#ecebfa] text-[#5624d0]">
                Premium
              </span>
            </div>
          </div>

          <div className="text-sm text-[#6a6f73] space-y-1">
            <p className="font-normal text-[#38755b]">{formatUpdatedDate(course.updatedAt)}</p>
            <p>{formatDuration(course.totalDurationInSeconds)} total hours • {courseLevel} • Subtitles</p>
          </div>

          <p className="text-sm text-[#2d2f31] line-clamp-2 leading-relaxed">
            {course.subtitles || course.description || "Master this subject with our comprehensive, step-by-step curriculum."}
          </p>

          {/* Learnings bullet points */}
          <ul className="space-y-1.5 text-sm text-[#2d2f31]">
            {bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 font-normal">✓</span>
                <span className="line-clamp-2">{point}</span>
              </li>
            ))}
          </ul>

          {/* Quick Actions Button Bar */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleCartAction}
              disabled={isAddingToCart}
              className="flex-1 h-11 bg-[#a435f0] text-white hover:bg-[#8710d8] font-normal text-base rounded-none shadow-none"
            >
              {isAddingToCart ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : isCourseInCart ? (
                "Go to cart"
              ) : (
                "Add to cart"
              )}
            </Button>
            <button
              onClick={handleWishlistAction}
              className={`h-11 w-11 shrink-0 border border-[#d1d7dc] flex items-center justify-center hover:bg-[#f7f9fa] ${
                isCourseInWishlist ? "text-[#a435f0]" : "text-[#2d2f31]"
              }`}
            >
              <Heart className={`h-5 w-5 ${isCourseInWishlist ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

Course.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    subtitles: PropTypes.string,
    ratings: PropTypes.number,
    rating: PropTypes.number,
    numOfReviews: PropTypes.number,
    numRatings: PropTypes.number,
    enrolledStudents: PropTypes.any,
    coursePrice: PropTypes.number,
    originalPrice: PropTypes.number,
    price: PropTypes.shape({
      original: PropTypes.number,
      current: PropTypes.number,
    }),
    totalDurationInSeconds: PropTypes.any,
    totalLectures: PropTypes.number,
    creator: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      photoUrl: PropTypes.string,
    }),
  }).isRequired,
};

export default Course;