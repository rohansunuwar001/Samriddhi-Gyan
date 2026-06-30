import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useGetMyLearningCoursesQuery } from "@/features/api/authApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Info,
  Clock,
  MoreVertical,
  Star,
  BookOpen,
  Archive,
  Share2,
  ListPlus,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Dedicated Enrolled Course Card matching Udemy My Learning layout exactly
const MyLearningCourseCard = ({ course }) => {
  const navigate = useNavigate();
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  const {
    _id: courseId,
    title,
    thumbnail,
    creator = {},
    progress = 0,
  } = course;

  const instructorName = creator.name || "Unknown Instructor";

  const handleCardClick = () => {
    navigate(`/course-detail/${courseId}/content`);
  };

  const handleRatingStarClick = (star, e) => {
    e.stopPropagation();
    setUserRating(star);
    toast.success(`You rated this course ${star} stars!`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white flex flex-col group relative select-none border border-[#d1d7dc] hover:shadow-md transition-all cursor-pointer rounded-none overflow-hidden h-full"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Dropdown Options button */}
        <div className="absolute top-2.5 right-2.5 z-20" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full bg-white/95 hover:bg-white text-[#2d2f31] flex items-center justify-center shadow-md transition-all hover:scale-105 border border-gray-100 outline-none">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-[#d1d7dc] rounded-none p-1 shadow-lg text-[#2d2f31] z-30">
              <DropdownMenuItem className="text-xs py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <Share2 className="h-3.5 w-3.5 mr-2" /> Share course
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <ListPlus className="h-3.5 w-3.5 mr-2" /> Add to lists
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#d1d7dc]" />
              <DropdownMenuItem className="text-xs py-2 px-3 text-red-600 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <Archive className="h-3.5 w-3.5 mr-2" /> Archive course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#2d2f31] leading-snug line-clamp-2 hover:text-[#5624d0] transition-colors">
            {title}
          </h3>
          <p className="text-[10px] text-[#6a6f73] font-normal truncate">
            {instructorName}
          </p>
        </div>

        {/* Bottom progress indicators */}
        <div className="space-y-2 pt-1">
          {/* Progress bar line */}
          <div className="w-full bg-gray-200 h-1.5 rounded-none overflow-hidden">
            <div 
              className="bg-[#5624d0] h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {progress === 0 ? (
            /* Unstarted Course option */
            <div className="flex justify-between items-center text-[11px] font-bold text-[#5624d0] hover:text-[#3b1990] pt-1">
              <span>START COURSE</span>
            </div>
          ) : (
            /* In-progress course option */
            <div className="flex items-center justify-between gap-2 text-[10px] text-[#6a6f73]">
              <span className="font-semibold text-gray-500">{progress}% complete</span>
              
              {/* Star interactive feedback */}
              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={(e) => handleRatingStarClick(star, e)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    title={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-3 w-3 ${
                        star <= (hoverRating || userRating)
                          ? "fill-[#b4690e] text-[#b4690e]"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[9px] font-bold text-[#5624d0] ml-1 hover:underline cursor-pointer">
                  Leave a rating
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

MyLearningCourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string.isRequired,
    creator: PropTypes.shape({
      name: PropTypes.string,
    }),
    progress: PropTypes.number,
  }).isRequired,
};

// Main redesigned MyLearning Layout
const MyLearning = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetMyLearningCoursesQuery();
  const [activeTab, setActiveTab] = useState("all");
  const [showScheduler, setShowScheduler] = useState(true);

  const myLearningCourses = data?.courses || [];

  if (isError) {
    return <ErrorState />;
  }

  const tabs = [
    { id: "all", label: "All courses" },
    { id: "lists", label: "My Lists" },
    { id: "wishlist", label: "Wishlist" },
    { id: "certs", label: "Certifications" },
    { id: "archived", label: "Archived" },
    { id: "tools", label: "Learning tools" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col select-none text-[#2d2f31]">
      {/* ── Dark Header block (Udemy layout) ── */}
      <header className="bg-[#1c1d1f] text-white shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-0">
          <h1 className="text-3xl font-bold leading-tight mb-6">
            My learning
          </h1>

          {/* Navigation link tabs */}
          <nav className="flex space-x-6 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-white text-white"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content view area ── */}
      <main className="max-w-7xl w-full mx-auto px-6 md:px-12 py-8 flex-1 space-y-6">
        {activeTab === "all" ? (
          <>
            {/* Start a weekly streak widget card */}
            <div className="border border-[#d1d7dc] bg-white p-6 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#2d2f31]">
                  Start a weekly streak
                </h3>
                <p className="text-xs text-[#6a6f73] font-normal leading-relaxed">
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
                    <p className="text-sm font-extrabold leading-none">0 weeks</p>
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
                    <div className="flex items-center gap-1 text-[#6a6f73] pt-0.5 font-bold">
                      <span>Jun 28 - Jul 4</span>
                      <Info className="h-3 w-3 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule learning time scheduler widget */}
            {showScheduler && (
              <div className="border border-[#d1d7dc] bg-white p-6 rounded-none flex items-start gap-4 shadow-sm relative">
                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 shrink-0 mt-0.5">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-3.5 pr-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-[#2d2f31]">
                      Schedule learning time
                    </h3>
                    <p className="text-xs text-[#6a6f73] leading-relaxed font-normal">
                      Learning a little each day adds up. Research shows that students who make learning a habit are more likely to reach their goals. Set time aside to learn and get reminders using your learning scheduler.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("/course-detail")}
                      className="border border-[#2d2f31] bg-white text-[#2d2f31] hover:bg-gray-50 px-4 py-2 text-xs font-bold transition-all"
                    >
                      Get started
                    </button>
                    <button
                      onClick={() => setShowScheduler(false)}
                      className="text-[#2d2f31] hover:text-black font-bold text-xs px-2 py-2"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Redesigned Courses Grid feed */}
            {isLoading ? (
              <MyLearningSkeleton />
            ) : myLearningCourses.length === 0 ? (
              <EmptyLearningState navigate={navigate} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {myLearningCourses.map((course) => (
                  <MyLearningCourseCard key={course._id} course={course} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Sub-tab placeholder containers */
          <div className="bg-white border border-[#d1d7dc] p-10 text-center rounded-none shadow-sm space-y-3">
            <BookOpen className="h-8 w-8 text-gray-300 mx-auto" />
            <h4 className="font-extrabold text-sm text-[#2d2f31] capitalize">
              No {activeTab} lists defined
            </h4>
            <p className="text-xs text-[#6a6f73] max-w-sm mx-auto leading-relaxed">
              Organize, share, and track your LMS certification programs and external developer resources in specialized custom channels.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

// Sub-components states

const ErrorState = () => (
  <div className="max-w-4xl mx-auto my-16 px-6 text-center select-none">
    <div className="bg-white border border-[#d1d7dc] rounded-none p-8 shadow-sm">
      <h2 className="text-base font-extrabold text-red-600 mb-2">
        Failed to load your courses
      </h2>
      <p className="text-xs text-[#6a6f73] mb-5">
        Please try refreshing the page or check your internet network settings.
      </p>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="rounded-none border-[#2d2f31] text-[#2d2f31] hover:bg-gray-50 text-xs font-bold"
      >
        Refresh Page
      </Button>
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
    <h3 className="text-sm font-extrabold text-[#2d2f31]">
      Your learning journey starts here
    </h3>
    <p className="text-xs text-[#6a6f73] leading-relaxed">
      You haven't enrolled in any courses yet. Explore our course registry to discover and enroll in full stack learning tracks.
    </p>
    <div className="flex justify-center gap-3 pt-2">
      <button
        onClick={() => navigate("/courses")}
        className="bg-[#2d2f31] hover:bg-black text-white px-5 py-2.5 text-xs font-bold transition-all"
      >
        Browse Courses
      </button>
      <button
        onClick={() => navigate("/")}
        className="border border-[#d1d7dc] text-gray-700 hover:bg-gray-50 px-5 py-2.5 text-xs font-bold transition-all"
      >
        Go to Home
      </button>
    </div>
  </div>
);

EmptyLearningState.propTypes = {
  navigate: PropTypes.func.isRequired,
};

export default MyLearning;