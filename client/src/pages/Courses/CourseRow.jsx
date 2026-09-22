// src/components/Courses/CourseRow.jsx
// eslint-disable-next-line no-unused-vars
import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseCard from "../student/CourseCard";
 // Adjust this path to match your actual Course Card component

const CourseRow = ({ heading, subheading, courses, sectionTag, actionLabel, onActionClick }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to dynamically show/hide navigation arrows
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 5);
      // Give a tiny pixel buffer for rounding errors on high-DPI screens
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollPosition);
      }
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [courses]);

  // Handle manual clicking of the arrows
  const handleScroll = (direction) => {
  const container = scrollContainerRef.current;
  if (container) {
    // 1. Find the very first course card in the row
    const firstItem = container.querySelector(":scope > *");
    
    if (firstItem) {
      // 2. Get the card's exact width (including padding/borders)
      const itemWidth = firstItem.offsetWidth;
      
      // 3. Grab the spacing gap between cards (defaults to 24px if gap-6 is used)
      const gap = parseInt(window.getComputedStyle(container).gap) || 24;
      
      // 4. Scroll by exactly one card unit
      const scrollAmount = itemWidth + gap;

      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    } else {
      // Fallback if no children exist yet
      const fallbackAmount = 280; 
      container.scrollBy({
        left: direction === "left" ? -fallbackAmount : fallbackAmount,
        behavior: "smooth",
      });
    }
  }
};

  return (
    <div className="mb-12 relative group/row">
      {/* Header section with optional tags or action buttons */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">{heading}</h2>
            {sectionTag && (
              <span className="bg-violet-100 text-violet-800 text-sm font-medium px-2.5 py-0.5 rounded">
                {sectionTag}
              </span>
            )}
          </div>
          {subheading && <p className="text-base text-gray-500 mt-1">{subheading}</p>}
        </div>
        
        {actionLabel && onActionClick && (
          <Button variant="ghost" size="sm" onClick={onActionClick} className="text-violet-600 hover:text-violet-700">
            {actionLabel}
          </Button>
        )}
      </div>

      {/* Carousel Wrapper */}
      <div className="relative mx-[-16px] px-[16px]">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <div className="absolute -left-14 top-1/2 -translate-y-1/2 z-10 hidden group-hover/row:block transition-all">
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg border border-gray-200 opacity-90 hover:opacity-100"
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </Button>
          </div>
        )}

        {/* Right Arrow Button */}
        {showRightArrow && (
          <div className="absolute -right-14 top-1/2 -translate-y-1/2 z-10 hidden group-hover/row:block transition-all">
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg border border-gray-200 opacity-90 hover:opacity-100"
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </Button>
          </div>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {courses.map((course) => (
            <div key={course._id} className="flex-shrink-0 w-64 snap-start">
              {/* Substitute this with your actual individual item component */}
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

CourseRow.propTypes = {
  heading: PropTypes.node.isRequired,
  subheading: PropTypes.string,
  courses: PropTypes.array.isRequired,
  sectionTag: PropTypes.string,
  actionLabel: PropTypes.string,
  onActionClick: PropTypes.func,
};

export default CourseRow;