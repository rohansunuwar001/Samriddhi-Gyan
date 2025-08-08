// --- CORE REACT & ROUTING ---

import { useNavigate, useParams } from 'react-router-dom';

// --- UI COMPONENTS (Shadcn/ui, etc.) ---
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// --- DATA FETCHING (RTK Query) ---
import { useGetCourseDetailWithStatusQuery } from '@/features/api/purchaseApi';

// --- NEW UI CHILD COMPONENTS (for the Udemy-like layout) ---


// --- YOUR REVIEW COMPONENTS ---
 // Make sure path is correct
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import CourseContent from '../Courses/CourseContent';
import CourseHeader from '../Courses/CourseHeader';
import CourseIncludes from '../Courses/CourseIncludes';
import InstructorProfile from '../Courses/InstructorProfile';
import PurchaseCard from '../Courses/PurchaseCard';
import Requirements from '../Courses/Requirements';
import WhatYouWillLearn from '../Courses/WhatYouWillLearn';
import AddReviewForm from '../Reviews/AddReviewform';
import ReviewsSection from '../Reviews/ReviewSection';

const CourseDetailPage = () => {
    // 1. Core Hooks and Data Fetching
    const params = useParams();
    const courseId = params.courseId;
    const navigate = useNavigate();
    const { data, isLoading, isError } = useGetCourseDetailWithStatusQuery(courseId);

    // 2. Loading and Error States
    if (isLoading) return <CourseDetailSkeleton />;
    if (isError || !data) return <ErrorLoadingCourse />; // Check for data object too

    // 3. Destructure Data for Cleaner Usage
    const { course, purchased } = data;
    
    // Check if the populated creator object exists before accessing its properties
    const creator = course.creator || { name: 'Unknown Instructor', title: '' };

    return (
        <div className="bg-white text-gray-800">
            {/* Dark themed header section - This will now show live data */}
            <CourseHeader course={{...course, creatorName: creator.name}} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="lg:flex lg:flex-row-reverse lg:gap-8">
                    
                    {/* Right Column (Sticky Purchase Card) - Shows live data */}
                    <div className="lg:w-1/3 w-full mb-8 lg:mb-0">
                       <PurchaseCard course={course} purchased={purchased} courseId={courseId} />
                    </div>

                    {/* Left Column (Main Content) - All components get live data */}
                    <div className="lg:w-2/3 w-full">
                        <main className="space-y-8 md:space-y-12">
                            {/* Assuming your API provides 'learnings' array */}
                            {course.learnings && course.learnings.length > 0 && <WhatYouWillLearn learnings={course.learnings} />}
                            
                            {/* Assuming your API provides 'includes' array */}
                            {course.includes && course.includes.length > 0 && <CourseIncludes includes={course.includes} />}

                            <CourseContent 
                                sections={course.lectures || []} 
                                totalLectures={course.lectures?.length || 0} 
                                // You might need to calculate totalLength on the backend or frontend
                                totalLength={course.totalDuration || 'N/A'}
                            />
                            
                            {/* Assuming your API provides 'requirements' array */}
                            {course.requirements && course.requirements.length > 0 && <Requirements requirements={course.requirements} />}
                            
                            {/* <Description descriptionHtml={course.description || '<p>No description provided.</p>'} /> */}

                            <InstructorProfile instructor={creator} />
                            
                            {/* Your existing review logic - now fully integrated */}
                            {purchased && <AddReviewForm courseId={courseId} />}
                            <ReviewsSection course={course} />
                        </main>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- SKELETON & ERROR COMPONENTS ---
// No changes needed here. These are well-built.
const CourseDetailSkeleton = () => (
  <div className="space-y-5">
    <div className="bg-[#2D2F31] text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-3">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto my-5 px-4 md:px-8 flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-2/3 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="w-full lg:w-1/3">
        <Card>
          <Skeleton className="w-full aspect-video" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-px w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
);

// Error state component
const ErrorLoadingCourse = () => (
  <div className="max-w-7xl mx-auto py-12 px-4 text-center">
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        Failed to load course details
      </h2>
      <p className="text-red-600 dark:text-red-400 mb-4">
        Please try refreshing the page or check your internet connection
      </p>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="text-red-700 dark:text-red-300"
      >
        Refresh Page
      </Button>
    </div>
  </div>
);

export default CourseDetailPage;