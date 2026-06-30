import { Check } from 'lucide-react';
import PropTypes from 'prop-types';

const WhatYouWillLearn = ({ learnings }) => (
    <section className="border border-[#d1d7dc] bg-white">
        <div className="px-8 py-8">
            <h2 className="mb-7 text-3xl font-extrabold tracking-tight text-[#2d2f31]">What you&apos;ll learn</h2>
            {Array.isArray(learnings) && learnings.length > 0 ? (
                <ul className="grid grid-cols-1 gap-x-14 gap-y-4 text-base leading-relaxed text-[#4b5563] md:grid-cols-2">
                    {learnings.map((item, index) => (
                        <li key={index} className="flex items-start gap-4">
                            <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[#2d2f31]" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No learning outcomes provided yet.</p>
            )}
        </div>
    </section>
);

WhatYouWillLearn.propTypes = {
    learnings: PropTypes.arrayOf(PropTypes.string),
};

export default WhatYouWillLearn;

