import PropTypes from 'prop-types';

const Requirements = ({ requirements }) => (
    <div className="font-sans">
        <h2 className="text-[24px] font-semibold text-[#1c1d1f] mb-3">Requirements</h2>
        {Array.isArray(requirements) && requirements.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2 text-[14px] text-[#2d2f31] leading-relaxed">
                {requirements.map((req, index) => <li key={index}>{req}</li>)}
            </ul>
        ) : (
            <p className="text-[14px] text-gray-500 font-light">No requirements specified for this course.</p>
        )}
    </div>
);

Requirements.propTypes = {
    requirements: PropTypes.arrayOf(PropTypes.string),
};

export default Requirements;