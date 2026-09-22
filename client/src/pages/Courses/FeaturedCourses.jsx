// src/components/FeaturedCourses.jsx

import { useState } from "react";
import { useGetFeaturedCoursesQuery } from "@/features/api/recommendedApi";
import CourseRow from "./CourseRow";
// Adjust path if necessary

const TABS = [
  { key: "popular", label: "Most popular" },
  { key: "new", label: "New" },
  { key: "intermediate", label: "Intermediate & advanced" },
];

const CardSkeleton = () => (
  <div className="flex-shrink-0 w-64 space-y-2">
    <div className="w-64 h-36 bg-gray-200 rounded-md animate-pulse" />
    <div className="h-4 bg-gray-200 rounded animate-pulse" />
    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
  </div>
);

const FeaturedCourses = () => {
  const [activeTab, setActiveTab] = useState("popular");
  const { data, isLoading } = useGetFeaturedCoursesQuery(activeTab);

  const courses = data?.featuredCourses || [];

  return (
    <section className="mb-12">
      {/* Title Header Section */}
      <h2 className="text-3xl font-semibold text-slate-800 mb-4">Featured courses</h2>

      {/* Tab Navigation Switches */}
      <div className="flex gap-6 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-base font-normal border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Track Display Content */}
      {isLoading ? (
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-base text-slate-500">No courses to show yet.</p>
      ) : (
        /* Reusing CourseRow directly removes redundant state, ref, and arrow layout code */
        <CourseRow
          heading=""
          subheading=""
          courses={courses}
        />
      )}
    </section>
  );
};

export default FeaturedCourses;