import { useLayoutEffect, useRef } from 'react';

// --- GSAP Animation Imports ---
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// --- Your Page Components ---
import DynamicContentHeader from '@/components/common/DynamicContentHeader';
import AboutCarousel from './AboutCourasel';
import CtaSection from './CtaSection';
import ImpactSection from './ImpactSection';
import InfoSection from './InfoSection';
import WelcomeHero from './WelcomeHero';

// --- Register the GSAP Plugin ---
// This is a crucial step to make ScrollTrigger work.
gsap.registerPlugin(ScrollTrigger);


const About = () => {
  // Data for your child components (unchanged)
  const newTitle = "Start Your Creative Journey";
  const newDescription = "Explore thousands of classes in design, photography, and more. Get inspired and start creating today with our expert-led online courses.";
  const projectStats = {
    title: "Our Project's Global Reach",
    description: "A summary of our achievements and the community we've built since launching last year.",
    metrics: [
      { value: '500K+', label: 'Active Users' },
      { value: '1.2K', label: 'Contributors' },
      { value: '2M+', label: 'Downloads' },
      { value: '4.9/5', label: 'User Rating' },
      { value: '15', label: 'Countries' },
      { value: '24/7', label: 'Support' },
    ],
  };

  // --- Refs for Animation ---
  const mainRef = useRef(null); // A ref for the main container to scope our animations

  // --- GSAP Animation Logic ---
  // useLayoutEffect is preferred over useEffect for animations to prevent flashes of unstyled content
  useLayoutEffect(() => {
    // gsap.context() is the modern way to set up and clean up animations in React
    const ctx = gsap.context(() => {
      
      // Select all elements with the class 'animate-section'
      const sections = gsap.utils.toArray('.animate-section');

      // Loop over each section and create a scroll-triggered animation for it
      sections.forEach(section => {
        gsap.from(section, {
          opacity: 0,       // Start with the section being invisible
          y: 75,            // Start 75px below its final position
          duration: 1,      // Animation should last 1 second
          ease: 'power3.out', // A nice easing function for a smooth effect
          scrollTrigger: {
            trigger: section,    // The animation starts when this element enters the viewport
            start: 'top 80%',    // Trigger when the top of the section is 80% down the viewport
            toggleActions: 'play none none none', // Play the animation once and don't reverse it
          },
        });
      });

    }, mainRef); // Scope the animations to the main container

    // Cleanup function - this will be called when the component unmounts
    return () => ctx.revert();

  }, []); // The empty dependency array ensures this runs only once on mount

  return (
    // Add the ref to the main container and an initial background color
    <div ref={mainRef} className='bg-white'>
      {/* WelcomeHero is usually "above the fold" (visible on load), so we don't animate it */}
      <WelcomeHero />

      {/* --- Wrap each section you want to animate in a div with the target class --- */}
      <div className="animate-section">
        <DynamicContentHeader title={newTitle} description={newDescription} />
      </div>

      <div className="bg-gray-100 flex items-center justify-center animate-section">
        <AboutCarousel />
      </div>

      <div className="animate-section">
        <ImpactSection 
          title={projectStats.title}
          description={projectStats.description}
          stats={projectStats.metrics} 
        />
      </div>
      
      <div className="animate-section">
        <CtaSection 
          description="We help organizations of all types and sizes prepare for the path ahead — wherever it leads. Our curated collection of business and technical courses help companies, governments, and nonprofits go further by placing learning at the center of their strategies."
          buttonText="Learn more"
          buttonHref="/blog" 
        />
      </div>

      <div className="animate-section">
        <InfoSection />
      </div>
    </div>
  )
}

export default About;