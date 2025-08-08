import PropTypes from 'prop-types';
import { FaStar } from 'react-icons/fa';
import ReviewCard from './ReviewCard';
const ReviewsSection = ({ course }) => {
  const { reviews, ratings, numOfReviews } = course;

  // Render a message if there are no reviews
  if (!reviews || reviews.length === 0) {
    return (
        <div className="mt-12 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Student Reviews</h2>
            <p className="mt-4 text-gray-500">This course doesn`t have any reviews yet. Be the first to leave one!</p>
        </div>
    );
  }

  return (
    <section className="mt-12 bg-white p-6 sm:p-8 rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Student Feedback</h2>
        <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-800">{ratings}</span>
            <FaStar className="text-yellow-500 text-xl" />
            <span className="text-lg text-gray-600">Course Rating ({numOfReviews} reviews)</span>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>
    </section>
  );
};


ReviewsSection.propTypes = {
  course: PropTypes.shape({
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        user: PropTypes.shape({
          name: PropTypes.string,
          photoUrl: PropTypes.string,
        }),
        rating: PropTypes.number.isRequired,
        comment: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ).isRequired,
    ratings: PropTypes.number.isRequired,
    numOfReviews: PropTypes.number.isRequired,
  }).isRequired,
};

export default ReviewsSection;