"use client"

import PropTypes from 'prop-types';

// SVG for the arrow icon to ensure it's sharp and clean
const ArrowRightIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" 
      clipRule="evenodd" 
    />
  </svg>
);

ArrowRightIcon.propTypes = {
    className: PropTypes.string,
};

// Data for the info cards. You can replace this with data from an API.
// Note: Tailwind CSS classes for colors are included directly for safety with purging.
const infoData = [
    {
        title: 'Work with us',
        description: "As a company, we're all learners and innovators. We live out our values every day to create a culture that is diverse, inclusive, and committed to helping employees thrive.",
        linkText: 'Join our team',
        linkHref: '#',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-500',
    },
    {
        title: 'See our research',
        description: "We're committed to improving lives through learning. Dig into our original research to learn about the forces that are shaping the modern workplace.",
        linkText: 'Learn more',
        linkHref: '#',
        borderColor: 'border-indigo-600',
        textColor: 'text-indigo-600',
    },
    {
        title: 'Read our blog',
        description: 'Want to know what we’ve been up to lately? Check out the company blog to get the scoop on the latest news, ideas and projects, and more.',
        linkText: 'Read now',
        linkHref: '#',
        borderColor: 'border-teal-500',
        textColor: 'text-teal-500',
    },
];

/**
 * A reusable card component for displaying a piece of information.
 */
const InfoCard = ({ title, description, linkText, linkHref, borderColor, textColor }) => (
    <div>
        <hr className={`border-t-4 ${borderColor} w-24 mb-6`} />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed mb-6">{description}</p>
        <a href={linkHref} className={`inline-flex items-center font-bold ${textColor} group`}>
            <span>{linkText}</span>
            <ArrowRightIcon className="w-5 h-5 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
        </a>
    </div>
);

InfoCard.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    linkText: PropTypes.string.isRequired,
    linkHref: PropTypes.string.isRequired,
    borderColor: PropTypes.string.isRequired,
    textColor: PropTypes.string.isRequired,
};

/**
 * A section component that displays multiple InfoCards in a grid.
 */
const InfoSection = () => {
    return (
        <div className="bg-white font-sans">
            <div className="max-w-7xl mx-auto py-16 px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
                    {infoData.map((card) => (
                        <InfoCard
                            key={card.title}
                            title={card.title}
                            description={card.description}
                            linkText={card.linkText}
                            linkHref={card.linkHref}
                            borderColor={card.borderColor}
                            textColor={card.textColor}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InfoSection;