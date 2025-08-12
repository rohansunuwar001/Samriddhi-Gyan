import { Button } from '@/components/ui/button';
import { useState } from 'react';
import PropTypes from 'prop-types';

export const Description = ({ descriptionHtml }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <div className="relative">
                <div
                    className={`prose max-w-none overflow-hidden transition-all duration-300 ${isExpanded ? '' : 'max-h-48'}`}
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
            </div>
            <Button variant="link" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Show less' : 'Show more'}
            </Button>
        </div>
    );
};

Description.propTypes = {
    descriptionHtml: PropTypes.string.isRequired,
};