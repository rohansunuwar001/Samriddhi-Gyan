import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, Play, BookOpen, Star, ShieldCheck, Zap } from "lucide-react";

const SubscribePage = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Please log in to start your subscription plan.");
      navigate("/login");
      return;
    }

    // Success action
    toast.success("Congratulations! Your Samriddhi Gyan Personal Plan subscription has started successfully!");
    navigate("/");
  };

  return (
    <div className="bg-[#1c1d1f] text-white min-h-screen font-sans text-left">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2d2f31] to-[#1c1d1f] py-16 px-6 sm:px-12 lg:px-16 border-b border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-current" /> Personal Plan
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Access 10,000+ of our <span className="text-[#a435f0]">top-rated</span> courses
            </h1>
            <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
              Upskill in tech, business, design, and more with our subscription-based Personal Plan. Cancel anytime.
            </p>
            <div className="space-y-3 pt-2 text-sm text-gray-300">
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

          {/* Pricing Card */}
          <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl border border-gray-100 max-w-md lg:ml-auto w-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Subscribe and Save</h3>
            <p className="text-sm text-gray-500 mb-6">Gain full access to the complete learning library.</p>
            
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold text-slate-800">Monthly Plan</span>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[#a435f0]">$29.00</span>
                  <span className="text-xs text-gray-500">/mo</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">7-day free trial. Cancel anytime before trial ends.</p>
            </div>

            <Button 
              onClick={handleSubscribe} 
              className="w-full h-14 bg-[#a435f0] hover:bg-[#8720cf] text-white text-lg font-extrabold rounded-xl transition-all shadow-md shadow-purple-500/10 mb-4"
            >
              Start 7-Day Free Trial
            </Button>
            
            <p className="text-center text-xs text-gray-400 leading-normal">
              By starting your free trial, you agree to our Terms of Use. Subscription automatically renews after trial.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
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

      {/* Trial Promo Banner */}
      <section className="bg-purple-950/40 border border-purple-500/20 rounded-3xl max-w-6xl mx-6 sm:mx-12 lg:mx-auto p-12 text-center space-y-6 mb-24">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ready to supercharge your learning?
        </h2>
        <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto">
          Start your 7-day trial of Personal Plan to unlock unlimited streaming of 10,000+ tech and career development courses.
        </p>
        <div className="pt-2">
          <Button 
            onClick={handleSubscribe} 
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
