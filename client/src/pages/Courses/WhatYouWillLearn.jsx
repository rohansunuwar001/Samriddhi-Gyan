import { Check } from 'lucide-react';
import PropTypes from 'prop-types';

const WhatYouWillLearn = ({ learnings }) => (
    <section className="border border-[#d1d7dc] bg-white font-sans">
        <div className="p-6 sm:p-8">
            <h2 className="mb-6 text-[24px] font-semibold tracking-tight text-[#1c1d1f]">What you&apos;ll learn</h2>
            {Array.isArray(learnings) && learnings.length > 0 ? (
                <ul className="grid grid-cols-1 gap-x-8 gap-y-3.5 text-[14px] leading-relaxed text-[#2d2f31] md:grid-cols-2">
                    {learnings.map((item, index) => (
                        <li key={index} className="flex items-start gap-3.5">
                            <Check className="mt-1 h-4 w-4 shrink-0 text-[#1c1d1f]" />
                            <span className="font-light text-[#2d2f31] leading-snug">{item}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-[14px] text-gray-500 font-light">No learning outcomes provided yet.</p>
            )}
        </div>
    </section>
);

WhatYouWillLearn.propTypes = {
    learnings: PropTypes.arrayOf(PropTypes.string),
};

export default WhatYouWillLearn;

