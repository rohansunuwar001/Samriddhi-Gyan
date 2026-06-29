// src/components/RecommendedCourse.jsx

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ExclamationTriangleIcon, RocketIcon } from "@radix-ui/react-icons";
import { useGetRecommendedCourseQuery } from "@/features/api/recommendedApi";
import CourseRow from "../Courses/CourseRow";
// Adjust path if necessary

const RecommendedCourse = () => {
  const { data, isLoading, isError, error, refetch } = useGetRecommendedCourseQuery();
  
  const courses = data?.recommendedCourses || [];

  return (
    <div className="bg-white font-sans">
      <div className="container max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <main>
          {isLoading ? (
            /* Horizontal slider skeleton matching CourseRow look-and-feel */
            <div className="flex gap-6 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <CourseSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <div className="max-w-2xl mx-auto">
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Error loading recommendations</AlertTitle>
                <AlertDescription>
                  {error?.data?.message || "Failed to fetch recommended courses"}
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={refetch}>
                      Try Again
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : courses.length > 0 ? (
            /* Swapping grid for the dynamic CourseRow slider track */
            <CourseRow
              // heading="Recommended For You"
              // subheading="Personalized classes based on your preferences"
              courses={courses}
            />
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <Alert>
                <RocketIcon className="h-4 w-4" />
                <AlertTitle>No recommendations yet</AlertTitle>
                <AlertDescription>
                  Complete some courses or update your preferences to get
                  personalized recommendations.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

/* Horizontal layout track item skeleton */
const CourseSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-64 space-y-2">
      <Skeleton className="w-64 h-36 rounded-md" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};

export default RecommendedCourse;