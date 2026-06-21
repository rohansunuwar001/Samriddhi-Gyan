// src/components/FeaturedCourses.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useGetFeaturedCoursesQuery } from "@/features/api/recommendedApi";


const TABS = [
  { key: "popular", label: "Most popular" },
  { key: "new", label: "New" },
  { key: "intermediate", label: "Intermediate & advanced" },
];

const TAG_STYLES = {
  "Hot & New": "bg-rose-100 text-rose-800",
  New: "bg-emerald-100 text-emerald-800",
  "Highest Rated": "bg-amber-100 text-amber-800",
};

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
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Featured courses</h2>

      <div className="flex gap-6 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-slate-500">No courses to show yet.</p>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {courses.map((course) => {
            const current = course.price?.current ?? 0;
            const original = course.price?.original;
            const hasDiscount = original && original > current;
            const tag = course.featuredTag;

            return (
              <Link
                key={course._id}
                to={`/course-detail/${course._id}`}
                className="flex-shrink-0 w-64"
              >
                <div className="relative w-64 h-36">
                  <img
                    src={course.thumbnail || "/placeholder.jpg"}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                  {tag && (
                    <span
                      className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded ${
                        TAG_STYLES[tag] || "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {tag}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-sm mt-2 leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {course.creator?.name || "Instructor"}
                </p>

                {(course.ratings ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-sm">
                    <span className="font-semibold text-amber-700">
                      {course.ratings.toFixed(1)}
                    </span>
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {course.numOfReviews > 0 && (
                      <span className="text-slate-400 text-xs">
                        ({course.numOfReviews.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-sm">Rs{current}</span>
                  {hasDiscount && (
                    <span className="text-xs text-slate-400 line-through">
                      Rs{original}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FeaturedCourses;
