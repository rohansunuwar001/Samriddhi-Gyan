import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  UploadCloud,
  FileCode,
  Info,
  Loader2,
  ShieldCheck,
  Code,
  Pencil,
  CheckCheck,
  ChevronLeft,
  File,
  Award,
  CalendarDays,
  TerminalSquare,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useGetCourseAssignmentsQuery,
  useSubmitAssignmentMutation,
} from "@/features/api/assignmentApi";

/* ─── helpers ─────────────────────────────────────────────────────────── */
const CODE_EXTS = ["js","py","java","cpp","c","ts","html","css","go","rs","json","jsx","tsx","php","rb","sh","sql"];
const TEXT_EXTS = ["txt","csv","md","log"];

function getKind(filename) {
  const ext = filename?.split(".").pop().toLowerCase() || "";
  if (CODE_EXTS.includes(ext)) return { ext, kind: "code" };
  if (TEXT_EXTS.includes(ext)) return { ext, kind: "text" };
  return { ext, kind: "other" };
}

/* ─── VS Code–style Dark Editor (always visible) ─────────────────────── */
function DarkTerminal({ filename, content, loading, fileUrl, isEditable, onChange }) {
  const { ext, kind } = filename ? getKind(filename) : { ext: "", kind: "" };
  const lines = (content || "").split("\n");

  const textareaRef = React.useRef(null);
  const gutterRef = React.useRef(null);

  const handleScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  React.useEffect(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [content]);

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden shadow-2xl"
         style={{ background: "#1e1e1e", border: "1px solid #3c3c3c" }}>

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div className="flex items-center shrink-0"
           style={{ background: "#252526", borderBottom: "1px solid #3c3c3c", minHeight: "35px" }}>
        {filename ? (
          <div className="flex items-center gap-2 px-4 py-1.5 border-r text-xs font-medium"
               style={{ background: "#1e1e1e", borderColor: "#3c3c3c", borderTop: "1px solid #007acc", color: "#cccccc" }}>
            <Code className="h-3.5 w-3.5" style={{ color: "#cccccc" }} />
            <span>{filename}</span>
          </div>
        ) : (
          <div className="px-4 py-1.5 text-xs" style={{ color: "#555" }}>
            No file open
          </div>
        )}
        <div className="ml-auto px-3 flex items-center gap-3">
          {filename && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: "#2d2d2d", color: "#888", border: "1px solid #3c3c3c" }}>
              .{ext}
            </span>
          )}
        </div>
      </div>

      {/* ── Editor body ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#007acc" }} />
            <span className="text-sm font-mono" style={{ color: "#858585" }}>Loading…</span>
          </div>

        ) : !filename ? (
          /* Idle state */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 select-none">
            <div className="flex flex-col items-center gap-3">
              <TerminalSquare className="h-10 w-10" style={{ color: "#3c3c3c" }} />
              <p className="text-sm font-medium" style={{ color: "#555" }}>No file open</p>
              <p className="text-xs text-center leading-relaxed" style={{ color: "#3c3c3c" }}>
                Upload a file on the left to preview<br />its contents here in the editor.
              </p>
            </div>
            <div className="w-full max-w-xs rounded-lg p-4 space-y-2"
                 style={{ background: "#252526", border: "1px solid #3c3c3c" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#555" }}>
                Supported formats
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["js","ts","py","java","cpp","go","html","css","json","txt","csv"].map(e => (
                  <span key={e} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "#2d2d2d", color: "#6a9955", border: "1px solid #3c3c3c" }}>
                    .{e}
                  </span>
                ))}
              </div>
            </div>
          </div>

        ) : kind === "other" ? (
          /* Non-previewable */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <File className="h-8 w-8" style={{ color: "#3c3c3c" }} />
            <div>
              <p className="text-sm font-mono" style={{ color: "#858585" }}>
                No preview available for <span style={{ color: "#9cdcfe" }}>.{ext}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: "#555" }}>
                Binary files cannot be rendered in the editor.
              </p>
            </div>
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                 className="text-xs hover:underline" style={{ color: "#007acc" }}>
                Download file →
              </a>
            )}
          </div>

        ) : kind === "code" ? (
          /* Code file with scroll-synchronized line numbers */
          <div className="flex flex-1 overflow-hidden text-sm font-mono"
               style={{ lineHeight: "1.6" }}>
            {/* Gutter */}
            <div ref={gutterRef}
                 className="select-none text-right shrink-0 pt-3 pb-3 overflow-hidden"
                 style={{ minWidth: "3.5rem", paddingRight: "1rem", paddingLeft: "0.75rem",
                          background: "#1e1e1e", color: "#495057",
                          borderRight: "1px solid #2d2d2d", fontSize: "13px", height: "100%" }}>
              {lines.map((_, i) => (
                <div key={i} style={{ height: "20.8px" }}>{i + 1}</div>
              ))}
            </div>
            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              readOnly={!isEditable}
              value={content || ""}
              onChange={(e) => onChange && onChange(e.target.value)}
              onScroll={handleScroll}
              className="flex-1 h-full bg-transparent outline-none resize-none pt-3 pb-3 pl-5 pr-5 overflow-auto whitespace-pre select-text"
              style={{ color: "#d4d4d4", fontSize: "13px", lineHeight: "1.6", border: "none" }}
              placeholder="Write your code here..."
            />
          </div>

        ) : (
          /* Text file */
          <textarea
            readOnly={!isEditable}
            value={content || ""}
            onChange={(e) => isEditable && onChange && onChange(e.target.value)}
            className="flex-1 w-full outline-none resize-none select-text"
            style={{ background: "#1e1e1e", color: "#d4d4d4", fontFamily: "monospace",
                     fontSize: "13px", lineHeight: "1.6", padding: "12px 20px",
                     border: "none" }}
            placeholder="Type your text here..."
          />
        )}
      </div>

      {/* ── Status bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 shrink-0 select-none"
           style={{ background: isEditable ? "#6a9955" : "#007acc", height: "22px" }}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-white/90">
            {filename ? `${kind === "code" ? "Code" : kind === "text" ? "Plain Text" : "Binary"} · ${lines.length} lines` : "Ready"}
          </span>
        </div>
        <span className="text-[11px] text-white/70">
          {ext ? ext.toUpperCase() : "No file"} · {isEditable ? "Editable" : "Read Only"}
        </span>
      </div>
    </div>
  );
}




/* ─── Main Component ──────────────────────────────────────────────────── */

const StudentAssignments = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const { data, isLoading, refetch } = useGetCourseAssignmentsQuery(courseId);
  const [submitAssignment, { isLoading: isSubmitting }] = useSubmitAssignmentMutation();

  const [view, setView] = useState("list");
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [file, setFile]             = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const [submissionContent, setSubmissionContent] = useState("");
  const [loadingContent, setLoadingContent]       = useState(false);
  const [filePreviewContent, setFilePreviewContent] = useState("");
  const [filePreviewLoading, setFilePreviewLoading] = useState(false);

  const openWorkspace = (asm) => {
    setSelectedAssignment(asm);
    setFile(null);
    setFilePreviewContent("");
    setIsEditingExisting(false);
    setSubmissionContent("");
    setView("workspace");
    if (asm.submission?.fileUrl) loadSubmission(asm.submission.fileUrl);
  };

  const goBack = () => {
    setView("list");
    setSelectedAssignment(null);
    setFile(null);
    setFilePreviewContent("");
    setSubmissionContent("");
    setIsEditingExisting(false);
  };

  const loadSubmission = async (url) => {
    setLoadingContent(true);
    try {
      const res  = await fetch(url);
      const text = await res.text();
      setSubmissionContent(text);
    } catch { setSubmissionContent("Error loading file contents."); }
    finally   { setLoadingContent(false); }
  };

  const readFile = (f) => {
    if (!f) { setFilePreviewContent(""); return; }
    const { kind } = getKind(f.name);
    if (kind === "other") { setFilePreviewContent(null); return; }
    setFilePreviewLoading(true);
    const reader  = new FileReader();
    reader.onload  = (e) => { setFilePreviewContent(e.target.result); setFilePreviewLoading(false); };
    reader.onerror = ()  => { setFilePreviewContent("Error reading file."); setFilePreviewLoading(false); };
    reader.readAsText(f);
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); readFile(f); }
  };
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); readFile(f); }
  };
  const handleContentChange = (newContent) => {
    setFilePreviewContent(newContent);
    if (file) {
      const updatedFile = new File([newContent], file.name, { type: file.type || "text/plain" });
      setFile(updatedFile);
    }
  };

  const handleStartEditing = () => {
    setIsEditingExisting(true);
    if (selectedAssignment?.submission) {
      const filename = selectedAssignment.submission.fileName;
      const type = selectedAssignment.submission.fileType || "text/plain";
      const f = new File([submissionContent], filename, { type });
      setFile(f);
      setFilePreviewContent(submissionContent);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedAssignment) { toast.error("Please upload a file first."); return; }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await submitAssignment({ assignmentId: selectedAssignment._id, formData }).unwrap();
      if (res.success) {
        toast.success("Assignment submitted successfully!");
        refetch();
        goBack();
      } else {
        toast.error(res.message || "Failed to submit.");
      }
    } catch { toast.error("Upload error. Please try again."); }
  };

  const assignments = data?.assignments || [];

  if (isLoading) return (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     VIEW 1 — Assignment Task List
  ══════════════════════════════════════════════════════════════════════ */
  if (view === "list") return (
    <div className="max-w-2xl mx-auto px-5 py-10">

      {/* Back to course */}
      <button
        onClick={() => navigate(`/course-detail/${courseId}/content`)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-violet-600 transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Course
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-violet-100">
          <FileCode className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Course Assignments</h1>
          <p className="text-xs font-light text-slate-400 mt-0.5">
            Click a task to open the submission workspace.
          </p>
        </div>
      </div>

      {/* Task cards */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 border-2 border-dashed border-slate-100 rounded-2xl text-center">
          <Info className="h-6 w-6 text-slate-300" />
          <p className="text-sm font-light text-slate-400">No assignments found for this course.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((asm) => {
            const isSubmitted = !!asm.submission;
            return (
              <button
                key={asm._id}
                onClick={() => openWorkspace(asm)}
                className="w-full text-left group border border-slate-100 bg-white hover:border-violet-200 hover:shadow-md hover:shadow-violet-50 rounded-2xl p-5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                        asm.type === "coding"
                          ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {asm.type.charAt(0).toUpperCase() + asm.type.slice(1)} Task
                      </span>
                      {isSubmitted && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCheck className="h-3 w-3" /> Submitted
                        </span>
                      )}
                      {asm.sectionId ? (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                          Section: {asm.sectionId.title}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-100">
                          Course-wide Task
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-medium text-slate-800 group-hover:text-violet-700 transition-colors">
                      {asm.title}
                    </h2>
                    {asm.description && (
                      <p className="text-sm font-light text-slate-400 line-clamp-2 leading-relaxed">
                        {asm.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 pt-1">
                      <span className="flex items-center gap-1.5 text-xs font-light text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Due {new Date(asm.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-light text-slate-400">
                        <Award className="h-3.5 w-3.5" />
                        {asm.maxPoints} points
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 p-2 rounded-xl bg-slate-50 group-hover:bg-violet-100 transition-colors mt-1">
                    <svg className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     VIEW 2 — Workspace (split: left form + right dark terminal)
  ══════════════════════════════════════════════════════════════════════ */
  const asm         = selectedAssignment;
  const isSubmitted = !!asm?.submission && !isEditingExisting;

  /* What to show in terminal */
  const termFilename = isEditingExisting
    ? file?.name
    : (isSubmitted ? asm.submission.fileName : file?.name);
  const termContent  = isEditingExisting
    ? filePreviewContent
    : (isSubmitted ? submissionContent : filePreviewContent);
  const termLoading  = isEditingExisting
    ? filePreviewLoading
    : (isSubmitted ? loadingContent : filePreviewLoading);
  const termFileUrl  = isSubmitted ? asm?.submission?.fileUrl : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3.5 bg-white border-b border-slate-100 shrink-0">
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          All Tasks
        </button>
        <span className="text-slate-200">|</span>
        <span className="text-sm font-medium text-slate-700 truncate">{asm.title}</span>
        {asm.submission && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full ml-auto shrink-0">
            <CheckCheck className="h-3 w-3" /> Submitted
          </span>
        )}
      </div>

      {/* ── Body: left panel + right terminal ────────────────────────── */}
      <div className="flex flex-1 overflow-hidden bg-slate-50/40">
        <div className="max-w-screen-2xl mx-auto w-full h-full flex gap-8 px-8 py-6 overflow-hidden">

          {/* ── Left: Workspace & Uploader ──────────────────────────── */}
          <div className="w-[420px] shrink-0 overflow-y-auto bg-white rounded-2xl border border-slate-100 px-6 py-6 space-y-5 shadow-sm">

          {/* Assignment meta */}
          <div className="space-y-2 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                asm.type === "coding"
                  ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                  : "bg-amber-50 text-amber-600 border-amber-100"
              }`}>
                {asm.type.charAt(0).toUpperCase() + asm.type.slice(1)} Task
              </span>
              {asm.sectionId ? (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  Section: {asm.sectionId.title}
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-100">
                  Course-wide Task
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-800">{asm.title}</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs font-light text-slate-400 flex items-center gap-1">
                <Award className="h-3.5 w-3.5" /> {asm.maxPoints} pts
              </span>
              <span className="text-xs font-light text-slate-400 flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Due {new Date(asm.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            {asm.description && (
              <p className="text-xs font-light text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 leading-relaxed">
                {asm.description}
              </p>
            )}
            {asm.type === "coding" && asm.requiredStructures?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-medium text-slate-400">Requires:</span>
                {asm.requiredStructures.map((s) => (
                  <span key={s} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submitted state */}
          {asm.submission && !isEditingExisting ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Assignment Submitted</p>
                  <p className="text-xs font-light text-emerald-600 mt-0.5 leading-relaxed">
                    Review your file in the terminal on the right.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-3 py-3 bg-slate-50">
                <div className="p-2 rounded-lg bg-emerald-100 shrink-0">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 truncate">{asm.submission.fileName}</p>
                  <p className="text-xs font-light text-slate-400 font-mono">{asm.submission.fileType}</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleStartEditing}
                className="w-full h-9 text-xs font-medium border-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Submission
              </Button>
            </div>

          ) : (
            /* Upload form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Drop zone */}
              <div
                onDragEnter={handleDrag} onDragOver={handleDrag}
                onDragLeave={handleDrag} onDrop={handleDrop}
                onClick={() => document.getElementById("file-input-ws").click()}
                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 text-center cursor-pointer transition-all select-none ${
                  dragActive
                    ? "border-violet-400 bg-violet-50/40"
                    : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/20 bg-slate-50/30"
                }`}
              >
                <input type="file" id="file-input-ws" className="hidden"
                  onChange={handleFileChange}
                  accept={asm.type === "coding" ? ".js,.py,.java,.cpp,.c,.ts,.txt" : ".pdf,.docx,.csv,.txt"}
                />
                <div className={`p-3 rounded-xl transition-all ${dragActive ? "bg-violet-100" : "bg-slate-100"}`}>
                  <UploadCloud className={`h-5 w-5 ${dragActive ? "text-violet-600" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Drop file here, or <span className="text-violet-600">browse</span>
                  </p>
                  <p className="text-xs font-light text-slate-400 mt-0.5">
                    {asm.type === "coding"
                      ? ".js · .py · .java · .cpp · .ts · .txt"
                      : ".pdf · .docx · .csv · .txt"}
                  </p>
                </div>
              </div>

              {/* File info card */}
              {file && (
                <div className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-3 bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-violet-100 shrink-0">
                      {asm.type === "coding"
                        ? <Code className="h-4 w-4 text-violet-600" />
                        : <FileText className="h-4 w-4 text-violet-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs font-light text-slate-400">{(file.size / 1024).toFixed(1)} KB — preview in terminal →</p>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => { setFile(null); setFilePreviewContent(""); }}
                    className="text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors shrink-0">
                    Remove
                  </button>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting || !file}
                className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-violet-200 gap-2">
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  : "Submit Assignment"}
              </Button>
            </form>
          )}
          </div>

          {/* ── Right: Dark Terminal (always visible) ───────────────── */}
          <div className="flex-1 h-full">
            <DarkTerminal
              filename={termFilename}
              content={termContent}
              loading={termLoading}
              fileUrl={termFileUrl}
              isEditable={isEditingExisting || !asm?.submission}
              onChange={handleContentChange}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
