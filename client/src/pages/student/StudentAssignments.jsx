import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  Clock,
  Award,
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileCode,
  ArrowRight,
  Info,
  Loader2,
  ShieldCheck,
  Code
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useGetCourseAssignmentsQuery,
  useSubmitAssignmentMutation
} from "@/features/api/assignmentApi";

const StudentAssignments = () => {
  const { courseId } = useParams();
  const { data, isLoading, refetch } = useGetCourseAssignmentsQuery(courseId);
  const [submitAssignment, { isLoading: isSubmitting }] = useSubmitAssignmentMutation();

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const assignments = data?.assignments || [];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedAssignment) {
      toast.error("Please upload a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await submitAssignment({
        assignmentId: selectedAssignment._id,
        formData
      }).unwrap();

      if (res.success) {
        toast.success("Assignment submitted successfully!");
        setFile(null);
        refetch();
        setSelectedAssignment(null);
      } else {
        toast.error(res.message || "Failed to submit assignment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload error. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-5">
        <FileCode className="h-9 w-9 text-purple-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Course Assignments</h1>
          <p className="text-sm text-slate-500">Upload code or essay documents and view graded assessments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Assignments List */}
        <div className="md:col-span-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider mb-2">Assignment Tasks</h2>
          {assignments.length === 0 ? (
            <div className="text-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 text-sm space-y-2">
              <Info className="h-6 w-6 mx-auto text-slate-400" />
              <p>No assignments found for this course.</p>
            </div>
          ) : (
            assignments.map((asm) => (
              <div
                key={asm._id}
                onClick={() => {
                  setSelectedAssignment(asm);
                  setFile(null);
                }}
                className={`border p-5 rounded-xl cursor-pointer transition-all shadow-sm relative overflow-hidden bg-white ${
                  selectedAssignment?._id === asm._id
                    ? "border-purple-600 ring-2 ring-purple-600/10 scale-[1.01]"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border">
                      {asm.type} Task
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-base">{asm.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{asm.description}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">
                    {asm.maxPoints} Pts
                  </Badge>
                </div>

                <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Due: {new Date(asm.deadline).toLocaleDateString()}
                  </span>
                  <span className="text-purple-600 font-bold flex items-center gap-1 hover:underline">
                    Manage submission
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Submission Editor/Uploader Sandbox */}
        <div className="md:col-span-6">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider mb-4">Workspace & Uploader</h2>

          {selectedAssignment ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <span className="text-xs uppercase font-bold text-purple-600 block">Uploading for:</span>
                <h3 className="text-xl font-bold text-slate-900">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border leading-relaxed">
                  {selectedAssignment.description}
                </p>
                {selectedAssignment.type === "coding" && selectedAssignment.requiredStructures?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[11px] font-bold text-slate-500">Requirements:</span>
                    {selectedAssignment.requiredStructures.map((s) => (
                      <Badge key={s} className="bg-indigo-55 text-indigo-700 border-indigo-200 text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Drag and Drop Uploader */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col justify-center items-center gap-2.5 relative select-none ${
                    dragActive
                      ? "border-purple-600 bg-purple-50/20"
                      : "border-slate-300 hover:border-slate-400 bg-slate-50/30"
                  }`}
                  onClick={() => document.getElementById("file-input").click()}
                >
                  <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    onChange={handleFileChange}
                    accept={
                      selectedAssignment.type === "coding"
                        ? ".js,.py,.java,.cpp,.c,.ts,.txt"
                        : ".pdf,.docx,.csv,.txt"
                    }
                  />
                  <UploadCloud className="h-10 w-10 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    Drag and drop file here, or click to browse
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedAssignment.type === "coding"
                      ? "Coding files (.js, .py, .java, .cpp, .ts, .txt)"
                      : "Document files (.pdf, .docx, .csv, .txt)"}
                  </span>
                </div>

                {/* Uploaded File Info Card */}
                {file && (
                  <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
                        {selectedAssignment.type === "coding" ? <Code className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block truncate max-w-[200px]">{file.name}</span>
                        <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-slate-400 hover:text-rose-600 transition-all font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full h-11 bg-purple-700 text-white font-semibold hover:bg-purple-800 flex justify-center items-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Submitting Assignment...
                    </>
                  ) : (
                    "Submit Assignment"
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-slate-200 bg-white rounded-xl text-slate-400 text-sm space-y-2">
              <Info className="h-8 w-8 text-slate-300 mx-auto animate-bounce-slow" />
              <p>Select an assignment task from the list on the left to start working or upload.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple badge helper
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
    {children}
  </span>
);

export default StudentAssignments;
