import PropTypes from 'prop-types';

const Requirements = ({ requirements }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">Requirements</h2>
        {Array.isArray(requirements) && requirements.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
                {requirements.map((req, index) => <li key={index}>{req}</li>)}
            </ul>
        ) : (
            <p className="text-gray-500">No requirements specified for this course.</p>
        )}
    </div>
);

Requirements.propTypes = {
    requirements: PropTypes.arrayOf(PropTypes.string),
};

export default Requirements;