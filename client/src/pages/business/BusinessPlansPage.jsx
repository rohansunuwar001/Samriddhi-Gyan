import React, { useState, useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Check,
  Minus,
  Sparkles,
  Users,
  Building2,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe2,
  BookOpen,
  Headphones,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestDemoModal from "./RequestDemoModal";
import TrustedBySection from "@/components/home/TrustedBySction";

gsap.registerPlugin(ScrollTrigger);

// Kinetic text reveal component matching the site's character animation standard
const AnimatedCharHeading = ({ text, className = "", as: Tag = "h2" }) => {
  if (!text) return null;
  const words = String(text).split(" ");

  return (
    <Tag className={`biz-split-heading ${className}`}>
      {words.map((word, wIdx) => (
        <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.26em] last:mr-0 align-top">
          {word.split("").map((char, cIdx) => (
            <span key={cIdx} className="inline-block overflow-hidden align-top">
              <span className="biz-split-char inline-block will-change-transform">
                {char}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
};

// Comparison Matrix Data Structure
const COMPARISON_SECTIONS = [
  {
    category: "Curriculum & Content Library",
    description: "Curated content covering critical technical, AI, business, and workplace skills.",
    features: [
      {
        name: "Top-rated course collection",
        team: "13,000+ courses",
        enterprise: "30,000+ courses",
        leadership: "Curated cohort modules",
        info: "Fresh courses mapped to real-world workplace and tech skills.",
      },
      {
        name: "International language collections",
        team: false,
        enterprise: "15+ languages (Nepali, English, Hindi, Spanish, etc.)",
        leadership: "Multilingual cohorts",
        info: "Courses taught in local languages by native industry experts.",
      },
      {
        name: "Generative AI & AI Agents coursework",
        team: true,
        enterprise: true,
        leadership: "AI Strategy for Executives",
        info: "Hands-on prompting, LLMs, and workflow automation training.",
      },
      {
        name: "Hands-on coding exercises & sandboxes",
        team: true,
        enterprise: true,
        leadership: "Strategic case studies",
        info: "In-browser coding environments with instant validation.",
      },
      {
        name: "Certification preparation & practice tests",
        team: "200+ cert exams",
        enterprise: "All major IT/Cloud/Agile certifications",
        leadership: "Executive badges",
        info: "AWS, Azure, GCP, CompTIA, PMP, CISSP mock exams and practice labs.",
      },
      {
        name: "Mobile app offline viewing & audio mode",
        team: true,
        enterprise: true,
        leadership: true,
        info: "Learn anywhere with mobile downloads on iOS and Android.",
      },
    ],
  },
  {
    category: "Administration & User Management",
    description: "Scalable controls to onboard teams, organize groups, and drive adoption.",
    features: [
      {
        name: "Target team size",
        team: "2 to 20 users",
        enterprise: "21+ users (Scalable to 50k+)",
        leadership: "Flexible cohorts",
        info: "Choose self-service for small teams or enterprise contracts for large orgs.",
      },
      {
        name: "User management & role assignments",
        team: "Basic admin",
        enterprise: "Granular roles (Admins, Group Admins, Users)",
        leadership: "Facilitators & Learners",
        info: "Assign admin rights without compromising sensitive org data.",
      },
      {
        name: "Custom user groups & business units",
        team: false,
        enterprise: true,
        leadership: "Cohort cohorts & squads",
        info: "Group by department, geography, or skill level.",
      },
      {
        name: "Course assignments with deadlines & custom messaging",
        team: false,
        enterprise: true,
        leadership: "Program syllabus milestones",
        info: "Send structured assignments with automated reminder notifications.",
      },
      {
        name: "Custom learning paths creation",
        team: false,
        enterprise: true,
        leadership: "Curated executive tracks",
        info: "Combine internal company docs with Samriddhi Gyan courses into custom curricula.",
      },
      {
        name: "Host proprietary internal company courses",
        team: false,
        enterprise: true,
        leadership: "Internal executive talks",
        info: "Privately upload your internal onboarding videos and security training.",
      },
    ],
  },
  {
    category: "Integrations & Enterprise Security",
    description: "Connect seamless identity, SSO, and existing HR/LMS tech stacks.",
    features: [
      {
        name: "Single Sign-On (SSO / SAML 2.0)",
        team: false,
        enterprise: "Okta, Azure AD, Ping, Google Workspace",
        leadership: true,
        info: "One-click authentication using your company's existing credentials.",
      },
      {
        name: "SCIM automated user provisioning",
        team: false,
        enterprise: true,
        leadership: true,
        info: "Automatically add or deprovision seats as employees join or leave.",
      },
      {
        name: "LMS / LXP Integrations",
        team: false,
        enterprise: "Cornerstone, Workday, Degreed, SuccessFactors",
        leadership: "LXP grade syncing",
        info: "Sync course catalogs and completion records directly to your LMS.",
      },
      {
        name: "REST APIs & Webhooks",
        team: false,
        enterprise: true,
        leadership: "Custom webhooks",
        info: "Extract real-time learning event data into your internal BI tools.",
      },
      {
        name: "Enterprise security & SOC2 compliance",
        team: "Standard SSL/TLS",
        enterprise: "SOC2 Type II, GDPR, ISO 27001",
        leadership: "Enterprise Grade",
        info: "Industry-leading data encryption at rest and in transit.",
      },
    ],
  },
  {
    category: "Analytics & Skill Insights",
    description: "Measure learning engagement, ROI, and skill benchmarks.",
    features: [
      {
        name: "User adoption & active learner metrics",
        team: "Standard metrics",
        enterprise: "Real-time interactive dashboards",
        leadership: "Cohort engagement scores",
        info: "Track how often your team logs in and learns.",
      },
      {
        name: "Skill proficiency & bench-strength insights",
        team: false,
        enterprise: true,
        leadership: "Leadership competency rubric",
        info: "Identify skill gaps across engineering, product, and business units.",
      },
      {
        name: "Course completion & assessment scores",
        team: true,
        enterprise: true,
        leadership: "Capstone deliverables",
        info: "Detailed quiz results and completion rates by employee.",
      },
      {
        name: "Scheduled automated report export (CSV / S3)",
        team: false,
        enterprise: true,
        leadership: "Executive summary deck",
        info: "Automate delivery of learning analytics to leadership inbox.",
      },
    ],
  },
  {
    category: "Customer Support & Success",
    description: "Dedicated advisors to help drive company-wide adoption and ROI.",
    features: [
      {
        name: "Support channel",
        team: "Email & Help Center",
        enterprise: "24/7 Priority Support & Chat",
        leadership: "Dedicated Program Concierge",
        info: "Guaranteed SLA response times for enterprise inquiries.",
      },
      {
        name: "Dedicated Customer Success Manager (CSM)",
        team: false,
        enterprise: "Included for 100+ seats",
        leadership: "Master Facilitators",
        info: "Strategic partner to assist with launch, engagement, and reviews.",
      },
      {
        name: "Custom onboarding & rollout plan",
        team: "Self-guided guide",
        enterprise: "White-glove executive kickoff",
        leadership: "Orientation sessions",
        info: "Tailored change management resources to guarantee team excitement.",
      },
    ],
  },
];

const BIZ_FAQS = [
  {
    q: "What is the difference between Team Plan and Enterprise Plan?",
    a: "Team Plan is built for smaller teams of 2 to 20 users who want self-service access to our top 13,000+ courses. Enterprise Plan is for organizations with 21+ learners and includes our full 30,000+ course library, international language collections, Single Sign-On (SSO/SCIM), LMS integrations, custom internal course hosting, and advanced skill analytics with a dedicated Customer Success Manager.",
  },
  {
    q: "How does the billing cycle work?",
    a: "Team Plan is billed as an annual subscription per user seat (e.g. Rs 3,999/user/month billed annually). Enterprise Plans are customized based on organization scale, multi-year commitments, and tailored integration requirements.",
  },
  {
    q: "Can we reassign user licenses if an employee leaves?",
    a: "Yes! On both Team and Enterprise plans, administrators can reassign licenses to new team members at any point during the subscription period at no extra cost.",
  },
  {
    q: "Does Samriddhi Gyan Business integrate with our existing LMS/SSO?",
    a: "Yes. Our Enterprise Plan supports Single Sign-On (Okta, Azure AD, Google Workspace, PingIdentity via SAML 2.0/SCIM) and turnkey integrations with major LMS/LXP platforms including Cornerstone, Workday, Degreed, SAP SuccessFactors, and custom REST APIs.",
  },
  {
    q: "Can we upload our own internal company training videos?",
    a: "Yes! With the Enterprise Plan, administrators can upload proprietary internal courses, onboarding pathways, and company compliance modules visible only to your verified employees.",
  },
  {
    q: "How do I start a free trial or request a live demo?",
    a: "Click 'Request a Demo' to book a 15-minute walkthrough with an enterprise learning advisor, or click 'Start Free Trial' under Team Plan to test with your core team immediately.",
  },
];

const BusinessPlansPage = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedPlanForDemo, setSelectedPlanForDemo] = useState("Enterprise Plan");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [teamSeats, setTeamSeats] = useState(5);

  const openDemo = (planName) => {
    navigate(`/business/request-demo?plan=${encodeURIComponent(planName || "Enterprise Plan")}`);
  };

  const toggleFaq = (idx) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  // GSAP Scroll Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // ── 1. Hero section – fade + slide up ───────────────────────────────
      gsap.from(".biz-hero-content", {
        opacity: 0,
        y: 35,
        duration: 0.9,
        ease: "power3.out",
      });

      // ── 2. Character-by-character kinetic reveal ─────────────────────────
      gsap.utils.toArray(".biz-split-heading").forEach((headingEl) => {
        const chars = headingEl.querySelectorAll(".biz-split-char");
        if (chars.length > 0) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: "90%", rotateZ: 1.5 },
            {
              opacity: 1,
              y: "0%",
              rotateZ: 0,
              duration: 0.45,
              stagger: 0.015,
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

      // ── 3. Section-level fade + lift ────────────────────────────────────
      gsap.utils.toArray(".biz-scroll-section").forEach((sec) => {
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

      // ── 4. Pricing cards stagger in ─────────────────────────────────────
      gsap.from(".biz-price-card", {
        opacity: 0,
        y: 50,
        scale: 0.95,
        duration: 0.65,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".biz-pricing-grid",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 5. Stat / metric counters pop in ────────────────────────────────
      gsap.from(".biz-stat-card", {
        opacity: 0,
        scale: 0.75,
        duration: 0.6,
        stagger: 0.12,
        ease: "back.out(1.6)",
        scrollTrigger: {
          trigger: ".biz-stats-grid",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 6. Comparison table rows fade in sequentially ───────────────────
      gsap.from(".biz-table-row", {
        opacity: 0,
        x: -20,
        duration: 0.4,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".biz-compare-table",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 7. FAQ items cascade down ────────────────────────────────────────
      gsap.from(".biz-faq-item", {
        opacity: 0,
        y: 25,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".biz-faq-list",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 8. Bottom CTA billboard – scale reveal ───────────────────────────
      gsap.from(".biz-cta-billboard", {
        opacity: 0,
        scale: 0.96,
        y: 30,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".biz-cta-billboard",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 9. CTA buttons spring in ─────────────────────────────────────────
      gsap.from(".biz-cta-btn", {
        opacity: 0,
        scale: 0.82,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: ".biz-cta-group",
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });

      // ── 10. Hero paragraph subtext slide up ──────────────────────────────
      gsap.from(".biz-hero-para", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        delay: 0.3,
        ease: "power3.out",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="bg-white text-[#1c1d1f] font-sans min-h-screen selection:bg-[#5624d0] selection:text-white"
      style={{ fontFamily: "Udemy-Regular, SF Pro Text, -apple-system, BlinkMacSystemFont, Roboto, sans-serif" }}
    >
      {/* 1. Header Navigation & Breadcrumb Banner */}
      <section className="bg-[#f6f7f9] border-b border-gray-200 py-16 px-4 sm:px-6 lg:px-8 biz-hero-content">
        <div className="max-w-[1340px] mx-auto text-left">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-base font-normal text-[#6a6f73] uppercase tracking-wider mb-5">
            <Link to="/" className="hover:text-[#5624d0] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#1c1d1f] font-medium">Business Plans</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#5624d0]/10 text-[#5624d0] border border-[#5624d0]/20 px-4 py-1.5 rounded-full text-base font-semibold uppercase tracking-wider mb-5">
            <Sparkles className="w-4 h-4" />
            Learning Plans for Businesses
          </div>

          <AnimatedCharHeading
            as="h1"
            text="Find the right learning plan for your business"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1c1d1f] tracking-tight leading-[1.15] max-w-5xl"
          />

          <p className="text-xl sm:text-2xl md:text-3xl text-[#6a6f73] mt-5 max-w-4xl leading-relaxed">
            Upskill your teams with on-demand access to 30,000+ top-rated courses in AI, software development, cloud computing, leadership, and workplace productivity taught in Nepali and English.
          </p>

          <div className="flex flex-wrap items-center gap-5 mt-10">
            <Button
              onClick={() => openDemo("Enterprise Plan")}
              className="bg-[#5624d0] hover:bg-[#401b9c] text-white font-semibold px-8 py-4 rounded-md text-xl transition-all shadow-md flex items-center gap-2.5 h-auto"
            >
              <span>Request a Demo</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <a
              href="#compare-matrix"
              className="bg-white hover:bg-gray-100 text-[#1c1d1f] border border-gray-300 font-semibold px-7 py-4 rounded-md text-xl transition-all flex items-center"
            >
              View Full Comparison Table
            </a>
          </div>
        </div>
      </section>

      {/* 2. Top Tier Pricing Cards (Team / Enterprise / Leadership) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto biz-scroll-section">
        <div className="biz-pricing-grid grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* --- Card 1: Team Plan --- */}
          <div className="biz-price-card border border-gray-200 rounded-xl p-7 sm:p-9 bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left relative group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-3.5 py-1.5 rounded-full text-base font-semibold">
                  <Users className="w-4 h-4" /> 2 - 20 users
                </div>
              </div>

              <div>
                <h3 className="text-4xl font-bold text-[#1c1d1f]">Team Plan</h3>
                <p className="text-lg text-[#6a6f73] mt-2 leading-relaxed">
                  For small teams looking to upskill with high-impact, self-service technical courses.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-5xl sm:text-6xl font-bold text-[#1c1d1f]">Rs 3,999</span>
                  <span className="text-lg text-gray-500 font-light">/ user / month</span>
                </div>
                <p className="text-base text-gray-500 mt-1.5">Billed annually (Rs 47,988 per seat / year)</p>
              </div>

              {/* Seat Slider */}
              <div className="bg-[#f6f7f9] p-5 rounded-lg space-y-2.5">
                <div className="flex justify-between text-base font-medium text-gray-700">
                  <span>Seats: <strong className="text-[#5624d0] text-lg">{teamSeats}</strong></span>
                  <span className="text-base font-semibold text-gray-900">Total: Rs {(teamSeats * 47988).toLocaleString()}/yr</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={teamSeats}
                  onChange={(e) => setTeamSeats(Number(e.target.value))}
                  className="w-full accent-[#5624d0] cursor-pointer h-2"
                />
              </div>

              {/* Core Features */}
              <div className="space-y-3.5 pt-2">
                <p className="text-base font-semibold text-gray-900 uppercase tracking-wider">Plan includes:</p>
                <ul className="space-y-3 text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Access to <strong>13,000+ top courses</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Goal-oriented learning paths</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Hands-on coding exercises & practice tests</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Basic team adoption & engagement reports</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>iOS & Android offline mobile access</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-gray-100">
              <Button
                onClick={() => navigate("/checkout?plan=team")}
                className="w-full bg-[#1c1d1f] hover:bg-black text-white font-semibold py-4 rounded-md text-xl transition-colors h-auto"
              >
                Start Free 14-Day Trial
              </Button>
            </div>
          </div>

          {/* --- Card 2: Enterprise Plan (Featured / Highlighted) --- */}
          <div className="biz-price-card border-2 border-[#5624d0] rounded-xl p-7 sm:p-9 bg-white shadow-2xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between text-left relative">
            {/* Top Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5624d0] text-white text-base font-bold uppercase px-5 py-1.5 rounded-full shadow-lg tracking-wider whitespace-nowrap">
              Most Popular • For 21+ Learners
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 bg-purple-50 text-[#5624d0] border border-purple-200 px-3.5 py-1.5 rounded-full text-base font-semibold">
                  <Building2 className="w-4 h-4" /> 21+ learners
                </div>
              </div>

              <div>
                <h3 className="text-4xl font-bold text-[#1c1d1f]">Enterprise Plan</h3>
                <p className="text-lg text-[#6a6f73] mt-2 leading-relaxed">
                  For organizations needing scalable upskilling, custom content hosting, LMS integration, and dedicated success support.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl sm:text-6xl font-bold text-[#5624d0]">Custom Pricing</span>
                </div>
                <p className="text-base text-gray-500 mt-1.5">Tiered pricing based on seat volume and contract length</p>
              </div>

              {/* Core Features */}
              <div className="space-y-3.5 pt-2">
                <p className="text-base font-semibold text-gray-900 uppercase tracking-wider">Everything in Team, plus:</p>
                <ul className="space-y-3 text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Full access to <strong>30,000+ top courses</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>International collections in <strong>15+ languages</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Single Sign-On (<strong>SSO / SAML</strong>) & SCIM auto-provisioning</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Host proprietary company internal courses</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>LMS / LXP integration (Cornerstone, Workday, Degreed)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span><strong>Dedicated Customer Success Manager (CSM)</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-gray-100">
              <Button
                onClick={() => openDemo("Enterprise Plan")}
                className="w-full bg-[#5624d0] hover:bg-[#401b9c] text-white font-semibold py-4 rounded-md text-xl transition-all shadow-md h-auto"
              >
                Request a Demo
              </Button>
            </div>
          </div>

          {/* --- Card 3: Leadership Academy --- */}
          <div className="biz-price-card border border-gray-200 rounded-xl p-7 sm:p-9 bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left relative group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-full text-base font-semibold">
                  <Award className="w-4 h-4" /> Cohort Leadership
                </div>
              </div>

              <div>
                <h3 className="text-4xl font-bold text-[#1c1d1f]">Leadership Academy</h3>
                <p className="text-lg text-[#6a6f73] mt-2 leading-relaxed">
                  Cohort-based immersive leadership programs designed to prepare managers and executives for strategic growth.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl sm:text-6xl font-bold text-[#1c1d1f]">Custom Add-on</span>
                </div>
                <p className="text-base text-gray-500 mt-1.5">Available for Enterprise accounts & specialized cohorts</p>
              </div>

              {/* Core Features */}
              <div className="space-y-3.5 pt-2">
                <p className="text-base font-semibold text-gray-900 uppercase tracking-wider">Cohort features:</p>
                <ul className="space-y-3 text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Executive leadership & management frameworks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Live virtual events & expert faculty facilitation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Collaborative peer discussion squads</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Real-world strategic business capstone projects</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
                    <span>Executive coaching & feedback rubrics</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-gray-100">
              <Button
                onClick={() => openDemo("Leadership Academy")}
                className="w-full bg-white hover:bg-gray-50 text-[#1c1d1f] font-semibold py-4 rounded-md text-xl border border-gray-300 transition-colors h-auto"
              >
                Learn More & Request Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Enterprise Social Proof & Metrics */}
      <section className="bg-[#f6f7f9] py-20 px-4 sm:px-6 lg:px-8 border-y border-gray-200 biz-scroll-section">
        <div className="max-w-[1340px] mx-auto">
          <div className="text-center mb-12">
            <AnimatedCharHeading
              text="Trusted by world-class organizations"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1c1d1f]"
            />
            <p className="text-lg sm:text-xl text-[#6a6f73] mt-3 max-w-2xl mx-auto">
              Over 16,000 businesses trust Samriddhi Gyan Business to train and certify their teams.
            </p>
          </div>

          <div className="biz-stats-grid grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-14">
            <div className="biz-stat-card bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-6xl sm:text-7xl font-extrabold text-[#5624d0]">84%</div>
              <p className="text-xl text-gray-900 font-semibold mt-3">Higher employee retention</p>
              <p className="text-base text-gray-600 mt-1.5 leading-relaxed">Companies report higher staff satisfaction when upskilling is sponsored.</p>
            </div>
            <div className="biz-stat-card bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-6xl sm:text-7xl font-extrabold text-[#5624d0]">2.5x</div>
              <p className="text-xl text-gray-900 font-semibold mt-3">Faster certification pass rate</p>
              <p className="text-base text-gray-600 mt-1.5 leading-relaxed">Learners clear AWS, Cloud, and Project Management exams on the 1st try.</p>
            </div>
            <div className="biz-stat-card bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-6xl sm:text-7xl font-extrabold text-[#5624d0]">30,000+</div>
              <p className="text-xl text-gray-900 font-semibold mt-3">Curated on-demand courses</p>
              <p className="text-base text-gray-600 mt-1.5 leading-relaxed">Fresh content updated weekly with the latest industry frameworks.</p>
            </div>
          </div>

          <TrustedBySection />
        </div>
      </section>

      {/* 4. Detailed Feature Comparison Table */}
      <section id="compare-matrix" className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto biz-scroll-section">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <AnimatedCharHeading
            text="Compare plans side-by-side"
            className="text-5xl sm:text-6xl font-bold text-[#1c1d1f] tracking-tight"
          />
          <p className="text-xl sm:text-2xl text-[#6a6f73] mt-4 leading-relaxed">
            Detailed breakdown of curriculum, administration controls, enterprise integrations, and analytics.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="biz-compare-table border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
          {/* Table Header (Sticky) */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200 grid grid-cols-12 gap-4 p-5 sm:p-7 items-center shadow-sm">
            <div className="col-span-5 md:col-span-4 text-left font-bold text-[#1c1d1f] text-xl sm:text-2xl">
              Features & Capabilities
            </div>
            <div className="col-span-2 md:col-span-3 text-center">
              <span className="font-bold text-[#1c1d1f] text-lg sm:text-xl block">Team Plan</span>
              <span className="text-base text-gray-500 hidden sm:inline">2 - 20 seats</span>
            </div>
            <div className="col-span-3 md:col-span-3 text-center">
              <span className="font-bold text-[#5624d0] text-lg sm:text-xl block">Enterprise Plan</span>
              <span className="text-base text-[#5624d0] font-semibold hidden sm:inline">21+ seats</span>
            </div>
            <div className="col-span-2 md:col-span-2 text-center">
              <span className="font-bold text-[#1c1d1f] text-lg sm:text-xl block">Leadership</span>
              <span className="text-base text-gray-500 hidden sm:inline">Cohorts</span>
            </div>
          </div>

          {/* Sections */}
          <div className="divide-y divide-gray-200">
            {COMPARISON_SECTIONS.map((section, sIdx) => (
              <div key={sIdx} className="p-5 sm:p-7 bg-white">
                <div className="text-left mb-5">
                  <h4 className="text-2xl sm:text-3xl font-bold text-[#1c1d1f]">{section.category}</h4>
                  <p className="text-base text-[#6a6f73] mt-1">{section.description}</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {section.features.map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      className="biz-table-row grid grid-cols-12 gap-4 py-4 items-center hover:bg-gray-50/80 transition-colors text-left text-base sm:text-lg"
                    >
                      {/* Feature Name */}
                      <div className="col-span-5 md:col-span-4 text-[#1c1d1f] font-normal pr-2">
                        <span className="text-base sm:text-lg font-medium">{feat.name}</span>
                        {feat.info && (
                          <p className="text-sm text-gray-500 font-light mt-1 leading-normal">{feat.info}</p>
                        )}
                      </div>

                      {/* Team Plan Col */}
                      <div className="col-span-2 md:col-span-3 text-center flex items-center justify-center text-gray-700">
                        {typeof feat.team === "boolean" ? (
                          feat.team ? (
                            <Check className="w-6 h-6 text-[#5624d0]" />
                          ) : (
                            <Minus className="w-5 h-5 text-gray-300" />
                          )
                        ) : (
                          <span className="font-normal text-base sm:text-lg">{feat.team}</span>
                        )}
                      </div>

                      {/* Enterprise Plan Col (Highlighted) */}
                      <div className="col-span-3 md:col-span-3 text-center flex items-center justify-center bg-purple-50/40 py-2.5 rounded text-[#1c1d1f]">
                        {typeof feat.enterprise === "boolean" ? (
                          feat.enterprise ? (
                            <Check className="w-6 h-6 text-[#5624d0]" />
                          ) : (
                            <Minus className="w-5 h-5 text-gray-300" />
                          )
                        ) : (
                          <span className="font-semibold text-[#5624d0] text-base sm:text-lg">{feat.enterprise}</span>
                        )}
                      </div>

                      {/* Leadership Col */}
                      <div className="col-span-2 md:col-span-2 text-center flex items-center justify-center text-gray-700">
                        {typeof feat.leadership === "boolean" ? (
                          feat.leadership ? (
                            <Check className="w-6 h-6 text-[#5624d0]" />
                          ) : (
                            <Minus className="w-5 h-5 text-gray-300" />
                          )
                        ) : (
                          <span className="font-normal text-base sm:text-lg">{feat.leadership}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Table Bottom Action Row */}
          <div className="bg-gray-50 border-t border-gray-200 grid grid-cols-12 gap-4 p-7 items-center">
            <div className="col-span-5 md:col-span-4 text-left font-semibold text-gray-800 text-lg">
              Ready to take the next step?
            </div>
            <div className="col-span-2 md:col-span-3 text-center">
              <Button
                onClick={() => navigate("/checkout?plan=team")}
                className="w-full bg-[#1c1d1f] hover:bg-black text-white font-semibold py-3.5 rounded text-base sm:text-lg h-auto"
              >
                Try Team Plan
              </Button>
            </div>
            <div className="col-span-3 md:col-span-3 text-center">
              <Button
                onClick={() => openDemo("Enterprise Plan")}
                className="w-full bg-[#5624d0] hover:bg-[#401b9c] text-white font-semibold py-3.5 rounded text-base sm:text-lg shadow h-auto"
              >
                Request Demo
              </Button>
            </div>
            <div className="col-span-2 md:col-span-2 text-center">
              <Button
                onClick={() => openDemo("Leadership Academy")}
                className="w-full bg-white hover:bg-gray-100 text-[#1c1d1f] border border-gray-300 font-semibold py-3.5 rounded text-base sm:text-lg h-auto"
              >
                Contact
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Enterprise FAQs Accordion */}
      <section className="bg-[#f6f7f9] py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-200 biz-scroll-section">
        <div className="max-w-4xl mx-auto text-left">
          <div className="text-center mb-12">
            <AnimatedCharHeading
              text="Frequently asked questions"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1c1d1f]"
            />
            <p className="text-lg sm:text-xl text-[#6a6f73] mt-3">
              Common questions about business procurement, licensing, and rollout.
            </p>
          </div>

          <div className="biz-faq-list space-y-4">
            {BIZ_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="biz-faq-item bg-white border border-gray-200 rounded-xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-7 py-6 flex items-center justify-between text-left font-semibold text-xl sm:text-2xl text-[#1c1d1f] hover:text-[#5624d0] transition-colors focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-6 h-6 text-[#5624d0] shrink-0" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-7 pb-6 text-lg sm:text-xl text-gray-600 leading-relaxed border-t border-gray-100 pt-4 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Bottom Billboard Conversion CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto">
        <div className="biz-cta-billboard bg-[#1c1d1f] text-white rounded-3xl p-10 sm:p-16 lg:p-20 text-center space-y-7 relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-[#5624d0]/30 text-purple-200 border border-purple-400/30 px-4 py-1.5 rounded-full text-base font-medium uppercase tracking-wider">
            <Zap className="w-4 h-4 text-purple-300" />
            Empower Your Workforce Today
          </div>

          <AnimatedCharHeading
            text="Ready to accelerate learning across your organization?"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.15]"
          />

          <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join thousands of forward-thinking companies driving revenue, innovation, and retention through on-demand skills.
          </p>

          <div className="biz-cta-group flex flex-wrap justify-center gap-5 pt-6">
            <Button
              onClick={() => openDemo("Enterprise Plan")}
              className="biz-cta-btn bg-[#5624d0] hover:bg-[#401b9c] text-white font-semibold px-9 py-4 rounded-md text-xl transition-all shadow-lg h-auto"
            >
              Request a Demo
            </Button>
            <Button
              onClick={() => navigate("/checkout?plan=team")}
              className="biz-cta-btn bg-white hover:bg-gray-100 text-[#1c1d1f] font-semibold px-9 py-4 rounded-md text-xl transition-all border border-white h-auto"
            >
              Start Team Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Request a Demo Modal */}
      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        defaultPlan={selectedPlanForDemo}
      />
    </div>
  );
};

export default BusinessPlansPage;
