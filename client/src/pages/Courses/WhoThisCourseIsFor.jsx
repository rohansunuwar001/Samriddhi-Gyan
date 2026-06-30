import PropTypes from 'prop-types';

const WhoThisCourseIsFor = ({ audience }) => {
    if (!Array.isArray(audience) || audience.length === 0) return null;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Who this course is for:</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
                {audience.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

WhoThisCourseIsFor.propTypes = {
    audience: PropTypes.arrayOf(PropTypes.string),
};

export default WhoThisCourseIsFor;
