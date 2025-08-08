import PropTypes from 'prop-types';
import { FaUserCircle } from 'react-icons/fa';
import StarRating from './StarRating'; // Import the StarRating component
const ReviewCard = ({ review }) => {

    console.log("Review Data:", review);
  // Fallback to a default avatar if photoUrl is missing or empty
  const avatar = review.user?.photoUrl ? (
    <img src={review.user.photoUrl} alt={review.user.name} className="h-11 w-11 rounded-full object-cover" />
  ) : (
    <FaUserCircle className="h-11 w-11 text-gray-400" />
  );

  // Format the date to be more readable (e.g., "August 8, 2025")
  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">{avatar}</div>
        <div className="flex-1">
          <p className="text-md font-semibold text-gray-900">{review.user?.name || 'Anonymous User'}</p>
          <div className="flex items-center gap-3 mt-1">
            <StarRating rating={review.rating} />
            <p className="text-sm text-gray-500">{reviewDate}</p>
          </div>
          <p className="mt-3 text-gray-700 whitespace-pre-wrap">{review.comment}</p>
        </div>
      </div>
    </div>
  );
};

ReviewCard.propTypes = {
  review: PropTypes.shape({
    user: PropTypes.shape({
      name: PropTypes.string,
      photoUrl: PropTypes.string,
    }),
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default ReviewCard;