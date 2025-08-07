
import { useLayoutEffect, useRef } from 'react';

// --- GSAP Animation Imports ---
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// --- Your Page Section Components ---
import ContactHero from "./ContactHero";
import HowWeStartedSection from "./HowWeStartedSection";
import OriginsSection from "./OriginsSection";

// --- Register the GSAP Plugin ---
// This is essential for ScrollTrigger to work.
gsap.registerPlugin(ScrollTrigger);


// Renamed from 'page' to 'ContactPage' for better readability and best practices
const ContactPage = () => {
  // Data for the OriginsSection component (unchanged)
  const originsData = {
    title: "Our origins",
    paragraphs: [
      "Growing up in a small Turkish village, Udemy founder Eren Bali had few educational opportunities — until he got a computer. Fueled by his dream to compete in mathematics, he used the internet to learn his way to a silver medal in the International Math Olympiad.",
      "After learning online changed his life, Eren partnered with co-founders Oktay Caglar and Gagan Biyani to achieve a common goal: to make quality education accessible to all."
    ]
  };

  // --- Refs for Animation Scoping ---
  const componentRef = useRef(null);

  // --- GSAP Animation Logic ---
  useLayoutEffect(() => {
    // Use GSAP's context for proper setup and cleanup in React
    const ctx = gsap.context(() => {

      // Target all direct children of the main container that we want to animate
      const sections = gsap.utils.toArray('.animate-section');

      // Create a staggered fade-in and slide-up animation for each section
      gsap.from(sections, {
        opacity: 0,
        y: 100,
        ease: 'power3.out',
        duration: 1.2,
        stagger: 0.3, // Add a 0.3-second delay between each section's animation
        scrollTrigger: {
          trigger: componentRef.current,
          start: 'top 70%', // Start the staggered animation when the container is 70% down the viewport
          end: 'bottom top',
          toggleActions: 'play none none none',
        }
      });

    }, componentRef); // Scope the animations to the componentRef

    // Cleanup function to revert all animations when the component unmounts
    return () => ctx.revert();
  }, []);


  return (
    // Add the ref to the main container
    <div ref={componentRef}>
      {/* We add the 'animate-section' class to each component we want to reveal on scroll */}
      <div className="animate-section">
        <ContactHero />
      </div>

      <div className="animate-section">
        <OriginsSection data={originsData} />
      </div>

      <div className="animate-section">
        <HowWeStartedSection />
      </div>
    </div>
  );
};

export default ContactPage;