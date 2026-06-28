// src/components/ui/skeletons.jsx
//
// All your section skeletons in one file.
// Built on top of your existing shadcn Skeleton component.
// Import only what you need in each page.

import { Skeleton } from "@/components/ui/skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// COURSE CARD SKELETON
// Use inside CourseMain and RecommendedCourse while courses are loading
// ─────────────────────────────────────────────────────────────────────────────
export const CourseCardSkeleton = () => (
  <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
    <Skeleton className="w-full h-44 rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-16 mt-1" />
    </div>
  </div>
);

// Grid of N course cards
export const CourseGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CourseCardSkeleton key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COURSE DETAIL PAGE SKELETON
// Use in CourseDetailPage while the course data is loading
// ─────────────────────────────────────────────────────────────────────────────
export const CourseDetailSkeleton = () => (
  <div className="bg-white">

    {/* Dark header */}
    <div className="bg-slate-800 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-3 w-48 bg-slate-600" />
        <Skeleton className="h-8 w-3/4 bg-slate-600" />
        <Skeleton className="h-8 w-1/2 bg-slate-600" />
        <Skeleton className="h-4 w-2/3 bg-slate-700" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-3 w-20 bg-slate-700" />
          <Skeleton className="h-3 w-24 bg-slate-700" />
          <Skeleton className="h-3 w-16 bg-slate-700" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-8 w-8 rounded-full bg-slate-600" />
          <Skeleton className="h-3 w-32 bg-slate-600" />
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:flex lg:flex-row-reverse lg:gap-8">

        {/* Purchase card */}
        <div className="lg:w-1/3 w-full mb-8 lg:mb-0">
          <div className="rounded-xl border border-slate-100 shadow-lg overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-3 w-32 mx-auto" />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:w-2/3 w-full space-y-8">

          {/* What you'll learn */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="border rounded-lg p-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-sm flex-shrink-0" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Course includes */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Course content */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3 w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>

          {/* Instructor */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COURSE PROGRESS / PLAYER SKELETON
// Use in the course content/player page while loading
// ─────────────────────────────────────────────────────────────────────────────
export const CourseProgressSkeleton = () => (
  <div className="flex h-screen overflow-hidden">
    {/* Sidebar */}
    <div className="w-80 border-r bg-slate-50 p-4 space-y-4 hidden lg:block flex-shrink-0">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
    {/* Video area */}
    <div className="flex-1 flex flex-col overflow-hidden">
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE SKELETON
// ─────────────────────────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
    <div className="flex items-center gap-6">
      <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
      <div className="space-y-3 flex-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
    <Skeleton className="h-10 w-32 rounded-lg" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MY LEARNING PAGE SKELETON
// For the enrolled courses list page
// ─────────────────────────────────────────────────────────────────────────────
export const MyLearningSkeleton = ({ count = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border rounded-xl">
        <Skeleton className="h-24 w-40 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);
