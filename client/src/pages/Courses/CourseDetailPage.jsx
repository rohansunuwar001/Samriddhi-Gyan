// --- (Import Child Components) ---


// --- (Import Mock Data) ---

import { useParams } from 'react-router-dom';


import { useGetCourseDetailWithStatusQuery } from '@/features/api/purchaseApi';
import CourseContent from './CourseContent';
import CourseHeader from './CourseHeader';
import CourseIncludes from './CourseIncludes';
import { Description } from './Description';
import InstructorProfile from './InstructorProfile';
import PurchaseCard from './PurchaseCard';
import Requirements from './Requirements';
import WhatYouWillLearn from './WhatYouWillLearn';
import ReviewsSection from '../Reviews/ReviewSection';

const CourseDetailPage = () => {
    const { courseId } = useParams();
    const { data, isLoading, isError } = useGetCourseDetailWithStatusQuery(courseId);
console.log("Course detail data:", data);

    // Defensive: extract the actual course object
    const course = data?.course;
    console.log("Course data:", course);

    if (isLoading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (isError || !course) {
        return <div className="text-center py-10 text-red-500">Course not found.</div>;
    }

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
                            <CourseContent sections={course.sections} totalLectures={course.totalLectures} totalLength={course.totalDurationInSeconds} />
                            <Requirements requirements={course.requirements} />
                            <Description descriptionHtml={course.description} />
                            <InstructorProfile instructor={course.creator} />
                            <ReviewsSection course={course} />
                        </main>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;