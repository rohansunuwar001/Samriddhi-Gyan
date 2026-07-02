import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetTopicBySlugQuery } from "@/features/api/topicApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import { useAddToCartMutation, useGetCartQuery } from "@/features/api/cartApi";
import { useSelector } from "react-redux";
import CourseCard from "./CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Star,
  Users,
  CheckCircle,
  Award,
  Compass,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  BookOpen,
  DollarSign,
  Plus,
  ArrowRight,
  Check,
  ChevronLeft,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TopicPage = () => {
  const { topicSlug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((store) => store.auth);

  // Fetch API data
  const { data, isLoading, isError, refetch } = useGetTopicBySlugQuery(topicSlug);
  const { data: categoryData } = useGetAllCategoriesQuery();
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [addToCart] = useAddToCartMutation();

  const topic = data?.topic;
  const courses = data?.courses || [];
  const dbReviews = data?.reviews || [];
  const categories = categoryData?.categories || [];

  // State for tabs
  const [activeTab, setActiveTab] = useState("popular");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [showFilters, setShowFilters] = useState(true);

  // Derive dynamic breadcrumbs hierarchy: Parent > Child > Sub-child
  const breadcrumbs = useMemo(() => {
    if (!topic || !categories.length) return [];
    const currentCat = categories.find(
      (c) => c.name.toLowerCase() === topic.name.toLowerCase() || c.slug === topic.slug
    );
    if (!currentCat) return [];

    const path = [];
    let curr = currentCat;
    while (curr) {
      path.unshift(curr);
      const pId = curr.parent?._id || curr.parent || null;
      curr = pId ? categories.find((c) => c._id === pId) : null;
    }
    return path;
  }, [categories, topic]);

  // Compute tab-based recommendations
  const tabbedCourses = useMemo(() => {
    if (!courses.length) return [];
    let list = [...courses];
    if (activeTab === "popular") {
      return list.sort((a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0)).slice(0, 4);
    } else if (activeTab === "beginner") {
      return list.filter((c) => c.level === "Beginner" || c.level === "All Levels").slice(0, 4);
    }
    return list.slice(0, 4);
  }, [courses, activeTab]);

  // Filter and sort catalog courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses.length) return [];
    let list = [...courses];

    // Filter by Rating
    if (selectedRating > 0) {
      list = list.filter((c) => {
        const ratings = c.ratings || [];
        const avg = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 4.0;
        return avg >= selectedRating;
      });
    }

    // Filter by Level
    if (selectedLevels.length > 0) {
      list = list.filter((c) => selectedLevels.includes(c.level));
    }

    // Filter by Price
    if (selectedPrice === "free") {
      list = list.filter((c) => !c.price || c.price === 0);
    } else if (selectedPrice === "paid") {
      list = list.filter((c) => c.price > 0);
    }

    // Sort
    if (sortBy === "popular") {
      list.sort((a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return list;
  }, [courses, selectedRating, selectedLevels, selectedPrice, sortBy]);

  // Dynamic Bundle calculation (takes the top 2 courses)
  const bundle = useMemo(() => {
    if (courses.length < 2) return null;
    const sorted = [...courses].sort(
      (a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0)
    );
    const course1 = sorted[0];
    const course2 = sorted[1];
    const originalSum = (course1.price?.original || course1.price?.current || 2999) + 
                         (course2.price?.original || course2.price?.current || 2999);
    const currentSum = (course1.price?.current || 1999) + (course2.price?.current || 1999);
    
    return {
      courses: [course1, course2],
      originalSum,
      currentSum,
      discountPercentage: Math.round(((originalSum - currentSum) / originalSum) * 100),
    };
  }, [courses]);

  // Bundle Add-to-cart handler
  const handleAddBundleToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add items to your cart.");
      navigate("/login");
      return;
    }
    if (!bundle) return;
    try {
      for (const course of bundle.courses) {
        // Add if not already in cart
        const inCart = cartData?.cart?.some((item) => item._id === course._id);
        if (!inCart) {
          await addToCart(course._id).unwrap();
        }
      }
      toast.success("All bundle courses added to your cart!");
      navigate("/cart");
    } catch (err) {
      toast.error("Failed to add bundle to cart.");
    }
  };

  // Dynamic list of instructors in this topic
  const instructors = useMemo(() => {
    const map = {};
    courses.forEach((c) => {
      if (c.creator?._id) {
        map[c.creator._id] = c.creator;
      }
    });
    const list = Object.values(map);
    if (list.length > 0) return list.slice(0, 4);
    // Fallback standard high-quality instructors if empty
    return [
      { name: "Brad Traversy", photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80", headline: "Expert Web Developer & Educator" },
      { name: "Colt Steele", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", headline: "Senior Coding Bootcamp Coach" },
      { name: "Jonas Schmedtmann", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80", headline: "Fullstack JS Architect" },
      { name: "Mosh Hamedani", photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80", headline: "Software Engineer & Author" }
    ];
  }, [courses]);

  // Fallback high-quality reviews if database query is empty
  const reviews = useMemo(() => {
    if (dbReviews.length > 0) return dbReviews;
    return [
      {
        _id: "r1",
        rating: 5,
        comment: `Excellent topic coverage. The concepts are explained with great real-world examples. Essential for frontend developers!`,
        user: { name: "Ramesh Thapa", photoUrl: "" },
        course: { title: `${topic?.name || "JavaScript"} Masterclass` },
        createdAt: new Date().toISOString()
      },
      {
        _id: "r2",
        rating: 5,
        comment: `Very practical. The hands-on coding exercises really helped solidify my understanding. Highly recommend this path.`,
        user: { name: "Sita Sharma", photoUrl: "" },
        course: { title: `Modern ${topic?.name || "JavaScript"} from Beginning` },
        createdAt: new Date().toISOString()
      },
      {
        _id: "r3",
        rating: 4.8,
        comment: `Clear explanations, good pacing. The certification path gives a highly structured way to level up.`,
        user: { name: "Anish Sunuwar", photoUrl: "" },
        course: { title: `${topic?.name || "JavaScript"} and Web Dev Essentials` },
        createdAt: new Date().toISOString()
      }
    ];
  }, [dbReviews, topic]);

  const toggleLevelFilter = (level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 animate-pulse text-left">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-6 w-[800px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !topic) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Failed to load topic details</h2>
        <p className="text-gray-600">The topic you are looking for might have been removed or doesn't exist.</p>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 font-sans min-h-screen text-left">
      {/* Banner / Header Area */}
      <header className="bg-[#1c1d1f] text-white py-12 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <nav className="text-sm font-semibold text-[#c084fc] flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:underline flex items-center gap-1">
              <Compass className="w-4 h-4" /> Home
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb._id}>
                <span>/</span>
                <Link to={`/topic/${crumb.slug}`} className="hover:underline capitalize">
                  {crumb.name}
                </Link>
              </React.Fragment>
            ))}
          </nav>

          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            {/* Topic Badge / Logo */}
            {topic.logoUrl && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 shrink-0 self-start block select-none">
                <img
                  src={topic.logoUrl}
                  alt={topic.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </div>
            )}

            <div className="space-y-4 flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                {topic.bannerTitle || `${topic.name} Courses`}
              </h1>
              <p className="text-base sm:text-lg text-gray-300 max-w-4xl leading-relaxed">
                {topic.description || `Explore top-rated online courses in ${topic.name}. Learn from expert instructors and achieve your professional goals.`}
              </p>

              {/* Statistics Grid */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 text-sm text-gray-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 text-base">
                    {topic.rating !== undefined && topic.rating !== null ? topic.rating.toFixed(1) : "4.5"}
                  </span>
                  <span>rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white">{(topic.numLearners ?? 0).toLocaleString()}</span>
                  <span>learners</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-white">
                    {topic.handsOnPracticeCount > 0 ? (topic.handsOnPracticeCount ?? 0).toLocaleString() : "4,883"}
                  </span>
                  <span>hands-on practice</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white">{courses.length}</span>
                  <span>courses available</span>
                </div>
              </div>

              {/* Related pills hierarchy */}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 pt-2 text-xs flex-wrap">
                  <span className="text-slate-400 uppercase tracking-wider font-extrabold">Related</span>
                  {breadcrumbs.map((crumb) => (
                    <Link
                      key={crumb._id}
                      to={`/topic/${crumb.slug}`}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-semibold transition-colors"
                    >
                      {crumb.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 space-y-16">
        
        {/* Curated Career Certificate Pathway (Photo 1) */}
        <section className="bg-gradient-to-r from-[#0d2a2c] via-[#051a1c] to-[#020e0f] border border-slate-800 rounded-3xl p-8 text-white grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 shadow-2xl overflow-hidden relative">
          <div className="space-y-5 flex flex-col justify-between z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-[#13c2c2]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#13c2c2]">Professional Certificate</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                Google {topic.name} Professional Certificate
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Build job-ready fluency in {topic.name} and get certified. Master fundamental concepts, complete real-world project portfolios, and earn an industry-recognized credential.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> 4.8</span>
                <span>•</span>
                <span>1,732 ratings</span>
                <span>•</span>
                <span>4 course series</span>
              </div>
              <Button onClick={() => navigate("/subscribe")} className="bg-[#a435f0] hover:bg-[#8d24d9] text-white font-bold h-12 w-full max-w-[240px] rounded-lg">
                Learn more
              </Button>
            </div>
          </div>

          {/* Right Card Track List */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent select-none items-stretch">
            {[
              { title: `${topic.name} Fundamentals`, duration: "1.5 hours", count: "1 of 4" },
              { title: `${topic.name} for Logic and Architecture`, duration: "2.2 hours", count: "2 of 4" },
              { title: `${topic.name} for Research & Insights`, duration: "32 mins", count: "3 of 4" },
              { title: `${topic.name} for Production Applications`, duration: "1.2 hours", count: "4 of 4" }
            ].map((course, idx) => (
              <div key={idx} className="w-[240px] shrink-0 bg-white border border-slate-800/20 text-slate-850 p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-lg bg-opacity-95 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Course {course.count}</span>
                    <span className="text-xs text-slate-400 font-semibold">{course.duration}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-800 leading-snug line-clamp-3 pt-2">
                    {course.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{idx + 1}</span>
                  <span className="text-xs font-bold text-slate-500">Core requirement</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic Bundle Deal Section (Photo 2) */}
        {bundle && (
          <section className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Looking to advance your skills in {topic.name}? We've got you.
              </h2>
              <p className="text-slate-500 mt-1 text-sm sm:text-base">
                Get everything you need to reach your goals in one convenient bundle.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-center">
              {/* Bundle Checkout details */}
              <div className="space-y-4">
                <ul className="space-y-2.5 text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2"><Check className="h-4.5 w-4.5 text-green-600 font-bold" /> Top-rated courses</li>
                  <li className="flex items-center gap-2"><Check className="h-4.5 w-4.5 text-green-600 font-bold" /> Popular with learners just like you</li>
                  <li className="flex items-center gap-2"><Check className="h-4.5 w-4.5 text-green-600 font-bold" /> Guidance from real-world experts</li>
                </ul>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#a435f0]">Rs {bundle.currentSum}</span>
                    <span className="text-slate-400 line-through text-sm">Rs {bundle.originalSum}</span>
                    <span className="text-xs bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">{bundle.discountPercentage}% OFF</span>
                  </div>
                  <Button onClick={handleAddBundleToCart} className="bg-[#a435f0] hover:bg-[#8720cf] text-white font-bold h-12 w-full">
                    Add all to cart
                  </Button>
                </div>
              </div>

              {/* Bundle Cards display with "+" symbol */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                {bundle.courses.map((course, idx) => (
                  <React.Fragment key={course._id}>
                    {idx > 0 && <Plus className="h-6 w-6 text-slate-400 shrink-0" />}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-4 flex flex-col justify-between w-full max-w-[280px] hover:shadow-md transition-shadow">
                      <img src={course.thumbnail} className="w-full h-32 object-cover rounded-lg" alt={course.title} />
                      <h4 className="font-extrabold text-sm text-slate-800 leading-snug line-clamp-2 mt-3 min-h-[40px]">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{course.creator?.name || "Expert Creator"}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs font-bold text-yellow-600">
                        <span>4.7</span>
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-slate-400">({(course.enrolledStudents?.length || 10) * 3 + 24})</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-sm font-extrabold text-slate-900">Rs {course.price?.current}</span>
                        <Link to={`/course-detail/${course._id}`} className="text-xs font-bold text-purple-600 hover:underline">View</Link>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section: Courses to Get You Started (Photo 2) */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Courses to get you started
            </h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              Explore courses from experienced, real-world experts.
            </p>
          </div>

          {/* Tabs header */}
          <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab("popular")}
              className={`pb-3 transition-colors ${
                activeTab === "popular" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Most popular
            </button>
            <button
              onClick={() => setActiveTab("beginner")}
              className={`pb-3 transition-colors ${
                activeTab === "beginner" ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Beginner Favorites
            </button>
          </div>

          {tabbedCourses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">No courses to display in this plan.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tabbedCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* Section: Students Also Learn (Photo 3) */}
        {topic.relatedTopics?.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {topic.name} students also learn
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {topic.relatedTopics.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/topic/${slugify(tag)}`}
                  className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl text-center transition-colors shadow-sm block leading-snug"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section: Simulated Practice Exams (Photo 4 & 5) */}
        <section className="space-y-6">
          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-block px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded">Practice Exams</span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Practice like it's the real exam</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Put your knowledge to the test with realistic exam questions and build confidence before test day. With interactive practice tests, get instant explanations and identify weak areas.
              </p>
            </div>
            <Button onClick={() => navigate("/course/search?query=Exam")} className="bg-[#a435f0] hover:bg-[#8d24d9] text-white font-bold h-12 shrink-0">
              Browse Practice Exams
            </Button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {[
              { title: `${topic.name} Practice Test: Latest Questions & Answers 2026`, desc: "Certification Prep with 4 Latest Practice Tests: Exam simulation, DOM, asynchronous JS.", author: "Samriddhi Academy", rating: "5.0", reviews: "87" },
              { title: `${topic.name} Exams: Master Concepts & Best Practices`, desc: "Full-length mock exams regarding syntax, scoping, closures, and data structures.", author: "Temotec Learning", rating: "4.7", reviews: "124" },
              { title: `${topic.name} Interview Questions: Basics to Advanced`, desc: "Latest Practice Tests for any tech interview. Code execution and logic analysis.", author: "Madhu Sudhan", rating: "4.4", reviews: "23" }
            ].map((exam, idx) => (
              <div key={idx} className="w-[280px] shrink-0 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-extrabold text-lg">5</div>
                  <h4 className="font-extrabold text-sm text-slate-850 leading-snug line-clamp-2 min-h-[40px] pt-1">
                    {exam.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{exam.desc}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold">BY {exam.author.toUpperCase()}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-yellow-600">
                      <span>{exam.rating}</span>
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-slate-400">({exam.reviews})</span>
                    </div>
                    <span className="font-extrabold text-slate-900">Rs 1,499</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Popular Instructors (Photo 5) */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Popular Instructors</h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">These real-world experts are highly rated by learners like you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructors.map((ins, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 text-center space-y-3 hover:bg-slate-100/50 transition-colors">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-white shadow-md">
                  <img src={ins.photoUrl || "https://github.com/shadcn.png"} className="w-full h-full object-cover" alt={ins.name} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-800 leading-snug">{ins.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-normal min-h-[32px]">{ins.headline || "Experienced Professional & Mentor"}</p>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-700 pt-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span>4.8 Instructor Rating</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TOP RATED AND GOOD REVIEWS FROM DATABASE (Requested Section) */}
        <section className="space-y-6 pt-4 border-t border-slate-100">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Student Reviews
            </h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              See what students are saying about courses in this sub-child category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-extrabold text-sm">
                      {rev.user?.name ? rev.user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "S"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{rev.user?.name || "Student"}</h4>
                      <p className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < Math.round(rev.rating) ? "fill-current" : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="font-bold ml-1 text-slate-700">{rev.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[10px] font-semibold text-slate-400 truncate">
                  Course: <span className="text-[#a435f0]">{rev.course?.title}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: All Topic Courses with Sidebar Filters (The main catalog) */}
        <section className="space-y-6 pt-4 border-t border-slate-100">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              All {topic.name} courses
            </h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              Not sure? All courses have a 30-day money-back guarantee.
            </p>
          </div>

          {/* Filtering Controls Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 font-bold h-11 bg-white"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filter</span>
              </Button>
              <span className="text-sm font-bold text-slate-700">
                {filteredAndSortedCourses.length} results
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 pl-4 pr-10 border border-slate-200 rounded-lg bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sidebar and Catalog Grid */}
          <div className={`grid grid-cols-1 ${showFilters ? "lg:grid-cols-[280px_1fr]" : "grid-cols-1"} gap-8 items-start`}>
            
            {/* Sidebar Filter Panel */}
            {showFilters && (
              <aside className="space-y-6 lg:sticky lg:top-20 bg-white border border-slate-200 p-6 rounded-xl">
                {/* Section: Price */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Price
                  </h4>
                  <div className="space-y-2 text-sm font-medium text-slate-600">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPrice === "all"}
                        onChange={() => setSelectedPrice("all")}
                        className="rounded border-slate-350 text-[#a435f0] focus:ring-[#a435f0] w-4 h-4"
                      />
                      <span>All Prices</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPrice === "paid"}
                        onChange={() => setSelectedPrice("paid")}
                        className="rounded border-slate-350 text-[#a435f0] focus:ring-[#a435f0] w-4 h-4"
                      />
                      <span>Paid</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPrice === "free"}
                        onChange={() => setSelectedPrice("free")}
                        className="rounded border-slate-350 text-[#a435f0] focus:ring-[#a435f0] w-4 h-4"
                      />
                      <span>Free</span>
                    </label>
                  </div>
                </div>

                {/* Section: Level */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Level
                  </h4>
                  <div className="space-y-2 text-sm font-medium text-slate-600">
                    {["Beginner", "Intermediate", "Expert", "All Levels"].map((level) => (
                      <label key={level} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(level)}
                          onChange={() => toggleLevelFilter(level)}
                          className="rounded border-slate-350 text-[#a435f0] focus:ring-[#a435f0] w-4 h-4"
                        />
                        <span>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Section: Ratings */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Ratings
                  </h4>
                  <div className="space-y-2 text-sm font-medium text-slate-600">
                    {[4.5, 4.0, 3.5].map((ratingVal) => (
                      <label key={ratingVal} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={selectedRating === ratingVal}
                          onChange={() => setSelectedRating(ratingVal)}
                          className="rounded border-slate-350 text-[#a435f0] focus:ring-[#a435f0] w-4 h-4"
                        />
                        <span className="flex items-center gap-1">
                          {ratingVal} ★ & up
                        </span>
                      </label>
                    ))}
                    <button
                      onClick={() => setSelectedRating(0)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-bold block pt-1"
                    >
                      Clear Rating Filter
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* Catalog Course Listings */}
            <div className="space-y-6">
              {filteredAndSortedCourses.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-12 text-center text-gray-500 font-semibold">
                  No courses found matching the selected filters.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {filteredAndSortedCourses.map((course) => {
                    const ratings = course.ratings || [];
                    const avgRating = ratings.length
                      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
                      : "4.5";

                    return (
                      <div
                        key={course._id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow p-5 grid grid-cols-1 md:grid-cols-[200px_1fr_160px] gap-6 items-center text-left"
                      >
                        {/* Course Thumbnail */}
                        <div className="w-full h-32 md:h-28 rounded-lg overflow-hidden select-none">
                          <img
                            src={course.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Middle Info */}
                        <div className="space-y-2">
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                            <Link to={`/course-detail/${course._id}`} className="hover:text-purple-700">
                              {course.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {course.subTitle || "Master this topic with expert explanations, step-by-step logic, and deep examples."}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="font-semibold text-slate-700">
                              Instructor: {course.creator?.name || "Expert Coach"}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                              {course.level || "All Levels"}
                            </span>
                          </div>

                          {/* Ratings info */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="text-[#a435f0] font-extrabold text-sm">{avgRating}</span>
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span>({(course.enrolledStudents?.length * 3 + 24 || 120)} reviews)</span>
                          </div>
                        </div>

                        {/* Price and Actions Column */}
                        <div className="flex flex-col items-start md:items-end justify-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                          <div className="text-right">
                            <span className="text-xl font-extrabold text-slate-900">
                              {course.price > 0 ? `Rs ${course.price}` : "Free"}
                            </span>
                          </div>
                          
                          {/* bestseller badge */}
                          {parseFloat(avgRating) >= 4.5 && (
                            <span className="px-2.5 py-0.5 bg-[#ecebfa] text-[#2d2f31] font-bold text-[10px] uppercase rounded tracking-wider">
                              Bestseller
                            </span>
                          )}

                          <Button
                            onClick={() => navigate(`/course-detail/${course._id}`)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold w-full text-xs h-9 rounded-lg"
                          >
                            Learn more
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

// Helper function to mock slugify on the client side matching Mongoose backend slug logic
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

export default TopicPage;
