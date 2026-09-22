import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { useGetCarouselSlidesQuery, useGetPromoBannersQuery } from "@/features/api/cmsApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import CourseCard from "../student/CourseCard";
import TrustedBySection from "@/components/home/TrustedBySction";
import LearningGoalsSection from "@/components/home/LearningGoalsSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

gsap.registerPlugin(ScrollTrigger);
import {
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiStar,
  FiCheckCircle,
} from "react-icons/fi";
import {
  Brain,
  Award,
  Database,
  Code,
  Laptop,
  Palette,
  Briefcase,
  Megaphone,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const getCategoryIcon = (categoryName = "") => {
  const lower = (categoryName || "").toLowerCase();
  if (
    lower.includes("ai") ||
    lower.includes("gpt") ||
    lower.includes("prompt") ||
    lower.includes("intelligence") ||
    lower.includes("machine learning") ||
    lower.includes("llm")
  ) {
    return <Brain className="w-8 h-8 text-[#5624d0]" />;
  }
  if (
    lower.includes("cert") ||
    lower.includes("cloud") ||
    lower.includes("aws") ||
    lower.includes("security") ||
    lower.includes("network") ||
    lower.includes("devops")
  ) {
    return <Award className="w-8 h-8 text-blue-600" />;
  }
  if (
    lower.includes("data") ||
    lower.includes("sql") ||
    lower.includes("analytics") ||
    lower.includes("database") ||
    lower.includes("excel")
  ) {
    return <Database className="w-8 h-8 text-emerald-600" />;
  }
  if (
    lower.includes("web") ||
    lower.includes("dev") ||
    lower.includes("code") ||
    lower.includes("program") ||
    lower.includes("software") ||
    lower.includes("javascript") ||
    lower.includes("python") ||
    lower.includes("react")
  ) {
    return <Code className="w-8 h-8 text-[#a435f0]" />;
  }
  if (
    lower.includes("design") ||
    lower.includes("ui") ||
    lower.includes("ux") ||
    lower.includes("art") ||
    lower.includes("graphic") ||
    lower.includes("photo")
  ) {
    return <Palette className="w-8 h-8 text-pink-600" />;
  }
  if (
    lower.includes("business") ||
    lower.includes("management") ||
    lower.includes("finance") ||
    lower.includes("entrepreneur") ||
    lower.includes("accounting")
  ) {
    return <Briefcase className="w-8 h-8 text-amber-600" />;
  }
  if (
    lower.includes("market") ||
    lower.includes("seo") ||
    lower.includes("social") ||
    lower.includes("ad")
  ) {
    return <Megaphone className="w-8 h-8 text-orange-600" />;
  }
  if (
    lower.includes("comp") ||
    lower.includes("it") ||
    lower.includes("tech") ||
    lower.includes("hardware") ||
    lower.includes("system") ||
    lower.includes("os")
  ) {
    return <Laptop className="w-8 h-8 text-indigo-600" />;
  }
  return <Layers className="w-8 h-8 text-[#a435f0]" />;
};

// Reusable horizontal course slider with hover chevrons matching Udemy UI
const CourseSlider = ({ courses }) => {
  const containerRef = useRef(null);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 620;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!courses || courses.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
        No courses available in this category yet. Check back soon!
      </div>
    );
  }

  return (
    <div className="relative group/slider">
      {/* Left Navigation Arrow */}
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll courses left"
        className="absolute -left-4 top-1/2 -translate-y-1/2 bg-[#1c1d1f] hover:bg-black text-white shadow-xl rounded-full w-11 h-11 flex items-center justify-center z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
        style={{ left: '-57px' }}
      >
        <FiChevronLeft className="w-6 h-6" />
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
        aria-label="Scroll courses right"
        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-[#1c1d1f] hover:bg-black text-white shadow-xl rounded-full w-11 h-11 flex items-center justify-center z-10 opacity-0 group-hover/slider:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
        style={{ right: '-57px' }}
      >
        <FiChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

// Character-by-character animated heading component with responsive word-wrapping
const AnimatedWordHeading = ({ text, className = "", as: Tag = "h2" }) => {
  if (!text) return null;
  const words = String(text).split(" ");

  return (
    <Tag className={`guest-split-heading ${className}`}>
      {words.map((word, wIdx) => (
        <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.26em] last:mr-0 align-top">
          {word.split("").map((char, cIdx) => (
            <span key={cIdx} className="inline-block overflow-hidden align-top">
              <span className="guest-split-char inline-block will-change-transform">
                {char}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
};

const GuestHome = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const { data, isLoading, isError } = useGetPublishedCourseQuery();
  const { data: carouselData } = useGetCarouselSlidesQuery({ active: "true" });
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const userCategoryInterest = localStorage.getItem("last_interacted_category") || "";
  const { data: promoData } = useGetPromoBannersQuery({ active: "true", category: userCategoryInterest });

  const defaultSlides = [
    {
      title: "Skills for your future, today",
      description: "Expand your horizons with top-rated courses in tech, business, and creative skills taught in Nepali & English.",
      image: "/guest_hero_student.png",
      bgColor: "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100",
      textColor: "text-amber-900",
      link: "/course/search",
    },
    {
      title: "Get AI-ready from Rs 999",
      description: "Gain job-ready AI skills and certifications to stand out in today's evolving market.",
      image: "/guest_hero_student.png",
      bgColor: "bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100",
      textColor: "text-indigo-900",
      link: "/course/search",
    },
  ];

  const slides = carouselData?.slides?.length > 0 ? carouselData.slides : defaultSlides;

  const defaultPromo = {
    title: "Reimagine your career in the AI era",
    description: "Future-proof your skillset with Samriddhi Gyan. Get access to hands-on practical projects, quizzes, and mentor feedback.",
    image: "/guest_promo_instructor.png",
    primaryBtnText: "Explore Courses",
    primaryBtnLink: "/course/search",
    secondaryBtnText: "Prep for Certifications",
    secondaryBtnLink: "/course/search",
  };

  const promo = promoData?.banners?.[0] || defaultPromo;

  // Auto-advance hero carousel every 6s unless hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const courses = data?.courses || [];
  const dbCategories = categoriesData?.categories || [];

  // Get parent (root) categories only
  const parentCategories = useMemo(() => {
    return dbCategories.filter((cat) => !cat.parent);
  }, [dbCategories]);

  // Map each parent category to its own name and all descendant category names
  const parentCategoryFamilyMap = useMemo(() => {
    const map = new Map();
    parentCategories.forEach((parent) => {
      const descendantNames = new Set([parent.name.toLowerCase()]);

      const addChildren = (parentId) => {
        dbCategories.forEach((cat) => {
          const pId = cat.parent?._id?.toString() || cat.parent?.toString();
          if (pId === parentId) {
            descendantNames.add(cat.name.toLowerCase());
            addChildren(cat._id?.toString());
          }
        });
      };

      addChildren(parent._id?.toString());
      map.set(parent.name.toLowerCase(), descendantNames);
    });
    return map;
  }, [parentCategories, dbCategories]);

  // Real parent categories only (strictly no child and no subchild categories)
  const exploreCategories = useMemo(() => {
    // Strictly parent categories (where parent is null or isParent is true)
    const rootParents = dbCategories.filter((cat) => !cat.parent || cat.isParent === true);

    if (rootParents.length > 0) {
      return rootParents
        .map((cat) => {
          const familyNames = parentCategoryFamilyMap.get(cat.name.toLowerCase());
          const directCount = courses.filter((c) => {
            const cCat = c.category?.trim().toLowerCase();
            return familyNames ? familyNames.has(cCat) : cCat === cat.name.toLowerCase();
          }).length;
          const count = Math.max(cat.courseCount || 0, directCount);
          return {
            name: cat.name,
            count: count,
            icon: getCategoryIcon(cat.name),
            query: cat.name,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    }

    return [];
  }, [dbCategories, parentCategoryFamilyMap, courses]);

  // Dynamic Skill category tabs based on parent categories in DB
  const skillTabs = useMemo(() => {
    const topCatNames = exploreCategories.map((c) => c.name).filter(Boolean);
    const uniqueTabs = Array.from(new Set(topCatNames)).slice(0, 7);
    return uniqueTabs.length > 0 ? ["All", ...uniqueTabs] : ["All"];
  }, [exploreCategories]);

  // Filter courses for active tab (including courses in child/subchild categories of the active parent tab)
  const tabCourses = useMemo(() => {
    if (activeTab === "All") return courses;
    const familyNames = parentCategoryFamilyMap.get(activeTab.toLowerCase());
    return courses.filter((c) => {
      const catName = c.category?.trim().toLowerCase();
      if (familyNames && catName && familyNames.has(catName)) {
        return true;
      }
      return (
        c.category?.toLowerCase() === activeTab.toLowerCase() ||
        c.courseTitle?.toLowerCase().includes(activeTab.toLowerCase())
      );
    });
  }, [activeTab, courses, parentCategoryFamilyMap]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const guestPageRef = useRef(null);

  // GSAP ScrollTrigger Animations
  useLayoutEffect(() => {
    if (isLoading || !guestPageRef.current) return;

    const ctx = gsap.context(() => {
      // ── 1. Hero billboard entrance ──────────────────────────────────────
      gsap.from(".guest-hero-container", {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: "power3.out",
      });

      // Hero float card slides in from left
      gsap.from(".guest-hero-float-card", {
        opacity: 0,
        x: -50,
        duration: 0.9,
        delay: 0.2,
        ease: "power3.out",
      });

      // Hero image parallax on scroll (scrub stays y-based)
      gsap.to(".guest-hero-image", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: ".guest-hero-container",
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      // ── 2. Character-by-character kinetic heading reveal ────────────────
      gsap.utils.toArray(".guest-split-heading").forEach((headingEl) => {
        const chars = headingEl.querySelectorAll(".guest-split-char");
        if (chars.length > 0) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: "95%", rotateZ: 2 },
            {
              opacity: 1,
              y: "0%",
              rotateZ: 0,
              duration: 0.55,
              stagger: 0.013,
              ease: "power3.out",
              scrollTrigger: {
                trigger: headingEl,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      });

      // ── 3. Subtitle text fade-up ─────────────────────────────────────────
      gsap.utils.toArray(".guest-subheading-animate").forEach((sub) => {
        gsap.from(sub, {
          opacity: 0,
          y: 22,
          duration: 0.75,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sub,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // ── 4. Section-level fade + slide up ────────────────────────────────
      gsap.utils.toArray(".guest-scroll-section").forEach((sec) => {
        gsap.from(sec, {
          opacity: 0,
          y: 40,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 87%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // ── 5. Skill tab buttons stagger in ─────────────────────────────────
      gsap.from(".guest-skill-tab", {
        opacity: 0,
        y: 12,
        duration: 0.5,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".guest-skill-tabs-row",
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 6. Category cards stagger in with scale ──────────────────────────
      const catSec = document.querySelector(".guest-categories-grid")?.closest(".guest-scroll-section");
      gsap.fromTo(
        ".guest-category-card",
        { opacity: 0, scale: 0.92, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: catSec || ".guest-categories-grid",
            start: "top 88%",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
          },
        }
      );

      // ── 7. Testimonial cards cascade in ─────────────────────────────────
      gsap.from(".guest-testimonial-card", {
        opacity: 0,
        y: 50,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".guest-testimonials-grid",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 8. Promo / dark CTA section – scale reveal ──────────────────────
      gsap.from(".guest-promo-block", {
        opacity: 0,
        scale: 0.97,
        y: 30,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".guest-promo-block",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // Promo image floats in from right
      gsap.from(".guest-promo-image", {
        opacity: 0,
        x: 60,
        duration: 0.9,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".guest-promo-block",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 9. Instructor banner – left image + right text stagger ──────────
      gsap.from(".guest-instructor-avatar", {
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".guest-instructor-section",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.from(".guest-instructor-text", {
        opacity: 0,
        x: 40,
        duration: 0.8,
        delay: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".guest-instructor-section",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 10. CTA buttons spring in ────────────────────────────────────────
      gsap.from(".guest-cta-btn", {
        opacity: 0,
        scale: 0.85,
        duration: 0.55,
        stagger: 0.1,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: ".guest-cta-group",
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    }, guestPageRef);

    return () => ctx.revert();
  }, [isLoading, exploreCategories.length]);

  // Keep ScrollTrigger positions accurate when dynamic data arrives and images load
  useEffect(() => {
    const handleRefresh = () => ScrollTrigger.refresh();

    window.addEventListener("load", handleRefresh);
    const t1 = setTimeout(handleRefresh, 100);
    const t2 = setTimeout(handleRefresh, 500);
    const t3 = setTimeout(handleRefresh, 1200);

    return () => {
      window.removeEventListener("load", handleRefresh);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [courses.length, exploreCategories.length, activeTab]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Testimonials
  const testimonials = [
    {
      quote:
        "Samriddhi Gyan helped me transition from a beginner to a full-stack engineer in Kathmandu. The Nepali explanations made complex topics click effortlessly.",
      name: "Aayush Sharma",
      role: "Frontend Developer at TechCraft",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      quote:
        "The certification prep courses are top tier. I passed my AWS Solutions Architect exam on the first attempt with their hands-on practice labs.",
      name: "Pratiksha Thapa",
      role: "Cloud Specialist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      quote:
        "Learning AI and Python from real industry practitioners at an affordable price made all the difference for our engineering team.",
      name: "Suman Shrestha",
      role: "Engineering Manager",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div ref={guestPageRef} className="bg-white text-[#2d2f31] min-h-screen font-sans selection:bg-[#a435f0] selection:text-white overflow-hidden">
      {/* 1. Hero Billboard Section */}
      <section
        className="relative overflow-hidden py-6 px-4 sm:px-6 lg:px-8 guest-hero-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-[1340px] mx-auto relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div
            className="flex transition-transform duration-700 ease-in-out w-full"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`${slide.bgColor || "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100"} flex-shrink-0 w-full min-h-[380px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[500px] flex items-center relative p-6 sm:p-12`}
              >
                {/* Float Card Content */}
                <div className="guest-hero-float-card bg-white border border-gray-100 rounded-xl p-6 sm:p-10 max-w-sm sm:max-w-md shadow-xl text-left z-10 transition-all duration-300 hover:shadow-2xl">
                  <AnimatedWordHeading
                    as="h1"
                    text={slide.title}
                    className="text-4xl sm:text-5xl font-bold text-[#1c1d1f] mb-4 leading-tight tracking-tight"
                  />
                  <p className="guest-subheading-animate text-lg sm:text-xl text-gray-700 mb-6 leading-relaxed">
                    {slide.description}
                  </p>
                  <Button
                    onClick={() => navigate(slide.link || "/course/search")}
                    className="guest-cta-btn bg-[#a435f0] hover:bg-[#8710d8] active:bg-[#6d0eb5] text-white font-medium px-6 py-3 rounded-md text-lg transition-all duration-200 shadow-md"
                  >
                    Explore Courses
                  </Button>
                </div>

                {/* Right Illustration */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block select-none pointer-events-none">
                  <img
                    src={slide.image || "/guest_hero_student.png"}
                    alt="Learn on Samriddhi Gyan"
                    className="guest-hero-image w-full h-full object-cover opacity-90 transition-transform duration-1000 transform hover:scale-105"
                  />
                  <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-transparent to-transparent"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Left/Right Navigation controls */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md z-20 focus:outline-none"
            aria-label="Previous slide"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md z-20 focus:outline-none"
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

      {/* 2. Trusted By Section */}
      <div className="guest-scroll-section">
        <TrustedBySection />
      </div>

      {/* 3. Skills Section matching Udemy screenshot */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto guest-scroll-section">
        <div className="text-left mb-4">
          <AnimatedWordHeading
            text="Skills to transform your career and life"
            className="text-4xl sm:text-5xl font-semibold text-[#2d2f31] tracking-tight"
          />
          <p className="guest-subheading-animate text-[16px] text-[#6a6f73] mt-2">
            From critical workplace skills to technical topics, Samriddhi Gyan supports your professional development.
          </p>
        </div>

        {/* Skill Tabs */}
        <div className="guest-skill-tabs-row flex border-b border-gray-200 overflow-x-auto scrollbar-none mb-6 gap-6 pt-2">
          {skillTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`guest-skill-tab pb-3 text-[15px] font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === tab
                  ? "text-[#2d2f31] border-b-2 border-[#2d2f31]"
                  : "text-[#6a6f73] hover:text-[#2d2f31]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Course Slider directly below tabs */}
        <div className="mb-12">
          <CourseSlider courses={tabCourses} />
        </div>
      </section>

      {/* 4. Learning Goals & Career Acceleration Section */}
      <div className="guest-scroll-section">
        <LearningGoalsSection />
      </div>

      {/* 5. Trending & Top Rated Courses */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto guest-scroll-section">
        <div className="text-left mb-6 flex items-center justify-between">
          <div>
            <AnimatedWordHeading
              text="Learners are viewing"
              className="text-3xl sm:text-4xl font-bold text-[#1c1d1f] tracking-tight"
            />
            <p className="guest-subheading-animate text-lg text-gray-600 mt-1">
              Top trending courses with highest enrollment and stellar ratings
            </p>
          </div>
          <Link
            to="/course/search"
            className="text-base font-medium text-[#a435f0] hover:text-[#8710d8] hover:underline flex items-center gap-1"
          >
            See all <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <CourseSlider courses={courses} />
      </section>

      {/* 6. Top Categories Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto guest-scroll-section">
        <div className="text-left mb-8">
          <AnimatedWordHeading
            text="Top categories"
            className="text-3xl sm:text-4xl font-bold text-[#1c1d1f] tracking-tight"
          />
          <p className="guest-subheading-animate text-lg text-gray-600 mt-1">
            Explore diverse topics to kickstart your next skill upgrade
          </p>
        </div>

        <div className="guest-categories-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {exploreCategories.slice(0, 12).map((cat, i) => (
            <div
              key={i}
              onClick={() => navigate(`/course/search?query=${encodeURIComponent(cat.query)}`)}
              className="guest-category-card group border border-gray-200 rounded-xl p-5 sm:p-6 bg-white hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer flex flex-col items-start text-left hover:-translate-y-1"
            >
              <div className="p-3 bg-gray-50 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#1c1d1f] group-hover:text-[#a435f0] transition-colors duration-200">
                {cat.name}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                {cat.count === 0 ? "0 courses" : `${cat.count} ${cat.count === 1 ? "course" : "courses"}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Pro Plan / Subscription Promo Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto">
        <div className="guest-promo-block bg-[#1c1d1f] text-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 shadow-xl relative">
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#a435f0]/20 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Samriddhi Gyan Pro
            </div>
            <AnimatedWordHeading
              text={promo.title}
              className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
            />
            <p className="guest-subheading-animate text-lg sm:text-xl text-gray-300 leading-relaxed">
              {promo.description}
            </p>
            <div className="guest-cta-group flex flex-wrap gap-4 pt-2">
              <Button
                onClick={() => navigate(promo.primaryBtnLink || "/course/search")}
                className="guest-cta-btn bg-[#a435f0] hover:bg-[#8710d8] text-white font-medium px-6 py-3 rounded-md text-lg transition-all duration-200 shadow-lg"
              >
                {promo.primaryBtnText}
              </Button>
              <Button
                onClick={() => navigate(promo.secondaryBtnLink || "/course/search")}
                className="guest-cta-btn bg-white hover:bg-gray-100 text-[#1c1d1f] font-medium px-6 py-3 rounded-md text-lg transition-all duration-200 shadow-md border border-white"
              >
                {promo.secondaryBtnText}
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5 h-64 sm:h-80 w-full relative select-none pointer-events-none hidden lg:block">
            <img
              src={promo.image || "/guest_promo_instructor.png"}
              alt="Promo illustration"
              className="guest-promo-image w-full h-full object-contain filter drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* 8. Become an Instructor Banner */}
      <section className="guest-instructor-section py-12 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto">
        <div className="border border-gray-200 rounded-2xl p-8 sm:p-12 bg-gray-50 grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
          <div className="guest-instructor-avatar md:col-span-4 flex justify-center">
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-purple-100 flex items-center justify-center p-4">
              <img
                src="/guest_hero_student.png"
                alt="Teach on Samriddhi Gyan"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
          <div className="guest-instructor-text md:col-span-8 space-y-4">
            <AnimatedWordHeading
              text="Become an instructor on Samriddhi Gyan"
              className="text-3xl sm:text-4xl font-bold text-[#1c1d1f]"
            />
            <p className="guest-subheading-animate text-lg sm:text-xl text-gray-700 leading-relaxed">
              Instructors from Nepal and around the world teach thousands of students on Samriddhi Gyan. We provide the tools and platform to publish your expertise, build an audience, and earn income.
            </p>
            <Button
              onClick={() => navigate("/signup")}
              className="guest-cta-btn bg-[#1c1d1f] hover:bg-black text-white font-medium px-6 py-3 rounded-md text-lg transition-all duration-200 shadow-md mt-2"
            >
              Start teaching today
            </Button>
          </div>
        </div>
      </section>

      {/* 9. Learner Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto mb-12">
        <div className="text-left mb-10">
          <AnimatedWordHeading
            text="How learners like you are achieving their goals"
            className="text-3xl sm:text-4xl font-bold text-[#1c1d1f] tracking-tight"
          />
        </div>

        <div className="guest-testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="guest-testimonial-card border border-gray-200 rounded-xl p-6 sm:p-8 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="text-5xl text-gray-300 font-serif leading-none">"</div>
                <p className="text-gray-800 text-lg leading-relaxed">{t.quote}</p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-gray-100 mt-6">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <h4 className="font-semibold text-[#1c1d1f] text-base">{t.name}</h4>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default GuestHome;
