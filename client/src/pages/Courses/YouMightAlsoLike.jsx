// src/components/YouMightAlsoLike.jsx

import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";

/**
 * Horizontally-scrolling "You might also like" row.
 *
 * Props:
 *  - excludeIds: array of course _ids to hide (e.g. courses already in the cart)
 *  - limit: max number of cards to show (default 10)
 */
const YouMightAlsoLike = ({ excludeIds = [], limit = 10 }) => {
  const scrollRef = useRef(null);

  const { data, isLoading, isError } = useGetPublishedCourseQuery();

  const scrollByCard = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 280, behavior: "smooth" });
  };

  if (isLoading || isError || !data) return null;

  // Be defensive about the response shape (courses / course / data)
  const allCourses = data.courses || data.course || data.data || [];

  const recommended = allCourses
    .filter((c) => !excludeIds.includes(c._id))
    .slice(0, limit);

  if (recommended.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-3xl font-semibold mb-4">You might also like</h2>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {recommended.map((course) => {
            const current = course.price?.current ?? 0;
            const original = course.price?.original;
            const hasDiscount = original && original > current;

            return (
              <Link
                key={course._id}
                to={`/course/${course.slug || course._id}`}
                className="flex-shrink-0 w-64 group"
              >
                <img
                  src={course.thumbnail || "/placeholder.jpg"}
                  alt={course.title}
                  className="w-64 h-36 object-cover rounded-md"
                />
                <h3 className="font-medium text-base mt-2 leading-snug line-clamp-2 group-hover:text-violet-600">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {course.instructor?.name || "Instructor"}
                </p>

                {course.rating && (
                  <div className="flex items-center gap-1 mt-1 text-base">
                    <span className="font-medium text-amber-700">
                      {course.rating}
                    </span>
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {course.numRatings && (
                      <span className="text-gray-400 text-sm">
                        ({course.numRatings.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-base">Rs {current.toFixed(2)}</span>
                  {hasDiscount && (
                    <span className="text-sm text-gray-400 line-through">
                      Rs {original.toFixed(2)}
                    </span>
                  )}
                </div>

                {(course.bestseller || course.premium) && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {course.premium && (
                      <span className="text-sm font-medium bg-violet-600 text-white px-1.5 py-0.5 rounded">
                        Premium
                      </span>
                    )}
                    {course.bestseller && (
                      <span className="text-sm font-medium bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                        Bestseller
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {recommended.length > 3 && (
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

export default YouMightAlsoLike;
