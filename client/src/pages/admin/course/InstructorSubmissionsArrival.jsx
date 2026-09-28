import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Award,
  Users,
  Eye,
  FileCode,
  FileText,
  Loader2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetCourseSubmissionsQuery,
  useGetCourseAssignmentsQuery
} from "@/features/api/assignmentApi";
import { useGetCreatorCourseQuery } from "@/features/api/courseApi";
import { AssignmentNavHeader } from "./AssignmentNavHeader";

const InstructorSubmissionsArrival = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCourseId, setSelectedCourseId] = useState(
    params.courseId || location.state?.courseId || ""
  );
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState(
    location.state?.assignmentId || "all"
  );
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "submitted" | "graded"
  const [searchQuery, setSearchQuery] = useState("");

  // Courses
  const { data: creatorCoursesData, isLoading: isCoursesLoading } = useGetCreatorCourseQuery(undefined, {
    skip: !!params.courseId
  });
  const courses = creatorCoursesData?.courses || [];

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  // Assignments for filter dropdown
  const { data: assignmentsData } = useGetCourseAssignmentsQuery(selectedCourseId, {
    skip: !selectedCourseId
  });
  const assignments = assignmentsData?.assignments || [];

  // All submissions for the course
  const {
    data: subsData,
    isLoading: isSubsLoading,
    refetch: refetchSubs
  } = useGetCourseSubmissionsQuery(selectedCourseId, {
    skip: !selectedCourseId
  });

  const allSubmissions = subsData?.submissions || [];

  // Filtering
  const filteredSubmissions = allSubmissions.filter((sub) => {
    // Assignment filter
    if (
      selectedAssignmentFilter !== "all" &&
      sub.assignmentId?._id !== selectedAssignmentFilter &&
      sub.assignmentId !== selectedAssignmentFilter
    ) {
      return false;
    }
    // Status filter
    if (statusFilter !== "all" && sub.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const studentName = sub.studentId?.name?.toLowerCase() || "";
      const studentEmail = sub.studentId?.email?.toLowerCase() || "";
      const asmTitle = sub.assignmentId?.title?.toLowerCase() || "";
      const fileName = sub.fileName?.toLowerCase() || "";
      return (
        studentName.includes(q) ||
        studentEmail.includes(q) ||
        asmTitle.includes(q) ||
        fileName.includes(q)
      );
    }
    return true;
  });

  // Metrics
  const totalCount = allSubmissions.length;
  const pendingCount = allSubmissions.filter((s) => s.status !== "graded").length;
  const gradedCount = allSubmissions.filter((s) => s.status === "graded").length;
  const flaggedCount = allSubmissions.filter(
    (s) => s.plagiarismMatches && s.plagiarismMatches.length > 0
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Shared Navigation Header */}
      <AssignmentNavHeader
        selectedCourseId={selectedCourseId}
        onCourseChange={(cId) => setSelectedCourseId(cId)}
        courses={courses}
        isCoursesLoading={isCoursesLoading}
        activeTab="submissions"
      />

      {!selectedCourseId ? (
        <div className="bg-white border border-slate-200 py-20 rounded-2xl text-center space-y-4 shadow-xs">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-light text-slate-800">Select a Course</h3>
          <p className="text-sm font-light text-slate-400 max-w-sm mx-auto">
            Choose a course to view newly arrived student submissions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-medium">
                <span>Total Received</span>
                <Inbox className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-light text-slate-900 mt-2">
                {totalCount}
              </div>
              <div className="text-xs font-light text-slate-400 mt-1">
                Submissions across all tasks
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-medium">
                <span>Awaiting Review</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-light text-amber-600 mt-2">
                {pendingCount}
              </div>
              <div className="text-xs font-light text-slate-400 mt-1">
                Needs inspection & grading
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-medium">
                <span>Graded / Checked</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-light text-emerald-600 mt-2">
                {gradedCount}
              </div>
              <div className="text-xs font-light text-slate-400 mt-1">
                Completed evaluations
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-medium">
                <span>Plagiarism Flags</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-3xl font-light text-rose-600 mt-2">
                {flaggedCount}
              </div>
              <div className="text-xs font-light text-slate-400 mt-1">
                Submissions with high similarity
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, email, assignment, or file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm font-light border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-purple-600 outline-none"
              />
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Assignment filter dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedAssignmentFilter}
                  onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
                  className="bg-transparent text-xs font-light text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">All Assignments</option>
                  {assignments.map((asm) => (
                    <option key={asm._id} value={asm._id}>
                      {asm.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status pills */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-light transition-all ${
                    statusFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs font-normal"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All ({allSubmissions.length})
                </button>
                <button
                  onClick={() => setStatusFilter("submitted")}
                  className={`px-3 py-1.5 rounded-lg font-light transition-all ${
                    statusFilter === "submitted"
                      ? "bg-white text-amber-700 shadow-xs font-normal"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter("graded")}
                  className={`px-3 py-1.5 rounded-lg font-light transition-all ${
                    statusFilter === "graded"
                      ? "bg-white text-emerald-700 shadow-xs font-normal"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Graded ({gradedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Submissions Arrival Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light text-slate-900">
                  Submissions Queue
                </h2>
                <p className="text-xs sm:text-sm font-light text-slate-500 mt-0.5">
                  Real-time arrival feed of student submissions ready for inspection.
                </p>
              </div>
              <span className="text-xs font-light text-slate-400">
                {filteredSubmissions.length} of {allSubmissions.length} shown
              </span>
            </div>

            {isSubsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-sm font-light text-slate-500">Loading incoming submissions...</span>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-normal text-slate-800">No Submissions Found</h3>
                  <p className="text-xs font-light text-slate-400 max-w-sm mx-auto mt-1">
                    {searchQuery || statusFilter !== "all" || selectedAssignmentFilter !== "all"
                      ? "No submissions matched your current filters. Try changing or clearing the filters above."
                      : "No student submissions have arrived yet for this course."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-light border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3.5 px-6 font-medium">Student</th>
                      <th className="py-3.5 px-6 font-medium">Assignment</th>
                      <th className="py-3.5 px-6 font-medium">Submitted</th>
                      <th className="py-3.5 px-6 font-medium">Code/AST Status</th>
                      <th className="py-3.5 px-6 font-medium">Plagiarism</th>
                      <th className="py-3.5 px-6 font-medium">Status & Score</th>
                      <th className="py-3.5 px-6 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map((sub) => {
                      const isGraded = sub.status === "graded";
                      const hasPlagFlag = sub.plagiarismMatches && sub.plagiarismMatches.length > 0;
                      return (
                        <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Student */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium uppercase shrink-0">
                                {sub.studentId?.photoUrl ? (
                                  <img
                                    src={sub.studentId.photoUrl}
                                    alt={sub.studentId.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  sub.studentId?.name?.charAt(0) || "S"
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-normal text-slate-900 truncate">
                                  {sub.studentId?.name || "Student"}
                                </div>
                                <div className="text-xs text-slate-400 font-light truncate">
                                  {sub.studentId?.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Assignment */}
                          <td className="py-4 px-6">
                            <div className="min-w-0 max-w-xs">
                              <div className="text-sm font-normal text-slate-800 truncate">
                                {sub.assignmentId?.title || "Assignment"}
                              </div>
                              <div className="text-xs text-slate-400 font-light flex items-center gap-1.5 mt-0.5">
                                <span className="uppercase text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                  {sub.assignmentId?.type || "task"}
                                </span>
                                <span className="truncate">{sub.fileName}</span>
                              </div>
                            </div>
                          </td>

                          {/* Submitted Timestamp */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="text-xs text-slate-700">
                              {new Date(sub.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(sub.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </td>

                          {/* Code/AST Status */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {sub.astValid === true ? (
                              <span className="inline-flex items-center gap-1 text-xs font-light text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                AST Passed
                              </span>
                            ) : sub.astValid === false ? (
                              <span className="inline-flex items-center gap-1 text-xs font-light text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Missing Rules
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-light">
                                Standard Doc
                              </span>
                            )}
                          </td>

                          {/* Plagiarism */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {hasPlagFlag ? (
                              <span className="inline-flex items-center gap-1 text-xs font-light text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                {sub.plagiarismMatches.length} Flag(s)
                              </span>
                            ) : isGraded ? (
                              <span className="inline-flex items-center gap-1 text-xs font-light text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Clean (0%)
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-light">
                                Scanned on Grade
                              </span>
                            )}
                          </td>

                          {/* Status & Grade */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            {isGraded ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-md">
                                  Score: {sub.grade} / {sub.assignmentId?.maxPoints || 100}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-light text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Needs Review
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <Button
                              onClick={() => {
                                navigate(`/instructor/assignments/check/${sub._id}`, {
                                  state: { courseId: selectedCourseId, submissionId: sub._id }
                                });
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-normal text-xs px-3.5 py-1.5 h-8 rounded-xl shadow-xs inline-flex items-center gap-1.5"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>{isGraded ? "Re-evaluate" : "Check & Grade"}</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorSubmissionsArrival;
