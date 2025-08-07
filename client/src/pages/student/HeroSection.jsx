"use client";

import { useCallback } from "react";
// Import Embla Carousel and its autoplay plugin
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Import your slide data
// Make sure the image paths are correct in this file
// /app/components/HeroData.js (or define it directly in your component)

export const slides = [
  {
    image: "/HeroImg.png", // Replace with your image path
    title: "Knowledge at your fingertips",
    description: "Learn from real-world experts from around the globe. Get courses from Rs 1000 through August 6.",
  },
  {
    image: "/HeroImg.png", // Replace with your second image path
    title: "Unlock Your Potential Today",
    description: "Explore thousands of hands-on creative classes. New courses are added every week.",
  },
  {
    image: "/HeroImg.png", // Replace with your third image path
    title: "Skills for Your Future",
    description: "Advance your career with new skills in data science, web development, and much more.",
  },
];

const HeroSection = () => {
  // Initialize the carousel with the autoplay plugin
  // The autoplay plugin will automatically slide every 4 seconds
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true }, // Loop the carousel
    [Autoplay({ delay: 4000, stopOnInteraction: false })] // Autoplay plugin
  );

  // Functions to control the carousel with our custom buttons
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="relative bg-white py-16 overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Embla Carousel container */}
        <div className="overflow-hidden relative rounded-lg" ref={emblaRef}>
          {/* Embla slides container */}
          <div className="flex">
            {/* Map through the slides data to create each slide */}
            {slides.map((slide, index) => (
              <div
                className="relative flex-[0_0_100%] min-h-[500px] flex items-center bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
                key={index}
              >
                {/* Text box on left for each slide */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-sm shadow-lg text-left ml-12">
                  <h2 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-lg text-gray-700">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left and Right Navigation Buttons */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-between items-center transform -translate-y-1/2 px-10">
            {/* Left Button */}
            <button
                onClick={scrollPrev}
                className="bg-white/80 hover:bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-md transition"
                aria-label="Previous slide"
            >
                <FiChevronLeft className="w-6 h-6" />
            </button>
            {/* Right Button */}
            <button
                onClick={scrollNext}
                className="bg-white/80 hover:bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center shadow-md transition"
                aria-label="Next slide"
            >
                <FiChevronRight className="w-6 h-6" />
            </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;