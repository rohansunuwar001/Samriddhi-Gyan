// src/pages/Courses/ExploreRelatedTopics.jsx

import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const ExploreRelatedTopics = ({ topics }) => {
    if (!Array.isArray(topics) || topics.length === 0) return null;

    return (
        <div>
            <h2 className="text-3xl font-semibold mb-4">Explore related topics</h2>
            <div className="flex flex-wrap gap-3">
                {topics.map((topic) => (
                    <Link
                        key={topic}
                        to={`/topics/${encodeURIComponent(topic)}`}
                        className="px-4 py-2 rounded-full border border-gray-800 text-base font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        {topic}
                    </Link>
                ))}
            </div>
        </div>
    );
};

ExploreRelatedTopics.propTypes = {
    topics: PropTypes.arrayOf(PropTypes.string),
};

export default ExploreRelatedTopics;
