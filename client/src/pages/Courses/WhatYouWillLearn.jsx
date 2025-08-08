import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PropTypes from 'prop-types';
const WhatYouWillLearn = ({ learnings }) => (
    <Card className="border-2 border-gray-200">
        <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">What you`ll learn</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {learnings.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 mt-1 flex-shrink-0 text-gray-700" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

WhatYouWillLearn.propTypes = {
    learnings: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default WhatYouWillLearn;