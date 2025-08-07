// File Path: app/components/LearningGoalsSection.js
import PropTypes from "prop-types";


import { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { PiCertificateBold, PiChartBarBold, PiCodepenLogoBold, PiShareNetworkBold } from 'react-icons/pi';

// --- Data for the feature cards ---
// Storing data separately makes the component cleaner and easier to update.
const features = [
  {
    id: 'training',
    icon: <PiCodepenLogoBold />,
    title: 'Hands-on training',
    description: 'Upskill effectively with AI-powered coding exercises, practice tests, and quizzes.',
    cta: { text: 'Explore features', href: '#' },
    tag: null,
  },
  {
    id: 'certification',
    icon: <PiCertificateBold />,
    title: 'Certification prep',
    description: 'Prep for industry-recognized certifications by solving real-world challenges and earn badges along the way.',
    cta: { text: 'Explore courses', href: '#' },
    tag: null,
  },
  {
    id: 'analytics',
    icon: <PiChartBarBold />,
    title: 'Insights and analytics',
    description: 'Fast-track goals with advanced insights plus a dedicated customer success team to help drive effective learning.',
    cta: { text: 'Find out more', href: '#' },
    tag: 'Enterprise Plan',
  },
  {
    id: 'customizable',
    icon: <PiShareNetworkBold />,
    title: 'Customizable content',
    description: 'Create tailored learning paths for team and organization goals and even host your own content and resources.',
    cta: { text: 'Find out more', href: '#' },
    tag: 'Enterprise Plan',
  },
];


const LearningGoalsSection = () => {
  // State to track which feature is currently active
  const [activeFeatureId, setActiveFeatureId] = useState(features[0].id);

  // --- Sub-component for a single feature card ---
  const FeatureCard = ({ feature, isActive, onClick }) => {
    const { icon, title, description, cta, tag } = feature;
    const activeClasses = isActive ? 'border-purple-600 shadow-lg' : 'border-gray-200';

    return (
      <button
        onClick={onClick}
        className={`w-full text-left bg-white rounded-lg p-6 border-2 transition-all duration-300 ${activeClasses}`}
      >
        <div className="flex items-start gap-5">
          <div className="text-2xl text-gray-800 mt-1">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-gray-900">{title}</h3>
              {tag && (
                <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded">
                  {tag}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-4">{description}</p>
            <a href={cta.href} className="font-bold text-purple-600 hover:text-purple-800 flex items-center gap-2 text-sm">
              <span>{cta.text}</span>
              <FaArrowRight size={12} />
            </a>
          </div>
        </div>
      </button>
    );
  };


  return (
    <section className="bg-white font-sans py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl text-center font-serif text-gray-900 mb-12">
          Learning focused on your goals
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Feature Cards */}
          <div className="space-y-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isActive={activeFeatureId === feature.id}
                onClick={() => setActiveFeatureId(feature.id)}
              />
            ))}
          </div>

          {/* Right Column: Image Display */}
          <div className="relative mt-4 lg:mt-0">
            {/* This is a single placeholder image. 
                For a real implementation, you might map `activeFeatureId` to different images. */}
            <img
              src="/rightside.webp" // IMPORTANT: Replace with the path to your image in the `public` folder
              alt="An example of a learning assessment showing a score and question details."
              width={800}
              height={750}
              className="rounded-xl shadow-2xl ring-1 ring-gray-900/10"
            />
          </div>

        </div>
      </div>
    </section>
  );
};
LearningGoalsSection.propTypes = {
  feature: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    cta: PropTypes.shape({
      text: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }).isRequired,
    tag: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default LearningGoalsSection;