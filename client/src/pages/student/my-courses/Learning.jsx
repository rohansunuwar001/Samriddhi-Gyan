import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetMyLearningCoursesQuery } from "@/features/api/authApi";
import { useGetUserRemindersQuery } from "@/features/api/reminderApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Info, Clock, Loader2, BookOpen, X } from "lucide-react";
import MyLearningCourseCard from "./MyLearningCourseCard";
import ReminderWizardModal from "../../../components/ReminderWizardModal";

const Learning = () => {
  const navigate = useNavigate();
  const { data: coursesData, isLoading: coursesLoading, isError } = useGetMyLearningCoursesQuery();
  const { data: remindersData } = useGetUserRemindersQuery();
  
  const [showScheduler, setShowScheduler] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isStreakInfoOpen, setIsStreakInfoOpen] = useState(false);

  const myLearningCourses = coursesData?.courses || [];
  const reminders = remindersData?.reminders || [];
  const hasReminders = reminders.length > 0;

  // Hide scheduler card if active reminders exist
  const displayScheduler = showScheduler && !hasReminders;

  if (isError) {
    return <ErrorState />;
  }

  const handleSaveSuccess = () => {
    navigate("/home/my-courses/learning-tools");
  };

  return (
    <div className="space-y-6">
      {/* Start a weekly streak widget card */}
      <div className="border border-[#d1d7dc] bg-white p-6 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-normal text-[#2d2f31]">
            Start a weekly streak
          </h3>
          <p className="text-base text-[#6a6f73] font-normal leading-relaxed">
            Let's chip away at your learning goals.
          </p>
        </div>

        <div className="flex items-center gap-8 shrink-0 flex-wrap">
          {/* Flame indicator */}
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <Flame className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="text-base font-normal leading-none">0 weeks</p>
              <p className="text-[10px] text-[#6a6f73] font-normal mt-0.5">Current streak</p>
            </div>
          </div>

          {/* Progress target circle */}
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10 flex items-center justify-center shrink-0">
              <svg className="h-10 w-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#e4e8eb"
                  strokeWidth="3.5"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#1f7a54"
                  strokeWidth="3.5"
                  strokeDasharray={100}
                  strokeDashoffset={100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute h-2.5 w-2.5 rounded-full bg-[#1f7a54]" />
            </div>
            
            <div className="text-[10px] leading-relaxed text-[#2d2f31] font-normal">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span><strong>0/30</strong> course min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#1f7a54]" />
                <span><strong>3/1</strong> visit</span>
              </div>
              <div className="flex items-center gap-1 text-[#6a6f73] pt-0.5 font-normal">
                <span>Jun 28 - Jul 4</span>
                <Info
                  className="h-3 w-3 cursor-pointer hover:text-[#6d28d2] transition-colors"
                  onClick={() => setIsStreakInfoOpen(true)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule learning time scheduler widget */}
      {displayScheduler && (
        <div className="border border-[#d1d7dc] bg-white p-6 rounded-none flex items-start gap-4 shadow-sm relative animate-in fade-in">
          <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 shrink-0 mt-0.5">
            <Clock className="h-5 w-5" />
          </div>
          <div className="space-y-3.5 pr-6">
            <div className="space-y-1">
              <h3 className="text-base font-normal text-[#2d2f31]">
                Schedule learning time
              </h3>
              <p className="text-base text-[#6a6f73] leading-relaxed font-normal">
                Learning a little each day adds up. Research shows that students who make learning a habit are more likely to reach their goals. Set time aside to learn and get reminders using your learning scheduler.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsWizardOpen(true)}
                className="border border-[#6d28d2] text-[#6d28d2] bg-white hover:bg-[#f5eeff] hover:border-[#892de1] hover:text-[#892de1] px-5 py-2.5 text-sm font-normal transition-all"
              >
                Get started
              </button>
              <button
                onClick={() => setShowScheduler(false)}
                className="text-[#2d2f31] hover:text-black font-normal text-base px-2 py-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Courses Grid feed */}
      {coursesLoading ? (
        <MyLearningSkeleton />
      ) : myLearningCourses.length === 0 ? (
        <EmptyLearningState navigate={navigate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {myLearningCourses.map((course) => (
            <MyLearningCourseCard key={course._id} course={course} isArchived={false} />
          ))}
        </div>
      )}

      {/* 3-Step Reminder Setup Wizard Modal */}
      <ReminderWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        reminderToEdit={null}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* About Streaks Modal */}
      {isStreakInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setIsStreakInfoOpen(false)}
        >
          <div
            className="relative bg-white rounded-none shadow-2xl w-full max-w-sm mx-4 p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setIsStreakInfoOpen(false)}
              className="absolute top-4 right-4 text-[#6a6f73] hover:text-[#2d2f31] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title */}
            <h2 className="text-xl font-normal text-[#2d2f31] mb-2">About streaks</h2>
            <p className="text-base text-[#6a6f73] leading-relaxed mb-5">
              Complete both your visit and minutes watched rings to maintain your weekly streak.
            </p>

            {/* Watch ring */}
            <div className="flex items-start gap-3 mb-3">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-amber-500" />
              <div>
                <p className="text-base font-normal text-[#2d2f31]">To complete the watch ring</p>
                <p className="text-base text-[#6a6f73]">Watch 30 minutes of course videos.</p>
              </div>
            </div>

            {/* Visit ring */}
            <div className="flex items-start gap-3 mb-6">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#1f7a54]" />
              <div>
                <p className="text-base font-normal text-[#2d2f31]">To complete the visit ring</p>
                <p className="text-base text-[#6a6f73]">Open the app or website once a week</p>
              </div>
            </div>

            {/* Data updates */}
            <div className="border-t border-[#d1d7dc] pt-4">
              <p className="text-base font-normal text-[#2d2f31] mb-1">Data updates</p>
              <p className="text-base text-[#6a6f73] leading-relaxed">
                Your minutes watched updates three{" "}
                <span className="text-[#6d28d2] font-light">times</span> per day. Return in a few hours to see your progress.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ErrorState = () => (
  <div className="max-w-4xl mx-auto my-16 px-6 text-center select-none">
    <div className="bg-white border border-[#d1d7dc] rounded-none p-8 shadow-sm">
      <h2 className="text-lg font-normal text-red-600 mb-2">
        Failed to load your courses
      </h2>
      <p className="text-base text-[#6a6f73] mb-5">
        Please try refreshing the page or check your internet network settings.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-none border border-[#2d2f31] text-[#2d2f31] hover:bg-gray-50 px-4 py-2 text-base font-normal"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

const MyLearningSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="space-y-3 rounded-none border border-[#d1d7dc] p-4 bg-white shadow-sm">
        <Skeleton className="w-full aspect-video rounded-none bg-gray-200" />
        <Skeleton className="h-4 w-3/4 bg-gray-200" />
        <Skeleton className="h-3 w-1/2 bg-gray-200" />
        <Skeleton className="h-3 w-full bg-gray-200" />
      </div>
    ))}
  </div>
);

const EmptyLearningState = ({ navigate }) => (
  <div className="bg-white rounded-none border border-[#d1d7dc] p-10 text-center max-w-lg mx-auto shadow-sm space-y-4">
    <h3 className="text-base font-normal text-[#2d2f31]">
      Your learning journey starts here
    </h3>
    <p className="text-base text-[#6a6f73] leading-relaxed">
      You haven't enrolled in any courses yet. Explore our course registry to discover and enroll in full stack learning tracks.
    </p>
    <div className="flex justify-center gap-3 pt-2">
      <button
        onClick={() => navigate("/courses")}
        className="bg-[#2d2f31] hover:bg-black text-white px-5 py-2.5 text-base font-normal transition-all"
      >
        Browse Courses
      </button>
      <button
        onClick={() => navigate("/")}
        className="border border-[#d1d7dc] text-gray-700 hover:bg-gray-50 px-5 py-2.5 text-base font-normal transition-all"
      >
        Go to Home
      </button>
    </div>
  </div>
);

export default Learning;
