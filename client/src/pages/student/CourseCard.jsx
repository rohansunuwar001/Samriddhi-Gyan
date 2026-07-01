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

  const ratingValue = course.ratings ?? course.rating ?? 4.5;
  const reviewsCount = course.numOfReviews ?? course.numRatings ?? 2500;
  const instructorName = course.creator?.name ?? course.instructor?.name ?? "Instructor";
  const totalHours = course.totalDurationInSeconds 
    ? Math.round(course.totalDurationInSeconds / 3600) 
    : 45;
  const totalLectures = course.totalLectures ?? 120;
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
            <h3 className="font-bold text-xl leading-tight line-clamp-2">
              {course.title}
            </h3>
          </CardHeader>
          <CardContent className="px-4 py-2 flex-1">
            <div className="w-full">
              <span className="text-xs text-gray-500 font-semibold mb-1 block">
                Your Progress
              </span>
              <Progress value={progressPercent} className="h-2 rounded" />
              <p className="text-xs text-gray-600 mt-1.5">
                {progressPercent}% Complete
              </p>
            </div>
          </CardContent>
          <CardFooter className="px-4 pb-4 mt-auto">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-3">
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
          to={`/course-detail/${course._id}`}
          className="group relative h-full block"
          ref={cardRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Card className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col hover:scale-[1.025]">
            <div className="relative overflow-hidden rounded-t-2xl">
              <img
                src={course.thumbnail || "/default-course-thumbnail.jpg"}
                alt={course.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {hasDiscount && (
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2.5 py-1 text-xs font-bold shadow-lg">
                  {discountPercentage}% OFF
                </Badge>
              )}
              <Badge className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white px-2.5 py-1 text-xs font-bold shadow-lg">
                {courseLevel}
              </Badge>

              {showRecommendationBadge && (
                <Badge className="absolute bottom-3 right-3 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                  Recommended
                </Badge>
              )}
            </div>

            <CardHeader className="px-5 pt-5 pb-3">
              <h3 className="font-extrabold text-xl leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors duration-200">
                {course.title}
              </h3>
            </CardHeader>

            <CardContent className="px-5 py-2 flex-1">
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                  <span className="ml-1 text-sm font-semibold text-gray-800">
                    {ratingValue.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">
                    ({reviewsCount})
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="ml-1 text-sm text-gray-800 font-medium">
                    {enrolledCount} students
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5 text-sm text-gray-600">
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

            <CardFooter className="px-5 pb-5 pt-4 mt-auto border-t border-gray-100">
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-2xl text-blue-800">
                      Rs{course.price?.current}
                    </span>
                    {hasDiscount && (
                      <span className="text-gray-500 line-through text-base font-medium">
                        Rs{course.price?.original}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 border-2 border-white shadow">
                    <AvatarImage
                      src={
                        course.creator?.photoUrl || "https://github.com/shadcn.png"
                      }
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
            <h4 className="font-extrabold text-[#2d2f31] text-base leading-snug line-clamp-3">
              {course.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {course.isBestseller && (
                <span className="bg-[#ecebfa] text-[#2d2f31] font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                  Bestseller
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#ecebfa] text-[#5624d0]">
                Premium
              </span>
            </div>
          </div>

          <div className="text-xs text-[#6a6f73] space-y-1">
            <p className="font-semibold text-[#38755b]">{formatUpdatedDate(course.updatedAt)}</p>
            <p>{totalHours} total hours • {courseLevel} • Subtitles</p>
          </div>

          <p className="text-xs text-[#2d2f31] line-clamp-2 leading-relaxed">
            {course.subtitle || course.description || "Master this subject with our comprehensive, step-by-step curriculum."}
          </p>

          {/* Learnings bullet points */}
          <ul className="space-y-1.5 text-xs text-[#2d2f31]">
            {bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5 font-bold">✓</span>
                <span className="line-clamp-2">{point}</span>
              </li>
            ))}
          </ul>

          {/* Quick Actions Button Bar */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleCartAction}
              disabled={isAddingToCart}
              className="flex-1 h-11 bg-[#a435f0] text-white hover:bg-[#8710d8] font-bold text-sm rounded-none shadow-none"
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
    price: PropTypes.shape({
      current: PropTypes.number.isRequired,
      original: PropTypes.number,
    }),
    progress: PropTypes.number,
    isPurchased: PropTypes.bool,
    level: PropTypes.string,
    ratings: PropTypes.number,
    numOfReviews: PropTypes.number,
    enrolledStudents: PropTypes.array,
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