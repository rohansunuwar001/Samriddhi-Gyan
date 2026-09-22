// File Path: app/components/LearningGoalsSection.js
import PropTypes from "prop-types";

import { useState, useRef, useLayoutEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import { PiCertificateBold, PiChartBarBold, PiCodepenLogoBold, PiShareNetworkBold } from "react-icons/pi";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    id: "training",
    icon: <PiCodepenLogoBold />,
    title: "Hands-on training",
    description: "Upskill effectively with AI-powered coding exercises, practice tests, and quizzes.",
    cta: { text: "Explore features", href: "#" },
    tag: null,
  },
  {
    id: "certification",
    icon: <PiCertificateBold />,
    title: "Certification prep",
    description:
      "Prep for industry-recognized certifications by solving real-world challenges and earn badges along the way.",
    cta: { text: "Explore courses", href: "#" },
    tag: null,
  },
  {
    id: "analytics",
    icon: <PiChartBarBold />,
    title: "Insights and analytics",
    description:
      "Fast-track goals with advanced insights plus a dedicated customer success team to help drive effective learning.",
    cta: { text: "Find out more", href: "#" },
    tag: "Enterprise Plan",
  },
  {
    id: "customizable",
    icon: <PiShareNetworkBold />,
    title: "Customizable content",
    description:
      "Create tailored learning paths for team and organization goals and even host your own content and resources.",
    cta: { text: "Find out more", href: "#" },
    tag: "Enterprise Plan",
  },
];

const LearningGoalsSection = () => {
  const [activeFeatureId, setActiveFeatureId] = useState(features[0].id);
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // ── 1. Heading kinetic char-by-char reveal (keep y) ─────────────────
      const headingEl = sectionRef.current?.querySelector(".lg-split-heading");
      if (headingEl) {
        const chars = headingEl.querySelectorAll(".lg-split-char");
        if (chars.length > 0) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: "90%", rotateZ: 1.5 },
            {
              opacity: 1,
              y: "0%",
              rotateZ: 0,
              duration: 0.5,
              stagger: 0.012,
              ease: "power3.out",
              scrollTrigger: {
                trigger: headingEl,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      }

      // ── 2. Each card gets its OWN ScrollTrigger ──────────────────────────
      // This makes cards animate one-by-one as they enter the viewport
      // and reverse individually when scrolling back up.
      const cards = sectionRef.current?.querySelectorAll(".lg-feature-card");
      cards?.forEach((card, i) => {
        // Card wrapper – slides in from left with slight vertical lift
        gsap.fromTo(
          card,
          {
            opacity: 0,
            x: -55,
            y: 10,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              end: "top 40%",
              toggleActions: "play none none reverse",
            },
          }
        );

        // Icon pops in with scale bounce after card
        const icon = card.querySelector(".lg-card-icon");
        if (icon) {
          gsap.fromTo(
            icon,
            { opacity: 0, scale: 0.5, rotate: -15 },
            {
              opacity: 1,
              scale: 1,
              rotate: 0,
              duration: 0.5,
              delay: 0.1 + i * 0.04,
              ease: "back.out(1.8)",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // Title slides up
        const title = card.querySelector(".lg-card-title");
        if (title) {
          gsap.fromTo(
            title,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: 0.15 + i * 0.04,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // Description fades in slightly after title
        const desc = card.querySelector(".lg-card-desc");
        if (desc) {
          gsap.fromTo(
            desc,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: 0.22 + i * 0.04,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }

        // CTA link slides in from left last
        const cta = card.querySelector(".lg-card-cta");
        if (cta) {
          gsap.fromTo(
            cta,
            { opacity: 0, x: -12 },
            {
              opacity: 1,
              x: 0,
              duration: 0.45,
              delay: 0.3 + i * 0.04,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        }
      });

      // ── 3. Right panel image slides in from right with scale ─────────────
      gsap.fromTo(
        ".lg-preview-image",
        { opacity: 0, x: 60, scale: 0.95 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".lg-preview-panel",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const FeatureCard = ({ feature, isActive, onClick }) => {
    const { icon, title, description, cta, tag } = feature;
    const activeClasses = isActive ? "border-purple-600 shadow-lg" : "border-gray-200";

    return (
      <button
        onClick={onClick}
        className={`lg-feature-card w-full text-left bg-white rounded-lg p-6 border-2 transition-all duration-300 ${activeClasses}`}
      >
        <div className="flex items-start gap-5">
          <div className="lg-card-icon text-4xl text-gray-800 mt-1 shrink-0">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="lg-card-title font-light text-gray-900">{title}</h3>
              {tag && (
                <span className="text-base font-light text-gray-700 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded">
                  {tag}
                </span>
              )}
            </div>
            <p className="lg-card-desc text-gray-600 text-lg mb-4">{description}</p>
            <a
              href={cta.href}
              className="lg-card-cta font-light text-purple-600 hover:text-purple-800 flex items-center gap-2 text-lg"
            >
              <span>{cta.text}</span>
              <FaArrowRight size={12} />
            </a>
          </div>
        </div>
      </button>
    );
  };

  return (
    <section ref={sectionRef} className="bg-white font-sans py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="lg-split-heading text-5xl sm:text-6xl text-center font-serif text-gray-900 mb-12">
          {"Learning focused on your goals".split(" ").map((word, wIdx) => (
            <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.26em] last:mr-0 align-top">
              {word.split("").map((char, cIdx) => (
                <span key={cIdx} className="inline-block overflow-hidden align-top">
                  <span className="lg-split-char inline-block will-change-transform">{char}</span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="lg-feature-cards space-y-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isActive={activeFeatureId === feature.id}
                onClick={() => setActiveFeatureId(feature.id)}
              />
            ))}
          </div>

          <div className="lg-preview-panel relative mt-4 lg:mt-0">
            <img
              src="/rightside.webp"
              alt="An example of a learning assessment showing a score and question details."
              width={800}
              height={750}
              className="lg-preview-image rounded-xl shadow-2xl ring-1 ring-gray-900/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

LearningGoalsSection.propTypes = {
  feature: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    cta: PropTypes.shape({
      text: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }).isRequired,
    tag: PropTypes.string,
  }),
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
};

export default LearningGoalsSection;