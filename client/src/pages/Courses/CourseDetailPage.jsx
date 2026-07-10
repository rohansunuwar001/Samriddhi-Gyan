// src/pages/Courses/CourseDetailPage.jsx

import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useGetCourseDetailWithStatusQuery } from '@/features/api/purchaseApi';
import { useTrackCourseViewMutation } from '@/features/api/authApi';

import CourseContent from './CourseContent';
import CourseHeader from './CourseHeader';
import CourseIncludes from './CourseIncludes';
import { Description } from './Description';
import InstructorProfile from './InstructorProfile';
import MoreCoursesFromInstructor from './MoreCoursesFromInstructor';
import PurchaseCard from './PurchaseCard';
import Requirements from './Requirements';
import WhoThisCourseIsFor from './WhoThisCourseIsFor';
import ExploreRelatedTopics from './ExploreRelatedTopics';
import WhatYouWillLearn from './WhatYouWillLearn';
import ReviewsSection from '../Reviews/ReviewSection';
import { CourseDetailSkeleton } from '@/components/ui/skeletons';
import LoadingSpinner from '@/components/LoadingSpinner';

const CourseDetailPage = () => {
    const { courseId } = useParams();
    const { data, isLoading, isError } = useGetCourseDetailWithStatusQuery(courseId);
    const [trackCourseView] = useTrackCourseViewMutation();

    const course = data?.course;

    useEffect(() => {
        if (courseId) {
            trackCourseView(courseId);
        }
    }, [courseId, trackCourseView]);

    useEffect(() => {
        if (course && course.category) {
            localStorage.setItem("last_interacted_category", course.category);
        }
    }, [course]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (isError || !course) {
        return <div className="text-center py-10 text-red-500">Course not found.</div>;
    }

    return (
        <div className="bg-white text-[#2d2f31]">
            <CourseHeader course={course} purchasePanel={<PurchaseCard course={course} />} />

            <div className="mx-auto grid max-w-[1500px] gap-12 px-6 pb-16 pt-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-10 lg:pt-20 xl:px-16">
                <main className="min-w-0 space-y-8">
                    <WhatYouWillLearn learnings={course.learnings} />
                    <CourseIncludes course={course} />
                    <CourseContent
                        sections={course.sections}
                        totalLectures={course.totalLectures}
                        totalLength={course.totalDurationInSeconds}
                    />
                    <Requirements requirements={course.requirements} />
                    <Description descriptionHtml={course.description} />
                    <WhoThisCourseIsFor audience={course.whoIsThisFor} />
                    <InstructorProfile instructor={course.creator} />
                    <ExploreRelatedTopics topics={course.topics} />
                    <ReviewsSection course={course} />
                    <MoreCoursesFromInstructor instructor={course.creator} currentCourseId={course._id} />
                </main>
                <div className="hidden lg:block relative">
                    <div className="sticky top-[90px] -mt-[370px] z-30">
                        <PurchaseCard course={course} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailPage;
