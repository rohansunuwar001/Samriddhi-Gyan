import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { useGetCarouselSlidesQuery, useGetPromoBannersQuery } from "@/features/api/cmsApi";
import CourseCard from "../student/CourseCard";
import TrustedBySection from "@/components/home/TrustedBySction";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { Brain, Award, Database, Search } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const GuestHome = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data, isLoading, isError } = useGetPublishedCourseQuery();
  const { data: carouselData } = useGetCarouselSlidesQuery({ active: "true" });
  const userCategoryInterest = localStorage.getItem("last_interacted_category") || "";
  const { data: promoData } = useGetPromoBannersQuery({ active: "true", category: userCategoryInterest });

  const defaultSlides = [
    {
      title: "Get AI-ready from Rs 999",
      description: "Gain job-ready AI skills to stand out at work. Offer ends July 2.",
      image: "/guest_hero_student.png",
      bgColor: "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100",
      textColor: "text-amber-900",
      link: "/course/search"
    },
    {
      title: "Skills for your future",
      description: "Expand your horizons with courses in web development, design, and business.",
      image: "/guest_hero_student.png",
      bgColor: "bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100",
      textColor: "text-indigo-900",
      link: "/course/search"
    },
  ];

  const slides = carouselData?.slides?.length > 0 ? carouselData.slides : defaultSlides;

  const defaultPromo = {
    title: "Reimagine your career in the AI era",
    description: "Future-proof your skills with Personal Plan. Get access to a variety of fresh content from real-world experts to fast-track your success.",
    image: "/guest_promo_instructor.png",
    primaryBtnText: "Learn AI and more",
    primaryBtnLink: "/course/search",
    secondaryBtnText: "Prep for a certification",
    secondaryBtnLink: "/course/search"
  };

  const promo = promoData?.banners?.[0] || defaultPromo;

  // ⚠️ All hooks MUST be called before any conditional returns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const categories = [
    {
      name: "Generative AI",
      description: "Master ChatGPT, Prompt Engineering, LLMs and AI Agents.",
      icon: <Brain className="w-8 h-8 text-purple-600" />,
      query: "Generative AI",
    },
    {
      name: "IT Certifications",
      description: "Prepare for AWS, Cisco, CompTIA, and security exams.",
      icon: <Award className="w-8 h-8 text-blue-600" />,
      query: "IT Certifications",
    },
    {
      name: "Data Science",
      description: "Learn Python, SQL, Machine Learning, and Data Analytics.",
      icon: <Database className="w-8 h-8 text-green-600" />,
      query: "Data Science",
    },
  ];

  const handleCategoryClick = (query) => {
    navigate(`/course/search?query=${encodeURIComponent(query)}`);
  };

  const courses = data?.courses || [];
  const trendingCourses = courses.slice(0, 4);
  const recommendedCourses = courses.slice(4, 8);

  return (
    <div className="bg-white text-[#2c2f31] min-h-screen font-sans">


      {/* Hero Carousel Section */}
      <section className="relative overflow-hidden py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div
            className="flex transition-transform duration-700 ease-in-out w-full"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`${slide.bgColor} flex-shrink-0 w-full min-h-[380px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[500px] flex items-center relative p-6 sm:p-12`}
              >
                {/* Float Card Content */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 sm:p-10 max-w-sm sm:max-w-md shadow-xl text-left z-10 transition-all duration-300 hover:shadow-2xl">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1c1d1f] mb-4 leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
                    {slide.description}
                  </p>
                  <Button
                    onClick={() => navigate(slide.link || "/course/search")}
                    className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-normal px-6 py-3 rounded-md text-base transition-all duration-200"
                  >
                    Explore Courses
                  </Button>
                </div>

                {/* Right side Illustration image */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block select-none pointer-events-none">
                  <img
                    src={slide.image}
                    alt="Learn with us"
                    className="w-full h-full object-cover opacity-90 transition-transform duration-1000 transform hover:scale-105"
                  />
                  <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-transparent to-transparent"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Left/Right Navigation controls */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md z-20"
            aria-label="Previous slide"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md z-20"
            aria-label="Next slide"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === index ? "bg-[#1c1d1f] w-6" : "bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section (Moved from logged-in Home) */}
      <TrustedBySection />

      {/* Categories Grid Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-left mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1d1f] tracking-tight">
            Learn essential career and life skills
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mt-2">
            Samriddhi Gyan helps you build in-demand skills fast and advance your career in a changing job market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <div
              key={i}
              onClick={() => handleCategoryClick(cat.query)}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer flex flex-col items-start text-left bg-white group hover:-translate-y-1"
            >
              <div className="p-3.5 bg-gray-50 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-xl font-normal text-[#1c1d1f] mb-2 group-hover:text-[#a435f0] transition-colors duration-200">
                {cat.name}
              </h3>
              <p className="text-sm text-gray-600 flex-1">{cat.description}</p>
              <span className="text-sm font-normal text-[#a435f0] group-hover:underline mt-4 inline-flex items-center gap-1">
                Explore topic <FiChevronRight className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Courses Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-left mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1d1f] tracking-tight">
              Trending courses
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mt-1">
              What's gaining momentum this week
            </p>
          </div>
          <Link
            to="/course/search"
            className="text-sm font-normal text-[#a435f0] hover:text-[#8710d8] hover:underline"
          >
            See all
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full h-48 rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500">
            Failed to load trending courses.
          </div>
        ) : trendingCourses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No courses available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Based on recent searches Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-left mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1d1f] tracking-tight">
            Based on your recent searches
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mt-1">
            Hand-picked recommendations for you
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full h-48 rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500">
            Failed to load recommendations.
          </div>
        ) : recommendedCourses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Check back later for recommendations.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Reimagine your career Promo Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
        <div className="bg-[#1c1d1f] text-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 shadow-xl relative">
          <div className="lg:col-span-7 text-left space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {promo.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              {promo.description}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                onClick={() => navigate(promo.primaryBtnLink || "/course/search")}
                className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-normal px-6 py-3 rounded-md text-base transition-all duration-200"
              >
                {promo.primaryBtnText}
              </Button>
              <Button
                onClick={() => navigate(promo.secondaryBtnLink || "/course/search")}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black font-normal px-6 py-3 rounded-md text-base transition-all duration-200"
              >
                {promo.secondaryBtnText}
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5 h-64 sm:h-80 w-full relative select-none pointer-events-none hidden lg:block">
            <img
              src={promo.image}
              alt="Promo illustration"
              className="w-full h-full object-contain filter drop-shadow-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuestHome;
