import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Play, Check, ChevronDown, ChevronUp, X, Sparkles, Paperclip, Send, Loader2, Bot } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/app/constant";
import { toast } from "sonner";

const CourseSidebar = ({
  courseData,
  selectedLecture,
  setSelectedLecture,
  progress = [],
  onCloseSidebar,
  onToggleLectureProgress,
}) => {
  const [activeTab, setActiveTab] = useState("content");

  // AI Assistant states
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, loading]);

  if (!courseData) {
    return (
      <aside className="w-[360px] bg-white border-l border-[#d1d7dc] flex-shrink-0 p-4">
        Loading...
      </aside>
    );
  }

  const { course } = courseData;

  // Auto-expand all sections for purchased courses
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [openSections, setOpenSections] = useState([]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (course?.sections?.length) {
      setOpenSections(course.sections.map((_, idx) => idx));
    }
  }, [course]);

  const toggleSection = (idx) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0min";
    const mins = Math.round(seconds / 60);
    return `${mins}min`;
  };

  const formatSectionDuration = (seconds) => {
    if (!seconds) return "0min";
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h > 0 ? `${h}hr ${m}min` : `${m}min`;
  };

  const askAI = async (questionText) => {
    const query = questionText || prompt;
    if (!query.trim()) return;

    setLoading(true);
    if (!questionText) setPrompt("");

    // Add user question to conversation list
    setConversation((prev) => [...prev, { role: "user", content: query }]);

    try {
      const host = BASE_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      const res = await axios.post(`${host}/api/v1/ai/ask`, {
        prompt: query,
      });

      const aiResponse = res.data.answer;
      // Add AI response to conversation list
      setConversation((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get response from AI assistant");
      setConversation((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  // Preset question triggers
  const presets = [
    "How is the course helpful to a Full Stack Web Developer?",
    "How do I apply the information from this course to my job?",
    "Explain Special Education to me as if I was a child",
    "Explain Special Education in simpler terms",
  ];

  return (
    <aside className="w-[360px] bg-white border-l border-[#d1d7dc] flex-shrink-0 flex flex-col h-full select-none z-10">
      {/* Sidebar Header Tabs */}
      <div className="flex items-center justify-between border-b border-[#d1d7dc] h-12 bg-white px-2 shrink-0">
        <div className="flex space-x-4 h-full">
          <button
            onClick={() => setActiveTab("content")}
            className={`h-full px-2 text-xs font-bold transition-all relative border-b-2 ${
              activeTab === "content"
                ? "border-[#2d2f31] text-[#2d2f31]"
                : "border-transparent text-[#6a6f73] hover:text-[#2d2f31]"
            }`}
          >
            Course content
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`h-full px-2 text-xs font-bold transition-all relative border-b-2 flex items-center gap-1 ${
              activeTab === "ai"
                ? "border-[#2d2f31] text-[#2d2f31]"
                : "border-transparent text-[#6a6f73] hover:text-[#2d2f31]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#a435f0]" /> AI Assistant
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onCloseSidebar}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 text-[#2d2f31] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {activeTab === "content" ? (
          <div className="divide-y divide-[#d1d7dc]">
            {course.sections?.map((section, idx) => {
              const sectionDuration = section.lectures?.reduce(
                (sum, lecture) => sum + (lecture.durationInSeconds || 0),
                0
              );

              // Calculate total and viewed lectures in section
              const totalLecturesCount = section.lectures?.length || 0;
              const viewedLecturesCount = section.lectures?.filter((lecture) =>
                progress.some((lp) => lp.lectureId === lecture._id && lp.viewed)
              ).length || 0;

              const isSectionOpen = openSections.includes(idx);

              return (
                <div key={section._id} className="bg-white">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full flex justify-between items-start p-4 bg-[#f7f9fa] hover:bg-[#ecebfa]/50 transition-colors text-left border-b border-[#d1d7dc]"
                  >
                    <div className="space-y-1 pr-4">
                      <h3 className="font-bold text-[#2d2f31] text-xs sm:text-sm leading-snug">
                        {section.title}
                      </h3>
                      <p className="text-[10px] text-[#6a6f73] font-normal">
                        {viewedLecturesCount} / {totalLecturesCount} |{" "}
                        {formatSectionDuration(sectionDuration)}
                      </p>
                    </div>
                    <span className="text-gray-500 shrink-0 mt-0.5">
                      {isSectionOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>

                  {/* Lectures List */}
                  {isSectionOpen && (
                    <ul className="divide-y divide-[#e4e8eb] bg-white">
                      {section.lectures?.map((lecture, lIdx) => {
                        const isViewed = progress.some(
                          (lp) => lp.lectureId === lecture._id && lp.viewed
                        );
                        const isSelected = selectedLecture?._id === lecture._id;

                        return (
                          <li
                            key={lecture._id}
                            className={`flex items-start gap-3.5 p-4 cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[#d1d7dc]/60 hover:bg-[#d1d7dc]/70"
                                : "hover:bg-[#f7f9fa]"
                            }`}
                            onClick={() => setSelectedLecture(lecture)}
                          >
                            {/* Checkbox wrapper */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleLectureProgress(lecture._id);
                              }}
                              className="mt-0.5 shrink-0"
                            >
                              <div
                                className={`h-4.5 w-4.5 border flex items-center justify-center transition-all ${
                                  isViewed
                                    ? "bg-[#5624d0] border-[#5624d0] text-white"
                                    : "border-gray-400 hover:border-gray-600 bg-white"
                                }`}
                              >
                                {isViewed && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </button>

                            {/* Lecture Details */}
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4
                                className={`text-[13px] leading-relaxed text-[#2d2f31] ${
                                  isSelected ? "font-bold" : "font-normal"
                                }`}
                              >
                                {lIdx + 1}. {lecture.title}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#6a6f73]">
                                <Play className="h-3 w-3 text-gray-500 fill-gray-400" />
                                <span>{formatDuration(lecture.durationInSeconds)}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Redesigned Premium AI Assistant Tab matching Screenshot 2 */
          <div className="flex flex-col flex-grow h-full bg-white select-none relative min-h-0">
            {/* Conversation / Suggestion Panel */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {conversation.length === 0 ? (
                /* Suggestion Presets Overlay (Udemy style) */
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#2d2f31]">
                      Do you have any questions about this course?
                    </h3>
                    <p className="text-[11px] text-[#6a6f73] leading-relaxed font-normal">
                      Our AI assistant may make mistakes. Verify for accuracy.{" "}
                      <span className="text-[#a435f0] hover:underline cursor-pointer">
                        Terms Apply.
                      </span>
                    </p>
                  </div>

                  {/* Preset Quick Options */}
                  <div className="space-y-3.5">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => askAI(preset)}
                        className="w-full text-left p-3.5 border border-[#d1d7dc] hover:bg-[#f7f9fa] transition-colors rounded-none outline-none block text-xs text-[#2d2f31] leading-relaxed font-normal shadow-none"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat bubble screen list */
                <div className="space-y-4">
                  {conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#a435f0] text-white rounded-none"
                            : "bg-[#f7f9fa] border border-[#d1d7dc] text-[#2d2f31] rounded-none"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-[#a435f0]">
                            <Bot className="h-3.5 w-3.5" /> Course Assistant
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[#f7f9fa] border border-[#d1d7dc] text-[#2d2f31] max-w-[85%] px-3.5 py-2.5 rounded-none text-xs flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#a435f0]" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Question Input Bar */}
            <div className="border-t border-[#d1d7dc] p-4 bg-white shrink-0 space-y-2">
              <div className="flex items-center gap-3.5">
                {/* Paperclip file link indicator */}
                <button className="text-[#6a6f73] hover:text-[#2d2f31] shrink-0 outline-none">
                  <Paperclip className="h-4.5 w-4.5" />
                </button>
                {/* Input Textbox */}
                <input
                  type="text"
                  placeholder="Ask a question"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="flex-grow border border-[#d1d7dc] px-3.5 py-2.5 text-xs outline-none focus:border-[#2d2f31] bg-white text-[#2d2f31] placeholder-gray-400 rounded-none h-10 min-w-0"
                />
                {/* Submit Circle Button */}
                <button
                  onClick={() => askAI()}
                  disabled={loading || !prompt.trim()}
                  className="h-8 w-8 rounded-full bg-[#a435f0] hover:bg-[#8710d8] flex items-center justify-center text-white shrink-0 disabled:opacity-40 disabled:hover:bg-[#a435f0] transition-colors outline-none"
                >
                  <Send className="h-3.5 w-3.5 rotate-[-45deg] translate-x-0.5 -translate-y-0.5" />
                </button>
              </div>

              {/* Feedback Links */}
              <span className="text-[10px] text-[#a435f0] hover:underline cursor-pointer block text-center font-bold">
                Share feedback
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

CourseSidebar.propTypes = {
  courseData: PropTypes.shape({
    course: PropTypes.shape({
      sections: PropTypes.array,
    }),
  }),
  selectedLecture: PropTypes.object,
  setSelectedLecture: PropTypes.func.isRequired,
  progress: PropTypes.array,
  onCloseSidebar: PropTypes.func.isRequired,
  onToggleLectureProgress: PropTypes.func.isRequired,
};

export default CourseSidebar;
