import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckSquare,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Code,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Sliders,
  Send,
  Loader2,
  BookOpen,
  Sparkles,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useGetCourseSubmissionsQuery,
  useGetSubmissionByIdQuery,
  useGradeSubmissionMutation
} from "@/features/api/assignmentApi";
import { useGetCreatorCourseQuery } from "@/features/api/courseApi";
import { AssignmentNavHeader } from "./AssignmentNavHeader";

const FEEDBACK_PRESETS = [
  "Excellent submission! Code structure is clean, modular, and adheres to all guidelines.",
  "Good attempt. Ensure you handle edge cases and test thoroughly before submitting.",
  "Missing required syntax structures specified in the assignment rules.",
  "High duplication flag detected. Please adhere to the academic honesty policy."
];

const InstructorCheckingSection = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const urlSubmissionId = params.submissionId || location.state?.submissionId || "";
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(urlSubmissionId);

  // Sync if URL param changes
  useEffect(() => {
    if (params.submissionId) {
      setSelectedSubmissionId(params.submissionId);
    }
  }, [params.submissionId]);

  // Selected Course
  const [selectedCourseId, setSelectedCourseId] = useState(
    location.state?.courseId || ""
  );

  const { data: creatorCoursesData, isLoading: isCoursesLoading } = useGetCreatorCourseQuery(undefined);
  const courses = creatorCoursesData?.courses || [];

  // Fetch individual submission details if selected
  const {
    data: subDetailData,
    isLoading: isSubDetailLoading,
    refetch: refetchSubDetail
  } = useGetSubmissionByIdQuery(selectedSubmissionId, {
    skip: !selectedSubmissionId
  });

  const activeSub = subDetailData?.submission;

  // Auto-set courseId from submission if not set
  useEffect(() => {
    if (activeSub?.assignmentId?.courseId && !selectedCourseId) {
      setSelectedCourseId(activeSub.assignmentId.courseId);
    } else if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0]._id);
    }
  }, [activeSub, selectedCourseId, courses]);

  // All submissions for current course (for previous/next navigation & dropdown)
  const { data: courseSubsData } = useGetCourseSubmissionsQuery(selectedCourseId, {
    skip: !selectedCourseId
  });
  const allCourseSubs = courseSubsData?.submissions || [];

  // Grading form state
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [plagiarismThreshold, setPlagiarismThreshold] = useState(0.4);
  const [activeViewerTab, setActiveViewerTab] = useState("code"); // "code" | "ast" | "plagiarism"
  const [copiedCode, setCopiedCode] = useState(false);

  // Populate grading inputs when activeSub changes
  useEffect(() => {
    if (activeSub) {
      setGrade(activeSub.grade !== null && activeSub.grade !== undefined ? String(activeSub.grade) : "");
      setFeedback(activeSub.feedback || "");
    }
  }, [activeSub]);

  // Mutation
  const [gradeSubmission, { isLoading: isGrading }] = useGradeSubmissionMutation();

  // Find index in submissions list for Prev/Next
  const currentIndex = allCourseSubs.findIndex((s) => s._id === selectedSubmissionId);
  const prevSub = currentIndex > 0 ? allCourseSubs[currentIndex - 1] : null;
  const nextSub = currentIndex >= 0 && currentIndex < allCourseSubs.length - 1 ? allCourseSubs[currentIndex + 1] : null;

  const handleSelectSubmission = (subId) => {
    setSelectedSubmissionId(subId);
    navigate(`/instructor/assignments/check/${subId}`, {
      state: { courseId: selectedCourseId, submissionId: subId }
    });
  };

  const handleCopyCode = () => {
    if (activeSub?.extractedText) {
      navigator.clipboard.writeText(activeSub.extractedText);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success("Code copied to clipboard!");
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmissionId) return;

    if (grade === "" || isNaN(Number(grade))) {
      toast.error("Please enter a valid numeric grade.");
      return;
    }

    try {
      const res = await gradeSubmission({
        submissionId: selectedSubmissionId,
        grade: Number(grade),
        feedback: feedback.trim(),
        threshold: Number(plagiarismThreshold)
      }).unwrap();

      if (res.success) {
        toast.success("Grade disbursed and plagiarism scan completed!");
        refetchSubDetail();
      } else {
        toast.error(res.message || "Failed to submit grade.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting grade.");
    }
  };

  const maxPoints = activeSub?.assignmentId?.maxPoints || 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Shared Navigation Header */}
      <AssignmentNavHeader
        selectedCourseId={selectedCourseId}
        onCourseChange={(cId) => {
          setSelectedCourseId(cId);
          setSelectedSubmissionId("");
        }}
        courses={courses}
        isCoursesLoading={isCoursesLoading}
        activeTab="check"
      />

      {/* Submission Picker / Top Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/instructor/assignments/submissions", { state: { courseId: selectedCourseId } })}
            className="text-xs font-light text-slate-600 hover:text-slate-900 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Queue
          </Button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Submission Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-light text-slate-400">Inspecting:</span>
            <select
              value={selectedSubmissionId}
              onChange={(e) => handleSelectSubmission(e.target.value)}
              className="text-xs font-light text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl outline-none max-w-xs truncate cursor-pointer"
            >
              <option value="">-- Choose Submission --</option>
              {allCourseSubs.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.studentId?.name || "Student"} - {sub.assignmentId?.title || "Task"} ({sub.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Previous / Next Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevSub}
            onClick={() => prevSub && handleSelectSubmission(prevSub._id)}
            className="text-xs font-light rounded-xl h-8 px-2.5"
            title={prevSub ? `Previous: ${prevSub.studentId?.name}` : "No previous submission"}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>
          <span className="text-xs font-light text-slate-400">
            {currentIndex >= 0 ? `${currentIndex + 1} of ${allCourseSubs.length}` : `0 of ${allCourseSubs.length}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!nextSub}
            onClick={() => nextSub && handleSelectSubmission(nextSub._id)}
            className="text-xs font-light rounded-xl h-8 px-2.5"
            title={nextSub ? `Next: ${nextSub.studentId?.name}` : "No next submission"}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Main Inspection Workbench */}
      {!selectedSubmissionId ? (
        <div className="bg-white border border-slate-200 py-24 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-light text-slate-800">No Submission Selected</h3>
            <p className="text-sm font-light text-slate-400 max-w-sm mx-auto mt-1">
              Select an incoming student submission from the dropdown above or navigate from the Submissions Arrival inbox to begin checking.
            </p>
          </div>
          <Button
            onClick={() => navigate("/instructor/assignments/submissions", { state: { courseId: selectedCourseId } })}
            className="bg-purple-600 hover:bg-purple-700 text-white font-normal text-xs px-4 py-2 rounded-xl"
          >
            Go to Submissions Arrival
          </Button>
        </div>
      ) : isSubDetailLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-sm font-light text-slate-500">Loading student submission details...</span>
        </div>
      ) : !activeSub ? (
        <div className="py-24 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
          <h3 className="text-base font-normal text-slate-800">Submission not found</h3>
          <p className="text-xs font-light text-slate-400">It may have been removed or deleted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Submission Content & Deep Inspection */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Card: Student Info & Task metadata */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-base font-medium uppercase shadow-xs shrink-0">
                    {activeSub.studentId?.photoUrl ? (
                      <img
                        src={activeSub.studentId.photoUrl}
                        alt={activeSub.studentId.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      activeSub.studentId?.name?.charAt(0) || "S"
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-normal text-slate-900">
                      {activeSub.studentId?.name || "Student"}
                    </h2>
                    <p className="text-xs font-light text-slate-400">
                      {activeSub.studentId?.email}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      activeSub.status === "graded"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {activeSub.status === "graded" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Score: {activeSub.grade} / {maxPoints}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Awaiting Evaluation</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Assignment Title & File Details */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-light text-slate-600">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Assignment</span>
                  <span className="text-sm font-normal text-slate-800">{activeSub.assignmentId?.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Submitted File</span>
                    <span className="font-mono text-slate-700">{activeSub.fileName}</span>
                  </div>
                  {activeSub.fileUrl && (
                    <a
                      href={activeSub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white border border-slate-200 text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Download Original File"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Viewer Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/60 text-xs font-light">
              <button
                onClick={() => setActiveViewerTab("code")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeViewerTab === "code"
                    ? "bg-white text-purple-700 font-normal shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code / Text Content</span>
              </button>

              <button
                onClick={() => setActiveViewerTab("ast")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeViewerTab === "ast"
                    ? "bg-white text-purple-700 font-normal shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AST Syntax Rules</span>
                {activeSub.astValid !== null && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeSub.astValid ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveViewerTab("plagiarism")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeViewerTab === "plagiarism"
                    ? "bg-white text-purple-700 font-normal shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Plagiarism & Duplication</span>
                {activeSub.plagiarismMatches && activeSub.plagiarismMatches.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            </div>

            {/* Viewer Tab 1: Code / Document Content */}
            {activeViewerTab === "code" && (
              <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
                {/* Editor Header */}
                <div className="bg-[#252526] px-4 py-2.5 border-b border-[#333] flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-purple-400" />
                    <span>{activeSub.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-1 rounded bg-[#333] hover:bg-[#444] text-[11px] text-slate-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCode ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="p-4 max-h-[550px] overflow-y-auto leading-relaxed text-indigo-200 whitespace-pre-wrap select-text">
                  {activeSub.extractedText ? (
                    activeSub.extractedText
                  ) : (
                    <span className="text-slate-500 italic">
                      No text or code could be extracted from this file format. You can download the original file above.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Viewer Tab 2: AST Syntax Rules Verification */}
            {activeViewerTab === "ast" && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-normal text-slate-900">
                      AST Structural Verification
                    </h3>
                    <p className="text-xs font-light text-slate-500 mt-0.5">
                      Automated compiler parsing checks verifying presence of required programming constructs.
                    </p>
                  </div>
                  {activeSub.astValid === true ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Passed Prerequisites
                    </span>
                  ) : activeSub.astValid === false ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Missing Syntax
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-light">Non-code submission</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Required Syntax Rules For This Assignment:
                  </div>

                  {activeSub.assignmentId?.requiredStructures?.length === 0 ? (
                    <p className="text-xs font-light text-slate-400 py-3">
                      No specific AST rules were mandated for this assignment.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeSub.assignmentId?.requiredStructures?.map((rule, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-light"
                        >
                          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <div className="font-mono text-slate-800">{rule}</div>
                            <div className="text-[11px] text-slate-400">AST Node Verified</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Viewer Tab 3: Plagiarism & Duplication Inspection */}
            {activeViewerTab === "plagiarism" && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-normal text-slate-900">
                      LSH Duplication & Plagiarism Report
                    </h3>
                    <p className="text-xs font-light text-slate-500 mt-0.5">
                      Locality Sensitive Hashing (LSH) and MinHash comparisons against peer submissions.
                    </p>
                  </div>
                  {activeSub.plagiarismMatches?.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      {activeSub.plagiarismMatches.length} Match Flag(s)
                    </span>
                  ) : activeSub.status === "graded" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      No Duplicates Found
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-light">
                      Scanned during grade submission
                    </span>
                  )}
                </div>

                {activeSub.plagiarismMatches && activeSub.plagiarismMatches.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 font-light">
                      The following peer submissions matched above the sensitivity threshold:
                    </p>
                    <div className="divide-y divide-slate-100 border border-rose-100 rounded-xl bg-rose-50/20 overflow-hidden">
                      {activeSub.plagiarismMatches.map((m, idx) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between text-xs font-light">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="font-normal text-slate-800">{m.id}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            {(m.similarity * 100).toFixed(1)}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs font-light text-slate-400 space-y-1">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p>Clean report! No peer text exceeded the duplication threshold.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Grading Workbench & Feedback Dock */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-5 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-normal">
                  <CheckSquare className="w-5 h-5 text-purple-600" />
                  <span>Evaluation Panel</span>
                </div>
                <span className="text-xs font-light text-slate-400">
                  Max: {maxPoints} pts
                </span>
              </div>

              <form onSubmit={handleGradeSubmit} className="space-y-5">
                {/* Score Input */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                    Final Score (Points) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={maxPoints}
                      step="0.5"
                      placeholder={`0 - ${maxPoints}`}
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      required
                      className="w-full h-12 pl-4 pr-16 text-lg font-normal border border-slate-200 rounded-xl bg-white outline-none focus:border-purple-600 shadow-xs"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-light text-slate-400">
                      / {maxPoints}
                    </span>
                  </div>

                  {/* Quick percentage scoring chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[1.0, 0.9, 0.8, 0.7, 0.5].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setGrade(String(Math.round(maxPoints * pct)))}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 text-[11px] font-light rounded-md transition-colors"
                      >
                        {pct * 100}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plagiarism threshold setting */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                    <span>LSH Plagiarism Limit</span>
                    <span className="text-purple-600 font-normal">
                      {(plagiarismThreshold * 100).toFixed(0)}%
                    </span>
                  </label>
                  <select
                    value={plagiarismThreshold}
                    onChange={(e) => setPlagiarismThreshold(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-light text-slate-700 bg-white outline-none focus:border-purple-600"
                  >
                    <option value="0.2">20% - Strict / High Sensitivity</option>
                    <option value="0.4">40% - Standard Recommended</option>
                    <option value="0.6">60% - Lenient / Broad Match</option>
                  </select>
                </div>

                {/* Feedback Commentary */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-slate-600">
                      Feedback & Notes
                    </label>
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Provide constructive feedback, suggestions for refactoring, or praise..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-3 text-xs font-light border border-slate-200 rounded-xl bg-white outline-none focus:border-purple-600 resize-none shadow-xs"
                  />

                  {/* Preset quick feedbacks */}
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Quick Snippets:
                    </span>
                    <div className="flex flex-col gap-1">
                      {FEEDBACK_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFeedback(preset)}
                          className="text-left text-[11px] font-light text-slate-500 hover:text-purple-700 truncate p-1 rounded hover:bg-purple-50 transition-colors"
                        >
                          "{preset.slice(0, 48)}..."
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Grade Button */}
                <Button
                  type="submit"
                  disabled={isGrading}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-normal text-sm rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  {isGrading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning & Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Save Grade & Scan Duplicates</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCheckingSection;
