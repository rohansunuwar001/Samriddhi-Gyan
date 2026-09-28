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
import {
  useGetTrendingCourseQuery,
  useGetRecommendedCourseQuery,
} from "@/features/api/recommendedApi";

const NoCoursesAvailable = ({ isLoggedIn }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Alert className="max-w-md text-center">
      {isLoggedIn ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <ShoppingBasket className="h-4 w-4" />
      )}
      <AlertTitle className="font-light">
        {isLoggedIn ? "You're All Caught Up!" : "No Courses Available"}
      </AlertTitle>
      <AlertDescription>
        {isLoggedIn
          ? "It looks like you've already enrolled in all of our available courses. Fantastic job!"
          : "There are currently no courses to display. Please check back later."}
        {isLoggedIn && (
          <div className="mt-4">
            <Button asChild>
              <Link to="/home/my-courses/learning">Go to My Learning</Link>
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
  // Fetch actual server recommendations using embeddings/collab filtering
  const {
    data: recommendedData,
    isLoading: isLoadingRec,
    isError: isErrorRec,
    error: recError,
  } = useGetRecommendedCourseQuery();

  // Fetch actual server trending data
  const {
    data: trendingData,
    isLoading: isLoadingTrending,
  } = useGetTrendingCourseQuery();

  // Fetch all published courses for fallbacks & categories grouping
  const {
    data: publishedData,
    isLoading: isLoadingPublished,
    isError: isErrorPublished,
    error: publishedError,
    refetch,
  } = useGetPublishedCourseQuery();

  const { user } = useSelector((state) => state.auth);

  const recommendedCourses = recommendedData?.recommendedCourses || [];
  const trendingCourses = trendingData?.trendingCourses || [];
  const allCourses = publishedData?.courses || [];

  // Exclude enrolled courses from fallback views
  const enrolledIds = React.useMemo(() => {
    return new Set(
      (user?.enrolledCourses || []).map((course) =>
        typeof course === "string" ? course : course._id
      )
    );
  }, [user]);

  const filteredCourses = React.useMemo(() => {
    if (allCourses.length === 0) return [];
    if (user) {
      return allCourses.filter((course) => !enrolledIds.has(course._id));
    }
    return allCourses;
  }, [allCourses, user, enrolledIds]);

  // Build category rows from remaining unpurchased courses
  const { categoryRows, fallbackRow } = React.useMemo(() => {
    if (filteredCourses.length === 0) {
      return { categoryRows: [], fallbackRow: [] };
    }

    const byCategory = {};
    filteredCourses.forEach((course) => {
      const category = course.category;
      if (!category) return;
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(course);
    });

    const categoryRows = Object.entries(byCategory)
      .filter(([, list]) => list.length >= 3)
      .slice(0, 3)
      .map(([category, list]) => ({ category, courses: list.slice(0, 8) }));

    const categoryCourseIds = new Set(
      categoryRows.flatMap(({ courses }) => courses.map((c) => c._id))
    );
    const remaining = filteredCourses.filter((c) => !categoryCourseIds.has(c._id));

    const fallbackRow = categoryRows.length === 0 ? remaining.slice(0, 8) : [];

    return { categoryRows, fallbackRow };
  }, [filteredCourses]);

  // Match courses against the user's freeform "occupation" text
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

  // "Because you wishlisted X" — pick the most recently wishlisted course
  const wishlistRow = React.useMemo(() => {
    if (
      !user?.wishlist ||
      user.wishlist.length === 0 ||
      filteredCourses.length === 0
    ) {
      return { pivot: null, courses: [] };
    }

    const wishlistIds = user.wishlist.map((item) =>
      typeof item === "string" ? item : item._id
    );
    const pivotId = wishlistIds[wishlistIds.length - 1];

    const pivot =
      filteredCourses.find((c) => c._id === pivotId) ||
      allCourses.find((c) => c._id === pivotId);

    if (!pivot) return { pivot: null, courses: [] };

    const related = filteredCourses.filter(
      (c) => c._id !== pivot._id && c.category && c.category === pivot.category
    );

    if (related.length === 0) return { pivot: null, courses: [] };

    return {
      pivot,
      courses: [...related]
        .sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0))
        .slice(0, 8),
    };
  }, [filteredCourses, user, allCourses]);

  // "Because you viewed X" — pick the most recently viewed course
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
      allCourses.find((c) => c._id === pivotId);

    if (!pivot) return { pivot: null, courses: [] };

    const related = filteredCourses.filter(
      (c) => c._id !== pivot._id && c.category && c.category === pivot.category
    );

    if (related.length === 0) return { pivot: null, courses: [] };

    return {
      pivot,
      courses: [...related]
        .sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0))
        .slice(0, 8),
    };
  }, [filteredCourses, user, allCourses]);

  const isLoading = isLoadingRec || isLoadingTrending || isLoadingPublished;
  const isError = isErrorRec || isErrorPublished;
  const error = publishedError || recError;

  const isEmpty = !isLoading && !isError && filteredCourses.length === 0;

  return (
    <div className="bg-white font-sans text-left">
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
              {trendingCourses.length > 0 && (
                <CourseRow
                  heading="Trending courses"
                  subheading="What's gaining momentum this week"
                  courses={trendingCourses}
                />
              )}

              {recommendedCourses.length > 0 && (
                <CourseRow
                  heading="Recommended for you"
                  subheading="Courses tailored to your learning preferences and history"
                  courses={recommendedCourses}
                />
              )}

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
                        to={`/course/${viewedRow.pivot.slug || viewedRow.pivot._id}`}
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
                        to={`/course/${wishlistRow.pivot.slug || wishlistRow.pivot._id}`}
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
