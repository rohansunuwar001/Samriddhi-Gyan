import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PropTypes from 'prop-types';
const CourseHeader = ({ course }) => {
    return (
        <div className="bg-gray-800 text-white pt-8 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:w-2/3">
                    <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                    <p className="mt-2 text-xl text-gray-300">{course.subtitle}</p>
                    <div className="mt-4 flex items-center flex-wrap gap-x-4 gap-y-2">
                        {course.isBestseller && <Badge className="bg-yellow-400 text-black">Bestseller</Badge>}
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-yellow-400">{course.rating}</span>
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-blue-300 underline">({course.reviewsCount.toLocaleString()} ratings)</span>
                        </div>
                        <span>{course.studentsCount.toLocaleString()} students</span>
                    </div>
                    <p className="mt-2 text-sm">Created by <span className="text-blue-300 underline">{course.creator.name}</span></p>
                    <div className="mt-2 text-sm flex items-center flex-wrap gap-x-4">
                        <span>Last updated {course.lastUpdated}</span>
                        <span>{course.language}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

CourseHeader.propTypes = {
    course: PropTypes.shape({
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string,
        isBestseller: PropTypes.bool,
        rating: PropTypes.number.isRequired,
        reviewsCount: PropTypes.number.isRequired,
        studentsCount: PropTypes.number.isRequired,
        creator: PropTypes.shape({
            name: PropTypes.string.isRequired,
        }).isRequired,
        lastUpdated: PropTypes.string.isRequired,
        language: PropTypes.string.isRequired,
        }).isRequired,
};

export default CourseHeader;