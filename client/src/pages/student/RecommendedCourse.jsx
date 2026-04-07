// src/components/RecommendedCourse.jsx

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ExclamationTriangleIcon, RocketIcon } from "@radix-ui/react-icons";
import CourseCard from "./CourseCard"; // Assumes CourseCard is in the same directory
import { useGetRecommendedCourseQuery } from "@/features/api/recommendedApi";

const RecommendedCourse = () => {
  const { data, isLoading, isError, error, refetch } = useGetRecommendedCourseQuery();
  console.log("Recommended Courses:", data);

  return (
    // --- UI CHANGE: Adopted the layout from CourseMain ---
    <div className="bg-white font-sans">
      <div className="container max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* You can add a header here if you like, e.g.,
          <header className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Recommended For You</h2>
          </header>
        */}
        <main>
          {isLoading ? (
            // --- KEPT: Using the better skeleton loader from the original RecommendedCourse ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <CourseSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            // --- KEPT: The existing error state ---
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
          ) : data?.recommendedCourses?.length > 0 ? (
            // --- UI CHANGE: Using the 3-column grid from CourseMain ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.recommendedCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  // Optional: You can still show a badge if you like
                  showRecommendationBadge={course.showRecommendationBadge} 
                />
              ))}
            </div>
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

// --- This is the same skeleton from your original file, now used in the new layout ---
const CourseSkeleton = () => {
  return (
    <div className="rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border">
      <Skeleton className="w-full aspect-video rounded-t-xl" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-6 w-full" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
};

export default RecommendedCourse;