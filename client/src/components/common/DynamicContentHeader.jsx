import PropTypes from "prop-types";


const DynamicContentHeader = ({ title, description }) => {
  return (
    <div className="bg-white flex items-center justify-center py-20">
      <div className="text-center max-w-4xl px-5">
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          {title}
        </h1>
        <p className="text-xl leading-relaxed text-gray-600 max-w-2xl mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
};

DynamicContentHeader.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
   
};

export default DynamicContentHeader;