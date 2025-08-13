import { Badge } from "@/components/ui/badge";
import React from "react";
import { Link } from "react-router-dom";
import { Star, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const SearchResult = ({ course }) => {
  return (
    <article className="group flex flex-col md:flex-row gap-4 p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-200 rounded-lg">
      <Link
        to={`/course-detail/${course._id}`}
        className="flex flex-col md:flex-row gap-4 flex-1"
        aria-label={`View ${course.title} course details`}
      >
        <div className="relative aspect-video w-full md:w-56 flex-shrink-0">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          {course.isBestseller && (
            <Badge variant="secondary" className="absolute top-2 left-2">
              Bestseller
            </Badge>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-bold text-lg md:text-xl line-clamp-2">
                {course.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {course.subtitle}
              </p>
            </div>
            <div className="md:hidden">
              <PriceDisplay price={course.price?.current} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.enrolledStudents?.length || 0} students
            </span>
            {course.totalDurationInSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(course.totalDurationInSeconds)}
              </span>
            )}
            {course.ratings > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                {course.ratings.toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="capitalize">
              {course.level}
            </Badge>
            {course.category && (
              <Badge variant="secondary" className="capitalize">
                {course.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Instructor:{" "}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {course.creator?.name || "Unknown"}
              </span>
            </span>
          </div>
        </div>
      </Link>

      <div className="hidden md:flex flex-col items-end justify-between gap-4 w-32 flex-shrink-0">
        <PriceDisplay price={course.price?.current} />
        <Button
          asChild
          size="sm"
          className="w-full"
          variant={course.price?.current === 0 ? "outline" : "default"}
        >
          <Link to={`/course-detail/${course._id}`}>
            {course.price?.current === 0 ? "Enroll Now" : "Buy Now"}
          </Link>
        </Button>
      </div>
    </article>
  );
};

// Helper to format seconds to h:mm:ss or m:ss
function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
}

const PriceDisplay = ({ price }) => {
  if (price === 0 || price === null) {
    return (
      <div className="text-right">
        <span className="font-bold text-green-600 dark:text-green-400">Free</span>
      </div>
    );
  }

  return (
    <div className="text-right">
      <span className="font-bold text-lg">Rs{price?.toLocaleString()}</span>
      {price > 999 && (
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          or Rs{Math.round(price / 12)}/mo
        </span>
      )}
    </div>
  );
};

export default React.memo(SearchResult);