import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const MyCoursesLayout = () => {
  const tabs = [
    { path: "/home/my-courses/learning", label: "All courses" },
    { path: "/home/my-courses/lists", label: "My Lists" },
    { path: "/home/my-courses/wishlist", label: "Wishlist" },
    { path: "/home/my-courses/certifications", label: "Certifications" },
    { path: "/home/my-courses/archived", label: "Archived" },
    { path: "/home/my-courses/learning-tools", label: "Learning tools" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col select-none text-[#2d2f31]">
      {/* ── Dark Header block ── */}
      <header className="bg-[#1c1d1f] text-white shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-0">
          <h1 className="text-4xl font-normal leading-tight mb-6">
            My learning
          </h1>

          {/* Navigation link tabs */}
          <nav className="flex space-x-6 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `py-3 px-1 border-b-4 text-sm sm:text-base font-normal transition-all whitespace-nowrap ${
                    isActive
                      ? "border-white text-white"
                      : "border-transparent text-white/60 hover:text-white"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Render selected child route */}
      <main className="max-w-7xl w-full mx-auto px-6 md:px-12 py-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MyCoursesLayout;
