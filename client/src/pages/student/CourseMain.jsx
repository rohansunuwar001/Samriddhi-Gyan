// src/components/CourseMain.jsx

import React from "react";
import { useSelector } from "react-redux";

// --- UI COMPONENTS & ICONS ---
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import PropTypes from "prop-types";

import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ShoppingBasket } from "lucide-react";
import { Link } from "react-router-dom";
import CourseRow from "../Courses/CourseRow";
import FeaturedCourses from "../Courses/FeaturedCourses";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { useGetTrendingCourseQuery } from "@/features/api/recommendedApi";

const NoCoursesAvailable = ({ isLoggedIn }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Alert className="max-w-md text-center">
      {isLoggedIn ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <ShoppingBasket className="h-4 w-4" />
      )}
      <AlertTitle className="font-bold">
        {isLoggedIn ? "You're All Caught Up!" : "No Courses Available"}
      </AlertTitle>
      <AlertDescription>
        {isLoggedIn
          ? "It looks like you've already enrolled in all of our available courses. Fantastic job!"
          : "There are currently no courses to display. Please check back later."}
        {isLoggedIn && (
          <div className="mt-4">
            <Button asChild>
              <Link to="/my-learning">Go to My Learning</Link>
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  </div>
);

NoCoursesAvailable.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
};

/**
 * A skeleton loader that mimics a row of horizontally-scrolling course cards.
 */
const CourseRowSkeleton = () => (
  <div className="mb-12">
    <Skeleton className="h-7 w-72 mb-4" />
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex-shrink-0 w-64 space-y-2">
          <Skeleton className="w-64 h-36 rounded-md" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  </div>
);

const CourseMain = () => {
  const { data, isLoading, isError, error, refetch } =
    useGetPublishedCourseQuery();
  const { data: trendingData } = useGetTrendingCourseQuery();
  const { user } = useSelector((state) => state.auth);

  console.log("get published course", data);
  console.log("get trending course", trendingData);

  console.log("User enrolledCourses:", user?.enrolledCourses);
  console.log("First enrolled item type:", typeof user?.enrolledCourses?.[0]);
  console.log("First enrolled item:", user?.enrolledCourses?.[0]);
  const trendingRow = React.useMemo(() => {
    if (!trendingData?.trendingCourses) return [];
    const enrolledIds = new Set(
      (user?.enrolledCourses || []).map((course) =>
        typeof course === "string" ? course : course._id,
      ),
    );
    return trendingData.trendingCourses.filter((c) => !enrolledIds.has(c._id));
  }, [trendingData, user]);

  const filteredCourses = React.useMemo(() => {
    if (!data?.courses) return [];

    if (user && data.courses.length > 0) {
      const enrolledIds = new Set(
        (user.enrolledCourses || []).map((course) =>
          typeof course === "string" ? course : course._id,
        ),
      );

      return data.courses.filter((course) => !enrolledIds.has(course._id));
    }

    return data.courses;
  }, [data, user]);

  // Build the recommendation rows: top-rated first, then grouped by category.
  // Falls back gracefully if courses don't have `rating` / `category` fields.
  const { recommended, categoryRows, fallbackRow } = React.useMemo(() => {
    if (filteredCourses.length === 0) {
      return { recommended: [], categoryRows: [], fallbackRow: [] };
    }

    const sorted = [...filteredCourses].sort((a, b) => {
      const ratingDiff = (b.ratings ?? 0) - (a.ratings ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.numOfReviews ?? 0) - (a.numOfReviews ?? 0);
    });

    const recommended = sorted.slice(0, 8);
    const recommendedIds = new Set(recommended.map((c) => c._id));
    const remaining = filteredCourses.filter((c) => !recommendedIds.has(c._id));

    const byCategory = {};
    remaining.forEach((course) => {
      const category = course.category;
      if (!category) return;
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(course);
    });

    const categoryRows = Object.entries(byCategory)
      .filter(([, list]) => list.length >= 3)
      .slice(0, 3)
      .map(([category, list]) => ({ category, courses: list.slice(0, 8) }));

    // If no category data exists at all, just show the remaining courses in one row.
    const fallbackRow = categoryRows.length === 0 ? remaining.slice(0, 8) : [];

    return { recommended, categoryRows, fallbackRow };
  }, [filteredCourses]);

  // Match courses against the user's freeform "occupation" text (e.g. "Full Stack Web Developer").
  // Matches on course.category/title containing the occupation, or sharing a significant word with it.
  const occupationRow = React.useMemo(() => {
    if (!user?.occupation || filteredCourses.length === 0) return [];

    const occLower = user.occupation.toLowerCase();
    const stopwords = new Set(["and", "the", "for", "with", "of"]);
    const occWords = occLower
      .split(/[^a-z0-9+]+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    const matches = filteredCourses.filter((course) => {
      const category = (course.category || "").toLowerCase();
      const title = (course.title || "").toLowerCase();
      if (!category && !title) return false;
      if (category && occLower.includes(category)) return true;
      return occWords.some((w) => category.includes(w) || title.includes(w));
    });

    return [...matches]
      .sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0))
      .slice(0, 8);
  }, [filteredCourses, user]);

  // "Because you wishlisted X" — pick the most recently wishlisted course (last
  // item added) and show other courses from the same category.
  // Handles user.wishlist being either an array of ids or populated course objects.
  const wishlistRow = React.useMemo(() => {
    if (
      !user?.wishlist ||
      user.wishlist.length === 0 ||
      filteredCourses.length === 0
    ) {
      return { pivot: null, courses: [] };
    }

    const wishlistIds = user.wishlist.map((item) =>
      typeof item === "string" ? item : item._id,
    );
    const pivotId = wishlistIds[wishlistIds.length - 1];

    const pivot =
      filteredCourses.find((c) => c._id === pivotId) ||
      data?.courses?.find((c) => c._id === pivotId);

    if (!pivot) return { pivot: null, courses: [] };

    const related = filteredCourses.filter(
      (c) => c._id !== pivot._id && c.category && c.category === pivot.category,
    );

    if (related.length === 0) return { pivot: null, courses: [] };

    return {
      pivot,
      courses: [...related]
        .sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0))
        .slice(0, 8),
    };
  }, [filteredCourses, user, data]);

  // "Because you viewed X" — pick the most recently viewed course (first item,
  // since trackCourseView unshifts onto the front) and show same-category courses.
  // Handles entry.course being either an id string or a populated course object.
  const viewedRow = React.useMemo(() => {
    if (
      !user?.viewHistory ||
      user.viewHistory.length === 0 ||
      filteredCourses.length === 0
    ) {
      return { pivot: null, courses: [] };
    }

    const mostRecent = user.viewHistory[0];
    const pivotId =
      typeof mostRecent.course === "string"
        ? mostRecent.course
        : mostRecent.course?._id;

    const pivot =
      filteredCourses.find((c) => c._id === pivotId) ||
      data?.courses?.find((c) => c._id === pivotId);

    if (!pivot) return { pivot: null, courses: [] };

    const related = filteredCourses.filter(
      (c) => c._id !== pivot._id && c.category && c.category === pivot.category,
    );

    if (related.length === 0) return { pivot: null, courses: [] };

    return {
      pivot,
      courses: [...related]
        .sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0))
        .slice(0, 8),
    };
  }, [filteredCourses, user, data]);

  const isEmpty = !isLoading && !isError && filteredCourses.length === 0;

  return (
    <div className="bg-white font-sans">
      <div className="container max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <main className="mt-12">
          {isLoading ? (
            <>
              <CourseRowSkeleton />
              <CourseRowSkeleton />
            </>
          ) : isError ? (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error loading courses</AlertTitle>
              <AlertDescription>
                {error?.data?.message ||
                  "Failed to fetch courses. Please try again."}
                <div className="mt-4">
                  <Button variant="outline" onClick={refetch}>
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : isEmpty ? (
            <NoCoursesAvailable isLoggedIn={!!user} />
          ) : (
            <>
              {trendingRow.length > 0 && (
                <CourseRow
                  heading="Trending courses"
                  subheading="What's gaining momentum this week"
                  courses={trendingRow}
                />
              )}

              <CourseRow
                heading="Recommended to you based on ratings"
                subheading="Courses tailored to your learning preferences and history"
                courses={recommended}
              />

              {occupationRow.length > 0 && (
                <CourseRow
                  heading={`Popular for ${user.occupation}`}
                  subheading="Inspired by your selections"
                  sectionTag="New"
                  actionLabel="Edit occupation"
                  onActionClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  courses={occupationRow}
                />
              )}

              {viewedRow.pivot && viewedRow.courses.length > 0 && (
                <CourseRow
                  heading={
                    <>
                      Because you viewed &quot;
                      <Link
                        to={`/course-detail/${viewedRow.pivot._id}`}
                        className="text-violet-600 underline underline-offset-2 hover:text-violet-700"
                      >
                        {viewedRow.pivot.title}
                      </Link>
                      &quot;
                    </>
                  }
                  courses={viewedRow.courses}
                />
              )}

              {wishlistRow.pivot && wishlistRow.courses.length > 0 && (
                <CourseRow
                  heading={
                    <>
                      Because you wishlisted &quot;
                      <Link
                        to={`/course-detail/${wishlistRow.pivot._id}`}
                        className="text-violet-600 underline underline-offset-2 hover:text-violet-700"
                      >
                        {wishlistRow.pivot.title}
                      </Link>
                      &quot;
                    </>
                  }
                  courses={wishlistRow.courses}
                />
              )}

              {categoryRows.map(({ category, courses }) => (
                <CourseRow
                  key={category}
                  heading={`What people who learn ${category} take next`}
                  subheading={`Popular picks among ${category} learners`}
                  courses={courses}
                />
              ))}

              <FeaturedCourses />

              {fallbackRow.length > 0 && (
                <CourseRow
                  heading="More courses for you"
                  subheading="Explore more from our catalog"
                  courses={fallbackRow}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseMain;
