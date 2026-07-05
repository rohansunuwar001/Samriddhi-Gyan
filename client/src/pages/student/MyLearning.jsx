import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useGetMyLearningCoursesQuery } from "@/features/api/authApi";
import {
  useGetUserRemindersQuery,
  useCreateReminderMutation,
  useUpdateReminderMutation,
  useDeleteReminderMutation,
} from "@/features/api/reminderApi";
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
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Search,
  X,
  Calendar,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Enrolled Course Card component
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
      className="bg-white flex flex-col group relative border border-[#d1d7dc] hover:shadow-md transition-all cursor-pointer rounded-none overflow-hidden h-full"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="absolute top-2.5 right-2.5 z-20" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full bg-white/95 hover:bg-white text-[#2d2f31] flex items-center justify-center shadow-md transition-all hover:scale-105 border border-gray-100 outline-none">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-[#d1d7dc] rounded-none p-1 shadow-lg text-[#2d2f31] z-30">
              <DropdownMenuItem className="text-sm py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <Share2 className="h-3.5 w-3.5 mr-2" /> Share course
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <ListPlus className="h-3.5 w-3.5 mr-2" /> Add to lists
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#d1d7dc]" />
              <DropdownMenuItem className="text-sm py-2 px-3 text-red-600 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <Archive className="h-3.5 w-3.5 mr-2" /> Archive course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-[13px] font-normal text-[#2d2f31] leading-snug line-clamp-2 hover:text-[#6d28d2] transition-colors">
            {title}
          </h3>
          <p className="text-[10px] text-[#6a6f73] font-normal truncate">
            {instructorName}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <div className="w-full bg-gray-200 h-1.5 rounded-none overflow-hidden">
            <div 
              className="bg-[#6d28d2] h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {progress === 0 ? (
            <div className="flex justify-between items-center text-[11px] font-normal text-[#6d28d2] hover:text-[#892de1] pt-1">
              <span>START COURSE</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-[10px] text-[#6a6f73]">
              <span className="font-normal text-gray-500">{progress}% complete</span>
              
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
                <span className="text-[9px] font-normal text-[#6d28d2] ml-1 hover:underline cursor-pointer">
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
  
  // Real DB data fetching
  const { data: coursesData, isLoading: coursesLoading, isError } = useGetMyLearningCoursesQuery();
  const { data: remindersData, isLoading: remindersLoading } = useGetUserRemindersQuery();
  
  const [createReminder, { isLoading: isCreating }] = useCreateReminderMutation();
  const [updateReminder, { isLoading: isUpdating }] = useUpdateReminderMutation();
  const [deleteReminder] = useDeleteReminderMutation();

  const [activeTab, setActiveTab] = useState("all");
  const [showScheduler, setShowScheduler] = useState(true);

  // Wizard Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard Field States
  const [reminderName, setReminderName] = useState("Learning reminder");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [searchCourseQuery, setSearchCourseQuery] = useState("");
  const [reminderFrequency, setReminderFrequency] = useState("Weekly");
  const [reminderTime, setReminderTime] = useState("12:00 PM");
  const [selectedDays, setSelectedDays] = useState(["Monday"]);
  const [calendarType, setCalendarType] = useState("None");

  const myLearningCourses = coursesData?.courses || [];
  const reminders = remindersData?.reminders || [];

  // Hide the scheduler card if reminders exist
  const displayScheduler = showScheduler && reminders.length === 0;

  // Initialize/Prefill form fields
  const handleOpenWizard = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setReminderName(reminder.name || "Learning reminder");
      setSelectedCourseId(reminder.courseId?._id || reminder.courseId || "");
      setReminderFrequency(reminder.frequency || "Weekly");
      setReminderTime(reminder.time || "12:00 PM");
      setSelectedDays(reminder.days || ["Monday"]);
      setCalendarType(reminder.calendarSynced || "None");
      setWizardStep(1);
    } else {
      setEditingReminder(null);
      setReminderName("Learning reminder");
      setSelectedCourseId(myLearningCourses[0]?._id || "");
      setReminderFrequency("Weekly");
      setReminderTime("12:00 PM");
      setSelectedDays(["Monday"]);
      setCalendarType("None");
      setWizardStep(1);
    }
    setSearchCourseQuery("");
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setEditingReminder(null);
  };

  // Submit Reminder to DB
  const handleDone = async () => {
    try {
      const payload = {
        name: reminderName,
        courseId: selectedCourseId || null,
        time: reminderTime,
        days: selectedDays,
        frequency: reminderFrequency,
        calendarSynced: calendarType,
      };

      if (editingReminder) {
        await updateReminder({ reminderId: editingReminder._id, ...payload }).unwrap();
        toast.success("Learning reminder updated successfully!");
      } else {
        await createReminder(payload).unwrap();
        toast.success("Learning reminder scheduled successfully!");
      }

      handleCloseWizard();
      setActiveTab("tools"); // Redirect user to Learning tools view
    } catch (err) {
      toast.error("Failed to save learning reminder.");
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    try {
      await deleteReminder(reminderId).unwrap();
      toast.success("Learning reminder deleted.");
    } catch (err) {
      toast.error("Failed to delete reminder.");
    }
  };

  // Calendar Event Builders
  const handleSyncCalendar = (type) => {
    setCalendarType(type);
    const matchedCourse = myLearningCourses.find(c => c._id === selectedCourseId);
    const courseTitle = matchedCourse ? matchedCourse.title : "LMS Learning";

    if (type === "Google") {
      const text = encodeURIComponent(reminderName);
      const details = encodeURIComponent(`Time to study: ${courseTitle}`);
      const recurrence = reminderFrequency === "Daily" ? "&recur=FREQ=DAILY" : reminderFrequency === "Weekly" ? "&recur=FREQ=WEEKLY" : "";
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}${recurrence}`;
      window.open(url, "_blank");
      toast.success("Google Calendar template opened.");
    } else if (type === "Apple" || type === "Outlook") {
      // Build standard .ics file download
      const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${reminderName}`,
        `DESCRIPTION:Study Session: ${courseTitle}`,
        `DTSTART:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      ];
      if (reminderFrequency === "Daily") icsLines.push("RRULE:FREQ=DAILY");
      else if (reminderFrequency === "Weekly") icsLines.push("RRULE:FREQ=WEEKLY");
      
      icsLines.push("END:VEVENT");
      icsLines.push("END:VCALENDAR");

      const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reminderName.toLowerCase().replace(/\s+/g, "_")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} calendar reminder downloaded.`);
    }
  };

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

  // Filtering courses matching search query in Wizard
  const filteredCoursesForWizard = myLearningCourses.filter((course) =>
    course.title.toLowerCase().includes(searchCourseQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col select-none text-[#2d2f31]">
      {/* ── Header tab navigation block ── */}
      <header className="bg-[#1c1d1f] text-white shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-0">
          <h1 className="text-4xl font-normal leading-tight mb-6">
            My learning
          </h1>

          <nav className="flex space-x-6 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-4 text-sm sm:text-base font-normal transition-all whitespace-nowrap ${
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
                <h3 className="text-lg font-normal text-[#2d2f31]">
                  Start a weekly streak
                </h3>
                <p className="text-sm text-[#6a6f73] font-normal leading-relaxed">
                  Let's chip away at your learning goals.
                </p>
              </div>

              <div className="flex items-center gap-8 shrink-0 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Flame className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-base font-normal leading-none">0 weeks</p>
                    <p className="text-[10px] text-[#6a6f73] font-normal mt-0.5">Current streak</p>
                  </div>
                </div>

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
                      <Info className="h-3 w-3 cursor-pointer" />
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
                    <p className="text-sm text-[#6a6f73] leading-relaxed font-normal">
                      Learning a little each day adds up. Research shows that students who make learning a habit are more likely to reach their goals. Set time aside to learn and get reminders using your learning scheduler.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenWizard()}
                      className="border border-[#6d28d2] text-[#6d28d2] hover:bg-[#f5eeff] hover:border-[#892de1] hover:text-[#892de1] px-5 py-2.5 text-sm font-normal transition-colors"
                    >
                      Get started
                    </button>
                    <button
                      onClick={() => setShowScheduler(false)}
                      className="text-[#2d2f31] hover:text-black font-normal text-sm px-2 py-2"
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
                  <MyLearningCourseCard key={course._id} course={course} />
                ))}
              </div>
            )}
          </>
        ) : activeTab === "tools" ? (
          /* Learning tools dashboard view matching Picture 4 */
          <div className="space-y-6 max-w-4xl animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-[22px] font-normal text-[#1c1d1f]">Learning reminders</h2>
              <p className="text-base text-[#6a6f73] font-normal leading-relaxed">
                Learning a little each day adds up. Research shows that students who make learning a habit are more likely to reach their goals. Set time aside to learn and get reminders using your learning scheduler.
              </p>
            </div>

            {remindersLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-28 w-full bg-gray-200 rounded-none border border-[#d1d7dc]" />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="border border-[#d1d7dc] bg-white p-12 text-center rounded-none shadow-sm space-y-4">
                <Clock className="h-10 w-10 text-gray-300 mx-auto" />
                <h4 className="font-normal text-base text-[#2d2f31]">
                  No reminders scheduled yet
                </h4>
                <p className="text-sm text-[#6a6f73] max-w-sm mx-auto leading-relaxed">
                  Stay committed to your personal learning track by setting up calendar events or browser reminders.
                </p>
                <button
                  onClick={() => handleOpenWizard()}
                  className="bg-[#6d28d2] hover:bg-[#892de1] text-white px-5 py-2.5 text-sm font-normal transition-colors"
                >
                  Create a reminder
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reminders.map((rem) => {
                  const courseTitle = rem.courseId?.title;
                  return (
                    <div 
                      key={rem._id} 
                      className="border border-[#d1d7dc] bg-white p-5 flex justify-between items-start gap-4 shadow-sm relative group"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-[#6d28d2] shrink-0 mt-0.5">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-lg font-normal text-[#1c1d1f]">{rem.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-[#2d2f31] font-normal">
                            <span className="flex items-center gap-1 font-normal text-slate-700">
                              {rem.time}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="capitalize">{rem.frequency}</span>
                          </div>
                          {rem.calendarSynced && rem.calendarSynced !== "None" && (
                            <p className="text-[11px] font-normal text-green-700 flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 stroke-[3px]" />
                              Added to {rem.calendarSynced} Calendar
                            </p>
                          )}
                          {courseTitle && (
                            <p className="text-[12.5px] text-gray-500 font-light">
                              Course: {courseTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Options button for Edit / Delete */}
                      <div className="shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center outline-none transition-colors">
                              <MoreVertical className="h-4.5 w-4.5 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 bg-white border border-[#d1d7dc] rounded-none p-1 shadow-lg text-[#2d2f31]">
                            <DropdownMenuItem 
                              onClick={() => handleOpenWizard(rem)}
                              className="text-sm py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit reminder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#d1d7dc]" />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteReminder(rem._id)}
                              className="text-sm py-2 px-3 text-red-600 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => handleOpenWizard()}
                  className="flex items-center gap-2 border border-[#6d28d2] text-[#6d28d2] hover:bg-[#f5eeff] hover:border-[#892de1] hover:text-[#892de1] px-5 py-2.5 text-sm font-normal transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add another
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Sub-tab placeholder containers */
          <div className="bg-white border border-[#d1d7dc] p-10 text-center rounded-none shadow-sm space-y-3">
            <BookOpen className="h-8 w-8 text-gray-300 mx-auto" />
            <h4 className="font-normal text-base text-[#2d2f31] capitalize">
              No {activeTab} lists defined
            </h4>
            <p className="text-sm text-[#6a6f73] max-w-sm mx-auto leading-relaxed">
              Organize, share, and track your LMS certification programs and external developer resources in specialized custom channels.
            </p>
          </div>
        )}
      </main>

      {/* ── 3-Step Reminder Setup Wizard Modal ── */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300] px-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col text-[#2d2f31]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-normal text-[#1c1d1f]">Learning reminders</h2>
              <button 
                onClick={handleCloseWizard}
                className="text-gray-400 hover:text-black p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5 flex-1">
              <p className="text-sm text-[#6a6f73] font-normal">Step {wizardStep} of 3</p>

              {wizardStep === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <label className="text-base font-normal text-[#1c1d1f]">Name</label>
                      <span className="text-[10px] text-gray-400 font-normal">optional</span>
                    </div>
                    <input 
                      type="text" 
                      value={reminderName}
                      onChange={(e) => setReminderName(e.target.value)}
                      placeholder="Learning reminder"
                      className="w-full border border-gray-300 px-3 py-2 text-base focus:border-black outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-base font-normal text-[#1c1d1f] block">Attach content (optional)</label>
                    <p className="text-sm text-[#6a6f73] font-normal">Most recent courses or labs:</p>
                    
                    {/* Courses Radio Options */}
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {filteredCoursesForWizard.map((course) => (
                        <label 
                          key={course._id} 
                          className="flex items-start gap-2.5 text-sm text-[#2d2f31] font-normal cursor-pointer hover:bg-slate-50 p-1.5"
                        >
                          <input 
                            type="radio" 
                            name="attached_content"
                            checked={selectedCourseId === course._id}
                            onChange={() => setSelectedCourseId(course._id)}
                            className="mt-0.5 accent-[#6d28d2]"
                          />
                          <span>Course: {course.title}</span>
                        </label>
                      ))}

                      <label className="flex items-center gap-2.5 text-sm text-[#2d2f31] font-normal cursor-pointer hover:bg-slate-50 p-1.5">
                        <input 
                          type="radio" 
                          name="attached_content"
                          checked={selectedCourseId === ""}
                          onChange={() => setSelectedCourseId("")}
                          className="accent-[#6d28d2]"
                        />
                        <span>None</span>
                      </label>
                    </div>

                    {/* Search Field */}
                    <div className="relative pt-1">
                      <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchCourseQuery}
                        onChange={(e) => setSearchCourseQuery(e.target.value)}
                        placeholder="Search"
                        className="w-full border border-gray-300 pl-9 pr-3 py-2 text-base focus:border-black outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                  {/* Frequency toggle select */}
                  <div className="space-y-2">
                    <label className="text-base font-normal text-[#1c1d1f] block">Frequency</label>
                    <div className="flex gap-2">
                      {["Daily", "Weekly", "Once"].map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setReminderFrequency(freq)}
                          className={`px-4 py-2 text-sm font-normal border transition-colors ${
                            reminderFrequency === freq
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "border-gray-300 text-[#2d2f31] hover:bg-slate-50"
                          }`}
                          style={{ borderRadius: 20 }}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time picker */}
                  <div className="space-y-2">
                    <label className="text-base font-normal text-[#1c1d1f] block">Time</label>
                    <div className="relative max-w-[200px]">
                      <input 
                        type="text" 
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full border border-gray-300 pl-3 pr-9 py-2 text-base focus:border-black outline-none transition-colors"
                        placeholder="12:00 PM"
                      />
                      <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-base font-normal text-[#1c1d1f] block">Add to calendar (optional)</label>
                    <div className="flex flex-wrap gap-2.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleSyncCalendar("Google")}
                        className={`flex items-center gap-1.5 px-4 py-2 border text-sm font-normal transition-all ${
                          calendarType === "Google" ? "border-black bg-slate-50" : "border-gray-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-red-500 font-normal">G</span> Sign in with Google
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSyncCalendar("Apple")}
                        className={`flex items-center gap-1.5 px-4 py-2 border text-sm font-normal transition-all ${
                          calendarType === "Apple" ? "border-black bg-slate-50" : "border-gray-300 hover:bg-slate-50"
                        }`}
                      >
                        🍎 Apple
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSyncCalendar("Outlook")}
                        className={`flex items-center gap-1.5 px-4 py-2 border text-sm font-normal transition-all ${
                          calendarType === "Outlook" ? "border-black bg-slate-50" : "border-gray-300 hover:bg-slate-50"
                        }`}
                      >
                        💻 Outlook
                      </button>
                    </div>
                    <p className="text-[11px] text-[#6a6f73] leading-relaxed pt-2">
                      Follow all calendar prompts and save before moving forward. Apple and outlook will download an ics file. Open this file to add it to your calendar.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-5 border-t border-gray-100 flex items-center justify-between shrink-0">
              <div>
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="text-[#6d28d2] hover:text-[#892de1] text-sm font-normal transition-colors"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div>
                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => prev + 1)}
                    className="bg-[#6d28d2] hover:bg-[#892de1] text-white text-sm font-normal py-2.5 px-5 transition-colors shrink-0"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDone}
                    disabled={isCreating || isUpdating}
                    className="bg-[#6d28d2] hover:bg-[#892de1] text-white text-sm font-normal py-2.5 px-5 transition-colors flex items-center gap-1 shrink-0"
                  >
                    {(isCreating || isUpdating) && <Loader2 className="h-3 w-3 animate-spin" />}
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components states

const ErrorState = () => (
  <div className="max-w-4xl mx-auto my-16 px-6 text-center select-none">
    <div className="bg-white border border-[#d1d7dc] rounded-none p-8 shadow-sm">
      <h2 className="text-lg font-normal text-red-600 mb-2">
        Failed to load your courses
      </h2>
      <p className="text-sm text-[#6a6f73] mb-5">
        Please try refreshing the page or check your internet network settings.
      </p>
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="rounded-none border-[#2d2f31] text-[#2d2f31] hover:bg-gray-50 text-sm font-normal"
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
    <h3 className="text-base font-normal text-[#2d2f31]">
      Your learning journey starts here
    </h3>
    <p className="text-sm text-[#6a6f73] leading-relaxed">
      You haven't enrolled in any courses yet. Explore our course registry to discover and enroll in full stack learning tracks.
    </p>
    <div className="flex justify-center gap-3 pt-2">
      <button
        onClick={() => navigate("/courses")}
        className="bg-[#2d2f31] hover:bg-black text-white px-5 py-2.5 text-sm font-normal transition-all"
      >
        Browse Courses
      </button>
      <button
        onClick={() => navigate("/")}
        className="border border-[#d1d7dc] text-gray-700 hover:bg-gray-50 px-5 py-2.5 text-sm font-normal transition-all"
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