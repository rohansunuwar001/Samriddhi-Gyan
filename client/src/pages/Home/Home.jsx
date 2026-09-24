import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import GuestHome from "./GuestHome";
import WelcomeBanner from "./WelcomeBanner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useGetMyLearningCoursesQuery, useLoadUserQuery } from "@/features/api/authApi";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { useGetRecommendedCourseQuery, useGetTrendingCourseQuery } from "@/features/api/recommendedApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import CourseCard from "../student/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

// Reusable horizontal course slider with hover chevrons
const CourseSlider = ({ courses }) => {
  const containerRef = useRef(null);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 600;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group/slider">
      {/* Left Navigation Arrow */}
      <button
        onClick={() => scroll("left")}
        aria-label="Previous courses"
        className="absolute -left-4 top-1/2 -translate-y-1/2 bg-[#1c1d1f] hover:bg-black text-white shadow-xl rounded-full w-11 h-11 flex items-center justify-center z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Slider Viewport */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {courses.map((course) => (
          <div key={course._id} className="w-[240px] shrink-0">
            <CourseCard course={course} />
          </div>
        ))}
      </div>

      {/* Right Navigation Arrow */}
      <button
        onClick={() => scroll("right")}
        aria-label="Next courses"
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-[#1c1d1f] hover:bg-black text-white shadow-xl rounded-full w-11 h-11 flex items-center justify-center z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((store) => store.auth);

  // Fetch loadUser to get occupation, interests, viewHistory, wishlist
  const { data: userDataResponse } = useLoadUserQuery(undefined, { skip: !isAuthenticated });
  const currentUser = userDataResponse?.user;

  // Fetch student purchased courses
  const {
    data: learningData,
    isLoading: isLoadingLearning,
    isError: isErrorLearning,
  } = useGetMyLearningCoursesQuery(undefined, { skip: !isAuthenticated });


  // Fetch recommended courses
  const {
    data: recommendedData,
    isLoading: isLoadingRecommended,
    isError: isErrorRecommended,
  } = useGetRecommendedCourseQuery(undefined, { skip: !isAuthenticated });


  // Fetch trending courses
  const {
    data: trendingData,
    isLoading: isLoadingTrending,
    isError: isErrorTrending,
  } = useGetTrendingCourseQuery(undefined, { skip: !isAuthenticated });


  // Fetch published courses (used for featured, fallbacks, searches, etc.)
  const {
    data: publishedData,
    isLoading: isLoadingPublished,
    isError: isErrorPublished,
  } = useGetPublishedCourseQuery(undefined, { skip: !isAuthenticated });




  // Fetch categories dynamically
  const { data: categoriesData } = useGetAllCategoriesQuery(undefined, { skip: !isAuthenticated });

  const [activeFeaturedTab, setActiveFeaturedTab] = useState("Most popular");

  useEffect(() => {
    if (recommendedData) {
      console.log("🎯 [Home Component] Recommended Courses JSON Data:", recommendedData);
    }
  }, [recommendedData]);

  if (!isAuthenticated) {
    return <GuestHome />;
  }

  const isHomeLoading = isLoadingLearning || isLoadingRecommended || isLoadingTrending || isLoadingPublished;
  if (isHomeLoading) {
    return <LoadingSpinner />;
  }

  const learningCourses = learningData?.courses || [];
  const allCourses = publishedData?.courses || [];

  // Filter out already purchased courses for recommendations
  const enrolledIds = new Set(learningCourses.map((c) => c._id.toString()));
  const unpurchasedCourses = allCourses.filter((c) => !enrolledIds.has(c._id.toString()));

  // 1. Recommended for you
  const recommendedCourses = recommendedData?.recommendedCourses || [];

  // 2. Based on your recent searches
  // Uses the real searchHistory persisted in DB (newest first, max 10 terms).
  const searchHistory = currentUser?.searchHistory || [];

  const recentSearchesCourses = (() => {
    if (searchHistory.length === 0) return []; // hide section when no history

    // Build a flat lowercase keyword list from all stored search terms
    const keywords = [
      ...new Set(
        searchHistory
          .join(" ")
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2)
      ),
    ];

    const matched = unpurchasedCourses.filter((course) => {
      const searchText = [
        course.title,
        course.subtitle,
        course.category,
        ...(course.tags || []),
        ...(course.topics || []),
      ]
        .join(" ")
        .toLowerCase();
      return keywords.some((kw) => searchText.includes(kw));
    });

    return matched.slice(0, 8);
  })();

  // 3. Because you viewed "[Course Title]"
  const viewHistory = currentUser?.viewHistory || [];
  const lastViewedEntry = viewHistory[0];
  const lastViewedCourse = lastViewedEntry?.course;
  const viewedCategory = lastViewedCourse?.category;

  const becauseYouViewedCourses = viewedCategory
    ? unpurchasedCourses.filter((c) => c.category === viewedCategory && c._id.toString() !== lastViewedCourse._id.toString())
    : unpurchasedCourses.slice(5, 13);

  // 4. Popular for [Occupation]
  // Extract meaningful keywords from the occupation string (ignore short stop-words)
  const occupation = currentUser?.occupation || "Full Stack Web Developer";
  const STOP_WORDS = new Set(["for", "and", "the", "a", "an", "in", "of", "to", "with", "full", "web"]);
  const occupationKeywords = occupation
    .toLowerCase()
    .split(/[\s/,]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const popularForOccupationCourses = (() => {
    if (occupationKeywords.length === 0) return unpurchasedCourses.slice(0, 8);

    const matched = unpurchasedCourses.filter((course) => {
      const searchText = [
        course.title,
        course.subtitle,
        course.category,
        ...(course.tags || []),
        ...(course.topics || []),
      ]
        .join(" ")
        .toLowerCase();
      return occupationKeywords.some((kw) => searchText.includes(kw));
    });

    // Fallback: if fewer than 3 courses match, show top-rated courses instead
    return matched.length >= 3 ? matched.slice(0, 8) : unpurchasedCourses.slice(0, 8);
  })();

  // 5. Trending courses
  const trendingCourses = trendingData?.trendingCourses || [];

  // 6. Because you wishlisted "[Course Title]"
  const wishlist = currentUser?.wishlist || [];
  const lastWishlistedCourse = wishlist[wishlist.length - 1];
  const wishlistedCategory = lastWishlistedCourse?.category;

  const becauseYouWishlistedCourses = wishlistedCategory
    ? unpurchasedCourses.filter((c) => c.category === wishlistedCategory && c._id.toString() !== lastWishlistedCourse._id.toString())
    : unpurchasedCourses.slice(1, 9);

  // 7. Recommended to you based on ratings
  const basedOnRatingsCourses = [...unpurchasedCourses].sort((a, b) => {
    const aRating = a.ratings || 0;
    const bRating = b.ratings || 0;
    return bRating - aRating;
  });

  // 8. Featured courses filtering
  let featuredCourses = [];
  if (activeFeaturedTab === "Most popular") {
    featuredCourses = [...unpurchasedCourses].sort((a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0));
  } else if (activeFeaturedTab === "New") {
    featuredCourses = [...unpurchasedCourses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    featuredCourses = unpurchasedCourses.filter((c) => c.level === "Intermediate" || c.level === "Advanced");
    if (featuredCourses.length === 0) featuredCourses = unpurchasedCourses.slice(0, 6);
  }

  // 9. Topics recommended for you — derived from the user's own activity
  //    Priority: enrolled course topics/tags → search history terms → viewed categories
  const recommendedTopics = (() => {
    const seen = new Set();
    const topics = [];

    const add = (label) => {
      if (!label) return;
      const key = label.trim().toLowerCase();
      if (key.length < 2 || seen.has(key)) return;
      seen.add(key);
      topics.push({ label: label.trim(), query: label.trim() });
    };

    // 1. Topics & tags from enrolled courses (most relevant signal)
    learningCourses.forEach((course) => {
      (course.topics || []).forEach(add);
      (course.tags || []).forEach(add);
      if (course.category) add(course.category);
    });

    // 2. Keywords from search history
    (currentUser?.searchHistory || []).forEach((term) => {
      term.split(/\s+/).forEach((word) => {
        if (word.length > 3) add(word);
      });
      add(term); // also add full term as-is
    });

    // 3. Categories from view history
    (currentUser?.viewHistory || []).forEach((entry) => {
      if (entry?.course?.category) add(entry.course.category);
    });

    return topics.slice(0, 15);
  })();

  return (
    <div className="bg-[#white] min-h-screen text-[#2d2f31] font-sans pb-20 text-left">
      <div className="container mx-auto px-6 sm:px-12 lg:px-16 py-8 max-w-7xl space-y-12">
        
        {/* Welcome Section */}
        <div className="bg-white border-b border-gray-100 pb-2">
          <WelcomeBanner />
        </div>

        {/* Let's start learning Section */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#2d2f31] tracking-tight">
              Let's start learning
            </h2>
            <Link
              to="/home/my-courses/learning"
              className="text-[14px] font-semibold text-[#a435f0] hover:text-[#8710d8] hover:underline"
            >
              My learning
            </Link>
          </div>

          {isLoadingLearning ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-[380px] shrink-0 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : isErrorLearning ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-[14px] text-gray-500">
              Failed to load purchased courses. Please refresh.
            </div>
          ) : learningCourses.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3 shadow-sm">
              <p className="text-[15px] text-gray-600 font-normal">
                You haven't enrolled in any courses yet.
              </p>
              <button
                onClick={() => navigate("/course/search")}
                className="bg-[#2d2f31] hover:bg-black text-white px-5 py-2.5 text-[14px] font-semibold rounded-sm shadow-sm transition-all"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="relative group/slider-learning">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none" style={{ scrollbarWidth: "none" }}>
                {learningCourses.map((course) => {
                  const resume = course.resumeInfo || {
                    sectionTitle: "Introduction",
                    lectureTitle: "First Lesson",
                    lectureDuration: 0,
                  };
                  const progressPercent = course.progress || 0;
                  const durMins = Math.round(resume.lectureDuration / 60) || 5;

                  return (
                    <div
                      key={course._id}
                      onClick={() => navigate(`/course/${course.slug || course._id}/content`)}
                      className="w-[380px] shrink-0 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all cursor-pointer flex flex-row overflow-hidden select-none"
                    >
                      {/* Left Thumbnail with Play Button */}
                      <div className="relative w-32 h-full bg-gray-100 shrink-0">
                        <img
                          src={course.thumbnail || "/placeholder_course.png"}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-white/95 flex items-center justify-center text-[#2d2f31] shadow-lg">
                            <Play className="h-5 w-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Right Info */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-[14px] text-[#2d2f31] line-clamp-1">
                            {course.title}
                          </h4>
                          <p className="text-[12px] text-[#6a6f73] font-normal truncate">
                            {resume.sectionTitle} • {resume.lectureTitle}
                          </p>
                          <p className="text-[11px] text-gray-400 font-light uppercase">
                            Lecture • {durMins}m left
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-2">
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#a435f0] h-full transition-all duration-500 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-[#6a6f73] font-normal">
                            <span>{progressPercent}% complete</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- WHAT TO LEARN NEXT ALGORITHMIC RECOMMENDATIONS --- */}
        <div className="space-y-10 pt-4">
          
          {/* Main Title Header */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-semibold text-[#2d2f31] tracking-tight">
              What to learn next
            </h2>
          </div>

          {/* Slider 1: Recommended for you */}
          {(isLoadingRecommended || (recommendedCourses && recommendedCourses.length > 0)) && (
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Recommended for you
              </h3>
              {isLoadingRecommended ? (
                <div className="flex gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 w-[240px] bg-gray-100 rounded-xl" />
                  ))}
                </div>
              ) : (
                <CourseSlider courses={recommendedCourses} />
              )}
            </div>
          )}

          {/* Slider 2: Based on your recent searches */}
          {recentSearchesCourses && recentSearchesCourses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Based on your recent searches
              </h3>
              <CourseSlider courses={recentSearchesCourses} />
            </div>
          )}

          {/* Slider 3: Because you viewed "..." */}
          {lastViewedCourse && becauseYouViewedCourses && becauseYouViewedCourses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Because you viewed &ldquo;
                <span className="text-[#a435f0] hover:underline cursor-pointer">
                  {lastViewedCourse.title}
                </span>
                &rdquo;
              </h3>
              <CourseSlider courses={becauseYouViewedCourses} />
            </div>
          )}

          {/* Slider 4: Popular for [Occupation] */}
          {popularForOccupationCourses && popularForOccupationCourses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                  Popular for {occupation}
                </h3>
                <button
                  onClick={() => navigate("/personalize")}
                  className="text-[14px] font-semibold text-[#a435f0] hover:underline"
                >
                  Edit occupation
                </button>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-gray-500 font-normal">
                <span className="bg-[#d5ffd6] text-[#1c6f21] px-2 py-0.5 rounded-sm font-semibold text-[11px] uppercase">
                  New
                </span>
                <span>Inspired by your selections</span>
              </div>
              <CourseSlider courses={popularForOccupationCourses} />
            </div>
          )}

          {/* Slider 5: Trending courses */}
          {trendingCourses && trendingCourses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Trending courses
              </h3>
              <CourseSlider courses={trendingCourses.slice(0, 8)} />
            </div>
          )}

          {/* Slider 6: Because you wishlisted "..." */}
          {lastWishlistedCourse && becauseYouWishlistedCourses && becauseYouWishlistedCourses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Because you wishlisted &ldquo;
                <span className="text-[#a435f0] hover:underline cursor-pointer">
                  {lastWishlistedCourse.title}
                </span>
                &rdquo;
              </h3>
              <CourseSlider courses={becauseYouWishlistedCourses} />
            </div>
          )}

          {/* Slider 7: Recommended to you based on ratings */}
          {basedOnRatingsCourses && basedOnRatingsCourses.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Recommended to you based on ratings
              </h3>
              <CourseSlider courses={basedOnRatingsCourses.slice(0, 8)} />
            </div>
          )}

          {/* Section 8: Featured courses Tab Section */}
          {featuredCourses && featuredCourses.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Featured courses
              </h3>
              
              {/* Tabs */}
              <div className="flex border-b border-gray-200 text-[15px] font-semibold gap-6">
                {["Most popular", "New", "Intermediate & advanced"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFeaturedTab(tab)}
                    className={`pb-3 focus:outline-none transition-colors border-b-2 ${
                      activeFeaturedTab === tab
                        ? "border-[#2d2f31] text-[#2d2f31]"
                        : "border-transparent text-[#6a6f73] hover:text-[#2d2f31]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <CourseSlider courses={featuredCourses} />
              </div>
            </div>
          )}

          {/* Section 9: Topics recommended for you */}
          {recommendedTopics && recommendedTopics.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#2d2f31]">
                Topics recommended for you
              </h3>
              <div className="flex flex-wrap gap-3">
                {recommendedTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/course/search?query=${encodeURIComponent(topic.query)}`)}
                    className="border border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-[#2d2f31] font-semibold text-[14px] px-5 py-3 rounded-md transition-all select-none"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Home;
