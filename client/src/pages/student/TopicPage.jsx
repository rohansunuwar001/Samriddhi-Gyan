import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGetTopicBySlugQuery } from "@/features/api/topicApi";
import { useInitializeExamEsewaMutation } from "@/features/api/certificationApi";
import LoadingSpinner from "@/components/LoadingSpinner";
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

const getCourseNumericPrice = (course) => {
  if (!course) return 0;
  if (course.price === undefined || course.price === null) return 0;
  if (typeof course.price === "number") return course.price;
  if (typeof course.price === "object") {
    return course.price.current !== undefined ? course.price.current : 0;
  }
  return 0;
};

const TopicPage = () => {
  const { topicSlug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((store) => store.auth);

  // Fetch API data
  const { data, isLoading, isError, error, refetch } = useGetTopicBySlugQuery(topicSlug);
  const { data: categoryData } = useGetAllCategoriesQuery();
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [addToCart] = useAddToCartMutation();
  const [initializeEsewa, { isLoading: initializingEsewa }] = useInitializeExamEsewaMutation();

  const topic = data?.topic;
  const courses = data?.courses || [];
  const dbReviews = data?.reviews || [];
  const categories = categoryData?.categories || [];
  const certification = data?.certification;

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
        const avg = c.avgRating !== undefined ? c.avgRating : (c.ratings?.length ? c.ratings.reduce((s, r) => s + r, 0) / c.ratings.length : 0);
        return avg >= selectedRating;
      });
    }

    // Filter by Level
    if (selectedLevels.length > 0) {
      list = list.filter((c) => selectedLevels.includes(c.level));
    }

    // Filter by Price
    if (selectedPrice === "free") {
      list = list.filter((c) => getCourseNumericPrice(c) === 0);
    } else if (selectedPrice === "paid") {
      list = list.filter((c) => getCourseNumericPrice(c) > 0);
    }

    // Sort
    if (sortBy === "popular") {
      list.sort((a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => getCourseNumericPrice(b) - getCourseNumericPrice(a));
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
    const p1 = getCourseNumericPrice(course1);
    const p2 = getCourseNumericPrice(course2);
    const orig1 = course1.price?.original || p1;
    const orig2 = course2.price?.original || p2;
    const originalSum = orig1 + orig2;
    const currentSum = p1 + p2;
    
    return {
      courses: [course1, course2],
      originalSum,
      currentSum,
      discountPercentage: originalSum > currentSum ? Math.round(((originalSum - currentSum) / originalSum) * 100) : 0,
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

  // Dynamic list of real instructors in this topic
  const instructors = useMemo(() => {
    const map = {};
    courses.forEach((c) => {
      if (c.creator?._id) {
        if (!map[c.creator._id]) {
          map[c.creator._id] = {
            ...c.creator,
            coursesCount: 1,
          };
        } else {
          map[c.creator._id].coursesCount++;
        }
      }
    });
    return Object.values(map);
  }, [courses]);

  // Real reviews from database
  const reviews = useMemo(() => {
    return Array.isArray(dbReviews) ? dbReviews : [];
  }, [dbReviews]);

  // Real practice / hands-on courses
  const practiceCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        (c.courseIncludes?.codingExercises > 0) ||
        /exam|practice|test|quiz|assessment/i.test(c.title || "")
    );
  }, [courses]);

  const toggleLevelFilter = (level) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !topic) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 text-center bg-white">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-50 text-red-500 mb-2">
            <span className="text-4xl font-extralight tracking-widest">404</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed font-light">
            {error?.data?.message ||
              "The page or topic you are looking for doesn't exist or is not directly accessible. Parent and child categories do not have dedicated topic pages."}
          </p>
          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="bg-[#a435f0] hover:bg-[#8710d8] text-white">
              <Link to="/" className="flex items-center gap-2">
                <Compass className="w-4 h-4" /> Go to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/courses">Explore All Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (topic.type === "certification" && certification) {
    const topCourse = courses.reduce((best, curr) => {
      if (!best) return curr;
      const bestRating = best.ratings || 0;
      const currRating = curr.ratings || 0;
      return currRating > bestRating ? curr : best;
    }, null);

    return (
      <div className="bg-slate-50 text-slate-900 font-sans min-h-screen text-left pb-20">
        {/* Banner */}
        <header className="bg-[#1c1d1f] text-white py-12 px-6 sm:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="space-y-4 flex-1">
              <nav className="text-base font-medium text-purple-400 flex items-center gap-2 flex-wrap">
                <Link to="/" className="hover:underline flex items-center gap-1">
                  <Compass className="w-4 h-4" /> Home
                </Link>
                {certification.categoryFilterParent?.name && (
                  <>
                    <span>/</span>
                    <span className="text-slate-300 capitalize">
                      {certification.categoryFilterParent.name}
                    </span>
                  </>
                )}
                {certification.categoryFilterChild?.name && (
                  <>
                    <span>/</span>
                    <span className="text-slate-300 capitalize">
                      {certification.categoryFilterChild.name}
                    </span>
                  </>
                )}
                <span>/</span>
                <span className="text-white capitalize">{certification.issuer?.name}</span>
              </nav>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
                {certification.name}
              </h1>
              <p className="text-xl text-slate-300 max-w-4xl leading-relaxed">
                {certification.description || `Prepare for the official certification. Earn your verified badge and credentials with curated courses and practice exams.`}
              </p>
              <div className="flex items-center gap-6 text-base text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{topic.rating !== undefined ? topic.rating.toFixed(1) : "4.5"}</span> rating
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">{(topic.numLearners ?? 0).toLocaleString()}</span> candidates
                </span>
              </div>
            </div>
            {/* Badge logo */}
            <div className="shrink-0">
              {certification.badgeUrl ? (
                <img
                  src={certification.badgeUrl}
                  alt={certification.name}
                  className="w-40 h-40 object-contain drop-shadow-[0_8px_24px_rgba(168,85,247,0.35)]"
                />
              ) : (
                <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white drop-shadow-[0_8px_24px_rgba(168,85,247,0.3)]">
                  <Award size={64} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column - Curated prep & course suggestions */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-3xl font-semibold text-slate-800 mb-6">Get Certified with Top Prep Courses</h2>
                {courses.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-3xl text-center text-slate-400">
                    No courses matching this certification's categories are currently available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {courses.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => navigate(`/course/${c.slug || c._id}`)}
                        className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full group"
                      >
                        <div>
                          <div className="relative overflow-hidden aspect-video">
                            <img
                              src={c.thumbnail || "/default-thumbnail.jpg"}
                              alt={c.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-5 space-y-2">
                            <h4 className="font-semibold text-slate-800 text-base line-clamp-2 leading-snug">
                              {c.title}
                            </h4>
                            <p className="text-sm text-slate-400">By {c.creator?.name || "Instructor"}</p>
                          </div>
                        </div>
                        <div className="p-5 pt-0 flex justify-between items-center text-sm border-t mt-auto">
                          <span className="font-bold text-purple-700 text-base">
                            {getCourseNumericPrice(c) > 0 ? `Rs ${getCourseNumericPrice(c)}` : "Free"}
                          </span>
                          <span className="text-slate-400 font-medium">{c.enrolledStudents?.length || 0} students</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Rated course spotlight */}
              {topCourse && (
                <div className="bg-purple-50/40 rounded-3xl p-6 border border-purple-100/50 flex flex-col md:flex-row gap-6 items-center">
                  <img
                    src={topCourse.thumbnail || "/default-thumbnail.jpg"}
                    alt=""
                    className="w-32 aspect-video object-cover rounded-xl border border-purple-100 shrink-0"
                  />
                  <div className="space-y-2 text-center md:text-left">
                    <span className="px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 bg-purple-100 rounded-full uppercase tracking-wider">
                      Highly Rated Course
                    </span>
                    <h3 className="font-semibold text-slate-800 text-lg leading-tight">
                      {topCourse.title}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Highest rated course in this certification preparation path. Start with this course for optimal preparation.
                    </p>
                    <button
                      onClick={() => navigate(`/course/${topCourse.slug || topCourse._id}`)}
                      className="text-sm font-semibold text-purple-700 hover:text-purple-800 inline-flex items-center gap-1 mt-1"
                    >
                      Start Learning Now <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Exam Details & Registration Card */}
            <div>
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm sticky top-28 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-800 text-xl mb-2">Practice Exam & Voucher</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Access the practice exams and register for the certification. Complete prep courses to unlock the test environments.
                  </p>
                </div>

                <div className="space-y-3.5 text-sm text-slate-600">
                  <div className="flex justify-between border-b pb-2">
                    <span className="flex items-center gap-1.5 font-normal">
                      <HelpCircle size={14} className="text-purple-500" /> Exam Price
                    </span>
                    <span className="font-semibold text-slate-800">Rs {certification.examPrice || 0}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Clock size={14} className="text-purple-500" /> Duration
                    </span>
                    <span className="font-semibold text-slate-800">{certification.duration || 90} mins</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Star className="text-purple-500" size={14} /> Passing Grade
                    </span>
                    <span className="font-semibold text-slate-800">{certification.passingScore || 70}% Score</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Award className="text-purple-500" size={14} /> Total / Pass Marks
                    </span>
                    <span className="font-semibold text-slate-800">{certification.totalMarks || 100} / {certification.passMarks || 40} Marks</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="flex items-center gap-1.5 font-normal">
                      <Award className="text-purple-500" size={14} /> Grades
                    </span>
                    <span className="font-semibold text-slate-800">{certification.grades || "A, B, C, Pass"}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="flex items-center gap-1.5 font-normal">
                      <DollarSign className="text-purple-500" size={14} /> Registry Fee
                    </span>
                    <span className="font-semibold text-slate-800">Rs {certification.certificatePrice || 0}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/certification/${certification.slug}`)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-semibold tracking-wide transition-all shadow-md"
                  >
                    Go to official Certification Portal <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 font-sans min-h-screen text-left">
      {/* Banner / Header Area */}
      <header className="bg-[#1c1d1f] text-white py-12 px-6 sm:px-12 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <nav className="text-lg font-light text-[#c084fc] flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:underline flex items-center gap-1">
              <Compass className="w-4 h-4" /> Home
            </Link>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb._id}>
                  <span>/</span>
                  <span className={isLast ? "text-white font-normal capitalize" : "text-[#c084fc]/80 capitalize"}>
                    {crumb.name}
                  </span>
                </React.Fragment>
              );
            })}
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
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight">
                {topic.bannerTitle || `${topic.name} Courses`}
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl leading-relaxed">
                {topic.description || `Explore top-rated online courses in ${topic.name}. Learn from expert instructors and achieve your professional goals.`}
              </p>

              {/* Statistics Grid */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 text-lg text-gray-300">
                {topic.rating > 0 && (
                  <div className="flex items-center gap-1.5 font-light">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-yellow-400 text-xl">
                      {topic.rating.toFixed(1)}
                    </span>
                    <span>rating</span>
                  </div>
                )}
                {topic.numLearners > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="font-light text-white">{topic.numLearners.toLocaleString()}</span>
                    <span>learners</span>
                  </div>
                )}
                {topic.handsOnPracticeCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-light text-white">
                      {topic.handsOnPracticeCount.toLocaleString()}
                    </span>
                    <span>hands-on practice</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span className="font-light text-white">{courses.length}</span>
                  <span>{courses.length === 1 ? 'course' : 'courses'} available</span>
                </div>
              </div>

              {/* Related pills */}
              {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                <div className="flex items-center gap-2 pt-2 text-base flex-wrap">
                  <span className="text-slate-400 uppercase tracking-wider font-light">Related</span>
                  {topic.relatedTopics.map((rel, rIdx) => {
                    const relSlug = typeof rel === "string" ? rel.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
                    return (
                      <Link
                        key={`rel-${rIdx}`}
                        to={`/topic/${relSlug}`}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-light transition-colors"
                      >
                        {rel}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 space-y-16">
        
        {/* Curated Career Certificate Pathway — Real Data */}
        <section className="bg-gradient-to-r from-[#0d2a2c] via-[#051a1c] to-[#020e0f] border border-slate-800 rounded-3xl p-8 text-white grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 shadow-2xl overflow-hidden relative">
          <div className="space-y-5 flex flex-col justify-between z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-[#13c2c2]" />
                <span className="text-base font-light uppercase tracking-widest text-[#13c2c2]">Professional Certificate</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-light tracking-tight leading-snug">
                {topic.bannerTitle || `${topic.name} Professional Certificate`}
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                {topic.description || `Build job-ready fluency in ${topic.name} and get certified. Master fundamental concepts, complete real-world project portfolios, and earn an industry-recognized credential.`}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-base text-slate-300 flex-wrap">
                {topic.rating > 0 && (
                  <>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {topic.rating.toFixed(1)}</span>
                    <span>•</span>
                  </>
                )}
                {courses.length > 0 && (
                  <>
                    <span>{courses.length} course{courses.length !== 1 ? 's' : ''} in this path</span>
                    <span>•</span>
                  </>
                )}
                {topic.numLearners > 0 && (
                  <span>{topic.numLearners.toLocaleString()} learners</span>
                )}
              </div>
              <Button onClick={() => navigate("/subscribe")} className="bg-[#a435f0] hover:bg-[#8d24d9] text-white font-light h-12 w-full max-w-[240px] rounded-lg">
                Learn more
              </Button>
            </div>
          </div>

          {/* Right Card Track List — Real courses */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent select-none items-stretch">
            {courses.length === 0 ? (
              <div className="flex items-center justify-center w-full text-slate-400 text-base py-8">
                No courses found for this topic yet.
              </div>
            ) : (
              courses.slice(0, 6).map((course, idx) => (
                <div
                  key={course._id}
                  onClick={() => navigate(`/course/${course.slug || course._id}`)}
                  className="w-[240px] shrink-0 bg-white text-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-lg cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-light text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Course {idx + 1} of {courses.length}</span>
                      <span className="text-[10px] text-slate-400 font-light">{course.level || "All Levels"}</span>
                    </div>
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-24 object-cover rounded-lg mt-1"
                      />
                    )}
                    <h4 className="font-light text-base text-slate-800 leading-snug line-clamp-3 pt-1">
                      {course.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">By {course.creator?.name || "Instructor"}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-base font-light text-slate-600">{idx + 1}</span>
                    <span className="text-sm font-light text-slate-500">Core requirement</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Dynamic Bundle Deal Section (Photo 2) */}
        {bundle && (
          <section className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">
                Looking to advance your skills in {topic.name}? We've got you.
              </h2>
              <p className="text-slate-500 mt-1 text-lg sm:text-xl">
                Get everything you need to reach your goals in one convenient bundle.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-center">
              {/* Bundle Checkout details */}
              <div className="space-y-4">
                <ul className="space-y-2.5 text-lg font-light text-slate-700">
                  <li className="flex items-center gap-2"><Check className="h-4.5 w-4.5 text-green-600 font-light" /> Top-rated courses</li>
                  <li className="flex items-center gap-2"><Check className="h-4.5 w-4.5 text-green-600 font-light" /> Popular with learners just like you</li>
                  <li className="flex items-center gap-2"><Check className="h-4.5 w-4.5 text-green-600 font-light" /> Guidance from real-world experts</li>
                </ul>
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-light text-[#a435f0]">Rs {bundle.currentSum}</span>
                    <span className="text-slate-400 line-through text-lg">Rs {bundle.originalSum}</span>
                    <span className="text-base bg-red-100 text-red-800 font-light px-1.5 py-0.5 rounded">{bundle.discountPercentage}% OFF</span>
                  </div>
                  <Button onClick={handleAddBundleToCart} className="bg-[#a435f0] hover:bg-[#8720cf] text-white font-light h-12 w-full">
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
                      <h4 className="font-light text-lg text-slate-800 leading-snug line-clamp-2 mt-3 min-h-[40px]">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-2 text-base font-light text-yellow-600">
                        {course.avgRating > 0 && (
                          <>
                            <span>{course.avgRating.toFixed(1)}</span>
                            <Star className="h-3 w-3 fill-current" />
                          </>
                        )}
                        <span className="text-slate-400">
                          ({course.enrolledStudents?.length || 0} {course.enrolledStudents?.length === 1 ? 'student' : 'students'})
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-lg font-light text-slate-900">Rs {course.price?.current}</span>
                        <Link to={`/course/${course.slug || course._id}`} className="text-base font-light text-purple-600 hover:underline">View</Link>
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
            <h2 className="text-4xl sm:text-5xl font-light tracking-tight">
              Courses to get you started
            </h2>
            <p className="text-slate-500 mt-1 text-lg sm:text-xl">
              Explore courses from experienced, real-world experts.
            </p>
          </div>

          {/* Tabs header */}
          <div className="flex border-b border-slate-200 gap-6 text-lg font-light">
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
            <div className="text-center py-12 text-slate-400 font-extralight">No courses to display in this plan.</div>
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
            <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">
              {topic.name} students also learn
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {topic.relatedTopics.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/topic/${slugify(tag)}`}
                  className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-lg font-light rounded-xl text-center transition-colors shadow-sm block leading-snug"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section: Real Practice Courses / Hands-on (Rendered only if real practice courses exist) */}
        {practiceCourses.length > 0 && (
          <section className="space-y-6">
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-block px-2.5 py-0.5 bg-purple-100 text-purple-700 text-base font-light rounded">Practice & Exercises</span>
                <h3 className="text-3xl sm:text-4xl font-light text-slate-900">Practice with hands-on exercises</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Put your knowledge to the test with real-world coding exercises and practice tests from actual courses in {topic.name}.
                </p>
              </div>
              <Button onClick={() => navigate("/course/search?query=" + encodeURIComponent(topic.name))} className="bg-[#a435f0] hover:bg-[#8d24d9] text-white font-light h-12 shrink-0">
                Browse All Courses
              </Button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {practiceCourses.map((c) => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/course/${c.slug || c._id}`)}
                  className="w-[280px] shrink-0 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="space-y-3">
                    <img src={c.thumbnail} alt={c.title} className="w-full h-32 object-cover rounded-lg" />
                    <h4 className="font-light text-lg text-slate-850 leading-snug line-clamp-2 min-h-[40px] pt-1">
                      {c.title}
                    </h4>
                    <p className="text-base text-slate-500 line-clamp-2 leading-relaxed">
                      {c.subTitle || c.subtitle || c.description || ""}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                    <p className="text-[10px] text-slate-400 font-light">BY {(c.creator?.name || "Instructor").toUpperCase()}</p>
                    <div className="flex items-center justify-between text-base">
                      {c.avgRating > 0 && (
                        <div className="flex items-center gap-1 font-light text-yellow-600">
                          <span>{c.avgRating.toFixed(1)}</span>
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-slate-400">({c.reviewCount || 0})</span>
                        </div>
                      )}
                      <span className="font-light text-slate-900">
                        {getCourseNumericPrice(c) > 0 ? `Rs ${getCourseNumericPrice(c)}` : "Free"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Real Instructors (only when instructors exist) */}
        {instructors.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">Course Instructors</h2>
              <p className="text-slate-500 mt-1 text-lg sm:text-xl">Learn from instructors teaching courses in {topic.name}.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {instructors.map((ins, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 text-center space-y-3 hover:bg-slate-100/50 transition-colors">
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-white shadow-md bg-purple-100 flex items-center justify-center">
                    {ins.photoUrl ? (
                      <img src={ins.photoUrl} className="w-full h-full object-cover" alt={ins.name} />
                    ) : (
                      <span className="text-2xl font-light text-purple-700">
                        {(ins.name || "I")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-light text-xl text-slate-800 leading-snug">{ins.name}</h4>
                    <p className="text-base text-slate-500 mt-1 line-clamp-2 leading-normal min-h-[32px]">{ins.headline || "Course Instructor"}</p>
                  </div>
                  <div className="text-base font-light text-slate-600 pt-1">
                    <span>{ins.coursesCount} {ins.coursesCount === 1 ? "course" : "courses"} in this topic</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TOP RATED AND GOOD REVIEWS FROM DATABASE (only when real reviews exist) */}
        {reviews.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-slate-100">
            <div>
              <h2 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">
                Student Reviews
              </h2>
              <p className="text-slate-500 mt-1 text-lg sm:text-xl">
                See what students are saying about courses in {topic.name}.
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
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-light text-lg">
                        {rev.user?.name ? rev.user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "S"}
                      </div>
                      <div>
                        <h4 className="font-light text-lg text-slate-800">{rev.user?.name || "Student"}</h4>
                        <p className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.round(rev.rating) ? "fill-current" : "text-slate-200"
                          }`}
                        />
                      ))}
                      <span className="font-light ml-1 text-slate-700">{rev.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-base text-slate-600 leading-relaxed line-clamp-4">
                      "{rev.comment}"
                    </p>
                  </div>
                  {rev.course?.title && (
                    <div className="pt-3 border-t border-slate-100 text-[10px] font-light text-slate-400 truncate">
                      Course: <span className="text-[#a435f0]">{rev.course.title}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: All Topic Courses with Sidebar Filters (The main catalog) */}
        <section className="space-y-6 pt-4 border-t border-slate-100">
          <div>
            <h2 className="text-4xl sm:text-5xl font-light tracking-tight">
              All {topic.name} courses
            </h2>
            <p className="text-slate-500 mt-1 text-lg sm:text-xl">
              Not sure? All courses have a 30-day money-back guarantee.
            </p>
          </div>

          {/* Filtering Controls Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 font-light h-11 bg-white"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filter</span>
              </Button>
              <span className="text-lg font-light text-slate-700">
                {filteredAndSortedCourses.length} results
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-base font-light text-slate-400 uppercase tracking-wider">Sort by</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 pl-4 pr-10 border border-slate-200 rounded-lg bg-white text-lg font-light text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
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
                  <h4 className="font-light text-lg text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Price
                  </h4>
                  <div className="space-y-2 text-lg font-extralight text-slate-600">
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
                  <h4 className="font-light text-lg text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Level
                  </h4>
                  <div className="space-y-2 text-lg font-extralight text-slate-600">
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
                  <h4 className="font-light text-lg text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Ratings
                  </h4>
                  <div className="space-y-2 text-lg font-extralight text-slate-600">
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
                      className="text-base text-purple-600 hover:text-purple-800 font-light block pt-1"
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
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-12 text-center text-gray-500 font-light">
                  No courses found matching the selected filters.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {filteredAndSortedCourses.map((course) => {
                    const isRatingArray = Array.isArray(course.ratings);
                    const ratingsList = isRatingArray ? course.ratings : [];
                    const avgRating =
                      course.avgRating > 0
                        ? course.avgRating.toFixed(1)
                        : typeof course.ratings === "number" && course.ratings > 0
                        ? course.ratings.toFixed(1)
                        : ratingsList.length
                        ? (
                            ratingsList.reduce(
                              (s, r) => s + (typeof r === "number" ? r : r?.rating || 0),
                              0
                            ) / ratingsList.length
                          ).toFixed(1)
                        : null;
                    const reviewCount =
                      course.reviewCount ??
                      course.numOfReviews ??
                      (isRatingArray ? ratingsList.length : 0);

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
                          <h3 className="text-xl sm:text-2xl font-light text-slate-800 leading-snug">
                            <Link to={`/course/${course.slug || course._id}`} className="hover:text-purple-700">
                              {course.title}
                            </Link>
                          </h3>
                          <p className="text-base text-slate-500 line-clamp-2 leading-relaxed">
                            {course.subTitle || "Master this topic with expert explanations, step-by-step logic, and deep examples."}
                          </p>
                          <div className="flex items-center gap-3 text-base text-slate-500 flex-wrap">
                            <span className="font-light text-slate-700">
                              Instructor: {course.creator?.name || "Expert Coach"}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-extralight">
                              {course.level || "All Levels"}
                            </span>
                          </div>

                          {/* Ratings info */}
                          <div className="flex items-center gap-1.5 text-base text-slate-500">
                            {avgRating && (
                              <>
                                <span className="text-[#a435f0] font-light text-lg">{avgRating}</span>
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              </>
                            )}
                            <span>
                              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'} • {course.enrolledStudents?.length || 0} learners)
                            </span>
                          </div>
                        </div>

                        {/* Price and Actions Column */}
                        <div className="flex flex-col items-start md:items-end justify-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                          <div className="text-right">
                            <span className="text-3xl font-light text-slate-900">
                              {getCourseNumericPrice(course) > 0 ? `Rs ${getCourseNumericPrice(course)}` : "Free"}
                            </span>
                          </div>
                          
                          {/* bestseller badge */}
                          {avgRating && parseFloat(avgRating) >= 4.5 && (
                            <span className="px-2.5 py-0.5 bg-[#ecebfa] text-[#2d2f31] font-light text-[10px] uppercase rounded tracking-wider">
                              Bestseller
                            </span>
                          )}

                          <Button
                            onClick={() => navigate(`/course/${course.slug || course._id}`)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-light w-full text-base h-9 rounded-lg"
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
