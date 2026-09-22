import React, { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGetCompanyLogosQuery } from "@/features/api/cmsApi";

gsap.registerPlugin(ScrollTrigger);

const TrustedBySection = () => {
  const { data: logosData } = useGetCompanyLogosQuery({ active: "true" });
  const sectionRef = useRef(null);

  const defaultLogos = [
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/3E0eIh3tWHNWADiHNBmW4j/3444d1a4d029f283aa7d10ccf982421e/volkswagen_logo.svg", name: "Volkswagen logo" },
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/2pNyDO0KV1eHXk51HtaAAz/090fac96127d62e784df31e93735f76a/samsung_logo.svg", name: "Samsung logo" },
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/3YzfvEjCAUi3bKHLW2h1h8/ec478fa1ed75f6090a7ecc9a083d80af/cisco_logo.svg", name: "Cisco logo" },
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/23XnhdqwGCYUhfgIJzj3PM/77259d1ac2a7d771c4444e032ee40d9e/vimeo_logo_resized-2.svg", name: "Vimeo logo" },
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/1UUVZtTGuvw23MwEnDPUr3/2683579ac045486a0aff67ce8a5eb240/procter_gamble_logo.svg", name: "Procter & Gamble logo" },
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/1GoAicYDYxxRPGnCpg93gi/a8b6190cc1a24e21d6226200ca488eb8/hewlett_packard_enterprise_logo.svg", name: "Hewlett Packard Enterprise logo" },
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/2tQm6aYrWQzlKBQ95W00G/c7aaf002814c2cde71d411926eceaefa/citi_logo.svg", name: "Citi logo" },
    { image: "https://cms-images.udemycdn.com/96883mtakkm8/7guDRVYa2DZD0wD1SyxREP/b704dfe6b0ffb3b26253ec36b4aab505/ericsson_logo.svg", name: "Ericsson logo" },
  ];

  const logos = logosData?.logos?.length > 0 ? logosData.logos : defaultLogos;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // ── 1. Heading kinetic char reveal (keep y) ──────────────────────────
      const headingEl = sectionRef.current?.querySelector(".trusted-split-heading");
      if (headingEl) {
        const chars = headingEl.querySelectorAll(".trusted-split-char");
        if (chars.length > 0) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: "90%", rotateZ: 1.5 },
            {
              opacity: 1,
              y: "0%",
              rotateZ: 0,
              duration: 0.45,
              stagger: 0.009,
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

      // Logo items stagger in
      gsap.from(".trusted-logo-item", {
        opacity: 0,
        y: 20,
        scale: 0.85,
        duration: 0.5,
        stagger: 0.07,
        ease: "back.out(1.4)",
        scrollTrigger: {
          trigger: ".trusted-logos-row",
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [logos.length]);

  return (
    <section ref={sectionRef} className="bg-white font-sans py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="trusted-split-heading text-center text-2xl text-gray-600 mb-12">
          {"Trusted by over 16,000 companies and millions of learners around the world".split(" ").map((word, wIdx) => (
            <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.26em] last:mr-0 align-top">
              {word.split("").map((char, cIdx) => (
                <span key={cIdx} className="inline-block overflow-hidden align-top">
                  <span className="trusted-split-char inline-block will-change-transform">{char}</span>
                </span>
              ))}
            </span>
          ))}
        </h2>

        <div className="trusted-logos-row flex justify-center items-center flex-wrap gap-x-10 gap-y-8 md:gap-x-16">
          {logos.map((logo, idx) => (
            <div key={logo._id || idx} className="trusted-logo-item relative h-8 w-28 sm:h-10 sm:w-32">
              <img
                src={logo.image}
                alt={logo.name}
                className="h-full w-full object-contain filter grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;