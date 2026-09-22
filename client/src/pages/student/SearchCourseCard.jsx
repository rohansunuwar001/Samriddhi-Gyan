import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Loader2, Check } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useAddToCartMutation, useGetCartQuery } from "@/features/api/cartApi";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import * as PopoverPrimitive from "@radix-ui/react-popover";

const SearchCourseCard = ({ course }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((store) => store.auth);

  const [showPopover, setShowPopover] = useState(false);
  const [popoverSide, setPopoverSide] = useState("right");
  const cardRef = useRef(null);
  const enterTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const isCourseInCart = cartData?.cart?.some((item) => item._id === course._id);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      if (spaceOnRight < 340) {
        setPopoverSide("left");
      } else {
        setPopoverSide("right");
      }
    }

    enterTimeoutRef.current = setTimeout(() => {
      setShowPopover(true);
    }, 60);
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);

    leaveTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
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
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add to cart.");
    }
  };

  const ratingValue = course.ratings ?? course.rating ?? 4.5;
  const reviewsCount = course.numOfReviews ?? course.numRatings ?? (Math.floor(ratingValue * 850) + 120);
  const instructorName = course.creator?.name ?? course.instructor?.name ?? "Samriddhi Expert";
  const courseLevel = course.level ?? "Intermediate";
  const durationHours = course.totalDurationInSeconds
    ? Math.round(course.totalDurationInSeconds / 3600)
    : course.totalHours ?? 15;
  const totalLectures = course.totalLectures ?? 135;
  const totalQuestions = course.totalQuestions ?? (course.isPracticeExam ? 360 : null);

  const currentPrice = course.price?.current ?? course.coursePrice ?? 1299;
  const originalPrice = course.price?.original;
  const hasDiscount = originalPrice && originalPrice > currentPrice;

  // Extract "What you'll learn" bullet points
  const rawLearnings = Array.isArray(course.learnings) && course.learnings.length > 0
    ? course.learnings
    : Array.isArray(course.whatYouWillLearn) && course.whatYouWillLearn.length > 0
    ? course.whatYouWillLearn
    : [];

  const learningPoints = rawLearnings.length > 0
    ? rawLearnings.slice(0, 3)
    : [
        `Choose the right architecture patterns, loop control flows, and escalation strategies for ${course.title || course.courseTitle || "this topic"}.`,
        "Evaluate real-world tool and resource designs, distinguishing effective patterns from common anti-patterns.",
        "Build end-to-end production projects with best practices, plan mode, and hands-on code walkthroughs.",
      ];

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      <PopoverAnchor asChild>
        <div
          ref={cardRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="group flex flex-col justify-between h-full bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden text-left relative"
        >
          <Link
            to={`/course-detail/${course._id}`}
            className="flex flex-col flex-1"
            aria-label={`View ${course.title || course.courseTitle} details`}
          >
            {/* 1. Thumbnail image with 16:9 aspect ratio */}
            <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
              <img
                src={course.thumbnail || course.courseThumbnail || "/placeholder_course.png"}
                alt={course.title || course.courseTitle}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            {/* 2. Course Meta Information */}
            <div className="p-4 flex flex-col flex-1 justify-between space-y-2">
              <div className="space-y-1">
                {/* Title */}
                <h3 className="font-semibold text-[16px] text-[#2d2f31] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
                  {course.title || course.courseTitle}
                </h3>

                {/* Subtitle / Short Description */}
                <p className="text-[13px] text-[#6a6f73] line-clamp-2 leading-relaxed">
                  {course.subtitle || course.description || "Master all domains with scenario-based practice tests, detailed explanations, and labs."}
                </p>

                {/* Instructor */}
                <p className="text-[12px] text-[#6a6f73] line-clamp-1 truncate pt-0.5">
                  {instructorName}
                </p>

                {/* Badges, Ratings, and Stats Row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[12px]">
                  {course.isBestseller || ratingValue >= 4.6 ? (
                    <span className="inline-block bg-[#eceb98] text-[#3d3c0a] font-semibold text-[11px] px-2 py-0.5 rounded-sm">
                      Bestseller
                    </span>
                  ) : course.isHotAndNew ? (
                    <span className="inline-block bg-[#fbebee] text-[#b32d0f] font-semibold text-[11px] px-2 py-0.5 rounded-sm">
                      Hot & New
                    </span>
                  ) : null}

                  {/* Star Rating */}
                  <div className="flex items-center gap-1 font-semibold text-[#b4690e]">
                    <Star className="w-3.5 h-3.5 fill-[#b4690e] text-[#b4690e]" />
                    <span>{ratingValue.toFixed(1)}</span>
                  </div>

                  {/* Reviews count badge */}
                  <span className="border border-gray-200 text-[#6a6f73] px-1.5 py-0.5 rounded-sm">
                    {reviewsCount.toLocaleString()} ratings
                  </span>

                  {/* Questions or Hours badge */}
                  {totalQuestions ? (
                    <span className="border border-gray-200 text-[#6a6f73] px-1.5 py-0.5 rounded-sm">
                      {totalQuestions} questions
                    </span>
                  ) : (
                    <span className="border border-gray-200 text-[#6a6f73] px-1.5 py-0.5 rounded-sm">
                      {durationHours} total hours • {totalLectures} lectures
                    </span>
                  )}

                  {/* Level Badge */}
                  <span className="border border-gray-200 text-[#6a6f73] px-1.5 py-0.5 rounded-sm capitalize">
                    {courseLevel}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* 3. Card Footer with Price and Add to cart */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-[18px] text-[#2d2f31]">
                Rs {currentPrice?.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-[13px] line-through text-[#6a6f73]">
                  Rs {originalPrice?.toLocaleString()}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCartAction}
              disabled={isAddingToCart}
              className="border border-[#a435f0] text-[#a435f0] hover:bg-purple-50 font-semibold text-[13px] px-3.5 py-1.5 rounded-sm transition-all duration-150 shrink-0 flex items-center justify-center min-w-[95px]"
            >
              {isAddingToCart ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCourseInCart ? (
                "In cart"
              ) : (
                "Add to cart"
              )}
            </button>
          </div>
        </div>
      </PopoverAnchor>

      {/* 4. "What you'll learn" Floating Hover Card matching the Udemy screenshot */}
      <PopoverContent
        side={popoverSide}
        align="center"
        sideOffset={12}
        className="z-50 w-[320px] sm:w-[350px] rounded-lg border border-gray-200 bg-white p-5 text-[#2d2f31] shadow-2xl outline-none hidden md:block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <PopoverPrimitive.Arrow className="fill-white stroke-gray-200 stroke-1" width={12} height={6} />
        <div className="space-y-3">
          <h4 className="font-semibold text-[16px] text-[#2d2f31] leading-snug">
            What you'll learn
          </h4>
          <ul className="space-y-2.5 text-[13px] text-[#2d2f31] leading-relaxed">
            {learningPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="text-[#2d2f31] font-semibold mt-0.5 shrink-0">✓</span>
                <span className="line-clamp-3">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(SearchCourseCard);

