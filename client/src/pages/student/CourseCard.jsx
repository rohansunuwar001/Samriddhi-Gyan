/* eslint-disable react/prop-types */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, PlayCircle, Star, Users, Heart, Loader2 } from "lucide-react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useAddToCartMutation, useGetCartQuery } from "@/features/api/cartApi";
import {
  useAddToWishlistMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from "@/features/api/wishlistApi";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const CourseCard = ({ course, showRecommendationBadge }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((store) => store.auth);
  const [showDetails, setShowDetails] = useState(false);
  const [popoverSide, setPopoverSide] = useState("right");
  const cardRef = useRef(null);
  const enterTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
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
      }, 60);
    }
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

    leaveTimeoutRef.current = setTimeout(() => {
      setShowDetails(false);
    }, 80);
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

  const handleWishlistAction = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const hasDiscount =
    course.price?.original && course.price.original > course.price.current;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((course.price.original - course.price.current) /
          course.price.original) *
          100
      )
    : 0;

  const enrolledCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : 0;

  const formatDuration = (seconds) => {
    if (!seconds) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
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

  const ratingValue =
    course.avgRating !== undefined && course.avgRating !== null
      ? Number(course.avgRating)
      : Array.isArray(course.ratings) && course.ratings.length
      ? Number(
          (
            course.ratings.reduce(
              (s, r) => s + (typeof r === "number" ? r : r?.rating || 0),
              0
            ) / course.ratings.length
          ).toFixed(1)
        )
      : typeof course.ratings === "number"
      ? course.ratings
      : typeof course.rating === "number"
      ? course.rating
      : 0;

  const reviewsCount =
    course.reviewCount !== undefined && course.reviewCount !== null
      ? course.reviewCount
      : course.numOfReviews ?? course.numRatings ?? (Array.isArray(course.ratings) ? course.ratings.length : 0);
  const instructorName = course.creator?.name ?? course.instructor?.name ?? "Instructor";
  const totalHours = course.totalDurationInSeconds 
    ? Math.round(course.totalDurationInSeconds / 3600) 
    : (course.lectures?.length ? Math.max(1, Math.round(course.lectures.length * 0.5)) : 0);
  const totalLectures = course.totalLectures ?? (course.lectures?.length || 0);
  const courseLevel = course.level ?? "All Levels";

  // --- Primary Logic Switch ---
  // If the user has purchased the course, show the "Learning Portal" view.
  if (course.isPurchased) {
    const progressPercent = course.progress || 0;
    
    return (
      <Card className="overflow-hidden rounded-xl border bg-white shadow-lg h-full flex flex-col transition-transform duration-300 hover:-translate-y-1.5">
        <Link
          to={`/course-detail/${course._id}/content`}
          className="group flex flex-col h-full"
        >
          <div className="relative">
            <img
              src={course.thumbnail || "/default-course-thumbnail.jpg"}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <PlayCircle className="w-16 h-16 text-white/90" />
            </div>
          </div>
          <CardHeader className="px-4 pt-4 pb-2">
            <h3 className="font-light text-3xl leading-tight line-clamp-2">
              {course.title}
            </h3>
          </CardHeader>
          <CardContent className="px-4 py-2 flex-1">
            <div className="w-full">
              <span className="text-base text-gray-500 font-light mb-1 block">
                Your Progress
              </span>
              <Progress value={progressPercent} className="h-2 rounded" />
              <p className="text-base text-gray-600 mt-1.5">
                {progressPercent}% Complete
              </p>
            </div>
          </CardContent>
          <CardFooter className="px-4 pb-4 mt-auto">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-light text-xl py-3">
              Continue Learning
            </Button>
          </CardFooter>
        </Link>
      </Card>
    );
  }

  // --- Fallback "For Sale" View with Hover Popover ---
  return (
    <Popover open={showDetails} onOpenChange={setShowDetails}>
      <PopoverAnchor asChild>
        <Link
          to={`/course/${course.slug || course._id}`}
          className="group relative h-full block"
          ref={cardRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex flex-col text-left cursor-pointer transition-all bg-white relative rounded-none overflow-hidden h-full">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden shrink-0">
              <img
                src={course.thumbnail || "/default-course-thumbnail.jpg"}
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Course details */}
            <div className="pt-2 px-1 pb-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-[15px] text-[#2d2f31] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
                  {course.title || course.courseTitle}
                </h3>
                <p className="text-[12px] text-[#6a6f73] line-clamp-1 truncate">
                  {instructorName}
                </p>
                <div className="flex items-center flex-wrap">
                  {ratingValue > 0 && (
                    <>
                      <span className="text-[14px] font-semibold text-[#b4690e] mr-1">
                        {ratingValue.toFixed(1)}
                      </span>
                      <div className="flex items-center text-[#b4690e]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.round(ratingValue)
                                ? "fill-current text-[#b4690e]"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  <span className="text-[12px] text-[#6a6f73] ml-1">
                    ({reviewsCount.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="font-semibold text-[16px] text-[#2d2f31]">
                    Rs {course.price?.current ?? course.coursePrice ?? "Free"}
                  </span>
                  {hasDiscount && (
                    <span className="text-[14px] line-through text-[#6a6f73]">
                      Rs {course.price?.original}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges block */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {course.isBestseller || (ratingValue >= 4.6 && reviewsCount > 0) ? (
                  <span className="inline-block bg-[#eceb98] text-[#3d3c0a] font-semibold text-[12px] px-2 py-0.5 rounded-sm">
                    Bestseller
                  </span>
                ) : course.isHotAndNew ? (
                  <span className="inline-block bg-[#fbebee] text-[#b32d0f] font-semibold text-[12px] px-2 py-0.5 rounded-sm">
                    Hot & New
                  </span>
                ) : (
                  <span className="inline-block bg-[#ece5f8] text-[#401b9c] font-semibold text-[12px] px-2 py-0.5 rounded-sm">
                    Premium
                  </span>
                )}
              </div>
            </div>
          </div>
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
            <h4 className="font-light text-[#2d2f31] text-xl leading-snug line-clamp-3">
              {course.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {course.isBestseller && (
                <span className="bg-[#ecebfa] text-[#2d2f31] font-light px-2 py-0.5 rounded text-[10px] uppercase">
                  Bestseller
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-light bg-[#ecebfa] text-[#5624d0]">
                Premium
              </span>
            </div>
          </div>

          <div className="text-base text-[#6a6f73] space-y-1">
            <p className="font-light text-[#38755b]">{formatUpdatedDate(course.updatedAt)}</p>
            <p>{totalHours} total hours • {courseLevel} • Subtitles</p>
          </div>

          <p className="text-base text-[#2d2f31] line-clamp-2 leading-relaxed">
            {course.subtitle || course.description || "Master this subject with our comprehensive, step-by-step curriculum."}
          </p>

          {/* Learnings bullet points */}
          <div className="pt-1">
            <h5 className="font-semibold text-[14px] text-[#2d2f31] mb-2">What you'll learn</h5>
            <ul className="space-y-1.5 text-[13px] text-[#2d2f31]">
              {bulletPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#2d2f31] font-semibold mt-0.5">✓</span>
                  <span className="line-clamp-2">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions Button Bar */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleCartAction}
              disabled={isAddingToCart}
              className="flex-1 h-11 bg-[#a435f0] text-white hover:bg-[#8710d8] font-light text-lg rounded-none shadow-none"
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

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    price: PropTypes.oneOfType([
      PropTypes.shape({
        current: PropTypes.number,
        original: PropTypes.number,
      }),
      PropTypes.number,
    ]),
    progress: PropTypes.number,
    isPurchased: PropTypes.bool,
    level: PropTypes.string,
    ratings: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
    numOfReviews: PropTypes.number,
    enrolledStudents: PropTypes.any,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    learnings: PropTypes.arrayOf(PropTypes.string),
    totalDurationInSeconds: PropTypes.number,
    totalLectures: PropTypes.number,
    creator: PropTypes.shape({
      name: PropTypes.string,
      photoUrl: PropTypes.string,
    }),
  }).isRequired,
  showRecommendationBadge: PropTypes.bool,
};

export default CourseCard;