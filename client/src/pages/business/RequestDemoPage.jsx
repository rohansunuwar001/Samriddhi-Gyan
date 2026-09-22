import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { CheckCircle2, Globe } from "lucide-react";
import { FaLinkedinIn, FaFacebookF, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";

export default function RequestDemoPage() {
  const navigate = useNavigate();

  const [email, setEmail]                   = useState("");
  const [firstName, setFirstName]           = useState("");
  const [lastName, setLastName]             = useState("");
  const [companyName, setCompanyName]       = useState("");
  const [phone, setPhone]                   = useState("");
  const [teamSize, setTeamSize]             = useState("21-200");
  const [showExtendedFields, setShowExtendedFields] = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [isSubmitted, setIsSubmitted]       = useState(false);
  const [emailError, setEmailError]         = useState("");

  // ── GSAP refs ──────────────────────────────────────────────────────────────
  const headingRef   = useRef(null);
  const subRef       = useRef(null);
  const subheadRef   = useRef(null);
  const listRef      = useRef(null);
  const trustedRef   = useRef(null);
  const formRef      = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Heading slides up + fades in
    tl.fromTo(
      headingRef.current,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85 }
    )
    // Sub-paragraph
    .fromTo(
      subRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 },
      "-=0.5"
    )
    // "With Samriddhi Gyan..." heading
    .fromTo(
      subheadRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      "-=0.4"
    )
    // List items staggered
    .fromTo(
      listRef.current?.querySelectorAll("li"),
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.12 },
      "-=0.3"
    )
    // Trusted by section
    .fromTo(
      trustedRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      "-=0.2"
    )
    // Form slides in from right
    .fromTo(
      formRef.current,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 },
      "-=1.2"
    );
  }, []);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
    if (e.target.value.includes("@") && !showExtendedFields) {
      setShowExtendedFields(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid work email address.");
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Demo request received! Our enterprise specialist will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-white text-[#1c1d1f] font-sans antialiased flex flex-col justify-between selection:bg-[#5624d0] selection:text-white">

      {/* ── MAIN HERO SECTION ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-8">

            {/* Main Headline */}
            <div>
              <h1
                ref={headingRef}
                className="text-5xl sm:text-6xl lg:text-[54px] font-bold text-[#1c1d1f] tracking-tight leading-[1.1]"
                style={{ opacity: 0 }}
              >
                Get your demo
              </h1>
              <p
                ref={subRef}
                className="text-2xl sm:text-3xl text-[#6a6f73] mt-3 font-light leading-relaxed"
                style={{ opacity: 0 }}
              >
                Tell us your needs and we'll start on a custom plan to drive results.
              </p>
            </div>

            {/* Sub-heading & Checkmark Points */}
            <div className="pt-2 space-y-5">
              <h2
                ref={subheadRef}
                className="text-2xl sm:text-3xl font-semibold text-[#1c1d1f]"
                style={{ opacity: 0 }}
              >
                With Samriddhi Gyan as your learning partner, you can:
              </h2>

              <ul ref={listRef} className="space-y-4">
                {[
                  "Train your entire workforce with 30,000+ courses in 16 languages",
                  "Prep employees for over 200 industry-recognized certification exams",
                  "Develop highly skilled tech teams in risk-free practice environments",
                  "Identify emerging skills gaps, learning trends, and industry benchmarks",
                  "Integrate content with your existing learning management system",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3.5">
                    <span className="text-[#008489] text-2xl font-bold shrink-0 mt-0.5 select-none">✓</span>
                    <span className="text-xl sm:text-[19px] text-[#1c1d1f] leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trusted By */}
            <div ref={trustedRef} className="pt-6 border-t border-gray-200" style={{ opacity: 0 }}>
              <h3 className="text-2xl font-semibold text-[#1c1d1f] mb-6">Trusted by</h3>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-8 sm:gap-12">
                  <span className="font-bold text-3xl tracking-tighter text-gray-800">// Nasdaq</span>
                  <span className="font-extrabold text-3xl uppercase tracking-widest text-gray-800 bg-gray-200 px-3 py-1 rounded-full text-base">MATTEL</span>
                  <span className="font-semibold text-3xl tracking-wider text-gray-800">CISCO</span>
                  <span className="font-serif italic font-semibold text-4xl text-gray-800">Fender</span>
                </div>
                <div className="flex flex-wrap items-center gap-8 sm:gap-12">
                  <div className="text-left leading-tight text-gray-800">
                    <span className="block font-normal text-lg">publicis</span>
                    <span className="block font-semibold text-lg tracking-wide">sapient</span>
                  </div>
                  <span className="font-semibold text-3xl tracking-tight text-gray-800">vimeo</span>
                  <span className="font-bold text-2xl tracking-widest uppercase text-gray-800">SAMSUNG</span>
                  <span className="font-serif font-semibold text-4xl tracking-tight text-gray-800">citi</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Form */}
          <div ref={formRef} className="lg:col-span-5" style={{ opacity: 0 }}>
            <div className="bg-white p-2 sm:p-4 rounded-none">
              {isSubmitted ? (
                <div className="p-8 border border-gray-200 bg-[#f7f9fa] rounded-none text-center space-y-5">
                  <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-4xl font-bold text-[#1c1d1f]">Thank You!</h3>
                  <p className="text-xl text-[#6a6f73] max-w-sm mx-auto">
                    We've received your demo inquiry for <strong className="text-[#1c1d1f]">{email}</strong>. A dedicated Samriddhi Gyan enterprise learning advisor will contact you shortly.
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={() => navigate("/business/plans")}
                      className="w-full bg-[#1c1d1f] hover:bg-black text-white font-semibold h-14 text-xl rounded-none transition-colors"
                    >
                      Explore Business Plans
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="workEmail" className="block text-[15px] font-semibold text-[#1c1d1f] mb-1.5">
                      Work Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="workEmail"
                      type="email"
                      required
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="name@company.com"
                      className="w-full h-14 px-4 bg-white border border-[#1c1d1f] text-xl text-[#1c1d1f] rounded-none focus:outline-none focus:ring-2 focus:ring-[#1c1d1f] transition placeholder:text-gray-400"
                    />
                    {emailError && <p className="text-base text-red-600 mt-1 font-normal">{emailError}</p>}
                  </div>

                  {showExtendedFields && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#1c1d1f] mb-1">First Name</label>
                          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"
                            className="w-full h-12 px-3.5 bg-white border border-gray-400 text-lg text-[#1c1d1f] rounded-none focus:outline-none focus:border-[#1c1d1f]" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#1c1d1f] mb-1">Last Name</label>
                          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"
                            className="w-full h-12 px-3.5 bg-white border border-gray-400 text-lg text-[#1c1d1f] rounded-none focus:outline-none focus:border-[#1c1d1f]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#1c1d1f] mb-1">Company Name</label>
                          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Corp"
                            className="w-full h-12 px-3.5 bg-white border border-gray-400 text-lg text-[#1c1d1f] rounded-none focus:outline-none focus:border-[#1c1d1f]" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#1c1d1f] mb-1">Company Size</label>
                          <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
                            className="w-full h-12 px-3.5 bg-white border border-gray-400 text-lg text-[#1c1d1f] rounded-none focus:outline-none focus:border-[#1c1d1f] cursor-pointer">
                            <option value="1-20">1 - 20 learners</option>
                            <option value="21-200">21 - 200 learners</option>
                            <option value="201-1000">201 - 1,000 learners</option>
                            <option value="1000+">1,000+ learners</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-[#1c1d1f] mb-1">Phone Number</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                          className="w-full h-12 px-3.5 bg-white border border-gray-400 text-lg text-[#1c1d1f] rounded-none focus:outline-none focus:border-[#1c1d1f]" />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#1c1d1f] hover:bg-black active:bg-gray-900 text-white font-semibold h-14 text-xl rounded-none transition-colors duration-150 flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                    <p className="text-sm text-[#6a6f73] text-left mt-3 leading-relaxed">
                      By signing up, you agree to our{" "}
                      <Link to="/terms" className="underline hover:text-[#1c1d1f]">Terms of Use</Link>{" "}
                      and{" "}
                      <Link to="/terms" className="underline hover:text-[#1c1d1f]">Privacy Policy</Link>.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
