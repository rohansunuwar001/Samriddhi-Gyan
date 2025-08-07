import { Star } from "lucide-react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
const CourseCard = ({ course }) => {
  // --- Future-Proof Data ---
  const rating = course.rating || 4.5; // Placeholder
  const reviewsCount = course.reviewsCount || 175; // Placeholder
  const originalPrice = course.originalPrice || null; // Placeholder
  const isNew = course.isNew || false;

  // Helper to render star ratings
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.round(rating) ? "text-yellow-500 fill-current" : "text-gray-300"}
      />
    ));
  };

  // --- **THE FIX IS HERE** ---
  // Safely determine the display price.
  const displayPrice = typeof course.price === 'number'
    ? `$${course.price.toFixed(2)}`
    : 'Free'; // Show "Free" if price is not a number

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="flex-shrink-0 w-full cursor-pointer group"
    >
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={course.thumbnail?.url || "/placeholder.png"}
          alt={course.title || 'Course thumbnail'}
          className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isNew && (
           <div className="absolute top-3 left-3 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            Hot & New
           </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="text-md font-bold text-gray-900 dark:text-white truncate group-hover:text-primary">
          {/* Add a fallback for the title as well, just in case */}
          {course.title || 'Untitled Course'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {course.author?.name || 'Unknown Author'}
        </p>

        {course.rating && (
          <div className="flex items-center mt-1.5 gap-1">
            <span className="font-bold text-sm text-yellow-600">{rating.toFixed(1)}</span>
            <div className="flex">{renderStars()}</div>
            <span className="text-sm text-gray-400">({reviewsCount.toLocaleString()})</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-1.5">
           {/* Use the safe displayPrice variable */}
          <p className="text-md font-bold text-gray-900 dark:text-white">{displayPrice}</p>
          {originalPrice && (
            <p className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};


CourseCard.propTypes = {
  course: PropTypes.shape({
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.shape({
      url: PropTypes.string
    }),
    author: PropTypes.shape({
        name: PropTypes.string
    }),
    rating: PropTypes.number,
    reviewsCount: PropTypes.number,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    isNew: PropTypes.bool
    }).isRequired
};


export default CourseCard;