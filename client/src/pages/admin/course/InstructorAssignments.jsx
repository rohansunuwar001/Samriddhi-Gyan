import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  Clock,
  Award,
  Users,
  Calendar,
  Plus,
  Loader2,
  BookOpen,
  Code,
  FileSpreadsheet,
  Trash2,
  Inbox,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useGetCourseAssignmentsQuery,
  useCreateAssignmentMutation,
  useDeleteAssignmentMutation
} from "@/features/api/assignmentApi";
import {
  useGetCreatorCourseQuery,
  useGetCourseByIdQuery
} from "@/features/api/courseApi";
import { AssignmentNavHeader } from "./AssignmentNavHeader";

const AVAILABLE_AST_STRUCTURES = [
  { value: "VariableDeclaration", label: "Variable Declarations", hint: "const, let, or var" },
  { value: "ForStatement", label: "For Loop Blocks", hint: "for (let i=0;...)" },
  { value: "WhileStatement", label: "While Loop Blocks", hint: "while (condition)" },
  { value: "FunctionDeclaration", label: "Function Declarations", hint: "function calculate() {}" },
  { value: "CallExpression", label: "Function Invocations", hint: "mathFunc(), doSomething()" }
];

const InstructorAssignments = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get courseId from params, state, or empty
  const [selectedCourseId, setSelectedCourseId] = useState(
    params.courseId || location.state?.courseId || ""
  );
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: creatorCoursesData, isLoading: isCoursesLoading } = useGetCreatorCourseQuery(undefined, {
    skip: !!params.courseId
  });

  const courses = creatorCoursesData?.courses || [];

  // Auto-select first course if none selected
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  const { data: assignmentsData, isLoading: isAsmsLoading, refetch: refetchAsms } = useGetCourseAssignmentsQuery(
    selectedCourseId,
    { skip: !selectedCourseId }
  );

  const { data: courseDetailData } = useGetCourseByIdQuery(selectedCourseId, {
    skip: !selectedCourseId
  });

  const [createAssignment, { isLoading: isCreating }] = useCreateAssignmentMutation();
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation();

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("coding");
  const [newDeadline, setNewDeadline] = useState("");
  const [newMaxPoints, setNewMaxPoints] = useState(100);
  const [newRequiredAst, setNewRequiredAst] = useState([]);

  const assignments = assignmentsData?.assignments || [];

  const handleRequiredAstToggle = (value) => {
    if (newRequiredAst.includes(value)) {
      setNewRequiredAst(newRequiredAst.filter((v) => v !== value));
    } else {
      setNewRequiredAst([...newRequiredAst, value]);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error("Please choose a course first.");
      return;
    }
    if (!newTitle.trim()) {
      toast.error("Please provide an assignment title.");
      return;
    }
    if (!newDesc.trim()) {
      toast.error("Please provide clear task instructions.");
      return;
    }
    if (!newDeadline) {
      toast.error("Please specify a deadline date and time.");
      return;
    }

    try {
      const res = await createAssignment({
        title: newTitle.trim(),
        description: newDesc.trim(),
        type: newType,
        courseId: selectedCourseId,
        sectionId: selectedSectionId || null,
        requiredStructures: newType === "coding" ? newRequiredAst : [],
        maxPoints: Number(newMaxPoints) || 100,
        deadline: new Date(newDeadline).toISOString()
      }).unwrap();

      if (res.success) {
        toast.success("Assignment published successfully!");
        setNewTitle("");
        setNewDesc("");
        setNewDeadline("");
        setNewMaxPoints(100);
        setNewRequiredAst([]);
        setSelectedSectionId("");
        setIsCreateOpen(false);
        refetchAsms();
      } else {
        toast.error(res.message || "Failed to publish assignment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating assignment.");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment and all its student submissions?")) {
      return;
    }
    try {
      const res = await deleteAssignment(assignmentId).unwrap();
      if (res.success) {
        toast.success("Assignment deleted.");
        refetchAsms();
      } else {
        toast.error(res.message || "Could not delete assignment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting assignment.");
    }
  };

  // Metrics
  const codingCount = assignments.filter((a) => a.type === "coding").length;
  const essayCount = assignments.filter((a) => a.type === "essay").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Shared Navigation Header */}
      <AssignmentNavHeader
        selectedCourseId={selectedCourseId}
        onCourseChange={(cId) => setSelectedCourseId(cId)}
        courses={courses}
        isCoursesLoading={isCoursesLoading}
        activeTab="assignments"
        extraActions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-normal text-sm px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Create Assignment</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-light text-slate-900">
                  New Course Assignment
                </DialogTitle>
                <DialogDescription className="text-sm font-light text-slate-500">
                  Configure assignment guidelines, target curriculum sections, and automated structural syntax rules.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateAssignment} className="space-y-6 mt-4">
                {/* 1. Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Asynchronous JavaScript & Fetch API"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full h-11 px-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white outline-none focus:border-purple-600 text-sm font-light shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Instructions & Problem Statement *
                    </label>
                    <textarea
                      placeholder="Specify task guidelines, input parameters, expected output format, and rules..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={4}
                      required
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-slate-800 bg-white outline-none focus:border-purple-600 text-sm font-light resize-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Target Course Section (Optional)
                    </label>
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-800 bg-white outline-none focus:border-purple-600 text-sm font-light shadow-xs"
                    >
                      <option value="">Course-wide (Available to all enrolled students)</option>
                      {courseDetailData?.course?.sections?.map((sec) => (
                        <option key={sec._id} value={sec._id}>
                          Section: {sec.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Type & Scoring */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">
                      Assignment Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewType("coding")}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          newType === "coding"
                            ? "border-purple-600 bg-purple-50/40 text-purple-900 ring-1 ring-purple-600"
                            : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                          <Code className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-normal">Coding Exercise</div>
                          <div className="text-xs text-slate-500 font-light">With AST & code checks</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewType("essay")}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          newType === "essay"
                            ? "border-purple-600 bg-purple-50/40 text-purple-900 ring-1 ring-purple-600"
                            : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-normal">Document / Essay</div>
                          <div className="text-xs text-slate-500 font-light">Report or written submission</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                        Max Points
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={newMaxPoints}
                        onChange={(e) => setNewMaxPoints(e.target.value)}
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-800 bg-white outline-none focus:border-purple-600 text-sm font-light shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                        Submission Deadline *
                      </label>
                      <input
                        type="datetime-local"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        required
                        className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-800 bg-white outline-none focus:border-purple-600 text-sm font-light shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. AST Syntax Rules for Coding */}
                {newType === "coding" && (
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-700">
                        Required AST Syntax Structures
                      </label>
                      <p className="text-xs text-slate-500 font-light mt-0.5">
                        The platform will automatically parse submissions into an Abstract Syntax Tree to ensure required patterns are present.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {AVAILABLE_AST_STRUCTURES.map((struct) => {
                        const isChecked = newRequiredAst.includes(struct.value);
                        return (
                          <div
                            key={struct.value}
                            onClick={() => handleRequiredAstToggle(struct.value)}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? "border-purple-500 bg-purple-50/30 text-purple-900"
                                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                            />
                            <div>
                              <div className="text-xs font-medium">{struct.label}</div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{struct.hint}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="font-light text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-normal text-sm px-6"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Assignment"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Course Not Selected View */}
      {!selectedCourseId ? (
        <div className="bg-white border border-slate-200 py-20 rounded-2xl text-center space-y-4 shadow-xs">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-light text-slate-800">Select a Course</h3>
          <p className="text-sm font-light text-slate-400 max-w-sm mx-auto">
            Pick one of your courses from the header dropdown above to view, create, or evaluate assignments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-medium">
                <span>Total Assignments</span>
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-light text-slate-900 mt-2">
                {assignments.length}
              </div>
              <div className="text-xs font-light text-slate-400 mt-1">
                Active tasks for this course
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-medium">
                <span>Coding Tasks</span>
                <Code className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-light text-slate-900 mt-2">
                {codingCount}
              </div>
              <div className="text-xs font-light text-slate-400 mt-1">
                With automated AST parsing
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-wider font-medium">
                <span>Written / Essays</span>
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-light text-slate-900 mt-2">
                {essayCount}
              </div>
              <div className="text-xs font-light text-slate-400 mt-1">
                Document reports
              </div>
            </div>
          </div>

          {/* Assignments List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-light text-slate-900">
                  Course Assignment Tasks
                </h2>
                <p className="text-xs sm:text-sm font-light text-slate-500 mt-0.5">
                  All created assignments currently published for this course.
                </p>
              </div>
              <div className="text-xs font-light text-slate-400">
                Showing {assignments.length} total tasks
              </div>
            </div>

            {isAsmsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-sm font-light text-slate-500">Loading assignments...</span>
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-normal text-slate-800">No Assignments Yet</h3>
                  <p className="text-xs font-light text-slate-400 max-w-sm mx-auto mt-1">
                    You haven't uploaded any assignments for this course. Click "+ Create Assignment" to get started!
                  </p>
                </div>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-normal text-xs px-4 py-2 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Create Your First Assignment
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignments.map((asm) => {
                  const isPastDeadline = new Date(asm.deadline) < new Date();
                  return (
                    <div
                      key={asm._id}
                      className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      {/* Left: Info */}
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                              asm.type === "coding"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                : "bg-blue-50 text-blue-700 border border-blue-200/60"
                            }`}
                          >
                            {asm.type === "coding" ? (
                              <Code className="w-3 h-3" />
                            ) : (
                              <FileSpreadsheet className="w-3 h-3" />
                            )}
                            {asm.type}
                          </span>

                          <span className="text-xs font-light text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            {asm.sectionId?.title ? `Section: ${asm.sectionId.title}` : "Course-wide"}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-light ${
                              isPastDeadline
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isPastDeadline ? "Past Deadline" : "Open for Submissions"}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-normal text-slate-900">
                            {asm.title}
                          </h3>
                          <p className="text-xs sm:text-sm font-light text-slate-500 line-clamp-2 mt-1">
                            {asm.description}
                          </p>
                        </div>

                        {/* AST tag rules if present */}
                        {asm.requiredStructures && asm.requiredStructures.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] text-slate-400 font-light mr-1">Required AST:</span>
                            {asm.requiredStructures.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Meta & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                        <div className="text-left sm:text-right space-y-1">
                          <div className="text-sm font-normal text-slate-800">
                            {asm.maxPoints} Points
                          </div>
                          <div className="text-xs font-light text-slate-400 flex items-center sm:justify-end gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(asm.deadline).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => {
                              navigate("/instructor/assignments/submissions", {
                                state: { courseId: selectedCourseId, assignmentId: asm._id }
                              });
                            }}
                            variant="outline"
                            className="text-xs font-light flex items-center gap-1.5 h-9 rounded-xl border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                            <span>Arrival Queue</span>
                          </Button>

                          <Button
                            onClick={() => handleDeleteAssignment(asm._id)}
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting}
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAssignments;
