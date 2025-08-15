// src/components/Reviews/ReviewsSection.jsx

import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FaStar } from "react-icons/fa";
import AddReviewForm from "./AddReviewform";
import StarRating from "./StarRating"; // Assuming you have this component
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar for replies

/**
 * A self-contained component for displaying and managing course reviews,
 * including showing instructor replies.
 */
const ReviewsSection = ({ course }) => {
  // Safeguard: Do not render if the course object isn't available yet.
  if (!course) {
    return null;
  }
console.log("Course review data:", course);
  // Safely destructure all properties from the 'course' object.
  const {
    reviews = [],
    _id: courseId,
    allowReview = false,
    isEnrolled = false,
    numOfReviews = 0,
    ratings = 0,
    creator, // Destructure the creator for use in replies
  } = course;

  return (
    <section aria-labelledby="reviews-heading">
      <h2
        id="reviews-heading"
        className="text-2xl font-bold tracking-tight text-gray-900 mb-6"
      >
        Student Feedback
      </h2>

      {/* --- Add Review Form Box --- */}
      <div className="mb-8 p-4 bg-slate-50 rounded-md">
        {allowReview ? (
          <AddReviewForm courseId={courseId} />
        ) : isEnrolled ? (
          <p className="text-center text-gray-700">
            Please complete at least 80% of the course to leave a review.
          </p>
        ) : (
          <p className="text-center text-gray-700">
            You must be enrolled in this course to leave a review.
          </p>
        )}
      </div>

      {/* --- Display Existing Reviews and Replies --- */}
      {reviews.length === 0 ? (
        <p className="mt-4 text-center text-gray-500">
          No reviews yet. Be the first to share your thoughts!
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold text-gray-800">
              {ratings.toFixed(1)}
            </span>
            <FaStar className="text-yellow-500 text-xl" />
            <span className="text-lg text-gray-600">
              Course Rating ({numOfReviews} reviews)
            </span>
          </div>

          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review._id} className="border">
                {/* --- Student's Review Part --- */}
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                  <Avatar>
                    <AvatarImage src={review.user?.photoUrl} />
                    <AvatarFallback>
                      {review.user?.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{review.user?.name}</p>
                    <StarRating rating={review.rating} />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-gray-800 leading-relaxed">
                    {review.comment}
                  </p>

                  {/* --- ⭐ NEW: Instructor's Reply Part (Conditional Render) --- */}
                  {review.reply && (
                    <div className="mt-4 ml-4 p-4 bg-slate-50 border-l-4 border-purple-200 rounded-r-md">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={creator?.photoUrl} />
                          <AvatarFallback>
                            {creator?.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">
                            {creator?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Instructor
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed mt-2 text-sm">
                        {review.reply}
                      </p>
                    </div>
                  )}
                  {/* --- End of Reply Part --- */}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

// --- Updated PropType Definitions ---
ReviewsSection.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    allowReview: PropTypes.bool,
    isEnrolled: PropTypes.bool,
    ratings: PropTypes.number,
    numOfReviews: PropTypes.number,
    // Add the instructor's details, as they are now used
    creator: PropTypes.shape({
      name: PropTypes.string,
      photoUrl: PropTypes.string,
    }),
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        user: PropTypes.shape({
          name: PropTypes.string,
          photoUrl: PropTypes.string,
        }),
        rating: PropTypes.number.isRequired,
        comment: PropTypes.string,
        // Add the optional 'reply' field
        reply: PropTypes.string,
      })
    ),
  }).isRequired,
};

export default ReviewsSection;
