import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2, ChevronDown, ChevronUp, Star, Sparkles, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  useGetActiveGetOfferPromoQuery,
  useGetActiveSubscriptionNavbarQuery
} from "@/features/api/cmsApi";
import { useBuySubscriptionMutation } from "@/features/api/subscriptionApi";
import { useGetSubscriptionPlansQuery } from "@/features/api/subscriptionPlansApi";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import TrustedBySection from "@/components/home/TrustedBySction";

gsap.registerPlugin(ScrollTrigger);

const FAQS = [
  {
    q: "What is Personal Plan?",
    a: "Personal Plan is a monthly or yearly subscription that gives you unlimited access to thousands of top-rated courses across tech, business, design, personal development, and more. It includes hands-on practice, quizzes, and certificates of completion."
  },
  {
    q: "How is Personal Plan different from buying a course?",
    a: "When you buy an individual course, you pay a one-time fee for lifetime access to that specific course. With Personal Plan, you pay a recurring subscription fee to stream any and all courses included in the curated subscription library for as long as your membership is active."
  },
  {
    q: "How are courses selected for Personal Plan?",
    a: "Courses in Personal Plan are hand-picked and continuously updated based on high student ratings, instructor reputation, content freshness, and relevance to modern in-demand industry skills."
  },
  {
    q: "How and when will I be billed?",
    a: "You are billed automatically at the start of each billing cycle (monthly or annually) according to your chosen plan duration. You can view your invoice and renewal date anytime in your account settings."
  },
  {
    q: "How can I cancel my subscription?",
    a: "You can easily cancel your subscription at any time from your account settings under Subscription Management. You will continue to have full access until the end of your current billing period."
  },
  {
    q: "Are all Samriddhi Gyan courses included in Personal Plan?",
    a: "Personal Plan provides unlimited access to over 10,000+ top-rated courses. While most popular courses are included, select specialized or third-party partner programs remain available for individual purchase only."
  }
];

const COLLECTION_CATEGORIES = [
  "Web Development",
  "Data Science",
  "IT Certifications",
  "Graphic Design & Illustration",
  "Digital Marketing",
  "Leadership",
  "Communication"
];

const SubscribePage = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  const [selectedPlanKey, setSelectedPlanKey] = useState("1m");
  const [activeCollectionTab, setActiveCollectionTab] = useState("Web Development");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const [buySubscription, { isLoading: isSubscribing }] = useBuySubscriptionMutation();
  const { data: plansData, isLoading: loadingPlans } = useGetSubscriptionPlansQuery();
  const { data: coursesData } = useGetPublishedCourseQuery();
  const { data: catData } = useGetAllCategoriesQuery();

  const { data: promoData } = useGetActiveGetOfferPromoQuery();
  const { data: navbarData } = useGetActiveSubscriptionNavbarQuery();

  const activePromo = promoData?.promo;
  const activeNavbar = navbarData?.navbar;
  const plans = plansData?.plans || [];
  const publishedCourses = coursesData?.courses || [];
  // Extract only parent categories (excluding child and sub-child categories)
  const parentCategories = useMemo(() => {
    if (catData?.categoryTree && catData.categoryTree.length > 0) {
      return catData.categoryTree.map(c => c.name).filter(Boolean);
    }
    if (catData?.categories && catData.categories.length > 0) {
      return catData.categories
        .filter(c => !c.parent || c.isParent)
        .map(c => c.name)
        .filter(Boolean);
    }
    return [];
  }, [catData]);

  const collectionTabs = useMemo(() => {
    if (parentCategories.length > 0) {
      return parentCategories;
    }
    return COLLECTION_CATEGORIES;
  }, [parentCategories]);

  useEffect(() => {
    if (collectionTabs.length > 0 && !collectionTabs.includes(activeCollectionTab)) {
      setActiveCollectionTab(collectionTabs[0]);
    }
  }, [collectionTabs, activeCollectionTab]);

  const offerButtonRef = useRef(null);
  const [showStickyNav, setShowStickyNav] = useState(false);

  // Active plan detection
  const activePlan = useMemo(() => {
    if (!plans || plans.length === 0 || !user?.subscription?.planName) return null;
    return plans.find(p => p.planName === user.subscription.planName);
  }, [plans, user]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (user?.subscription?.status === "active" && activePlan) {
      return plans.filter(p => p.durationMonths > activePlan.durationMonths);
    }
    return plans;
  }, [plans, user, activePlan]);

  useEffect(() => {
    if (filteredPlans.length > 0) {
      if (!filteredPlans.some(p => p.key === selectedPlanKey)) {
        setSelectedPlanKey(filteredPlans[0].key);
      }
    }
  }, [filteredPlans, selectedPlanKey]);

  useEffect(() => {
    const handleScroll = () => {
      if (offerButtonRef.current) {
        const rect = offerButtonRef.current.getBoundingClientRect();
        setShowStickyNav(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activePromo]);

  const handleSubscribe = (planKeyOrUrl) => {
    if (!user) {
      toast.error("Please log in to start your subscription plan.");
      navigate("/login");
      return;
    }
    if (planKeyOrUrl && typeof planKeyOrUrl === "string" && planKeyOrUrl.startsWith("/")) {
      navigate(planKeyOrUrl);
      return;
    }
    const key = (typeof planKeyOrUrl === "string" && planKeyOrUrl) ? planKeyOrUrl : selectedPlanKey;
    navigate(`/checkout?type=subscription&planKey=${key}`);
  };

  const selectedPlan = plans.find(p => p.key === selectedPlanKey) || plans[0];
  const selectedPrice = selectedPlan ? selectedPlan.priceNpr - selectedPlan.discountNpr : 899;

  // Active category matching terms (includes parent category name, and all its children/subchildren)
  const activeCategoryTerms = useMemo(() => {
    const terms = new Set();
    const tabName = (activeCollectionTab || "").toLowerCase().trim();
    if (tabName) terms.add(tabName);

    // If categoryTree is available, find the active parent branch and gather all descendant names & slugs
    if (catData?.categoryTree && Array.isArray(catData.categoryTree)) {
      const targetParent = catData.categoryTree.find(
        node => node.name?.toLowerCase().trim() === tabName
      );
      if (targetParent) {
        const collectDescendants = (node) => {
          if (node.name) terms.add(node.name.toLowerCase().trim());
          if (node.slug) terms.add(node.slug.toLowerCase().trim());
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach(collectDescendants);
          }
        };
        collectDescendants(targetParent);
      }
    } else if (catData?.categories && Array.isArray(catData.categories)) {
      // Find parent category and match any direct or indirect children
      const parentCat = catData.categories.find(
        c => c.name?.toLowerCase().trim() === tabName && (!c.parent || c.isParent)
      );
      if (parentCat) {
        const parentId = parentCat._id?.toString();
        const descendantIds = new Set([parentId]);
        // Multi-pass to collect all depth levels
        for (let pass = 0; pass < 3; pass++) {
          catData.categories.forEach(c => {
            const pId = c.parent?._id?.toString() || c.parent?.toString();
            if (pId && descendantIds.has(pId)) {
              descendantIds.add(c._id.toString());
              if (c.name) terms.add(c.name.toLowerCase().trim());
              if (c.slug) terms.add(c.slug.toLowerCase().trim());
            }
          });
        }
      }
    }

    return Array.from(terms);
  }, [activeCollectionTab, catData]);

  // Filter collection courses strictly for the active parent category and its child/subchild topics
  const collectionCourses = useMemo(() => {
    if (!publishedCourses || publishedCourses.length === 0) return [];
    return publishedCourses.filter(c => {
      const cat = (c.category || "").toLowerCase().trim();
      const topics = Array.isArray(c.topics) ? c.topics.map(t => t.toLowerCase().trim()) : [];
      
      return activeCategoryTerms.some(term => 
        cat === term || 
        cat.includes(term) || 
        term.includes(cat) || 
        topics.some(t => t === term || t.includes(term) || term.includes(t))
      );
    }).slice(0, 6);
  }, [publishedCourses, activeCategoryTerms]);

  const pageContainerRef = useRef(null);

  // GSAP ScrollTrigger Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from(".hero-content-left", {
        opacity: 0,
        x: -30,
        duration: 0.9,
        ease: "power3.out"
      });
      gsap.from(".hero-content-right", {
        opacity: 0,
        x: 30,
        duration: 0.9,
        ease: "power3.out"
      });

      // Stats counters stagger
      gsap.from(".stat-counter-item", {
        opacity: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".stats-section",
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });

      // Generic animate-on-scroll sections
      gsap.utils.toArray(".gsap-scroll-section").forEach((section) => {
        gsap.from(section, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 82%",
            toggleActions: "play none none none"
          }
        });
      });

      // Comparison cards stagger
      gsap.from(".plan-compare-card", {
        opacity: 0,
        y: 40,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".plan-comparison-section",
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageContainerRef} className="bg-white text-[#2d2f31] font-sans antialiased overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* STICKY TOP SUB-BAR (Scroll triggered) */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showStickyNav && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#d1d7dc] shadow-md z-50 flex items-center justify-between px-6 md:px-12"
          >
            <div className="flex items-center gap-4">
              <span className="font-semibold text-[18px] text-[#1c1d1f]">Personal Plan</span>
            </div>
            <div className="flex items-center gap-5">
              <p className="hidden md:block text-[14px] text-[#6a6f73] font-light">
                Starting at <span className="text-[#1c1d1f] font-semibold">Rs {selectedPrice.toLocaleString()}</span> /month. Cancel anytime.
              </p>
              <Button
                onClick={() => handleSubscribe(selectedPlanKey)}
                className="bg-[#5624d0] hover:bg-[#401b9c] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xs transition-colors cursor-pointer"
              >
                Start subscription
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION (White background, left copy, right illustration) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-b border-[#d1d7dc]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-5 hero-content-left">
            <div className="flex items-center gap-2">
              <span className="text-[#5624d0] font-semibold text-[14px]">Personal Plan</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e0f2fe] text-[#0369a1] text-[12px] font-semibold rounded-xs">
                🏷️ 30% off the annual plan
              </span>
            </div>

            <h1 className="text-[32px] sm:text-[40px] lg:text-[44px] font-semibold tracking-tight text-[#1c1d1f] leading-[1.15]">
              Save 30% on your first year
            </h1>

            <p className="text-[16px] sm:text-[18px] text-[#2d2f31] leading-relaxed font-light">
              Go further at work and in life with access to a collection of top-rated courses in tech, business, and more.
            </p>

            <div className="pt-2">
              <Button
                ref={offerButtonRef}
                onClick={() => handleSubscribe(selectedPlanKey)}
                disabled={isSubscribing}
                className="h-12 bg-[#5624d0] hover:bg-[#401b9c] text-white text-[16px] font-semibold px-8 rounded-xs transition-colors cursor-pointer shadow-sm flex items-center gap-2"
              >
                {isSubscribing && <Loader2 className="animate-spin w-4 h-4" />}
                Save now
              </Button>
              <p className="text-[11px] text-[#6a6f73] mt-2.5 leading-normal max-w-lg font-light">
                30% off first year of Personal Plan yearly access. Discount offer only valid on Sept 14 – 21, 2026. Existing Personal Plan subscribers do not qualify. Subscription auto-renews at then-applicable regular yearly pricing after first year unless canceled.
              </p>
            </div>
          </div>

          {/* Right Column: Hero Graphic */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end hero-content-right">
            <div className="relative w-full max-w-[540px] aspect-[4/3] rounded-md overflow-hidden bg-gradient-to-tr from-[#f97316]/20 via-[#ea580c]/10 to-amber-100 flex items-center justify-center p-4">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                alt="Students collaborating on laptop"
                className="w-full h-full object-cover rounded-sm shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATS BAR (28,000+ / 20,000+ / 4.5 star / 9,000+) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-b border-[#d1d7dc] py-12 stats-section">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="stat-counter-item">
            <div className="text-[32px] sm:text-[38px] font-semibold text-[#1c1d1f] tracking-tight">28,000+</div>
            <div className="text-[14px] text-[#6a6f73] font-light mt-1">on-demand courses</div>
          </div>
          <div className="stat-counter-item">
            <div className="text-[32px] sm:text-[38px] font-semibold text-[#1c1d1f] tracking-tight">20,000+</div>
            <div className="text-[14px] text-[#6a6f73] font-light mt-1">practice exercises</div>
          </div>
          <div className="stat-counter-item">
            <div className="text-[32px] sm:text-[38px] font-semibold text-[#1c1d1f] tracking-tight flex items-center justify-center gap-1">
              4.5 <Star className="w-6 h-6 fill-[#e59819] text-[#e59819]" />
            </div>
            <div className="text-[14px] text-[#6a6f73] font-light mt-1">average course rating</div>
          </div>
          <div className="stat-counter-item">
            <div className="text-[32px] sm:text-[38px] font-semibold text-[#1c1d1f] tracking-tight">9,000+</div>
            <div className="text-[14px] text-[#6a6f73] font-light mt-1">top instructors</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. LOGO CLOUD (Trusted By) */}
      {/* ------------------------------------------------------------- */}
      <div className="gsap-scroll-section">
        <TrustedBySection />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. VALUE PROP FEATURE: Cutting-edge skills */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white py-16 border-b border-[#d1d7dc] gsap-scroll-section">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop"
                alt="Professional learner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#6a6f73]">Current</span>
            <h2 className="text-[28px] sm:text-[34px] font-semibold text-[#1c1d1f] leading-tight">
              Cutting-edge skills to keep you sharp
            </h2>
            <p className="text-[16px] text-[#2d2f31] leading-relaxed font-light">
              Learn confidently with up-to-date courses covering in-demand topics like AI for any role, cloud computing certifications, web development, productivity, leadership, design, digital marketing, and more.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. GET A PEEK AT THE COLLECTION (Course Grid with Tabs) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white py-16 border-b border-[#d1d7dc] gsap-scroll-section">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-[28px] sm:text-[34px] font-semibold text-[#1c1d1f] tracking-tight">
            Get a peek at the collection
          </h2>
          <p className="text-[16px] text-[#6a6f73] mt-2 font-light">
            With thousands of our best-rated courses from top instructors, Personal Plan is your subscription to success. Explore some of the included content below.
          </p>

          {/* Category Tabs */}
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-none border-b border-[#d1d7dc] mt-6 pb-2">
            {collectionTabs.map((tab) => {
              const isActive = activeCollectionTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveCollectionTab(tab)}
                  className={`text-[15px] font-semibold pb-2 transition-colors whitespace-nowrap relative cursor-pointer ${
                    isActive ? "text-[#1c1d1f] border-b-2 border-[#1c1d1f]" : "text-[#6a6f73] hover:text-[#1c1d1f]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Collection Grid: Left graphic + Right 2x3 cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-stretch">
            {/* Left Graphic Banner (Udemy Wizard Illustration) */}
            <div className="lg:col-span-5 bg-[#b8b3e8] rounded-md p-6 flex flex-col items-center justify-center text-center overflow-hidden relative shadow-sm">
              <img
                src="https://cms-images.udemycdn.com/96883mtakkm8/45kUu8h2d3m5I8N0gq9w2A/8ba360811b514d3f3f3e5db7ffc7931b/desktop-hands-on-practice.png"
                alt="Collection illustration"
                className="w-full max-w-[340px] h-auto object-contain"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
                }}
              />
            </div>

            {/* Right Course Items (2 Columns x 3 Rows - Flat borderless clean Udemy layout) */}
            <div className="lg:col-span-7">
              {collectionCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
                  {collectionCourses.map((c) => {
                    const ratingNum = typeof c.ratings === "number" && c.ratings > 0 ? c.ratings : 4.5;
                    const reviewsNum = typeof c.numOfReviews === "number" && c.numOfReviews > 0 ? c.numOfReviews : (c.enrolledStudents?.length ? c.enrolledStudents.length * 3 : 1);
                    const studentsNum = Array.isArray(c.enrolledStudents) && c.enrolledStudents.length > 0 ? c.enrolledStudents.length : 1;

                    return (
                      <Link
                        key={c._id}
                        to={`/course/${c.slug || c._id}`}
                        className="flex flex-col items-start text-left group"
                      >
                        <h4 className="font-semibold text-[18px] text-[#1c1d1f] group-hover:text-[#5624d0] leading-[1.25] line-clamp-2">
                          {c.title}
                        </h4>
                        <p className="text-[14px] text-[#2d2f31] font-light truncate mt-1.5">
                          {c.creator?.name || "Instructor"}
                        </p>
                        <p className="text-[14px] text-[#6a6f73] font-light mt-0.5">
                          {studentsNum.toLocaleString()} {studentsNum === 1 ? 'student' : 'students'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-semibold text-[15px] text-[#1c1d1f]">
                            {ratingNum.toFixed(1)}
                          </span>
                          <div className="flex text-[#b4690e]">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-[#b4690e] text-[#b4690e]" />
                            ))}
                          </div>
                          <span className="text-[14px] text-[#6a6f73] font-light">
                            ({reviewsNum.toLocaleString()})
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#4b1cad] text-white text-[12px] font-semibold rounded-xs shadow-xs">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Premium
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-sm border border-gray-200">
                  <p className="text-[16px] font-semibold text-[#1c1d1f]">
                    No courses available in {activeCollectionTab} yet.
                  </p>
                  <p className="text-[14px] text-[#6a6f73] mt-1">
                    New courses are regularly added to the Personal Plan collection.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar inside section: 'Start exploring the collection today.' */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#d1d7dc]">
            <p className="text-[16px] font-semibold text-[#1c1d1f]">
              Start exploring the collection today.
            </p>
            <Button
              onClick={() => handleSubscribe(selectedPlanKey)}
              className="bg-[#5624d0] hover:bg-[#401b9c] text-white text-[14px] font-semibold px-6 py-2.5 rounded-xs transition-colors cursor-pointer"
            >
              Start subscription
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. CHOOSE A PLAN THAT WORKS FOR YOU (2 Cards Comparison) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-[#f7f9fa] py-20 border-b border-[#d1d7dc] plan-comparison-section">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-[30px] sm:text-[36px] font-semibold text-center text-[#1c1d1f] tracking-tight">
            Choose a plan that works for you
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 items-stretch">
            {/* Card 1: Personal Plan (Featured / Highlighted) */}
            <div className="bg-white border-2 border-[#5624d0] rounded-sm shadow-lg overflow-hidden flex flex-col justify-between relative plan-compare-card">
              <div className="bg-[#5624d0] text-white text-center py-2 text-[12px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" /> Best value
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl font-semibold text-[#1c1d1f]">Personal Plan</h3>
                  <p className="text-[13px] text-[#6a6f73] mt-1 font-light">Streamline your career goals</p>

                  <div className="mt-4 inline-flex items-center gap-1 px-2.5 py-1 bg-[#e0f2fe] text-[#0369a1] text-[12px] font-semibold rounded-xs">
                    🏷️ 30% off the annual plan
                  </div>

                  <div className="mt-6">
                    <div className="text-[14px] text-[#6a6f73]">
                      Starting at <span className="line-through">Rs 1,299</span> <span className="text-3xl font-semibold text-[#1c1d1f]">Rs {selectedPrice.toLocaleString()}</span> /month
                    </div>
                    <p className="text-[11px] text-[#6a6f73] mt-1 font-light">Billed monthly or annually. Cancel anytime.</p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-8 space-y-3.5 text-[14px] text-[#2d2f31]">
                    <div className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#5624d0] shrink-0 mt-0.5" />
                      <span>28,000+ professional and personal development courses</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#5624d0] shrink-0 mt-0.5" />
                      <span>4.5/5 average rating across instructors</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#5624d0] shrink-0 mt-0.5" />
                      <span>20,000+ practice exercises & coding quizzes</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#5624d0] shrink-0 mt-0.5" />
                      <span>9,000+ top industry instructors</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Button
                    onClick={() => handleSubscribe(selectedPlanKey)}
                    className="w-full h-12 bg-[#5624d0] hover:bg-[#401b9c] text-white text-[16px] font-semibold rounded-xs transition-colors cursor-pointer"
                  >
                    Start subscription
                  </Button>
                </div>
              </div>
            </div>

            {/* Card 2: Buy Individual Courses */}
            <div className="bg-white border border-[#d1d7dc] rounded-sm p-6 sm:p-8 flex flex-col justify-between shadow-sm plan-compare-card">
              <div>
                <h3 className="text-3xl font-semibold text-[#1c1d1f]">Buy individual courses</h3>
                <p className="text-[13px] text-[#6a6f73] mt-1 font-light">Learn anything</p>

                <div className="mt-12">
                  <div className="text-3xl font-semibold text-[#1c1d1f]">Rs 899 - Rs 4,999</div>
                  <p className="text-[11px] text-[#6a6f73] mt-1 font-light">One time purchase</p>
                </div>

                {/* Feature Checklist */}
                <div className="mt-8 space-y-3.5 text-[14px] text-[#2d2f31]">
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#6a6f73] shrink-0 mt-0.5" />
                    <span>250,000+ professional and personal development courses</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#6a6f73] shrink-0 mt-0.5" />
                    <span>Pay as you go, lifetime access per course</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  onClick={() => navigate("/course/search")}
                  variant="outline"
                  className="w-full h-12 border-[#1c1d1f] text-[#1c1d1f] hover:bg-gray-100 text-[16px] font-semibold rounded-xs transition-colors cursor-pointer"
                >
                  Browse all courses
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (Accordion) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white py-20 gsap-scroll-section">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-[28px] sm:text-[34px] font-semibold text-center text-[#1c1d1f] tracking-tight mb-10">
            Frequently asked questions
          </h2>

          <div className="divide-y divide-[#d1d7dc] border-y border-[#d1d7dc]">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left py-2 focus:outline-none group cursor-pointer"
                  >
                    <span className="text-[16px] sm:text-[18px] font-semibold text-[#1c1d1f] group-hover:text-[#5624d0] transition-colors">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#1c1d1f] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#1c1d1f] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-[14px] text-[#6a6f73] leading-relaxed font-light pr-6 animate-in fade-in duration-200">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscribePage;
