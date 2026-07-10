import PropTypes from "prop-types";
import React, { useState, useMemo } from "react";
import { FaFacebookF, FaLink, FaLinkedinIn, FaStar } from "react-icons/fa";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MessageSquare,
  ThumbsUp,
  Trash2,
  Calendar,
  Clock,
  Plus,
  Loader2,
  Sparkles,
  ArrowLeft,
  Bot,
  Check,
  BookOpen,
  Download,
} from "lucide-react";
import ReviewsSection from "../Reviews/ReviewSection";
import BolaVideoPlayer from "../admin/lecture/BolaVideoPlayer";
import {
  useGetCourseQuestionsQuery,
  useCreateQuestionMutation,
  useToggleUpvoteMutation,
  useAddAnswerMutation
} from "@/features/api/questionApi";
import {
  useGetUserRemindersQuery,
  useCreateReminderMutation,
  useDeleteReminderMutation
} from "@/features/api/reminderApi";
import {
  useGetDueFlashcardsQuery,
  useCreateFlashcardMutation,
  useReviewFlashcardMutation,
  useGenerateAIFlashcardsMutation,
} from "@/features/api/flashcardApi";
import { toast } from "sonner";
import axios from "axios";
import { BASE_URL } from "@/app/constant";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";

const MainContent = ({
  courseData,
  selectedLecture,
  progress = [],
  onLectureViewed,
  prevLecture,
  nextLecture,
  onPrevLecture,
  onNextLecture,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const [selectedTab, setSelectedTab] = useState("overview");

  const course = courseData?.course;
  const courseId = course?._id;

  // Q&A queries & states
  const { data: qnaData, isLoading: qnaLoading } = useGetCourseQuestionsQuery(courseId, { skip: !courseId });
  const [createQuestion] = useCreateQuestionMutation();
  const [toggleUpvote] = useToggleUpvoteMutation();
  const [addAnswer] = useAddAnswerMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [lectureFilter, setLectureFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");

  const [isAsking, setIsAsking] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [newAnswerText, setNewAnswerText] = useState("");

  // AI assistant dialog within Q&A
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Reminders queries & states
  const { data: reminderData } = useGetUserRemindersQuery();
  const courseReminders = React.useMemo(() => {
    if (!reminderData?.reminders) return [];
    return reminderData.reminders.filter(
      (r) => {
        const cId = r.courseId?._id || r.courseId;
        return cId === courseId;
      }
    );
  }, [reminderData, courseId]);
  const [createReminder] = useCreateReminderMutation();
  const [deleteReminder] = useDeleteReminderMutation();

  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderDays, setReminderDays] = useState(["Monday"]);
  const [reminderFrequency, setReminderFrequency] = useState("Weekly");

  // Flashcards queries & states
  const { data: flashcardsData } = useGetDueFlashcardsQuery(courseId, { skip: !courseId });
  const [createFlashcard] = useCreateFlashcardMutation();
  const [reviewFlashcard] = useReviewFlashcardMutation();
  const [generateAIFlashcards, { isLoading: aiGenerating }] = useGenerateAIFlashcardsMutation();

  const [manualQuestion, setManualQuestion] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  const totalDuration = useMemo(() => {
    if (!course) return 0;
    return (course.sections || []).reduce(
      (sectionSum, section) =>
        sectionSum +
        (section.lectures || []).reduce(
          (lectureSum, lecture) => lectureSum + (lecture.durationInSeconds || 0),
          0
        ),
      0
    );
  }, [course]);

  const watchedDuration = useMemo(() => {
    if (!course) return 0;
    return (course.sections || []).reduce(
      (sectionSum, section) =>
        sectionSum +
        (section.lectures || []).reduce((lectureSum, lecture) => {
          const isViewed = progress.some((lp) => lp.lectureId === lecture._id && lp.viewed);
          return lectureSum + (isViewed ? lecture.durationInSeconds || 0 : 0);
        }, 0),
      0
    );
  }, [progress, course]);

  const percent = useMemo(() => {
    if (totalDuration === 0) return 0;
    return Math.min((watchedDuration / totalDuration) * 100, 100);
  }, [watchedDuration, totalDuration]);

  if (!course) {
    return <LoadingSpinner />;
  }

  const ratings = course.ratings || 0;
  const numOfReviews = course.numOfReviews || 0;
  const studentCount = course.enrolledStudents?.length || 0;
  const language = course.language || "N/A";
  const level = course.level || "N/A";
  const instructor = course.creator || {};
  const instructorName = instructor.name || "Unknown Instructor";
  const instructorHeadline = instructor.headline || "";
  const instructorPhoto = instructor.photoUrl || "https://via.placeholder.com/100";
  const instructorLinks = instructor.links || {};

  const totalLectures = (course.sections || []).reduce(
    (sum, section) => sum + (section.lectures?.length || 0),
    0
  );

  const formatDurationString = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Q&A Submissions
  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please fill in both the title and details.");
      return;
    }
    try {
      await createQuestion({
        courseId,
        lectureId: selectedLecture?._id,
        title: newTitle,
        content: newContent
      }).unwrap();
      toast.success("Question posted successfully!");
      setNewTitle("");
      setNewContent("");
      setIsAsking(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to post question.");
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswerText.trim()) return;
    try {
      const res = await addAnswer({
        questionId: selectedQuestion._id,
        content: newAnswerText
      }).unwrap();
      setSelectedQuestion(res.question);
      setNewAnswerText("");
      toast.success("Answer posted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post answer.");
    }
  };

  const handleUpvoteClick = async (questionId, e) => {
    e.stopPropagation();
    try {
      await toggleUpvote(questionId).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  // Q&A Filters
  const filteredQuestions = useMemo(() => {
    const list = qnaData?.questions || [];
    return list.filter((q) => {
      const matchesSearch =
        !searchQuery.trim() ||
        q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLecture =
        lectureFilter === "all" ||
        (q.lectureId?._id === selectedLecture?._id);

      return matchesSearch && matchesLecture;
    }).sort((a, b) => {
      if (sortBy === "recommended") {
        return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [qnaData, searchQuery, lectureFilter, sortBy, selectedLecture]);

  // AI assistant direct ask Q&A
  const handleAiAsk = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");
    try {
      const host = BASE_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";
      const res = await axios.post(`${host}/api/v1/ai/ask`, {
        prompt: aiPrompt,
        courseId: courseId,
        lectureId: selectedLecture?._id,
      });
      setAiResponse(res.data.answer);
    } catch (err) {
      console.error(err);
      setAiResponse("I was unable to retrieve a response at this time. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Reminders Actions
  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!reminderDays.length) {
      toast.error("Please select at least one day.");
      return;
    }
    try {
      await createReminder({
        courseId,
        time: reminderTime,
        days: reminderDays,
        frequency: reminderFrequency
      }).unwrap();
      toast.success("Learning reminder saved successfully!");
      setIsAddingReminder(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add learning reminder.");
    }
  };

  const handleReminderDelete = async (reminderId) => {
    try {
      await deleteReminder(reminderId).unwrap();
      toast.success("Reminder deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDaySelection = (day) => {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "qna", label: "Q&A" },
    { id: "notes", label: "Notes" },
    { id: "flashcards", label: "Flashcards" },
    { id: "announcements", label: "Announcements" },
    { id: "reviews", label: "Reviews" },
    { id: "tools", label: "Learning tools" },
  ];

  return (
    <main className="flex-grow bg-white flex flex-col h-full overflow-y-auto select-none relative">
      {/* ── Video Player Area with Dark Background ── */}
      <div className="relative bg-[#1c1d1f] w-full flex items-center justify-center group/player">
        <div className="w-full max-w-[1200px] relative aspect-video">
          {selectedLecture?.videoUrl ? (
            <BolaVideoPlayer
              key={selectedLecture._id}
              src={selectedLecture.videoUrl}
              onEnded={() => onLectureViewed(selectedLecture._id, true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1d1f] text-white text-center p-4">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="max-h-32 opacity-40 rounded mb-4"
              />
              <div className="font-normal text-lg text-gray-300">
                {selectedLecture?.title || "Select a lecture from the sidebar"}
              </div>
            </div>
          )}
        </div>

        {/* Download Lecture Video if downloadable is true */}
        {selectedLecture?.videoUrl && selectedLecture.downloadable && (
          <a
            href={selectedLecture.videoUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 left-4 bg-black/60 hover:bg-black/90 text-white px-3 py-1.5 rounded-sm flex items-center gap-1.5 text-sm z-30 transition-all font-normal shadow-md"
            title="Download Lecture Video"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        )}

        {/* Previous Lecture Skip Overlay Control */}
        {prevLecture && (
          <button
            onClick={onPrevLecture}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white h-11 w-11 rounded-full flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity duration-200 z-20"
            title={`Previous: ${prevLecture.title}`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Lecture Skip Overlay Control */}
        {nextLecture && (
          <button
            onClick={onNextLecture}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white h-11 w-11 rounded-full flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity duration-200 z-20"
            title={`Next: ${nextLecture.title}`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Float Chevron to Slide-out/Toggle Sidebar if closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#1c1d1f] hover:bg-black border-l border-y border-gray-600 text-white h-12 w-6 flex items-center justify-center rounded-l-md shadow-md z-30"
            title="Open course content sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs and Details Area */}
      <div className="px-6 md:px-12 py-6 flex-1 bg-white">
        {/* Tab switch bar */}
        <div className="border-b border-[#d1d7dc]">
          <nav className="flex space-x-6 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`py-3 px-1 border-b-2 text-lg font-normal transition-all whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "border-[#2d2f31] text-[#2d2f31]"
                    : "border-transparent text-[#6a6f73] hover:text-[#2d2f31]"
                }`}
                onClick={() => setSelectedTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="mt-6 max-w-4xl">
          {selectedTab === "overview" && (
            <article className="space-y-6">
              <div>
                <h1 className="text-2xl font-normal text-[#2d2f31] leading-tight">
                  About this course
                </h1>
                <p className="text-lg mt-2 text-[#6a6f73] font-normal leading-relaxed">
                  {course.subtitles || "Master this subject step-by-step."}
                </p>
              </div>

              {/* Course Meta Info row */}
              <div className="flex items-center gap-x-6 gap-y-2 flex-wrap text-base text-[#2d2f31]">
                <div className="flex items-center gap-1">
                  <span className="font-normal text-[#b4690e]">{ratings.toFixed(1)}</span>
                  <div className="flex items-center text-[#b4690e]">
                    <FaStar className="h-3 w-3 fill-current" />
                  </div>
                  <span className="text-[#5624d0] hover:underline cursor-pointer">
                    {numOfReviews} ratings
                  </span>
                </div>
                <div>
                  <span className="font-normal">{studentCount}</span> students
                </div>
                <div>
                  <span className="font-normal">{formatDurationString(totalDuration)}</span> total
                </div>
              </div>

              <div className="h-px bg-[#d1d7dc]" />

              {/* Detailed specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-base text-[#2d2f31]">
                <div className="space-y-1">
                  <span className="text-[#6a6f73] block">By the numbers</span>
                  <p>Skill level: {level}</p>
                  <p>Students: {studentCount}</p>
                  <p>Languages: {language}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#6a6f73] block">Features</span>
                  <p>Lectures: {totalLectures}</p>
                  <p>Video: {formatDurationString(totalDuration)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[#6a6f73] block">Certificates</span>
                  <p>Get Skillera certificate by completing entire course</p>
                </div>
              </div>

              <div className="h-px bg-[#d1d7dc]" />

              {/* Description */}
              <div className="space-y-3">
                <h2 className="text-xl font-normal text-[#2d2f31]">Description</h2>
                <div
                  className="text-base text-[#2d2f31] leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              </div>

              <div className="h-px bg-[#d1d7dc]" />

              {/* Instructor Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-normal text-[#2d2f31]">Instructor</h2>
                <div className="flex items-start gap-4">
                  <img
                    src={instructorPhoto}
                    alt={instructorName}
                    className="rounded-full w-14 h-14 object-cover border border-gray-200"
                  />
                  <div className="space-y-1">
                    <h3 className="text-xl font-normal text-[#5624d0] hover:underline cursor-pointer">
                      {instructorName}
                    </h3>
                    <p className="text-base text-[#6a6f73]">{instructorHeadline}</p>
                    <div className="flex space-x-3 pt-2">
                      {instructorLinks.facebook && (
                        <a
                          href={instructorLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <FaFacebookF className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {instructorLinks.linkedin && (
                        <a
                          href={instructorLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-blue-700 transition-colors"
                        >
                          <FaLinkedinIn className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {instructorLinks.website && (
                        <a
                          href={instructorLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          <FaLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* ────────────────── Q&A Tab (Picture 3) ────────────────── */}
          {selectedTab === "qna" && (
            <div className="space-y-6 text-[#2d2f31] bg-white py-2">
              {selectedQuestion ? (
                /* Detail Thread screen */
                <div className="space-y-5">
                  <button
                    onClick={() => setSelectedQuestion(null)}
                    className="flex items-center gap-2 text-xl font-normal text-[#5624d0] hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to all questions
                  </button>

                  <div className="border border-[#d1d7dc] p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#2d2f31] text-white flex items-center justify-center font-normal text-base">
                        {selectedQuestion.userId?.name?.slice(0, 2).toUpperCase() || "ST"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-normal">{selectedQuestion.title}</h3>
                        <p className="text-base text-gray-500">
                          Asked by {selectedQuestion.userId?.name || "Student"}{" "}
                          {selectedQuestion.lectureId && `• ${selectedQuestion.lectureId.title}`}
                        </p>
                        <p className="text-base pt-3 leading-relaxed whitespace-pre-wrap">{selectedQuestion.content}</p>
                      </div>
                    </div>
                  </div>

                  {/* Answers thread */}
                  <div className="space-y-4 pl-6 border-l-2 border-[#d1d7dc]">
                    <h4 className="text-base font-normal uppercase tracking-wider text-gray-500">
                      Replies ({selectedQuestion.answers?.length || 0})
                    </h4>

                    {selectedQuestion.answers?.map((ans, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 border border-[#e4e8eb] flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-normal text-base">
                          {ans.userId?.name?.slice(0, 2).toUpperCase() || "ST"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-normal text-[#2d2f31]">
                            {ans.userId?.name || "Student"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(ans.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-base pt-2 leading-relaxed whitespace-pre-wrap">{ans.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleAnswerSubmit} className="space-y-2">
                    <textarea
                      placeholder="Write your answer..."
                      value={newAnswerText}
                      onChange={(e) => setNewAnswerText(e.target.value)}
                      rows={3}
                      className="w-full border border-[#d1d7dc] p-3 text-base outline-none focus:border-[#2d2f31]"
                    />
                    <button
                      type="submit"
                      className="bg-[#2d2f31] hover:bg-black text-white px-4 py-2.5 text-base font-normal transition-colors"
                    >
                      Post Answer
                    </button>
                  </form>
                </div>
              ) : isAsking ? (
                /* Ask Question Screen */
                <form onSubmit={handleAskSubmit} className="space-y-4">
                  <h3 className="text-xl font-normal">Ask a new question</h3>
                  <div className="space-y-1">
                    <label className="text-base font-normal block text-gray-600">Question Title</label>
                    <input
                      type="text"
                      placeholder="Be specific. e.g. Why does my state hook trigger twice?"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full border border-[#d1d7dc] px-3.5 py-2.5 text-base outline-none focus:border-[#2d2f31]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-base font-normal block text-gray-600">Details</label>
                    <textarea
                      rows={5}
                      placeholder="Describe what you tried, what went wrong, and include any error logs or code snippets..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full border border-[#d1d7dc] p-3.5 text-base outline-none focus:border-[#2d2f31]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="bg-[#a435f0] hover:bg-[#8710d8] text-white px-5 py-2.5 text-base font-normal"
                    >
                      Publish Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAsking(false)}
                      className="border border-[#d1d7dc] text-[#2d2f31] hover:bg-gray-100 px-5 py-2.5 text-base font-normal"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Main Question List Screen */
                <div className="space-y-6">
                  {/* Purple Banner trigger helper */}
                  <div className="bg-[#f3ebfc] border border-[#ecebfa] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-lg font-normal flex items-center gap-1.5 text-[#2d2f31]">
                        <Sparkles className="h-4 w-4 text-[#a435f0] fill-current" />
                        Get an instant answer from the assistant
                      </h4>
                      <p className="text-base text-[#6a6f73] font-normal leading-relaxed">
                        Our AI uses context from the course to help answer most questions immediately.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAiModal(true)}
                      className="bg-[#a435f0] hover:bg-[#8710d8] text-white px-4 py-2.5 text-base font-normal transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Get an instant answer
                    </button>
                  </div>

                  {/* Search and Filters row */}
                  <div className="space-y-4">
                    <div className="flex items-center max-w-full">
                      <input
                        type="text"
                        placeholder="Search all course questions"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow border border-[#d1d7dc] px-3.5 py-2.5 text-base outline-none focus:border-[#2d2f31] bg-white h-10 min-w-0"
                      />
                      <button className="h-10 w-10 bg-[#5624d0] hover:bg-[#3b1990] text-white flex items-center justify-center shrink-0">
                        <Search className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Filter by lecture */}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-normal text-gray-500">Filters:</span>
                        <select
                          value={lectureFilter}
                          onChange={(e) => setLectureFilter(e.target.value)}
                          className="border border-[#d1d7dc] px-3.5 py-2 text-base outline-none bg-white h-10 cursor-pointer"
                        >
                          <option value="all">All lectures</option>
                          <option value="current">Current lecture</option>
                        </select>
                      </div>

                      {/* Sort by */}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-normal text-gray-500">Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="border border-[#d1d7dc] px-3.5 py-2 text-base outline-none bg-white h-10 cursor-pointer"
                        >
                          <option value="recommended">Sort by recommended</option>
                          <option value="recent">Sort by recent</option>
                        </select>
                      </div>

                      <button className="border border-[#d1d7dc] hover:bg-gray-50 px-4 h-10 text-base font-normal transition-colors">
                        Filter questions
                      </button>
                    </div>
                  </div>

                  {/* List items block */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xl font-normal">
                      All questions in this course ({filteredQuestions.length})
                    </h3>

                    {qnaLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-[#a435f0]" />
                      </div>
                    ) : filteredQuestions.length === 0 ? (
                      <p className="py-8 text-center text-base text-gray-500 font-normal">
                        No questions found. Be the first to start a conversation!
                      </p>
                    ) : (
                      <div className="divide-y divide-[#d1d7dc]">
                        {filteredQuestions.map((q) => {
                          const initial = q.userId?.name ? q.userId.name.slice(0, 2).toUpperCase() : "ST";
                          const hasUpvoted = q.upvotes?.includes(courseData?.userId); // placeholder check

                          return (
                            <div
                              key={q._id}
                              onClick={() => setSelectedQuestion(q)}
                              className="py-5 flex items-start gap-4 cursor-pointer hover:bg-gray-50/50 transition-all"
                            >
                              {/* Avatar */}
                              <div className="h-10 w-10 rounded-full bg-[#2d2f31] text-white flex items-center justify-center font-normal text-base shrink-0">
                                {initial}
                              </div>

                              {/* Details */}
                              <div className="flex-grow min-w-0 pr-4 space-y-1">
                                <h4 className="text-base font-normal text-[#2d2f31] line-clamp-1 hover:text-[#5624d0]">
                                  {q.title}
                                </h4>
                                <p className="text-sm text-gray-500 line-clamp-1 font-normal">
                                  {q.userId?.name || "Student"}{" "}
                                  {q.lectureId && (
                                    <span className="text-[#5624d0]">
                                      {" "}• {q.lectureId.title}
                                    </span>
                                  )}{" "}
                                  • {new Date(q.createdAt).toLocaleDateString()}
                                </p>
                              </div>

                              {/* Stats counts */}
                              <div className="flex items-center gap-4 shrink-0 text-base text-[#2d2f31]">
                                <button
                                  onClick={(e) => handleUpvoteClick(q._id, e)}
                                  className={`flex flex-col items-center gap-0.5 hover:text-[#a435f0] ${
                                    hasUpvoted ? "text-[#a435f0]" : ""
                                  }`}
                                >
                                  <span className="font-normal">{q.upvotes?.length || 0}</span>
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </button>
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-normal">{q.answers?.length || 0}</span>
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowAiModal(true)}
                      className="bg-[#a435f0] hover:bg-[#8710d8] text-white px-5 py-2.5 text-base font-normal transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Get an instant answer
                    </button>
                    <button
                      onClick={() => setIsAsking(true)}
                      className="border border-[#2d2f31] text-[#2d2f31] hover:bg-gray-100 px-5 py-2.5 text-base font-normal transition-all"
                    >
                      Ask a new question
                    </button>
                  </div>
                </div>
              )}

              {/* AI assistant instant reply Modal */}
              {showAiModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white max-w-lg w-full p-6 space-y-4 rounded-none border border-[#d1d7dc] shadow-2xl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-normal flex items-center gap-1.5 text-[#a435f0]">
                        <Bot className="h-5 w-5" /> Ask AI Learning Assistant
                      </h3>
                      <button
                        onClick={() => {
                          setShowAiModal(false);
                          setAiPrompt("");
                          setAiResponse("");
                        }}
                        className="text-gray-400 hover:text-[#2d2f31] text-2xl font-normal"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAiAsk} className="space-y-3">
                      <p className="text-base text-[#6a6f73] leading-relaxed font-normal">
                        Type any question regarding this course, lectures, or full-stack technologies to get a response.
                      </p>
                      <input
                        type="text"
                        placeholder="e.g. Can you explain the difference between REST and GraphQL?"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full border border-[#d1d7dc] px-3 py-2 text-base outline-none focus:border-[#2d2f31]"
                      />
                      <button
                        type="submit"
                        disabled={aiLoading || !aiPrompt.trim()}
                        className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white py-2 text-base font-normal disabled:opacity-50"
                      >
                        {aiLoading ? "Thinking..." : "Generate Answer"}
                      </button>
                    </form>

                    {aiResponse && (
                      <div className="mt-3 p-4 bg-gray-50 border border-[#d1d7dc] text-base leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                        <span className="font-normal block mb-1 text-[#a435f0]">AI Answer:</span>
                        {aiResponse}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === "flashcards" && (() => {
            const dueCards = flashcardsData?.cards || [];
            const hasDue = dueCards.length > 0;

            const handleManualCreate = async (e) => {
              e.preventDefault();
              if (!manualQuestion.trim() || !manualAnswer.trim()) {
                toast.error("Please fill in both the question and answer.");
                return;
              }
              try {
                await createFlashcard({
                  courseId,
                  question: manualQuestion.trim(),
                  answer: manualAnswer.trim()
                }).unwrap();
                toast.success("Flashcard added successfully!");
                setManualQuestion("");
                setManualAnswer("");
              } catch (err) {
                console.error(err);
                toast.error("Failed to add flashcard.");
              }
            };

            const handleAIGenerate = async () => {
              if (!selectedLecture?._id) {
                toast.error("Please select a lecture first.");
                return;
              }
              try {
                toast.info("Gemini is analyzing the lecture to generate flashcards...");
                const result = await generateAIFlashcards({
                  courseId,
                  lectureId: selectedLecture._id
                }).unwrap();
                toast.success(`Successfully generated ${result.cards?.length || 3} flashcards!`);
              } catch (err) {
                console.error(err);
                toast.error("Failed to generate AI flashcards.");
              }
            };

            const handleScoreReview = async (cardId, score) => {
              try {
                await reviewFlashcard({ cardId, quality: score }).unwrap();
                toast.success("Response recorded!");
                setCardFlipped(false);
                if (activeCardIdx >= dueCards.length - 1) {
                  // Last card finished
                  setIsReviewing(false);
                  setActiveCardIdx(0);
                } else {
                  setActiveCardIdx(prev => prev + 1);
                }
              } catch (err) {
                console.error(err);
                toast.error("Failed to submit score.");
              }
            };

            if (isReviewing && hasDue) {
              const activeCard = dueCards[activeCardIdx];
              if (!activeCard) return null;
              return (
                <div className="space-y-6 max-w-xl mx-auto text-left">
                  <div className="flex justify-between items-center text-base text-gray-500 font-normal">
                    <span>Session: {activeCardIdx + 1} of {dueCards.length} due</span>
                    <button
                      onClick={() => {
                        setIsReviewing(false);
                        setActiveCardIdx(0);
                        setCardFlipped(false);
                      }}
                      className="text-[#a435f0] hover:underline"
                    >
                      Exit review
                    </button>
                  </div>

                  {/* Flipped card deck container */}
                  <div 
                    onClick={() => !cardFlipped && setCardFlipped(true)}
                    className="min-h-[220px] bg-slate-50 border border-slate-200/80 rounded-2xl p-8 flex flex-col justify-center items-center text-center cursor-pointer transition-all shadow-md hover:shadow-lg relative overflow-hidden"
                  >
                    {!cardFlipped ? (
                      <div className="space-y-4">
                        <span className="inline-block px-2.5 py-0.5 bg-purple-100 text-purple-700 text-sm font-normal rounded-full uppercase tracking-wider">
                          Question
                        </span>
                        <p className="text-xl sm:text-2xl font-normal text-slate-800 leading-snug px-4">
                          {activeCard.question}
                        </p>
                        <p className="text-base text-purple-600 font-normal animate-pulse pt-2">
                          Click card to reveal answer
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-sm font-normal rounded-full uppercase tracking-wider">
                          Answer
                        </span>
                        <p className="text-xl font-light text-slate-700 leading-relaxed px-4 max-h-[140px] overflow-y-auto">
                          {activeCard.answer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Score Button Bar */}
                  {cardFlipped && (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm text-center text-slate-400 font-normal uppercase tracking-wider">
                        How well did you recall this answer?
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 0, label: "Forgot", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
                          { val: 3, label: "Hard", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
                          { val: 4, label: "Good", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
                          { val: 5, label: "Easy", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" }
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            onClick={() => handleScoreReview(activeCard._id, btn.val)}
                            className={`py-2.5 border text-base font-normal rounded-xl transition-all shadow-sm ${btn.color}`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 text-left">
                {/* Due status check panel */}
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl flex flex-col items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-normal text-slate-800">Spaced Repetitive Cards</h3>
                      <p className="text-base text-slate-500 leading-relaxed font-normal">
                        Our adaptive system automatically schedules review times for your cards using the SuperMemo-2 spaced recall algorithm to maximize retention.
                      </p>
                    </div>

                    <div className="py-2">
                      {hasDue ? (
                        <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 px-4 py-2.5 rounded-xl text-base font-normal text-purple-700">
                          <BookOpen className="w-4 h-4" />
                          <span>You have {dueCards.length} flashcards due for study today!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-slate-100 border border-slate-200/40 px-4 py-2.5 rounded-xl text-base font-normal text-slate-600">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>All caught up! No flashcards due for review today.</span>
                        </div>
                      )}
                    </div>

                    {hasDue && (
                      <Button
                        onClick={() => {
                          setIsReviewing(true);
                          setActiveCardIdx(0);
                          setCardFlipped(false);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-normal h-11 px-6 rounded-xl"
                      >
                        Start Review Session
                      </Button>
                    )}
                  </div>

                  {/* AI Generation Box */}
                  {selectedLecture && (
                    <div className="border border-purple-100 bg-[#fbf8ff] p-6 rounded-2xl space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-lg font-normal text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-600 fill-current" />
                          Generate Cards with Gemini AI
                        </h4>
                        <p className="text-base text-slate-500 font-normal leading-relaxed">
                          Let AI analyze the current lecture <strong className="text-purple-700">"{selectedLecture.title}"</strong> and create a set of custom study flashcards instantly.
                        </p>
                      </div>
                      <Button
                        onClick={handleAIGenerate}
                        disabled={aiGenerating}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-normal h-10 px-5 rounded-xl gap-2 disabled:opacity-50 text-base"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Auto-Generate Cards</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Manual flashcard creation sidebar */}
                <aside className="border border-slate-200 p-6 rounded-2xl bg-white space-y-4 h-fit">
                  <h3 className="text-lg font-normal text-slate-800 border-b border-slate-100 pb-2">
                    Create Flashcard
                  </h3>
                  <form onSubmit={handleManualCreate} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-normal text-slate-500 uppercase tracking-wider">
                        Question
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. What is state?"
                        value={manualQuestion}
                        onChange={(e) => setManualQuestion(e.target.value)}
                        className="w-full border border-slate-200 p-3 rounded-lg text-base outline-none focus:border-purple-500 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-normal text-slate-500 uppercase tracking-wider">
                        Answer
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. State is a component's memory..."
                        value={manualAnswer}
                        onChange={(e) => setManualAnswer(e.target.value)}
                        className="w-full border border-slate-200 p-3 rounded-lg text-base outline-none focus:border-purple-500 bg-slate-50/50"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-normal h-10 rounded-xl text-base"
                    >
                      Add Flashcard
                    </Button>
                  </form>
                </aside>
              </div>
            );
          })()}

          {selectedTab === "notes" && (
            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 text-center text-base text-gray-500">
              Create and manage study notes to keep track of key concepts during lectures.
            </div>
          )}

          {selectedTab === "announcements" && (
            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 text-center text-base text-gray-500">
              No course announcements posted yet. Check back later for updates from the instructor.
            </div>
          )}

          {selectedTab === "reviews" && (
            <section className="max-w-4xl">
              <ReviewsSection course={course} percentCompleted={percent} />
            </section>
          )}

          {/* ────────────────── Learning Tools Tab (Picture 5) ────────────────── */}
          {selectedTab === "tools" && (
            <div className="space-y-6 text-[#2d2f31] bg-white py-2">
              {isAddingReminder ? (
                /* Add Reminder Form */
                <form onSubmit={handleAddReminder} className="border border-[#d1d7dc] p-5 space-y-4 max-w-md">
                  <h3 className="text-lg font-normal">Add a learning reminder</h3>

                  {/* Time picker */}
                  <div className="space-y-1">
                    <label className="text-base font-normal block text-gray-600">Select Time</label>
                    <div className="flex items-center gap-2 border border-[#d1d7dc] px-3.5 py-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="text-base outline-none bg-transparent w-full"
                      />
                    </div>
                  </div>

                  {/* Day Picker */}
                  <div className="space-y-1">
                    <label className="text-base font-normal block text-gray-600">Select Days</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {daysOfWeek.map((day) => {
                        const selected = reminderDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => toggleDaySelection(day)}
                            className={`px-3 py-1.5 text-base font-normal border transition-all ${
                              selected
                                ? "bg-[#2d2f31] border-[#2d2f31] text-white font-normal"
                                : "border-[#d1d7dc] text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Frequency selection */}
                  <div className="space-y-1">
                    <label className="text-base font-normal block text-gray-600">Frequency</label>
                    <select
                      value={reminderFrequency}
                      onChange={(e) => setReminderFrequency(e.target.value)}
                      className="w-full border border-[#d1d7dc] px-3.5 py-2.5 text-base outline-none bg-white font-normal"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-[#5624d0] hover:bg-[#3b1990] text-white px-4 py-2.5 text-base font-normal"
                    >
                      Save reminder
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingReminder(false)}
                      className="border border-[#d1d7dc] text-gray-700 hover:bg-gray-100 px-4 py-2.5 text-base font-normal"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Main Tools view matching Picture 5 */
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-normal">Learning reminders</h3>
                    <p className="text-base text-[#6a6f73] font-normal leading-relaxed">
                      Set up push notifications or calendar events to stay on track for your learning goals.
                    </p>
                  </div>

                  {/* Display saved reminders list */}
                  {courseReminders && courseReminders.length > 0 && (
                    <div className="space-y-3 max-w-md pt-2">
                      <h4 className="text-base font-normal uppercase tracking-wider text-gray-500">
                        Active Reminders
                      </h4>
                      <div className="divide-y divide-[#d1d7dc]">
                        {courseReminders.map((rem) => (
                          <div key={rem._id} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-[#5624d0] mt-0.5" />
                              <div className="space-y-0.5">
                                <p className="text-base font-normal text-[#2d2f31]">
                                  {rem.days.map((d) => d.slice(0, 3)).join(", ")} at {rem.time}
                                </p>
                                <p className="text-sm text-gray-500 font-normal">
                                  {rem.frequency} Reminder
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleReminderDelete(rem._id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete reminder"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => setIsAddingReminder(true)}
                      className="bg-[#5624d0] hover:bg-[#3b1990] text-white px-5 py-3 text-base font-normal transition-all flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Add a learning reminder
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

MainContent.propTypes = {
  courseData: PropTypes.object,
  selectedLecture: PropTypes.object,
  progress: PropTypes.array,
  onLectureViewed: PropTypes.func.isRequired,
  prevLecture: PropTypes.object,
  nextLecture: PropTypes.object,
  onPrevLecture: PropTypes.func.isRequired,
  onNextLecture: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
};

export default MainContent;
