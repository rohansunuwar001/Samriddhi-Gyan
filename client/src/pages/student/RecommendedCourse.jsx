import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetRecommendedCourseQuery } from "@/features/api/courseApi";
import { ExclamationTriangleIcon, RocketIcon } from "@radix-ui/react-icons";
import { Sparkles } from "lucide-react";
import PropTypes from "prop-types";
import CourseCard from "./CourseCard";


const RecommendedCourse = () => {
  const { data, isLoading, isError, error, refetch } = useGetRecommendedCourseQuery();

  return (
    <section className="bg-gray-50 dark:bg-[#141414] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Recommended For You
            </h2>
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="mt-2 max-w-2xl text-lg text-gray-600 dark:text-gray-300 mx-auto">
            Courses tailored to your learning preferences and history
          </p>
        </div>

        {isError ? (
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error loading recommendations</AlertTitle>
              <AlertDescription>
                {error?.data?.message || 'Failed to fetch recommended courses'}
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={refetch}>
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 7 }).map((_, index) => (
              <CourseSkeleton key={index} />
            ))}
          </div>
        ) : data?.recommendedCourses?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {data.recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course}
                showRecommendationBadge/>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            <Alert>
              <RocketIcon className="h-4 w-4" />
              <AlertTitle>No recommendations yet</AlertTitle>
              <AlertDescription>
                Complete some courses or update your preferences to get personalized recommendations
                <div className="mt-4">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Recommendations
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </section>
  );
};



RecommendedCourse.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      thumbnail: PropTypes.string,
      price: PropTypes.shape({
        current: PropTypes.number.isRequired,
        original: PropTypes.number
      }),
      creator: PropTypes.shape({
        name: PropTypes.string.isRequired
      })
    })
  )
};


const CourseSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 dark:border-gray-700">
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