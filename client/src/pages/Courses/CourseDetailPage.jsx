
// --- (Import Child Components) ---


// --- (Import Mock Data) ---

import CourseHeader from './CourseHeader';
import PurchaseCard from './PurchaseCard';
import WhatYouWillLearn from './WhatYouWillLearn';
import CourseIncludes from './CourseIncludes';
import CourseContent from './CourseContent';
import Requirements from './Requirements';
import { Description } from '@radix-ui/react-dialog';
import InstructorProfile from './InstructorProfile';
import ReviewsSection from '../Reviews/ReviewSection';
import { mockCourseData } from '@/data/mockCourseData';

const CourseDetailPage = () => {
    const course = mockCourseData;

    return (
        <div className="bg-white text-gray-800">
            {/* Dark themed header section */}
            <CourseHeader course={course} />

            {/* Main content and sticky purchase card */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="lg:flex lg:flex-row-reverse lg:gap-8">

                    {/* --- Right Column (Sticky Purchase Card) --- */}
                    <div className="lg:w-1/3 w-full mb-8 lg:mb-0">
                        <PurchaseCard course={course} />
                    </div>

                    {/* --- Left Column (Main Content) --- */}
                    <div className="lg:w-2/3 w-full">
                        <main className="space-y-8">
                            <WhatYouWillLearn learnings={course.learnings} /> 
                            <CourseIncludes includes={course.includes} />
                            <CourseContent sections={course.sections} totalLectures={course.totalLectures} totalLength={course.totalLength} />
                            <Requirements requirements={course.requirements} />
                            {/* <Description descriptionHtml={course.descriptionHtml} /> */}
                            <InstructorProfile instructor={course.instructor} />
                            Assuming your ReviewsSection is compatible
                            <ReviewsSection course={course} />
                        </main>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;