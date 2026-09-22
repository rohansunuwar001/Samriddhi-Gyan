import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Sliders,
  Plus,
  Loader2,
  BookOpen,
  History,
  Eye,
  Info,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useGetCourseAssignmentsQuery,
  useCreateAssignmentMutation,
  useGetAssignmentSubmissionsQuery,
  useGradeSubmissionMutation
} from "@/features/api/assignmentApi";
import {
  useGetCreatorCourseQuery,
  useGetCourseByIdQuery
} from "@/features/api/courseApi";

const AVAILABLE_AST_STRUCTURES = [
  { value: "VariableDeclaration", label: "Variable Declarations (const/let/var)" },
  { value: "ForStatement", label: "For Loop Blocks (for)" },
  { value: "WhileStatement", label: "While Loop Blocks (while)" },
  { value: "FunctionDeclaration", label: "Function Declarations" },
  { value: "CallExpression", label: "Function Invocations / Calls" }
];

const InstructorAssignments = () => {
  const params = useParams();
  const [selectedCourseId, setSelectedCourseId] = useState(params.courseId || "");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const { data: creatorCoursesData, isLoading: isCoursesLoading } = useGetCreatorCourseQuery(undefined, {
    skip: !!params.courseId
  });

  const { data: assignmentsData, isLoading: isAsmsLoading, refetch: refetchAsms } = useGetCourseAssignmentsQuery(selectedCourseId, {
    skip: !selectedCourseId
  });

  const { data: courseDetailData } = useGetCourseByIdQuery(selectedCourseId, {
    skip: !selectedCourseId
  });

  const [createAssignment, { isLoading: isCreating }] = useCreateAssignmentMutation();
  const [gradeSubmission, { isLoading: isGrading }] = useGradeSubmissionMutation();

  const [activeAssignmentId, setActiveAssignmentId] = useState("");
  const { data: subsData, refetch: refetchSubs } = useGetAssignmentSubmissionsQuery(activeAssignmentId, {
    skip: !activeAssignmentId
  });

  const [selectedSub, setSelectedSub] = useState(null);

  // Grading form state
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [plagiarismThreshold, setPlagiarismThreshold] = useState(0.4);

  // New assignment form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("coding");
  const [newDeadline, setNewDeadline] = useState("");
  const [newMaxPoints, setNewMaxPoints] = useState(100);
  const [newRequiredAst, setNewRequiredAst] = useState([]);

  const assignments = assignmentsData?.assignments || [];
  const submissions = subsData?.submissions || [];

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value);
    setActiveAssignmentId("");
    setSelectedSub(null);
    setSelectedSectionId("");
  };

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
      toast.error("Please select a course first.");
      return;
    }
    if (!newTitle.trim() || !newDesc.trim() || !newDeadline) {
      toast.error("Please fill in title, description and deadline.");
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
        toast.success("Assignment created successfully!");
        setNewTitle("");
        setNewDesc("");
        setNewDeadline("");
        setNewMaxPoints(100);
        setNewRequiredAst([]);
        setSelectedSectionId("");
        refetchAsms();
      } else {
        toast.error(res.message || "Failed to create assignment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating assignment.");
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      const res = await gradeSubmission({
        submissionId: selectedSub._id,
        grade: Number(grade),
        feedback: feedback.trim(),
        threshold: Number(plagiarismThreshold)
      }).unwrap();

      if (res.success) {
        toast.success("Submission graded and scanned for plagiarism!");
        refetchSubs();
        setSelectedSub(res.submission); // update panel view
      } else {
        toast.error(res.message || "Failed to submit grade.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting grade.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200 pb-5 mb-8">
        <div>
          <h1 className="text-5xl font-extralight text-slate-900">Assignment Manager</h1>
          <p className="text-lg font-extralight text-slate-500 mt-1">Create course tasks and inspect/grade student submissions with AST and LSH duplication tools.</p>
        </div>
      </div>

      {/* Course Selector (visible only in global context) */}
      {!params.courseId && (
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mb-8 space-y-3">
          <label className="text-xl font-extralight text-slate-700 block">Select Course to Manage Assignments</label>
          {isCoursesLoading ? (
            <div className="flex items-center gap-2 text-base font-extralight text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span>Loading your courses...</span>
            </div>
          ) : (
            <select
              value={selectedCourseId}
              onChange={handleCourseChange}
              className="w-full max-w-md h-10 px-3 border border-slate-200 rounded-lg text-slate-800 bg-white outline-none focus:border-purple-600 text-base font-extralight"
            >
              <option value="">-- Choose a Course --</option>
              {creatorCoursesData?.courses?.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {!selectedCourseId ? (
        <div className="bg-white border border-slate-200 py-16 rounded-xl text-center space-y-3 shadow-sm">
          <BookOpen className="h-10 w-10 text-slate-350 mx-auto" />
          <h3 className="text-2xl font-extralight text-slate-750">No Course Selected</h3>
          <p className="text-base font-extralight text-slate-400 max-w-xs mx-auto">Please choose one of your courses from the selector above to start managing assignments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
        {/* Left Column: Create & List Assignments */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assignment Creation Form */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-3xl font-extralight text-slate-800 flex items-center gap-1.5">
              <Plus className="h-5 w-5 text-purple-600 shrink-0" />
              Create New Assignment
            </h2>
            <form onSubmit={handleCreateAssignment} className="space-y-4 text-base font-extralight">
              <div className="space-y-1">
                <label className="text-base font-extralight text-slate-700">Assignment Title</label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript Arrays Exercise"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-250 rounded-lg text-slate-800 bg-white outline-none focus:border-purple-600 text-base font-extralight"
                />
              </div>

              <div className="space-y-1">
                <label className="text-base font-extralight text-slate-700">Task Description</label>
                <textarea
                  placeholder="Explain instructions, parameters, or guidelines..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full h-20 p-3 border border-slate-250 rounded-lg text-slate-800 bg-white outline-none focus:border-purple-600 resize-none text-base font-extralight"
                />
              </div>

              <div className="space-y-1">
                <label className="text-base font-extralight text-slate-700">Target Section (Assign To)</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full h-9 px-2 border border-slate-250 rounded-lg text-slate-800 bg-white focus:border-purple-600 outline-none text-base font-extralight"
                >
                  <option value="">Course-wide (As Whole / No Section)</option>
                  {courseDetailData?.course?.sections?.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      Section: {sec.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-base font-extralight text-slate-700">Task Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full h-9 px-2 border border-slate-250 rounded-lg text-slate-800 bg-white focus:border-purple-600 outline-none text-base font-extralight"
                  >
                    <option value="coding">Coding File</option>
                    <option value="essay">Essay Document</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-base font-extralight text-slate-700">Max Points</label>
                  <input
                    type="number"
                    value={newMaxPoints}
                    onChange={(e) => setNewMaxPoints(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-250 rounded-lg text-slate-800 bg-white outline-none focus:border-purple-600 text-base font-extralight"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-base font-extralight text-slate-700">Deadline</label>
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-250 rounded-lg text-slate-800 bg-white outline-none focus:border-purple-600 text-base font-extralight"
                />
              </div>

              {/* AST checklist if coding is selected */}
              {newType === "coding" && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-base font-extralight text-slate-700 block mb-1">
                    Required AST Syntax Rules
                  </label>
                  <div className="space-y-1.5">
                    {AVAILABLE_AST_STRUCTURES.map((struct) => (
                      <label key={struct.value} className="flex items-center gap-2 text-slate-600 text-sm font-extralight">
                        <input
                          type="checkbox"
                          checked={newRequiredAst.includes(struct.value)}
                          onChange={() => handleRequiredAstToggle(struct.value)}
                          className="rounded border-slate-350 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                        />
                        {struct.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isCreating}
                className="w-full h-9 bg-purple-700 text-white hover:bg-purple-800 font-extralight text-base flex justify-center items-center gap-1.5 shadow-sm"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving Task...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Save Assignment
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Assignments List */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-3xl font-extralight text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-5 w-5 text-slate-500 shrink-0" />
              Existing Assignments
            </h2>
            {isAsmsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-base font-extralight text-slate-450 text-center py-4">No assignments created yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((asm) => (
                  <div
                    key={asm._id}
                    onClick={() => {
                      setActiveAssignmentId(asm._id);
                      setSelectedSub(null);
                    }}
                    className={`border p-3.5 rounded-lg cursor-pointer transition-all ${
                      activeAssignmentId === asm._id
                        ? "border-purple-600 bg-purple-50/10"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-base font-extralight text-slate-800 truncate max-w-[180px]">{asm.title}</span>
                      <span className="uppercase text-[10px] font-extralight px-1.5 py-0.5 rounded bg-slate-100 border text-slate-500">
                        {asm.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Submissions List */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4 min-h-[500px]">
            <h2 className="text-3xl font-extralight text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Users className="h-5 w-5 text-slate-500 shrink-0" />
              Student Submissions
            </h2>

            {activeAssignmentId ? (
              submissions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm space-y-2">
                  <Info className="h-6 w-6 text-slate-300 mx-auto" />
                  <p>No student submissions received yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {submissions.map((sub) => (
                    <div
                      key={sub._id}
                      onClick={() => {
                        setSelectedSub(sub);
                        setGrade(sub.grade !== null ? String(sub.grade) : "");
                        setFeedback(sub.feedback || "");
                      }}
                      className={`border p-3.5 rounded-lg cursor-pointer transition-all text-sm flex justify-between items-center gap-4 ${
                        selectedSub?._id === sub._id
                          ? "border-purple-600 bg-purple-50/10"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-base font-extralight text-slate-800 block">
                          {sub.studentId?.name || "Student"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-extralight">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge
                        className={
                          sub.status === "graded"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-extralight"
                            : "bg-amber-100 text-amber-800 border-amber-200 text-[9px] font-extralight"
                        }
                      >
                        {sub.status === "graded" ? `Graded: ${sub.grade}` : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-24 text-slate-400 text-base font-extralight space-y-2">
                <Info className="h-6 w-6 text-slate-350 mx-auto" />
                <p>Select an assignment on the left to load student submissions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inspect and Grade Dashboard */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-5 min-h-[500px]">
            <h2 className="text-3xl font-extralight text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Eye className="h-5 w-5 text-slate-600 shrink-0" />
              Inspection Dashboard
            </h2>

            {selectedSub ? (
              <div className="space-y-5">
                {/* Student details */}
                <div className="text-sm space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-150 font-extralight">
                  <span className="text-[9px] uppercase font-extralight text-purple-600 block">Student Profile</span>
                  <div className="text-lg font-extralight text-slate-800">
                    {selectedSub.studentId?.name || "Student"}
                  </div>
                  <div className="text-slate-500">{selectedSub.studentId?.email}</div>
                  <div className="text-[10px] text-slate-400 border-t border-slate-200/60 mt-1.5 pt-1.5 truncate">
                    Uploaded file: <span className="font-medium">{selectedSub.fileName}</span>
                  </div>
                </div>

                {/* AST Status (if coding task) */}
                {selectedSub.astValid !== null && (
                  <div
                    className={`p-3.5 rounded-lg text-sm flex gap-2.5 border font-extralight ${
                      selectedSub.astValid
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}
                  >
                    {selectedSub.astValid ? (
                      <>
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-light block text-base">AST Validation Passed</span>
                          <p className="text-[11px] font-extralight mt-0.5">Code satisfies structural prerequisites.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-light block text-base">AST Validation Failed</span>
                          <p className="text-[11px] font-extralight mt-0.5">Missing one or more required syntax structures.</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Plagiarism checks */}
                {selectedSub.plagiarismMatches && selectedSub.plagiarismMatches.length > 0 ? (
                  <div className="space-y-2 border border-rose-200 bg-rose-50/10 p-3.5 rounded-lg text-sm font-extralight">
                    <span className="font-light text-rose-600 flex items-center gap-1 text-base">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      ⚠️ LSH Duplication Flags Found
                    </span>
                    <div className="space-y-2 mt-1">
                      {selectedSub.plagiarismMatches.map((match, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-rose-100 font-extralight">
                          <span className="font-extralight text-slate-700 truncate max-w-[140px]">{match.id}</span>
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-extralight text-[9px]">
                            {(match.similarity * 100).toFixed(0)}% Match
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  selectedSub.status === "graded" && (
                    <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-extralight flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-light block text-base">LSH Plagiarism Clear</span>
                        <p className="text-[11px] font-extralight">No duplicates exceeding the match threshold.</p>
                      </div>
                    </div>
                  )
                )}

                {/* Extracted file text block */}
                {selectedSub.extractedText && (
                  <div className="space-y-1.5 text-base font-extralight">
                    <span className="text-base font-extralight text-slate-750 block">Extracted Text Content</span>
                    <div className="border rounded-lg bg-slate-950 text-indigo-300 p-3 max-h-36 overflow-y-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                      {selectedSub.extractedText}
                    </div>
                  </div>
                )}

                {/* Grading Form */}
                <form onSubmit={handleGradeSubmission} className="space-y-4 border-t border-slate-100 pt-4 text-base font-extralight">
                  <div className="grid grid-cols-2 gap-3.5 items-end">
                    <div className="space-y-1">
                      <label className="text-base font-extralight text-slate-700">Enter Grade</label>
                      <input
                        type="number"
                        placeholder="e.g. 85"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-slate-800 bg-white outline-none focus:border-purple-600 text-base font-extralight"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-base font-extralight text-slate-700 flex justify-between">
                        LSH Plag Limit
                        <span className="text-purple-600 font-normal">{(plagiarismThreshold * 100).toFixed(0)}%</span>
                      </label>
                      <select
                        value={plagiarismThreshold}
                        onChange={(e) => setPlagiarismThreshold(Number(e.target.value))}
                        className="w-full h-9 px-2 border border-slate-200 rounded-lg text-slate-800 bg-white focus:border-purple-600 outline-none text-base font-extralight"
                      >
                        <option value="0.2">20% (Sensitive)</option>
                        <option value="0.4">40% (Standard)</option>
                        <option value="0.6">60% (Lenient)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-base font-extralight text-slate-700">Feedback Comments</label>
                    <textarea
                      placeholder="Input feedback, formatting suggestions, or notes..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full h-16 p-3 border border-slate-200 rounded-lg text-slate-800 bg-white outline-none focus:border-purple-600 resize-none text-base font-extralight"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isGrading}
                    className="w-full h-9 bg-purple-700 text-white font-extralight text-base rounded-lg hover:bg-purple-800 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isGrading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Running Plagiarism Check & Grading...
                      </>
                    ) : (
                      "Disburse Grade & Run Checks"
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 text-base font-extralight space-y-2">
                <Info className="h-8 w-8 text-slate-300 mx-auto" />
                <p>Select a student submission to evaluate, inspect text, and run plagiarism/AST checks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

// Simple badge helper
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium border ${className}`}>
    {children}
  </span>
);

export default InstructorAssignments;
