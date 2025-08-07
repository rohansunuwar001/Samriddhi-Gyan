import PropTypes from "prop-types";
const TitleandHeader = ({ first, second }) => {
  return (
    <div className="max-w-3xl">
      {/* Main heading with a serif font, large size, and bold weight */}
      <h2 className="font-serif text-4xl font-bold text-slate-800 mb-4">
        {first}
      </h2>

      {/* Subheading with a sans-serif font, smaller size, and normal weight */}
      <h3 className="font-sans text-xl font-normal text-slate-600">
        {second}
      </h3>
    </div>
  );
};

TitleandHeader.propTypes = {
  first: PropTypes.string.isRequired,
  second: PropTypes.string.isRequired,
};

export default TitleandHeader