import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
const InstructorProfile = ({ instructor }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Instructor</h2>
            <p className="font-bold text-lg text-blue-500 underline">{instructor.name}</p>
            <p className="text-gray-500 text-sm">{instructor.title}</p>
            <div className="flex items-start gap-4 mt-4">
                <img src={instructor.image} alt={instructor.name} className="h-28 w-28 rounded-full object-cover" />
                <div className="space-y-1">
                    <div className="flex items-center gap-2"><Star className="h-4 w-4" /><span>{instructor.rating} Instructor Rating</span></div>
                    {/* Add other stats */}
                </div>
            </div>
            <div
                className={`prose max-w-none relative overflow-hidden mt-4 ${isExpanded ? 'max-h-full' : 'max-h-24'}`}
                dangerouslySetInnerHTML={{ __html: instructor.bioHtml }}
            />
            <Button variant="link" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Show less' : 'Show more'}
            </Button>
        </div>
    )
}




InstructorProfile.propTypes = {
    instructor: PropTypes.shape({
        name: PropTypes.string.isRequired,
        title: PropTypes.string,
        image: PropTypes.string.isRequired,
        rating: PropTypes.number.isRequired,
        bioHtml: PropTypes.string.isRequired,
    }).isRequired,
};
export default InstructorProfile;