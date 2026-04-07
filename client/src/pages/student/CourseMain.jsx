// src/components/CourseMain.jsx

import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import React from "react";
import { useSelector } from 'react-redux';

// --- UI COMPONENTS & ICONS ---
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import PropTypes from "prop-types";
import CourseCard from "./CourseCard";
// --- ⭐ NEW: Import your custom header component ---

import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ShoppingBasket } from "lucide-react";
import { Link } from "react-router-dom";

// ... (The NoCoursesAvailable and CourseCardSkeleton sub-components remain unchanged)
const NoCoursesAvailable = ({ isLoggedIn }) => (
    <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md text-center">
            {isLoggedIn ? (
                <CheckCircle2 className="h-4 w-4" />
            ) : (
                <ShoppingBasket className="h-4 w-4" />
            )}
            <AlertTitle className="font-bold">
                {isLoggedIn ? "You're All Caught Up!" : "No Courses Available"}
            </AlertTitle>
            <AlertDescription>
                {isLoggedIn 
                    ? "It looks like you've already enrolled in all of our available courses. Fantastic job!"
                    : "There are currently no courses to display. Please check back later."
                }
                 {isLoggedIn && (
                    <div className="mt-4">
                        <Button asChild>
                            <Link to="/my-learning">Go to My Learning</Link>
                        </Button>
                    </div>
                 )}
            </AlertDescription>
        </Alert>
    </div>
);

NoCoursesAvailable.propTypes = {
    isLoggedIn: PropTypes.bool.isRequired,
};


/**
 * A skeleton loader component that mimics the layout of a CourseCard.
 */
const CourseCardSkeleton = () => (
    <div className="rounded-xl shadow-sm overflow-hidden border">
        <Skeleton className="w-full aspect-video rounded-b-none" />
        <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-10 w-full rounded-md mt-2" />
        </div>
    </div>
);

const CourseMain = () => {
  const { data, isLoading, isError, error, refetch } = useGetPublishedCourseQuery();
  const { user } = useSelector((state) => state.auth);

  const filteredCourses = React.useMemo(() => {
    if (!data?.courses) return [];
    if (user && data.courses.length > 0) {
      const enrolledIds = new Set(user.enrolledCourses || []);
      return data.courses.filter(course => !enrolledIds.has(course._id));
    }
    return data.courses;
  }, [data, user]);

  const isEmpty = !isLoading && !isError && filteredCourses.length === 0;

  return (
    <div className="bg-white font-sans">
      <div className="container max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <main className="mt-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, index) => <CourseCardSkeleton key={index} />)}
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error loading courses</AlertTitle>
              <AlertDescription>
                {error?.data?.message || 'Failed to fetch courses. Please try again.'}
                <div className="mt-4"><Button variant="outline" onClick={refetch}>Retry</Button></div>
              </AlertDescription>
            </Alert>
          ) : isEmpty ? (
            <NoCoursesAvailable isLoggedIn={!!user} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseMain;