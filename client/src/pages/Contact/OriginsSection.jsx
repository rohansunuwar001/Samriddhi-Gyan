
import PropTypes from 'prop-types';

// --- The Dynamic Component ---
const OriginsSection = ({ data }) => {
  // A fallback in case no data is provided.
  if (!data) {
    return null;
  }

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container mx-auto px-6">
        {/* Centering wrapper with a max-width for readability */}
        <div className="max-w-prose mx-auto text-center">

          {/* Section Title */}
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
            {data.title}
          </h2>

          {/* Dynamic Paragraphs */}
          {data.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-lg text-gray-700 leading-relaxed"
            >
              {paragraph}
              {/* Add space between paragraphs but not after the last one */}
              {index < data.paragraphs.length - 1 && <br />}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};


OriginsSection.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    paragraphs: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};



// You would typically export only the main component
export default OriginsSection;