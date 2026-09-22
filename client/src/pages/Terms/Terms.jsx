import React, { useState } from "react";
import { ShieldCheck, FileText, Lock, Globe, DollarSign, AlertCircle, HelpCircle } from "lucide-react";

const Terms = () => {
  const [activeSection, setActiveSection] = useState("intro");

  const sections = [
    { id: "intro", title: "1. Acceptance of Terms", icon: Globe },
    { id: "accounts", title: "2. User Accounts & Security", icon: Lock },
    { id: "courses", title: "3. Course Access & Content", icon: FileText },
    { id: "payments", title: "4. Payments, Refunds & Billing", icon: DollarSign },
    { id: "conduct", title: "5. Code of Conduct", icon: ShieldCheck },
    { id: "liability", title: "6. Limitation of Liability", icon: AlertCircle },
    { id: "contact", title: "7. Contact Information", icon: HelpCircle },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="bg-[#f7f9fa] min-h-screen text-[#2d2f31] font-sans pb-20 text-left select-text">
      {/* Page Hero Header */}
      <div className="bg-[#1c1d1f] text-white py-16 px-6 sm:px-12 border-b border-gray-800">
        <div className="max-w-6xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-xl font-light leading-relaxed">
            Welcome to Samriddhi Gyan. These Terms of Service govern your use of our LMS platform, websites, and online courses.
          </p>
          <p className="text-sm text-gray-400 font-medium">
            Last Updated: July 1, 2026
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Sticky Side Navigation (Desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 bg-white border border-[#d1d7dc] p-4 space-y-1">
              <h3 className="text-sm font-semibold text-[#6a6f73] uppercase tracking-wider mb-3 px-2">
                Table of Contents
              </h3>
              {sections.map((sec) => {
                const IconComponent = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-all text-left ${
                      isActive
                        ? "bg-[#ecebfa] text-[#5624d0]"
                        : "text-[#2d2f31] hover:bg-gray-50 hover:text-[#5624d0]"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Terms Text Content */}
          <div className="col-span-1 lg:col-span-3 space-y-10">
            <div className="bg-white border border-[#d1d7dc] p-6 sm:p-10 space-y-12">
              
              {/* Introduction Section */}
              <section id="intro" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <Globe className="w-5 h-5 text-[#a435f0]" />
                  <h2 className="text-2xl font-semibold text-[#2d2f31]">
                    1. Acceptance of Terms
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-[#2d2f31] font-light leading-relaxed space-y-3">
                  <p>
                    By registering for, accessing, or using the Samriddhi Gyan LMS platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you are prohibited from utilizing our website, platform, and online services.
                  </p>
                  <p>
                    These terms apply to all visitors, registered students, instructors, and any others who access or use our LMS system. We reserve the right, at our sole discretion, to modify or replace these terms at any time.
                  </p>
                </div>
              </section>

              {/* User Accounts & Security */}
              <section id="accounts" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <Lock className="w-5 h-5 text-[#a435f0]" />
                  <h2 className="text-2xl font-semibold text-[#2d2f31]">
                    2. User Accounts & Security
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-[#2d2f31] font-light leading-relaxed space-y-3">
                  <p>
                    When creating an account on Samriddhi Gyan, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate suspension or termination of your account.
                  </p>
                  <p>
                    You are solely responsible for safeguarding the credentials associated with your account and for any activities or actions performed under your password. You agree to immediately notify Samriddhi Gyan upon becoming aware of any breach of security or unauthorized use of your account.
                  </p>
                </div>
              </section>

              {/* Course Access & Content */}
              <section id="courses" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <FileText className="w-5 h-5 text-[#a435f0]" />
                  <h2 className="text-2xl font-semibold text-[#2d2f31]">
                    3. Course Access & Content
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-[#2d2f31] font-light leading-relaxed space-y-3">
                  <p>
                    Upon purchasing a course, Samriddhi Gyan grants you a limited, non-exclusive, non-transferable license to access the lecture videos, transcripts, assignments, and reading materials solely for your personal, non-commercial education.
                  </p>
                  <p>
                    You may not distribute, share, download, modify, resell, or publicly display any course materials or lectures without prior written consent from the author or Samriddhi Gyan. Violation of this license may lead to immediate revocation of course access without refund.
                  </p>
                </div>
              </section>

              {/* Payments, Refunds & Billing */}
              <section id="payments" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <DollarSign className="w-5 h-5 text-[#a435f0]" />
                  <h2 className="text-2xl font-semibold text-[#2d2f31]">
                    4. Payments, Refunds & Billing
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-[#2d2f31] font-light leading-relaxed space-y-3">
                  <p>
                    All pricing is listed in USD (or regional equivalent currencies). Students agree to provide accurate payment info (Credit/Debit Card or Google Pay) at checkout. Transactions are processed securely by our global payment gateways.
                  </p>
                  <p>
                    **Refund Policy:** We offer a 30-day money-back guarantee for all courses purchased on our platform. If you are unsatisfied with a course, you may request a refund within 30 days of purchase. Refunds are processed within 5-10 business days.
                  </p>
                </div>
              </section>

              {/* Code of Conduct */}
              <section id="conduct" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <ShieldCheck className="w-5 h-5 text-[#a435f0]" />
                  <h2 className="text-2xl font-semibold text-[#2d2f31]">
                    5. Code of Conduct
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-[#2d2f31] font-light leading-relaxed space-y-3">
                  <p>
                    As a user of Samriddhi Gyan, you agree to maintain academic honesty, integrity, and mutual respect. You are strictly prohibited from:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 font-light">
                    <li>Posting offensive, discriminatory, abusive, or harassing content inside the discussion forums or course reviews.</li>
                    <li>Utilizing our AI Learning Assistant to generate spam, malicious script code, or attempt security exploits on the LMS servers.</li>
                    <li>Attempting to bypass authentication or restrict other users' access to the course lecture players.</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section id="liability" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <AlertCircle className="w-5 h-5 text-[#a435f0]" />
                  <h2 className="text-2xl font-semibold text-[#2d2f31]">
                    6. Limitation of Liability
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-[#2d2f31] font-light leading-relaxed space-y-3">
                  <p>
                    To the maximum extent permitted by law, Samriddhi Gyan LMS and its affiliates, directors, officers, employees, or content contributors shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of or inability to access our online services.
                  </p>
                  <p>
                    We do not guarantee that our platform will always operate error-free or that access will be completely uninterrupted. All services and course materials are provided on an "as is" and "as available" basis.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section id="contact" className="space-y-4 scroll-mt-24">
                <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
                  <HelpCircle className="w-5 h-5 text-[#a435f0]" />
                  <h2 className="text-2xl font-semibold text-[#2d2f31]">
                    7. Contact Information
                  </h2>
                </div>
                <div className="text-sm sm:text-base text-[#2d2f31] font-light leading-relaxed space-y-3">
                  <p>
                    If you have any questions, disputes, or feedback regarding these Terms of Service, please reach out to our legal compliance and student support teams:
                  </p>
                  <div className="bg-slate-50 border border-gray-200 p-4 space-y-1 font-medium text-[#2d2f31]">
                    <p>Samriddhi Gyan LMS Inc.</p>
                    <p>Support Email: legal@samriddhigyan.com</p>
                    <p>Address: Kathmandu, Nepal</p>
                  </div>
                </div>
              </section>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Terms;
