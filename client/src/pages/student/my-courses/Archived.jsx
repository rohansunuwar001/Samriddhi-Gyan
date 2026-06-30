import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetArchivedCoursesQuery } from "@/features/api/authApi";
import { Skeleton } from "@/components/ui/skeleton";
import MyLearningCourseCard from "./MyLearningCourseCard";
import { Archive } from "lucide-react";

const Archived = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetArchivedCoursesQuery();

  const archivedCourses = data?.courses || [];

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto my-10 text-center select-none">
        <div className="bg-white border border-[#d1d7dc] p-8 shadow-sm">
          <h2 className="text-sm font-extrabold text-red-600 mb-2">
            Failed to load your archived courses
          </h2>
          <p className="text-xs text-[#6a6f73] mb-5">
            Please try refreshing the page or check your internet connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-3 rounded-none border border-[#d1d7dc] p-4 bg-white shadow-sm">
              <Skeleton className="w-full aspect-video rounded-none bg-gray-200" />
              <Skeleton className="h-4 w-3/4 bg-gray-200" />
              <Skeleton className="h-3 w-1/2 bg-gray-200" />
              <Skeleton className="h-3 w-full bg-gray-200" />
            </div>
          ))}
        </div>
      ) : archivedCourses.length === 0 ? (
        <div className="bg-white rounded-none border border-[#d1d7dc] p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
          <Archive className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-[#2d2f31]">
            No archived courses
          </h3>
          <p className="text-xs text-[#6a6f73] leading-relaxed">
            Archive courses you've finished or aren't currently studying to organize your workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {archivedCourses.map((course) => (
            <MyLearningCourseCard key={course._id} course={course} isArchived={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Archived;
