// src/components/CourseRow.jsx

import { useRef } from "react";
import { Link } from "react-router-dom";
import { Star, Users, Clock, BookOpen, ChevronRight } from "lucide-react";

/**
 * Horizontally-scrolling row of course cards (rich style: discount ribbon,
 * level badge, recommended tag, rating, students, duration, lessons, price,
 * instructor avatar).
 *
 * Props:
 *  - heading: string for the row's title (e.g. "Recommended to you based on ratings")
 *  - subheading: optional smaller gray line under the heading
 *  - sectionTag: optional small pill next to the heading (e.g. "New")
 *  - actionLabel: optional link text shown at the right of the heading (e.g. "Edit occupation")
 *  - onActionClick: handler for actionLabel
 *  - courses: array of course objects to display
 *  - badgeText: text for the corner "Recommended" style tag (set to "" to hide it)
 */
const CourseRow = ({
  heading,
  subheading = "",
  sectionTag = "",
  actionLabel = "",
  onActionClick,
  courses = [],
  badgeText = "Recommended",
}) => {
  const scrollRef = useRef(null);

  const scrollByCard = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (!courses || courses.length === 0) return null;

  const formatDuration = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">{heading}</h2>
          {sectionTag && (
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
              {sectionTag}
            </span>
          )}
        </div>
        {actionLabel && (
          <button
            onClick={onActionClick}
            className="text-violet-600 text-sm font-medium hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {subheading && (
        <p className="text-sm text-slate-500 mt-1">{subheading}</p>
      )}

      <div className="relative mt-5">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {courses.map((course) => {
            const current = course.price?.current ?? 0;
            const original = course.price?.original;
            const hasDiscount = original && original > current;
            const discountPct = hasDiscount
              ? Math.round(100 - (current / original) * 100)
              : null;

            // Matches the real Course schema (level, ratings, numOfReviews,
            // enrolledStudents, totalLectures, totalDurationInSeconds, creator)
            const level = course.level || "All Levels";
            const rating = course.ratings ?? 0;
            const numRatings = course.numOfReviews ?? 0;
            const students = course.enrolledStudents?.length ?? 0;
            const duration = formatDuration(course.totalDurationInSeconds);
            const lessons = course.totalLectures ?? 0;
            const avatar = course.creator?.photoUrl;

            return (
              <Link
                key={course._id}
                to={`/course-detail/${course._id}`}
                className="flex-shrink-0 w-72 bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail with overlay badges */}
                <div className="relative w-full h-40">
                  <img
                    src={course.thumbnail || "/placeholder.jpg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {discountPct}% OFF
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                    {level}
                  </span>
                  {badgeText && (
                    <span className="absolute bottom-3 right-3 bg-violet-600 text-white text-xs font-semibold px-2 py-1 rounded">
                      {badgeText}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg leading-snug line-clamp-1">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                      <span className="text-gray-400">({numRatings})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {students} student{students !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {lessons} lesson{lessons !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-blue-700 font-bold text-xl">
                        Rs{current}
                      </span>
                      {hasDiscount && (
                        <span className="text-gray-400 text-sm line-through">
                          Rs{original}
                        </span>
                      )}
                    </div>
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={course.creator?.name || "Instructor"}
                        className="h-9 w-9 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gray-200" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {courses.length > 3 && (
          <button
            onClick={scrollByCard}
            aria-label="Scroll for more courses"
            className="hidden md:flex items-center justify-center absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 h-9 w-9 rounded-full bg-white border shadow-md hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        )}
      </div>
    </section>
  );
};

export default CourseRow;
