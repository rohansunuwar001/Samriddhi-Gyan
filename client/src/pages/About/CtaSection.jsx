import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // React Router DOM for navigation

// A simple SVG spinner component for the loading state
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const CtaSection = ({ description, buttonText, buttonHref }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleButtonClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    navigate(buttonHref);
  };

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
          {description}
        </p>
        <div className="mt-10">
          <button
            onClick={handleButtonClick}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-bold rounded-md shadow-sm hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner /> : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Prop types for reusability and type checking
CtaSection.propTypes = {
  description: PropTypes.string,
  buttonText: PropTypes.string,
  buttonHref: PropTypes.string,
};

// Default props
CtaSection.defaultProps = {
  description: 'We help organizations of all types and sizes prepare for the path ahead — wherever it leads. Our curated collection of business and technical courses help companies, governments, and nonprofits go further by placing learning at the center of their strategies.',
  buttonText: 'Learn more',
  buttonHref: '/blog',
};

export default CtaSection;
