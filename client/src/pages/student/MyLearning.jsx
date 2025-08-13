import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadUserQuery } from "@/features/api/authApi";
import { BookOpen, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CourseCard from "./CourseCard";

const MyLearning = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useLoadUserQuery();
  console.log("User data:", data);
  const myLearning = data?.user?.enrolledCourses || [];

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto my-10 px-4 md:px-0 text-center">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
            Failed to load your courses
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
  }

  return (
    <div className="max-w-7xl mx-auto my-10 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-2xl md:text-3xl flex items-center gap-3">
          <BookOpen className="text-blue-600 dark:text-blue-400" />
          My Learning
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate("/courses")}
          className="hidden sm:flex"
        >
          Browse More Courses
        </Button>
      </div>

      {isLoading ? (
        <MyLearningSkeleton />
      ) : myLearning.length === 0 ? (
        <EmptyLearningState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myLearning.map((course) => (
            <CourseCard key={course._id} course={course} showProgress />
          ))}
        </div>
      )}
    </div>
  );
};

// Skeleton loading state
const MyLearningSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="space-y-3">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

// Empty state component
const EmptyLearningState = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center max-w-2xl mx-auto">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
        <Rocket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Your learning journey starts here
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        You haven`t enrolled in any courses yet. Explore our catalog to find
        courses that match your interests.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go to Home
        </Button>
      </div>
    </div>
  );
};

export default MyLearning;
