import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Star, Search, ThumbsUp, ThumbsDown } from "lucide-react";
import AddReviewForm from "./AddReviewform";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ReviewsSection = ({ course, percentCompleted }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [helpfulReviews, setHelpfulReviews] = useState({}); // { reviewId: 'up' | 'down' }

  if (!course) {
    return null;
  }

  const {
    reviews = [],
    _id: courseId,
    allowReview = false,
    isEnrolled = false,
    numOfReviews = 0,
    ratings = 0,
  } = course;

  // Calculate rating breakdown strictly from real server review data
  const breakdown = useMemo(() => {
    if (Array.isArray(reviews) && reviews.length > 0) {
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach((r) => {
        const val = Math.max(1, Math.min(5, Math.round(r.rating || 0)));
        if (counts[val] !== undefined) {
          counts[val]++;
        }
      });
      const total = reviews.length;
      return {
        5: Math.round((counts[5] / total) * 100),
        4: Math.round((counts[4] / total) * 100),
        3: Math.round((counts[3] / total) * 100),
        2: Math.round((counts[2] / total) * 100),
        1: Math.round((counts[1] / total) * 100),
      };
    }
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }, [reviews]);

  const handleHelpfulClick = (reviewId, type) => {
    setHelpfulReviews((prev) => {
      const current = prev[reviewId];
      if (current === type) {
        // Toggle off
        const copy = { ...prev };
        delete copy[reviewId];
        return copy;
      }
      return { ...prev, [reviewId]: type };
    });
  };

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        !searchQuery.trim() ||
        r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRating =
        ratingFilter === "all" ||
        Math.round(r.rating) === parseInt(ratingFilter, 10);

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, ratingFilter]);

  const renderStars = (ratingValue) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= ratingValue;
          const half = !filled && star - 0.5 <= ratingValue;
          return (
            <Star
              key={star}
              className={`h-3.5 w-3.5 ${
                filled
                  ? "fill-[#b4690e] text-[#b4690e]"
                  : half
                  ? "fill-[#b4690e] text-[#b4690e] opacity-70"
                  : "text-gray-300 fill-transparent"
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <section className="space-y-8 select-none bg-white py-2 text-[#2d2f31]">
      <div>
        <h2 className="text-3xl font-light tracking-tight mb-5">Student feedback</h2>

        {/* Rating Grid Breakdown */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-white pb-6">
          {/* Large Average Score */}
          <div className="text-center md:text-left shrink-0">
            <div className="text-[72px] font-light text-[#b4690e] leading-none mb-1">
              {ratings ? ratings.toFixed(1) : "0.0"}
            </div>
            <div className="flex justify-center md:justify-start mb-2">
              {renderStars(ratings)}
            </div>
            <div className="text-base font-light text-[#b4690e] uppercase tracking-wider">
              Course Rating
            </div>
          </div>

          {/* Rating distribution progress bars */}
          <div className="flex-1 w-full max-w-lg space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const pct = breakdown[rating] || 0;
              return (
                <div key={rating} className="flex items-center gap-3 text-base">
                  {/* Progress Bar Line */}
                  <div className="flex-1 bg-gray-200 h-2 rounded-none overflow-hidden relative">
                    <div
                      className="bg-[#6a6f73] h-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Rating stars visualization */}
                  <div className="w-24 shrink-0 flex items-center justify-start gap-1">
                    {renderStars(rating)}
                  </div>
                  {/* Percentage label link */}
                  <button
                    onClick={() => setRatingFilter(rating.toString())}
                    className="w-10 text-left text-[#5624d0] hover:text-[#3b1990] hover:underline font-light shrink-0"
                  >
                    {pct}%
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write a Review Block */}
      <div className="p-5 border border-[#d1d7dc] bg-[#f7f9fa] rounded-none">
        {allowReview ? (
          <AddReviewForm courseId={courseId} />
        ) : isEnrolled ? (
          <p className="text-center text-base text-[#6a6f73] font-light leading-relaxed">
            Please complete at least 80% of the course to leave a review. (Currently at {(percentCompleted || 0).toFixed(0)}%)
          </p>
        ) : (
          <p className="text-center text-base text-[#6a6f73] font-light leading-relaxed">
            You must be enrolled in this course to leave a review.
          </p>
        )}
      </div>

      {/* Reviews Search & Filtration controls */}
      <div className="space-y-4">
        <h3 className="text-2xl font-light">Reviews</h3>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Search Reviews Input bar */}
          <div className="flex items-center max-w-md flex-grow">
            <input
              type="text"
              placeholder="Search reviews"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow border border-[#d1d7dc] px-3.5 py-2.5 text-base outline-none focus:border-[#2d2f31] bg-white text-[#2d2f31] placeholder-gray-400 rounded-none h-10 min-w-0"
            />
            <button className="h-10 w-10 shrink-0 bg-[#2d2f31] hover:bg-black text-white flex items-center justify-center transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Filter ratings dropdown selection */}
          <div className="flex items-center gap-3">
            <span className="text-base font-light text-[#2d2f31] whitespace-nowrap">Filter ratings</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="border border-[#d1d7dc] px-3.5 py-2 text-base outline-none focus:border-[#2d2f31] bg-white text-[#2d2f31] rounded-none h-10 min-w-[120px] font-light cursor-pointer"
            >
              <option value="all">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews feed list */}
      <div className="divide-y divide-[#d1d7dc] border-t border-[#d1d7dc]">
        {filteredReviews.length === 0 ? (
          <p className="py-8 text-center text-base text-gray-500 font-light">
            No reviews match your filter parameters.
          </p>
        ) : (
          filteredReviews.map((review) => {
            const initial = review.user?.name ? review.user.name.slice(0, 2).toUpperCase() : "ST";
            const feedback = helpfulReviews[review._id];

            return (
              <div key={review._id} className="py-6 flex items-start gap-4">
                {/* Avatar with Initials bubble */}
                <Avatar className="h-10 w-10 rounded-full border border-gray-100 shrink-0">
                  <AvatarImage src={review.user?.photoUrl} />
                  <AvatarFallback className="bg-[#2d2f31] text-white text-base font-light rounded-full">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                {/* Content body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-light text-[#2d2f31] truncate">
                      {review.user?.name || "Student"}
                    </h4>
                  </div>

                  {/* Rating Stars and Date relative info */}
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    {review.createdAt && (
                      <span className="text-sm text-[#6a6f73] font-light">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Text Comment body */}
                  <p className="text-base leading-relaxed text-[#2d2f31] font-light pt-1 break-words">
                    {review.comment || "Good"}
                  </p>

                  {/* Helpful question line */}
                  <div className="flex items-center gap-3 text-sm text-[#6a6f73] font-light pt-2">
                    <span>Was this review helpful?</span>
                    
                    <button
                      onClick={() => handleHelpfulClick(review._id, "up")}
                      className={`h-7 w-7 rounded-full border flex items-center justify-center transition-all ${
                        feedback === "up"
                          ? "bg-[#2d2f31] border-[#2d2f31] text-white"
                          : "border-[#d1d7dc] text-[#2d2f31] hover:bg-gray-100"
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => handleHelpfulClick(review._id, "down")}
                      className={`h-7 w-7 rounded-full border flex items-center justify-center transition-all ${
                        feedback === "down"
                          ? "bg-[#2d2f31] border-[#2d2f31] text-white"
                          : "border-[#d1d7dc] text-[#2d2f31] hover:bg-gray-100"
                      }`}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>

                    <button className="hover:underline text-[#2d2f31] ml-1">
                      Report
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

ReviewsSection.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    allowReview: PropTypes.bool,
    isEnrolled: PropTypes.bool,
    ratings: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
    numOfReviews: PropTypes.number,
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        user: PropTypes.shape({
          name: PropTypes.string,
          photoUrl: PropTypes.string,
        }),
        rating: PropTypes.number.isRequired,
        comment: PropTypes.string,
        createdAt: PropTypes.string,
      })
    ),
  }).isRequired,
  percentCompleted: PropTypes.number,
};

export default ReviewsSection;
