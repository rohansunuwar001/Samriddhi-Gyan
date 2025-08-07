import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// --- UI Components & Icons ---
import { Search, CreditCard, MonitorPlay, BarChart2, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

// --- GSAP Plugin Registration ---
// We must register the ScrollTrigger plugin to use it
gsap.registerPlugin(ScrollTrigger);

// --- Data for the steps (unchanged) ---
const steps = [
    { icon: <Search className="h-8 w-8" />, title: "Find Your Course", description: "Browse our catalog or get personalized recommendations based on your interests and skill level.", color: "text-blue-500", bgColor: "bg-blue-500" },
    { icon: <CreditCard className="h-8 w-8" />, title: "Enroll & Pay Securely", description: "Complete your enrollment with our safe payment system. Start learning immediately after payment.", color: "text-green-500", bgColor: "bg-green-500" },
    { icon: <MonitorPlay className="h-8 w-8" />, title: "Start Learning", description: "Access video lessons, downloadable resources, and interactive content at your own pace.", color: "text-purple-500", bgColor: "bg-purple-500" },
    { icon: <BarChart2 className="h-8 w-8" />, title: "Track Progress", description: "Monitor your advancement through courses with visual dashboards and completion metrics.", color: "text-orange-500", bgColor: "bg-orange-500" },
    { icon: <Sparkles className="h-8 w-8" />, title: "Get Recommendations", description: "Receive personalized course suggestions based on your learning patterns and completed content.", color: "text-pink-500", bgColor: "bg-pink-500" }
];

const HowItWorks = () => {
  const componentRef = useRef(null);
  const timelineRef = useRef(null);

  // useLayoutEffect is preferred for animations to prevent flashes of unstyled content
  useLayoutEffect(() => {
    // gsap.context() is the modern way to scope animations and handle cleanup automatically.
    const ctx = gsap.context(() => {
        
        // --- Animate the Timeline "Drawing" ---
        gsap.to(timelineRef.current, {
            scaleY: 1, // Animate the height (scaleY) from 0 (in CSS) to 1
            scrollTrigger: {
                trigger: componentRef.current,
                start: 'top 40%',
                end: 'bottom 80%',
                scrub: 1, // Smoothly animates as you scroll
            },
            ease: 'none'
        });

        // --- Animate each step card as it enters the viewport ---
        const stepCards = gsap.utils.toArray('.step-card');
        stepCards.forEach((card) => {
            gsap.fromTo(card,
                { y: 100, opacity: 0 }, // Starting state
                { // Ending state
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%', // Start animation when the top of the card is 85% down the viewport
                        toggleActions: 'play none none none', // Play the animation once and don't reverse
                    }
                }
            );
        });

    }, componentRef); // Scope the context to our main component

    // Cleanup function to revert all animations when the component unmounts
    return () => ctx.revert(); 
  }, []);

  return (
    <section ref={componentRef} className="py-20 sm:py-24 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white font-serif">
            Start Learning in Minutes
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300 mx-auto">
            Our simple process gets you from signup to skills in just a few steps.
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Background progress line */}
          <div className="absolute left-8 top-0 h-full w-1 bg-gray-200 dark:bg-gray-700"></div>
          {/* Animated "drawing" progress line */}
          <div 
            ref={timelineRef} 
            className="absolute left-8 top-0 h-full w-1 bg-indigo-500 origin-top" 
            style={{ scaleY: 0 }} // Initial state for GSAP to animate from
          ></div>
          
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="step-card relative flex items-start gap-6" // Added a class for GSAP to target
              >
                {/* Step number icon */}
                <div className={`flex-shrink-0 relative z-10 flex items-center justify-center h-16 w-16 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 ${step.color}`}>
                  <span className="text-2xl font-bold">{index + 1}</span>
                </div>

                {/* Step content card */}
                <motion.div
                  className="w-full"
                  // Framer Motion hover animation
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card className="shadow-lg border-l-4 h-full" style={{ borderColor: `var(--color-${step.color.split('-')[1]})` }}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className={`p-3 rounded-lg ${step.bgColor} bg-opacity-10 dark:bg-opacity-20`}>
                        {React.cloneElement(step.icon, { className: `h-8 w-8 ${step.color}` })}
                      </div>
                      <CardTitle className="text-xl text-gray-800 dark:text-white">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-24 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to begin your journey?</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">There`s no better time to start than now.</p>
            <Link to="/courses" className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-md hover:bg-indigo-700 transition-colors">
              Browse Available Courses
              </Link>
{/* 
          <Button size="lg" className="mt-6 mx-auto group">
            Browse Available Courses
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button> */}
        </div>
      </div>
       {/* Helper for Card border colors */}
      <style>{`
        :root {
            --color-blue: #3b82f6;
            --color-green: #22c55e;
            --color-purple: #8b5cf6;
            --color-orange: #f97316;
            --color-pink: #ec4899;
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;