import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, BookOpen, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetActiveGetOfferPromoQuery,
  useGetActiveSubscriptionNavbarQuery
} from "@/features/api/cmsApi";
import { useBuySubscriptionMutation } from "@/features/api/subscriptionApi";
import { useGetSubscriptionPlansQuery } from "@/features/api/subscriptionPlansApi";

const SubscribePage = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  const [selectedPlanKey, setSelectedPlanKey] = useState("1m");

  const [buySubscription, { isLoading: isSubscribing }] = useBuySubscriptionMutation();
  const { data: plansData, isLoading: loadingPlans } = useGetSubscriptionPlansQuery();

  // Queries for active CMS components
  const { data: promoData, isLoading: loadingPromo } = useGetActiveGetOfferPromoQuery();
  const { data: navbarData, isLoading: loadingNavbar } = useGetActiveSubscriptionNavbarQuery();

  const activePromo = promoData?.promo;
  const activeNavbar = navbarData?.navbar;
  const plans = plansData?.plans || [];

  // Scroll trigger states
  const offerButtonRef = useRef(null);
  const [showStickyNav, setShowStickyNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (offerButtonRef.current) {
        const rect = offerButtonRef.current.getBoundingClientRect();
        if (rect.bottom < 0) {
          setShowStickyNav(true);
        } else {
          setShowStickyNav(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activePromo]);

  const handleSubscribe = async (planKeyOrUrl) => {
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

    try {
      toast.info("Initiating subscription payment...");
      const response = await buySubscription({ planKey: key }).unwrap();

      if (response.success && response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        toast.error("Failed to initiate subscription payment.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.data?.message || "Failed to initiate payment.");
    }
  };

  return (
    <div className="bg-[#1c1d1f] text-white min-h-screen font-sans text-left relative">
      {/* ------------------------------------------------------------- */}
      {/* STICKY SUBSCRIPTION NAVBAR (SCROLL-TRIGGERED) */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showStickyNav && activeNavbar && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-white text-slate-900 border-b border-gray-250 shadow-md z-50 flex items-center justify-between px-6 md:px-12"
          >
            {/* Left side: Logo & Plan Name */}
            <div className="flex items-center gap-4">
              <img
                src="/samriddhi_logo1.png"
                alt="Samriddhi Logo"
                className="h-8 md:h-9 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="font-bold text-gray-800 text-sm md:text-base border-l border-gray-200 pl-4">
                {activeNavbar.planName}
              </span>
            </div>

            {/* Right side: Pricing and CTA */}
            <div className="flex items-center gap-4 sm:gap-6">
              <p className="hidden md:block text-sm text-gray-600 font-medium">
                {activeNavbar.pricingText}
              </p>
              <Button
                onClick={() => handleSubscribe(activeNavbar.buttonUrl)}
                className="bg-[#a435f0] hover:bg-[#8720cf] text-white text-sm font-extrabold px-6 py-2.5 rounded transition-all shadow-sm"
              >
                {activeNavbar.buttonText}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION / PROMO CARD */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-[#2d2f31] to-[#1c1d1f] py-16 px-6 sm:px-12 lg:px-16 border-b border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Offer Details */}
          <div className="lg:col-span-7 space-y-6">
            {activePromo ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  <Zap className="w-3 h-3 fill-current" /> {activePromo.badgeText}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  {activePromo.title}
                </h1>
                <p className="text-base sm:text-lg text-gray-300 max-w-2xl leading-relaxed">
                  {activePromo.description}
                </p>
              </>
            ) : (
              // Default Fallback offer
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  <Zap className="w-3 h-3 fill-current" /> Personal Plan
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Access 10,000+ of our <span className="text-[#a435f0]">top-rated</span> courses
                </h1>
                <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
                  Upskill in tech, business, design, and more with our subscription-based Personal Plan. Cancel anytime.
                </p>
              </>
            )}

            {/* Plan pricing options list */}
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-gray-200">Choose your subscription plan duration:</h3>
              {loadingPlans ? (
                <div className="flex items-center gap-2 text-purple-400 py-2">
                  <Loader2 className="animate-spin w-4 h-4" /> Loading subscription plans...
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {plans.map((p) => {
                    const finalPrice = p.priceNpr - p.discountNpr;
                    const isSelected = selectedPlanKey === p.key;
                    return (
                      <div
                        key={p.key}
                        onClick={() => setSelectedPlanKey(p.key)}
                        className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#a435f0] bg-[#a435f0]/10 shadow-[0_0_12px_rgba(164,53,240,0.3)]"
                            : "border-gray-800 hover:border-gray-700 bg-gray-900/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="font-bold text-white text-sm">{p.planName}</div>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? "border-[#a435f0]" : "border-gray-600"
                            }`}
                          >
                            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#a435f0]" />}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-white">Rs {finalPrice.toLocaleString()}</span>
                          {p.discountNpr > 0 && (
                            <span className="text-xs text-gray-400 line-through">Rs {p.priceNpr.toLocaleString()}</span>
                          )}
                        </div>
                        {p.discountNpr > 0 && (
                          <div className="text-[10px] text-green-400 font-bold mt-0.5">
                            Save Rs {p.discountNpr.toLocaleString()}!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                ref={offerButtonRef}
                disabled={isSubscribing}
                onClick={() => handleSubscribe(selectedPlanKey)}
                className="w-full sm:w-auto h-14 bg-[#a435f0] hover:bg-[#8720cf] text-white text-base font-extrabold px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSubscribing && <Loader2 className="animate-spin w-5 h-5" />}
                Proceed to eSewa Checkout
              </Button>
              {activePromo?.finePrint && (
                <p className="text-[11px] text-gray-400 leading-normal max-w-md mt-2">
                  {activePromo.finePrint}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>Hands-on practice exercises & coding quizzes</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>Certificates of completion for every course</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span>Curated selection of industry-recognized certifications</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Illustration Mockup */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-video sm:aspect-square overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
              <img
                src="/promo_banner.png"
                alt="Promo Banner"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // fallback to CSS composition if image is missing
                  e.target.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* BENEFITS GRID */}
      {/* ------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <h2 className="text-3xl font-extrabold text-center tracking-tight sm:text-4xl">
          Why subscribe to Personal Plan?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4 hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold">10,000+ top courses</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Explore critical subjects like Python, JavaScript, Web Development, Data Science, AI, Leadership, and Finance.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4 hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold">Certificates of completion</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Earn shareable credentials upon finishing courses to prove your expertise to employers or clients.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4 hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold">Flexible learning schedule</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Learn at your own pace from any device. Switch courses anytime, skip chapters, and resume wherever you left off.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FINAL CALL TO ACTION BANNER */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-purple-950/40 border border-purple-500/20 rounded-3xl max-w-6xl mx-6 sm:mx-12 lg:mx-auto p-12 text-center space-y-6 mb-24">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ready to supercharge your learning?
        </h2>
        <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto">
          Start your 7-day trial of Personal Plan to unlock unlimited streaming of 10,000+ tech and career development courses.
        </p>
        <div className="pt-2">
          <Button
            onClick={() => handleSubscribe("/subscribe")}
            className="px-8 h-14 bg-white hover:bg-gray-150 text-slate-900 text-lg font-extrabold rounded-xl transition-all shadow-lg"
          >
            Start Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SubscribePage;
