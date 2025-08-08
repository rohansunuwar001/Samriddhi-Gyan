import PropsType from 'prop-types';
import { FaBullhorn, FaChartBar, FaCloud, FaCode, FaGamepad, FaLightbulb, FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// Icon mapping remains the same
const iconMap = {
  cloud: { icon: <FaCloud />, bg: 'bg-green-500' },
  data: { icon: <FaChartBar />, bg: 'bg-purple-500' },
  marketing: { icon: <FaBullhorn />, bg: 'bg-indigo-500' },
  fullstack: { icon: <FaCode />, bg: 'bg-yellow-500' },
  game: { icon: <FaGamepad />, bg: 'bg-teal-500' },
  product: { icon: <FaLightbulb />, bg: 'bg-orange-500' },
};

const CareerCard = ({ career }) => {
  const navigate = useNavigate();

  const { icon, bg } = iconMap[career.iconKey] || {
    icon: <FaLightbulb />,
    bg: 'bg-gray-400',
  };

  const handleClick = () => {
    navigate(`/course-detail/${career._id}`);
  }

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden transition-shadow duration-300 hover:shadow-xl"
    >
      <div className={`relative h-52 w-full ${bg}`}>
        <div className="absolute inset-0 flex items-center justify-start p-6 text-white/20 text-8xl z-0">
          {icon}
        </div>
        <div className="relative w-full h-full z-10">
          {/* Use standard <img> tag instead of next/image */}
          <img
            src={career.courseThumbnail}
            alt={career.courseTitle}
            className="w-full h-full object-contain object-bottom-right" // Use Tailwind classes for object-fit and object-position
          />
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900">{career.courseTitle}</h3>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-1 border border-gray-300 rounded-md px-2 py-1">
            <FaStar className="text-yellow-500" />
            <span>{career.rating || "4.5"}</span>
          </div>
          <div className="border border-gray-300 rounded-md px-2 py-1">
            {career.courseLevel || "N/A"} ratings
          </div>
          <div className="border border-gray-300 rounded-md px-2 py-1">
            {career.originalPrice || "N/A"} total hours
          </div>
        </div>
      </div>
    </div>
  );
};

CareerCard.propTypes = {
  career: PropsType.shape({
    _id: PropsType.string.isRequired,
    courseTitle: PropsType.string.isRequired,
    courseThumbnail: PropsType.string.isRequired,
    iconKey: PropsType.string.isRequired,
    rating: PropsType.number,
    courseLevel: PropsType.string,
    originalPrice: PropsType.number,
  }).isRequired,
};


export default CareerCard;