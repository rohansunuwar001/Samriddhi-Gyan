import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link } from 'react-router-dom'; // 1. Import the Link component

const InstructorProfile = ({ instructor }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Defensive: fallback values for missing fields
    const id = instructor?._id; // Get the instructor's ID for the link
    const name = instructor?.name || "Unknown Instructor";
    const headline = instructor?.headline || "";
    const photoUrl = instructor?.photoUrl || "https://github.com/shadcn.png";
    const rating = typeof instructor?.rating === "number" ? instructor.rating : 0;
    const bioHtml = instructor?.bioHtml || "";

    // Helper component to avoid repeating the Link logic and to handle cases where there is no ID.
    const InstructorLink = ({ children, className }) => {
        if (!id) {
            // If there's no ID, render the children without a link.
            return <div className={className}>{children}</div>;
        }
        // If there is an ID, wrap the children in a Link.
        return (
            <Link to={`/instructor-profile/${id}`} className={className}>
                {children}
            </Link>
        );
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Instructor</h2>
            
            {/* 2. Wrap the instructor's name in the Link */}
            <InstructorLink>
                <p className="font-bold text-lg text-blue-500 underline hover:text-blue-700 transition-colors">
                    {name}
                </p>
            </InstructorLink>

            <p className="text-gray-500 text-sm">{headline}</p>

            <div className="flex items-start gap-4 mt-4">
                {/* 3. Wrap the instructor's photo in the Link */}
                <InstructorLink>
                    <img
                        src={photoUrl}
                        alt={name}
                        className="h-28 w-28 rounded-full object-cover border-2 border-transparent hover:border-blue-500 transition-all"
                    />
                </InstructorLink>
                <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{rating.toFixed(1)} Instructor Rating</span>
                    </div>
                    {/* You can add other stats here if available, e.g., total students */}
                </div>
            </div>

            <div
                className={`prose max-w-none relative overflow-hidden mt-4 ${isExpanded ? 'max-h-full' : 'max-h-24'}`}
                dangerouslySetInnerHTML={{ __html: bioHtml }}
            />
            {bioHtml && (
                <Button variant="link" onClick={() => setIsExpanded(!isExpanded)} className="px-0">
                    {isExpanded ? 'Show less' : 'Show more'}
                </Button>
            )}
        </div>
    );
};

// 4. Update PropTypes to require the instructor's _id
InstructorProfile.propTypes = {
    instructor: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        headline: PropTypes.string,
        photoUrl: PropTypes.string,
        rating: PropTypes.number,
        bioHtml: PropTypes.string,
    }).isRequired,
};

export default InstructorProfile;