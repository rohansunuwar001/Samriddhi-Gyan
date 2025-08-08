import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { ExclamationTriangleIcon, RocketIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import Course from "./Course";

const Courses = () => {
  const { data, isLoading, isError, error, refetch } = useGetPublishedCourseQuery();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const [direction, setDirection] = useState(0); // 0 for right, 1 for left

  const COURSES_PER_PAGE = 4;

  if (isError) {
    return (
      <div className="bg-gray-50 dark:bg-[#141414] min-h-[60vh] flex items-center justify-center">
        <div className="max-w-7xl mx-auto p-6 w-full">
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
        </div>
      </div>
    );
  }

  const nextSlide = () => {
    setDirection(0);
    setCurrentIndex((prevIndex) =>
      Math.min(prevIndex + COURSES_PER_PAGE, (data?.courses?.length || 0) - 1)
    );
  };

  const prevSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => Math.max(prevIndex - COURSES_PER_PAGE, 0));
  };

  const visibleCourses = data?.courses?.slice(
    currentIndex,
    currentIndex + COURSES_PER_PAGE
  );

  return (
    <section className="bg-white dark:bg-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Unlock Your Potential
          </h2>
          <p className="mt-4 max-w-3xl text-xl text-gray-600 dark:text-gray-300 mx-auto">
            Explore a wide range of courses designed to help you master new skills and advance your career.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <CourseSkeleton key={index} />
            ))}
          </div>
        ) : data?.courses?.length > 0 ? (
          <div className="relative">
            <div className="flex justify-center">
              <div className="relative w-full max-w-6xl">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                  <Button
                    onClick={prevSlide}
                    disabled={currentIndex === 0}
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </div>

                <div
                  ref={sliderRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-12"
                >
                  <AnimatePresence mode="wait" custom={direction}>
                    {visibleCourses?.map((course) => (
                      <motion.div
                        key={course._id}
                        custom={direction}
                        initial={{ opacity: 0, x: direction === 0 ? 50 : -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction === 0 ? -50 : 50 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                      >
                        <Course course={course} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                  <Button
                    onClick={nextSlide}
                    disabled={currentIndex + COURSES_PER_PAGE >= (data?.courses?.length || 0)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {Array.from({
                  length: Math.ceil((data?.courses?.length || 0) / COURSES_PER_PAGE)
                }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index * COURSES_PER_PAGE)}
                    className={`h-2 w-2 rounded-full ${currentIndex / COURSES_PER_PAGE === index ? 'bg-primary w-4' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <Alert className="max-w-2xl mx-auto bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
              <RocketIcon className="h-5 w-5 text-blue-500" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">No Courses Available</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                We're working hard to bring you new and exciting courses. Please check back soon!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {data?.courses?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <Button variant="primary" size="lg" className="hover:scale-105 transition-transform">
              View All Courses
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Courses;

const CourseSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-200 dark:border-gray-700 h-full"
    >
      <Skeleton className="w-full h-48" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </motion.div>
  );
};