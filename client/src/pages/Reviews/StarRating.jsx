import { FaRegStar, FaStar } from 'react-icons/fa';
import PropsType from 'prop-types';
const StarRating = ({ rating = 0 }) => {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const emptyStars = totalStars - fullStars;

  return (
    <div className="flex items-center text-yellow-500">
      {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
      {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} />)}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropsType.number,
};

export default StarRating;