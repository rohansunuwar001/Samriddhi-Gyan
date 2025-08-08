import { Button } from '@/components/ui/button';
import { useState } from 'react';
import PropTypes from 'prop-types';
export const Description = ({ descriptionHtml }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <div
                className={`prose max-w-none relative overflow-hidden ${isExpanded ? 'max-h-full' : 'max-h-48'}`}
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
            {!isExpanded && (
                 <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent" />
            )}
             <Button variant="link" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Show less' : 'Show more'}
            </Button>
        </div>
    );
};

Description.propTypes = {
    descriptionHtml: PropTypes.string.isRequired,
};