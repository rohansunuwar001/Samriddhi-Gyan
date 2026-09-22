import PropTypes from 'prop-types';

const WhoThisCourseIsFor = ({ audience }) => {
    if (!Array.isArray(audience) || audience.length === 0) return null;

    return (
        <div className="font-sans">
            <h2 className="text-[24px] font-semibold text-[#1c1d1f] mb-3">Who this course is for:</h2>
            <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#2d2f31] leading-relaxed">
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
