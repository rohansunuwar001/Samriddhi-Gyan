import React from "react";
import { useParams } from "react-router-dom";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import MainContent from "./MainContent";
import CourseSidebar from "./CourseSidebar";
import { useGetCourseProgressQuery, useUpdateLectureProgressMutation } from "@/features/api/courseProgressApi";

const CourseProgress = () => {
  const { courseId } = useParams();
  const { data: courseData, isLoading, error } = useGetCourseDetailWithStatusQuery(courseId);

  // Fetch progress
  const { data: progressData } = useGetCourseProgressQuery(courseId);

  // Update progress mutation
  const [updateLectureProgress] = useUpdateLectureProgressMutation();

  // Find the first lecture as default
  const getFirstLecture = (course) => {
    if (!course?.sections?.length) return null;
    for (const section of course.sections) {
      if (section.lectures && section.lectures.length > 0) {
        return section.lectures[0];
      }
    }
    return null;
  };

  const [selectedLecture, setSelectedLecture] = React.useState(null);

  React.useEffect(() => {
    if (courseData?.course && !selectedLecture) {
      setSelectedLecture(getFirstLecture(courseData.course));
    }
  }, [courseData, selectedLecture]);

  // Handler to mark lecture as viewed
  const handleLectureViewed = async (lectureId) => {
    // No need to refetch manually, invalidatesTags handles it.
    await updateLectureProgress({ courseId, lectureId });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error || !courseData) return <div>Failed to load course.</div>;

  const progress = progressData?.data?.progress || [];

  // --- Calculate total duration in hours ---
  const totalSeconds = courseData?.course?.totalDurationInSeconds || 0;
  const totalHours = (totalSeconds / 3600).toFixed(1);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Show total video duration at the top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow px-4 py-2 rounded text-gray-700 font-semibold z-10">
        Total Video Duration: {totalHours} hrs
      </div>
      <MainContent
        courseData={courseData}
        selectedLecture={selectedLecture}
        progress={progress}
        onLectureViewed={handleLectureViewed} // Pass the function as a prop
      />
      <CourseSidebar
        courseData={courseData}
        selectedLecture={selectedLecture}
        setSelectedLecture={setSelectedLecture}
        progress={Array.isArray(progress) ? progress : []}
      />
    </div>
  );
};

export default CourseProgress;