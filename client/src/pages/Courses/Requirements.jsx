import PropTypes from 'prop-types';
export const Requirements = ({ requirements }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">Requirements</h2>
        <ul className="list-disc pl-5 space-y-1">
            {requirements.map((req, index) => <li key={index}>{req}</li>)}
        </ul>
    </div>
);

Requirements.propTypes = {
    requirements: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Requirements;