import PropTypes from 'prop-types';

/**
 * A reusable component for displaying a single statistic.
 */
const StatItem = ({ value, label }) => (
  <div className="text-center">
    <p className="text-4xl md:text-5xl font-bold text-white">{value}</p>
    <p className="text-base text-indigo-200 mt-1">{label}</p>
  </div>
);

StatItem.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

/**
 * A section to showcase key metrics and impact.
 * The layout is designed to handle the specific 4-up top row and 2-up bottom row from the design.
 */
const ImpactSection = ({ title, description, stats }) => {
  // The layout has 4 stats on the top row and the rest centered on the bottom.
  const topRowStats = stats.slice(0, 4);
  const bottomRowStats = stats.slice(4);

  return (
    <div className="bg-indigo-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        {/* Header Content */}
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-white">
            {title}
          </h2>
          <p className="mt-5 text-lg text-indigo-100 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-20 text-white">
          {/* Top Row with 4 items */}
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 md:grid-cols-4">
            {topRowStats.map((stat, index) => (
              <StatItem key={index} value={stat.value} label={stat.label} />
            ))}
          </div>

          {/* Bottom Row (for any remaining items), centered */}
          {bottomRowStats.length > 0 && (
            <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-12 sm:gap-x-24">
              {bottomRowStats.map((stat, index) => (
                <StatItem key={index} value={stat.value} label={stat.label} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ImpactSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};

ImpactSection.defaultProps = {
  title: 'Creating impact around the world',
  description: 'With our global catalog spanning the latest skills and topics, people and organizations everywhere are able to adapt to change and thrive.',
  stats: [
    { value: '85M+', label: 'Learners' },
    { value: '85K', label: 'Instructors' },
    { value: '250K+', label: 'Courses' },
    { value: '1.1B', label: 'Course enrollments' },
    { value: '77', label: 'Languages' },
    { value: '17K+', label: 'Enterprise customers' },
  ],
};

export default ImpactSection;