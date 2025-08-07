import { gsap } from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { Link, useRouteError } from 'react-router-dom';

// This is the self-contained, animated error page component.
export default function AnimatedErrorPage() {
  const error = useRouteError();
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    // GSAP Context for safe animation cleanup in React's StrictMode
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      const errorStatusCode = error.status || 500;
      const statusCodeElement = containerRef.current.querySelector('.status-code');

      // Animate a proxy object for a smooth number scroll effect
      let counter = { value: 0 };
      tl.to(counter, {
        value: errorStatusCode,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          statusCodeElement.textContent = Math.round(counter.value);
        },
      }, "start");

      // Staggered reveal for the text elements
      tl.from(".reveal-text", {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: 'power3.out',
      }, "start+=0.5");

      // Button animation
      tl.from(".home-link-btn", {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: 'back.out(1.7)',
      }, "start+=1.2");

    }, containerRef);

    // Cleanup function
    return () => ctx.revert();

  }, [error]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden text-center text-white bg-gray-900 font-sans"
    >
      <h1 className="status-code text-9xl md:text-[200px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-cyan-400">
        0
      </h1>

      <div className="mt-4 reveal-text">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {error.statusText || 'An Error Occurred'}
        </h2>
      </div>

      <div className="mt-6 text-lg leading-8 text-gray-300 reveal-text">
        <p>{error.data || "Something went wrong on our end."}</p>
      </div>

      <div className="mt-10 home-link-btn">
        <Link
          to="/"
          className="inline-block px-8 py-4 text-lg font-semibold text-white transition-all duration-300 rounded-lg shadow-lg bg-purple-600/80 hover:bg-purple-700/80 hover:scale-105 backdrop-blur-sm ring-1 ring-white/20"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}