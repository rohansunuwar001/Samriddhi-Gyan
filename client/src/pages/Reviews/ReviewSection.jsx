import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PropTypes from 'prop-types';
import { FaStar } from 'react-icons/fa';
import StarRating from './StarRating'; // adjust path if needed

const ReviewsSection = ({ reviews = [] }) => {
  // Render a message if there are no reviews
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div className="mt-12 bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Student Reviews</h2>
        <p className="mt-4 text-gray-500">This course doesn't have any reviews yet. Be the first to leave one!</p>
      </div>
    );
  }

  const { ratings, numOfReviews } = reviews[0].course; // Assuming all reviews belong to the same course

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
          <Card key={review._id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                <span className="text-sm text-gray-600">{review.user?.name}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-gray-800">{review.comment}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

ReviewsSection.propTypes = {
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
};

export default ReviewsSection;