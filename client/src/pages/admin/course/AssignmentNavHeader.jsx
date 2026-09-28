import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  Inbox,
  CheckSquare,
  BookOpen,
  ChevronRight,
  Layers,
  Sparkles
} from "lucide-react";

export const AssignmentNavHeader = ({
  selectedCourseId,
  onCourseChange,
  courses = [],
  isCoursesLoading = false,
  activeTab = "assignments",
  extraActions = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: "assignments",
      label: "Assignment Tasks",
      icon: <FileText className="w-4 h-4" />,
      path: "/instructor/assignments",
    },
    {
      id: "submissions",
      label: "Submissions Arrival",
      icon: <Inbox className="w-4 h-4" />,
      path: "/instructor/assignments/submissions",
    },
    {
      id: "check",
      label: "Checking & Grading",
      icon: <CheckSquare className="w-4 h-4" />,
      path: "/instructor/assignments/check",
    },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Academic Evaluation Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-tight">
            Assignment Studio
          </h1>
          <p className="text-sm sm:text-base font-light text-slate-500 mt-1 max-w-2xl">
            Design structured coursework, manage student arrivals in real-time, and run automated AST syntax validation & LSH duplication checks.
          </p>
        </div>

        {/* Right side course selector & action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-xs">
            <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
            <select
              value={selectedCourseId}
              onChange={(e) => onCourseChange(e.target.value)}
              disabled={isCoursesLoading}
              className="bg-transparent text-sm font-light text-slate-800 outline-none w-full max-w-[220px] truncate cursor-pointer"
            >
              <option value="">-- Choose Course --</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {extraActions}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit max-w-full overflow-x-auto border border-slate-200/60 shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                // Preserve query or navigate directly
                navigate(tab.path, { state: { courseId: selectedCourseId } });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-light transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white text-purple-700 font-normal shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span className={isActive ? "text-purple-600" : "text-slate-400"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
