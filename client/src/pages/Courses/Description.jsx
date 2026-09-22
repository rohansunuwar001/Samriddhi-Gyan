import { Button } from '@/components/ui/button';
import { useState } from 'react';
import PropTypes from 'prop-types';

export const Description = ({ descriptionHtml }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!descriptionHtml?.trim()) return null;

    return (
        <div>
            <h2 className="text-3xl font-semibold mb-4">Description</h2>
            <div className="relative">
                <div
                    className={`
                        prose prose-slate max-w-none
                        prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mt-5 prose-headings:mb-2
                        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2
                        prose-strong:font-semibold prose-strong:text-gray-900
                        prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
                        prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
                        prose-li:my-1 prose-li:text-gray-700
                        prose-code:bg-gray-100 prose-code:text-purple-700 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-base prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-md prose-pre:p-4
                        prose-a:text-purple-700 prose-a:underline
                        overflow-hidden transition-all duration-300
                        ${isExpanded ? '' : 'max-h-64'}
                    `}
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
            </div>
            <Button variant="link" onClick={() => setIsExpanded(!isExpanded)} className="px-0 mt-2 text-purple-700 font-medium">
                {isExpanded ? 'Show less' : 'Show more'}
            </Button>
        </div>
    );
};

Description.propTypes = {
    descriptionHtml: PropTypes.string,
};
