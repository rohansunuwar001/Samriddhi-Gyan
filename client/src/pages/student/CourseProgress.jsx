import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import MainContent from "./MainContent";
import CourseSidebar from "./CourseSidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useGetCourseProgressQuery, useUpdateLectureProgressMutation } from "@/features/api/courseProgressApi";
import { useLoadUserQuery, useArchiveCourseMutation, useUnarchiveCourseMutation } from "@/features/api/authApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Star, Loader2, Trophy, Share2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const CircularProgressTrophy = ({ percent }) => {
  const radius = 14;
  const strokeWidth = 2.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-9 w-9 shrink-0 select-none">
      <svg className="h-9 w-9 transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#3e4143"
          strokeWidth={strokeWidth}
        />
        {/* White/Silver progress track circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Trophy icon centered inside */}
      <Trophy className="absolute h-4 w-4 text-[#d1d7dc]" />
    </div>
  );
};

const CourseProgress = () => {
  const { courseId } = useParams();
  const { data: courseData, isLoading, error } = useGetCourseDetailWithStatusQuery(courseId);

  // Fetch progress
  const { data: progressData } = useGetCourseProgressQuery(courseId);

  // Update progress mutation
  const [updateLectureProgress] = useUpdateLectureProgressMutation();

  const { isAuthenticated, token } = useSelector((store) => store.auth);
  // Load user data to check if this course is archived
  const { data: userData } = useLoadUserQuery(undefined, { skip: !isAuthenticated && !token });
  const [archiveCourse] = useArchiveCourseMutation();
  const [unarchiveCourse] = useUnarchiveCourseMutation();

  // Header Dialog/Popover states
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const [isShareOpen, setIsShareOpen] = useState(false);

  const [announcementEmails, setAnnouncementEmails] = useState(true);
  const [promoEmails, setPromoEmails] = useState(true);

  // Sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Find the first lecture as default
  const getFirstLecture = (course) => {
    if (!course?.sections?.length) return null;
    for (const section of course.sections) {
      if (section.lectures && section.lectures.length > 0) {
        return section.lectures[0];
      }
    }
    return null;
  };

  const [selectedLecture, setSelectedLecture] = useState(null);

  const isArchived = userData?.user?.archivedCourses?.includes(courseId);

  const handleArchiveToggle = async () => {
    try {
      if (isArchived) {
        await unarchiveCourse(courseId).unwrap();
        toast.success("Course unarchived successfully");
      } else {
        await archiveCourse(courseId).unwrap();
        toast.success("Course archived successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update course archive status");
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();

  const handleSelectLecture = (lecture) => {
    if (!lecture) return;
    setSelectedLecture(lecture);
    if (lecture._id && courseId) {
      localStorage.setItem(`last_lecture_${courseId}`, lecture._id);
      setSearchParams({ lecture: lecture._id }, { replace: true });
    }
  };

  useEffect(() => {
    if (courseData?.course && !selectedLecture) {
      const savedLectureId = searchParams.get("lecture") || localStorage.getItem(`last_lecture_${courseId}`);
      let found = null;
      if (savedLectureId) {
        for (const section of courseData.course.sections) {
          const lec = section.lectures?.find((l) => l._id === savedLectureId);
          if (lec) {
            found = lec;
            break;
          }
        }
      }
      if (!found) {
        found = getFirstLecture(courseData.course);
      }
      if (found) {
        handleSelectLecture(found);
      }
    }
  }, [courseData, selectedLecture, courseId]);

  // Compute a flat array of all lectures in the course
  const allLectures = React.useMemo(() => {
    if (!courseData?.course?.sections) return [];
    const flat = [];
    for (const section of courseData.course.sections) {
      if (section.lectures) {
        flat.push(...section.lectures);
      }
    }
    return flat;
  }, [courseData]);

  const currentLectureIndex = allLectures.findIndex((l) => l._id === selectedLecture?._id);
  const prevLecture = currentLectureIndex > 0 ? allLectures[currentLectureIndex - 1] : null;
  const nextLecture =
    currentLectureIndex >= 0 && currentLectureIndex < allLectures.length - 1
      ? allLectures[currentLectureIndex + 1]
      : null;

  const goToPrevLecture = () => {
    if (prevLecture) handleSelectLecture(prevLecture);
  };

  const goToNextLecture = () => {
    if (nextLecture) handleSelectLecture(nextLecture);
  };

  // Handler to mark lecture as viewed
  const handleLectureViewed = async (lectureId, viewed) => {
    await updateLectureProgress({ courseId, lectureId, viewed });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !courseData) {
    return (
      <div className="text-center py-20 text-red-500 font-light">
        Failed to load course content. Please try again.
      </div>
    );
  }

  const progress = progressData?.data?.progress || [];

  // Calculate lectures and completion count
  const totalLectures = courseData?.course?.sections?.reduce(
    (sum, section) => sum + (section.lectures?.length || 0), 0
  ) || 0;

  const completedCount = courseData?.course?.sections?.reduce(
    (sum, section) =>
      sum +
      (section.lectures?.filter((lecture) =>
        progress.some((lp) => lp.lectureId === lecture._id && lp.viewed)
      ).length || 0),
    0
  ) || 0;

  const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const courseSlugOrId = courseData?.course?.slug || courseId;
  const courseUrl = `${window.location.origin}/course/${courseSlugOrId}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(courseUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#2d2f31]">
      {/* Sticky Dark Header Bar */}
      <header className="sticky top-0 z-40 bg-[#1c1d1f] text-white h-14 flex items-center justify-between px-4 border-b border-[#3e4143]">
        {/* Left: Logo, Title */}
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="shrink-0 flex items-center">
            <img 
              src="/samriddhi_logo1.png" 
              alt="Samriddhi Logo" 
              className="h-14 object-contain invert brightness-0 transition-transform duration-200 hover:scale-105" 
            />
          </Link>
          <div className="h-6 w-px bg-[#3e4143] shrink-0"></div>
          <span className="font-light text-xl text-[#f7f9fa] truncate max-w-[180px] sm:max-w-[320px] md:max-w-[450px]">
            {courseData.course.title}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 text-xl font-light text-[#d1d7dc]">
          {/* Assignments/Tasks Link */}
          <Link
            to={`/course/${courseSlugOrId}/assignments`}
            className="flex items-center gap-1.5 hover:text-white transition-colors border border-[#8a8d91] hover:border-white px-3 py-1.5 rounded-none shrink-0 font-light text-sm"
          >
            Assignments
          </Link>

          {/* Leave a Rating */}
          <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 hover:text-white transition-colors shrink-0 font-light">
                <Star className="h-4 w-4 text-gray-400" />
                <span className="hidden md:inline">Leave a rating</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-8 bg-white text-[#2d2f31] rounded-none border border-[#d1d7dc] shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-4xl font-light text-center mb-1 text-[#2d2f31]">
                  How would you rate this course?
                </DialogTitle>
                <p className="text-center text-lg font-light text-[#6a6f73] uppercase mb-4 tracking-wider">
                  Select Rating
                </p>
              </DialogHeader>
              <div className="flex justify-center gap-2 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      setSelectedRating(star);
                      toast.success(`You rated this course ${star} stars!`);
                      setIsRatingOpen(false);
                    }}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-9 w-9 ${
                        star <= (hoverRating || selectedRating)
                          ? "fill-[#b4690e] text-[#b4690e]"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Your Progress Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 hover:text-white transition-colors shrink-0 font-light">
                <CircularProgressTrophy percent={progressPercent} />
                <span className="hidden sm:inline">Your progress</span>
                <span className="text-[15px]">▼</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white text-[#2d2f31] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.15)] rounded-none border border-[#d1d7dc] mt-2 mr-2 z-50">
              <div className="space-y-4">
                <div>
                  <h4 className="font-light text-[#2d2f31] text-xl leading-tight">
                    {completedCount} of {totalLectures} complete.
                  </h4>
                  <p className="text-lg text-[#6a6f73] mt-1 font-light">
                    Finish course to get your certificate
                  </p>
                </div>
                {/* Visual linear progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#a435f0] h-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[15px] text-right font-light text-[#2d2f31]">{progressPercent}% Complete</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Share Course Dialog */}
          <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 hover:text-white transition-colors border border-[#8a8d91] hover:border-white px-3 py-1.5 rounded-none shrink-0 font-light">
                Share <Share2 className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-6 bg-white text-[#2d2f31] rounded-none border border-[#d1d7dc] shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-4xl font-light mb-4 text-[#2d2f31]">
                  Share this course
                </DialogTitle>
              </DialogHeader>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={courseUrl}
                  className="flex-grow border border-[#2d2f31] px-3 py-2 text-lg outline-none bg-[#f7f9fa]"
                />
                <Button
                  onClick={handleCopyUrl}
                  className="bg-[#a435f0] text-white hover:bg-[#8710d8] font-light text-lg rounded-none h-auto px-5 shadow-none"
                >
                  Copy
                </Button>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button className="h-10 w-10 border border-[#d1d7dc] rounded-full flex items-center justify-center hover:bg-[#f7f9fa] text-[#5624d0] font-light text-xl">
                  f
                </button>
                <button className="h-10 w-10 border border-[#d1d7dc] rounded-full flex items-center justify-center hover:bg-[#f7f9fa] text-[#5624d0] font-light text-xl">
                  𝕏
                </button>
                <button className="h-10 w-10 border border-[#d1d7dc] rounded-full flex items-center justify-center hover:bg-[#f7f9fa] text-[#5624d0] font-light text-xl">
                  ✉
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings Options (3-Dot Dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:text-white transition-colors border border-[#8a8d91] hover:border-white h-8 w-8 flex items-center justify-center rounded-none text-xl shrink-0">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 bg-white text-[#2d2f31] rounded-none border border-[#d1d7dc] mt-2 shadow-[0_4px_16px_rgba(0,0,0,0.15)] z-50" align="end">
              <DropdownMenuItem className="cursor-pointer font-light text-lg py-2.5 flex items-center gap-2 hover:bg-[#f7f9fa] focus:bg-[#f7f9fa] focus:text-[#2d2f31]">
                ★ Favorite this course
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleArchiveToggle}
                className="cursor-pointer font-light text-lg py-2.5 flex items-center gap-2 hover:bg-[#f7f9fa] focus:bg-[#f7f9fa] focus:text-[#2d2f31]"
              >
                📁 {isArchived ? "Unarchive this course" : "Archive this course"}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-light text-lg py-2.5 flex items-center gap-2 hover:bg-[#f7f9fa] focus:bg-[#f7f9fa] focus:text-[#2d2f31]">
                🎁 Gift this course
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#d1d7dc]" />
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#f7f9fa] cursor-pointer text-[11px] font-light text-[#2d2f31]">
                <input
                  type="checkbox"
                  checked={announcementEmails}
                  onChange={(e) => setAnnouncementEmails(e.target.checked)}
                  className="rounded border-[#d1d7dc] text-[#5624d0] focus:ring-[#5624d0] h-4 w-4"
                />
                New announcement emails
              </label>
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#f7f9fa] cursor-pointer text-[11px] font-light text-[#2d2f31]">
                <input
                  type="checkbox"
                  checked={promoEmails}
                  onChange={(e) => setPromoEmails(e.target.checked)}
                  className="rounded border-[#d1d7dc] text-[#5624d0] focus:ring-[#5624d0] h-4 w-4"
                />
                Promotional emails
              </label>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      {/* Main content grid underneath the header */}
      <div className="flex flex-1 relative min-h-0">
        <MainContent
          courseData={courseData}
          selectedLecture={selectedLecture}
          progress={progress}
          onLectureViewed={handleLectureViewed}
          prevLecture={prevLecture}
          nextLecture={nextLecture}
          onPrevLecture={goToPrevLecture}
          onNextLecture={goToNextLecture}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        {isSidebarOpen && (
          <CourseSidebar
            courseData={courseData}
            selectedLecture={selectedLecture}
            setSelectedLecture={handleSelectLecture}
            progress={Array.isArray(progress) ? progress : []}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            onToggleLectureProgress={handleLectureViewed}
          />
        )}
      </div>
    </div>
  );
};

export default CourseProgress;