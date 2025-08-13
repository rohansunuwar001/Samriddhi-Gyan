import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import CourseCard from "./CourseCard";
import PropTypes from "prop-types";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { useSelector } from 'react-redux'; // Import to get user state
import React from "react";

const CourseMain = () => {
  const { data, isLoading, isError, error, refetch } = useGetPublishedCourseQuery();
  // Optional but recommended: Check if the user is actually logged in
  const { user } = useSelector((state) => state.auth);

  // Memoize the filtered list to prevent re-renders unless data or user changes
  const filteredCourses = React.useMemo(() => {
    if (!data?.courses) return [];
    
    // If the user is logged in, filter out purchased courses.
    // Otherwise, show all courses.
    if (user) {
      return data.courses.filter(course => !course.isPurchased);
    }
    
    return data.courses;

  }, [data, user]);

  return (
    <div className="bg-white font-sans">
      <div className="container max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <main>
          {isLoading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : isError ? (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error loading courses</AlertTitle>
              <AlertDescription>
                {error?.data?.message || 'Failed to fetch courses. Please try again.'}
                <div className="mt-4">
                  <Button variant="outline" onClick={refetch}>
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* ✅ CORE LOGIC CHANGE:
                  We now map over the 'filteredCourses' list instead of the raw data.
                  This list already has the purchased courses removed. */}
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

// PropTypes can be simplified as this view now only shows un-purchased courses
CourseMain.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      // ... other props
    })
  )
};