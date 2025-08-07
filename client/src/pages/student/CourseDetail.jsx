import BuyCourseButton from "@/components/BuyCourseButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import { format } from "date-fns";
import { BadgeInfo, Lock, PlayCircle, UsersIcon } from "lucide-react";
import ReactPlayer from "react-player";
import { useNavigate, useParams } from "react-router-dom";

const CourseDetail = () => {
  const params = useParams();
  const courseId = params.courseId;
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetCourseDetailWithStatusQuery(courseId);

  if (isLoading) return <CourseDetailSkeleton />;
  if (isError) return <ErrorLoadingCourse />;

  const { course, purchased } = data;
  const firstLecture = course.lectures[0];
  const enrolledCount = course.enrolledStudents?.length || 0;

  const handleContinueCourse = () => {
    if (purchased) {
      navigate(`/course-progress/${courseId}`);
    }
  };

  return (
    <main className="space-y-5">
      {/* Course Header Section */}
      <section className="bg-[#2D2F31] text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-3">
          <h1 className="font-bold text-2xl md:text-3xl lg:text-4xl">
            {course.courseTitle}
          </h1>
          {course.subtitle && (
            <p className="text-base md:text-lg text-gray-300">
              {course.subtitle}
            </p>
          )}
          <p className="text-sm md:text-base">
            Created by{" "}
            <span className="text-[#C0C4FC] underline italic">
              {course.creator.name}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BadgeInfo size={16} aria-hidden="true" />
              <span>
                Last updated{" "}
                {format(new Date(course.updatedAt || course.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle size={16} aria-hidden="true" />
              <span>{course.lectures.length} lectures</span>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon size={16} aria-hidden="true" />
              <span>
                {enrolledCount.toLocaleString()} student{enrolledCount !== 1 ? "s" : ""} enrolled
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto my-5 px-4 md:px-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column - Description & Content */}
        <div className="w-full lg:w-2/3 space-y-6">
          <section>
            <h2 className="font-bold text-xl md:text-2xl mb-4">Description</h2>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>
                {course.lectures.length} lecture{course.lectures.length !== 1 ? "s" : ""}
                {course.totalDuration && ` • ${formatDuration(course.totalDuration)}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.lectures.map((lecture, idx) => (
                <div 
                  key={lecture._id || idx} 
                  className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="mt-0.5">
                    {purchased ? (
                      <PlayCircle size={16} className="text-blue-500" />
                    ) : (
                      <Lock size={16} className="text-gray-400" />
                    )}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm md:text-base font-medium">
                      {lecture.lectureTitle}
                    </h3>
                    {lecture.duration && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDuration(lecture.duration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Video & Purchase */}
        <div className="w-full lg:w-1/3">
          <Card className="sticky top-6">
            {firstLecture?.videoUrl ? (
              <div className="w-full aspect-video bg-black">
                <ReactPlayer
                  width="100%"
                  height="100%"
                  url={firstLecture.videoUrl}
                  controls={true}
                  light={course.courseThumbnail}
                  playIcon={<PlayCircle size={48} className="text-white" />}
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center p-4">
                  <PlayCircle size={48} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Preview not available
                  </p>
                </div>
              </div>
            )}
            <CardContent className="p-4 space-y-3">
              {firstLecture && (
                <>
                  <h3 className="font-medium text-lg">
                    {firstLecture.lectureTitle}
                  </h3>
                  <Separator />
                </>
              )}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Price:</h4>
                <div className="text-right">
                  {course.discountedPrice ? (
                    <>
                      <span className="text-lg font-bold">
                        Rs{course.discountedPrice}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        Rs{course.coursePrice}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">
                      Rs{course.coursePrice}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4">
              {purchased ? (
                <Button 
                  onClick={handleContinueCourse} 
                  className="w-full"
                  aria-label="Continue course"
                >
                  Continue Course
                </Button>
              ) : (
                <BuyCourseButton 
                  courseId={courseId} 
                  price={course.coursePrice}
                  className="w-full"
                />
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
};

// Helper function to format duration (assuming duration is in seconds)
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
};

// Skeleton loading state
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

export default CourseDetail;