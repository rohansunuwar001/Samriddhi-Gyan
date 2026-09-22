import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  PlusCircle,
  Upload,
  X,
  CheckCircle,
  Pause,
  Play,
  FileVideo,
} from "lucide-react";
import SectionManager from "./SectionManager";
import { useGetCourseByIdQuery, useEditCourseMutation } from "@/features/api/courseApi";
import { useCreateSectionMutation } from "@/features/api/sectionApi";
import axios from "axios";
import { BASE_URL } from "@/app/constant";

const CourseCurriculumTab = () => {
  const { courseId } = useParams();
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionObjective, setNewSectionObjective] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Bulk Uploader state
  const [bulkStep, setBulkStep] = useState("select"); // select | preview | uploading | complete
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(0);

  const fileInputRef = useRef(null);
  const uploadTimerRef = useRef(null);

  const { data: courseData, isLoading: isLoadingCourse, isError, refetch } = useGetCourseByIdQuery(courseId);
  const [createSection, { isLoading: isCreatingSection }] = useCreateSectionMutation();
  const [editCourse] = useEditCourseMutation();

  const handleAddSection = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newSectionTitle.trim()) {
      toast.error("Please provide a title for the section.");
      return;
    }
    try {
      await createSection({
        courseId,
        title: newSectionTitle.trim(),
        learningObjective: newSectionObjective.trim()
      }).unwrap();
      toast.success("Section created!");
      setNewSectionTitle("");
      setNewSectionObjective("");
      setIsAddingSection(false);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || "Failed to create section.");
    }
  };

  // Bulk Upload flow
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(f => f.type.startsWith("video/"));
    if (videoFiles.length === 0) {
      toast.error("Please select valid video files.");
      return;
    }
    setSelectedFiles(videoFiles.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      status: "pending", // pending | uploading | complete
      progress: 0,
    })));
    setBulkStep("preview");
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) {
        setBulkStep("select");
      }
      return next;
    });
  };

  // Real upload process
  const startBulkUpload = async () => {
    if (selectedFiles.length === 0) return;
    setBulkStep("uploading");
    setUploadProgress(0);
    setIsPaused(false);

    const formData = new FormData();
    selectedFiles.forEach((sf) => {
      formData.append("videos", sf.file);
    });

    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "multipart/form-data",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await axios.post(
        `${BASE_URL || "http://localhost:10000"}/api/v1/course/${courseId}/bulk-upload`,
        formData,
        {
          withCredentials: true,
          headers,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            setSelectedFiles((prev) =>
              prev.map((item) => ({
                ...item,
                progress: percentCompleted,
                status: percentCompleted >= 100 ? "complete" : "uploading",
              }))
            );
          },
        }
      );

      if (response.data?.success) {
        toast.success("All videos uploaded successfully to library!");
        setBulkStep("complete");
        refetch();
      } else {
        throw new Error(response.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to upload files.");
      setBulkStep("select");
    }
  };

  const handleBulkComplete = () => {
    setIsBulkOpen(false);
    setSelectedFiles([]);
    setBulkStep("select");
  };

  const handleSectionDragStart = (e, idx) => {
    e.dataTransfer.setData("draggedSectionIdx", idx);
  };

  const handleSectionDragOver = (e) => {
    e.preventDefault();
  };

  const handleSectionDrop = async (e, targetIdx) => {
    const draggedIdx = parseInt(e.dataTransfer.getData("draggedSectionIdx"), 10);
    if (isNaN(draggedIdx) || draggedIdx === targetIdx) return;

    const list = [...(courseData?.course?.sections || [])];
    const [draggedItem] = list.splice(draggedIdx, 1);
    list.splice(targetIdx, 0, draggedItem);

    const sectionIds = list.map((s) => s._id);

    const formData = new FormData();
    formData.append("sections", JSON.stringify(sectionIds));

    try {
      await editCourse({ courseId, formData }).unwrap();
      toast.success("Sections reordered.");
      refetch();
    } catch {
      toast.error("Failed to reorder sections.");
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
      </div>
    );
  }
  if (isError) return <div className="p-8 text-center text-red-500">Error loading curriculum.</div>;

  const sections = courseData?.course?.sections || [];

  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm relative">
      <div className="flex items-center justify-between border-b border-[#d1d7dc] pb-5 mb-8">
        <div>
          <h2 className="text-5xl font-light text-[#1c1d1f]">Curriculum</h2>
          <p className="text-xl text-[#6a6f73] mt-1">
            Create your course in sections, each focused on a single learning objective. Then add content, practice activities, and assessments.
          </p>
        </div>
        <button
          onClick={() => setIsBulkOpen(true)}
          className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-light text-xl px-4 py-2.5 transition-colors"
        >
          Bulk Uploader
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-6 mb-8">
        {sections.length > 0 ? (
          sections.map((section, idx) => (
            <div
              key={section._id}
              draggable
              onDragStart={(e) => handleSectionDragStart(e, idx)}
              onDragOver={handleSectionDragOver}
              onDrop={(e) => handleSectionDrop(e, idx)}
              className="group relative"
            >
              <SectionManager section={section} courseId={courseId} index={idx + 1} />
            </div>
          ))
        ) : (
          <div className="text-center text-[#6a6f73] py-20 border-2 border-dashed border-[#d1d7dc] bg-[#f7f9fa]">
            <p className="text-xl font-extralight">This course has no sections yet. Add your first one below!</p>
          </div>
        )}
      </div>

      {/* Add Section form or toggle */}
      {isAddingSection ? (
        <div className="border border-[#1c1d1f] p-6 bg-white relative mb-8">
          <button
            type="button"
            onClick={() => setIsAddingSection(false)}
            className="absolute top-4 left-4 text-[#6a6f73] hover:text-[#1c1d1f]"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="pl-8 space-y-5">
            <div className="flex items-center gap-4">
              <span className="font-light text-xl text-[#1c1d1f] w-24 shrink-0">New Section:</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Enter a Title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="w-full border border-[#6a6f73] px-3 py-2 text-xl text-[#1c1d1f] outline-none focus:border-[#1c1d1f] transition-all"
                />
                <span className="absolute right-3 top-2.5 text-lg text-[#6a6f73]">
                  {80 - newSectionTitle.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-light text-lg text-[#1c1d1f]">
                What will students be able to do at the end of this section?
              </span>
              <div className="relative">
                <input
                  type="text"
                  maxLength={200}
                  placeholder="Enter a learning objective"
                  value={newSectionObjective}
                  onChange={(e) => setNewSectionObjective(e.target.value)}
                  className="w-full border border-[#6a6f73] px-3 py-2 text-xl text-[#1c1d1f] outline-none focus:border-[#1c1d1f] transition-all"
                />
                <span className="absolute right-3 top-2.5 text-lg text-[#6a6f73]">
                  {200 - newSectionObjective.length}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingSection(false);
                  setNewSectionTitle("");
                  setNewSectionObjective("");
                }}
                className="text-xl font-light text-[#1c1d1f] hover:text-black px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingSection}
                onClick={handleAddSection}
                className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-light text-xl px-5 py-2.5 transition-colors disabled:opacity-50"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <button
            onClick={() => setIsAddingSection(true)}
            className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-light text-xl px-4 py-2.5 transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Section
          </button>
        </div>
      )}

      {/* ══ BULK UPLOADER MODAL (Samriddhi Gyan Design) ══ */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-[#1c1d1f]/60 flex items-center justify-center z-[300] p-4">
          <div className="bg-white w-full max-w-[700px] border border-[#d1d7dc] shadow-2xl flex flex-col relative max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d1d7dc]">
              <span className="font-light text-[#1c1d1f]">Bulk Uploader</span>
              <button
                onClick={() => {
                  if (bulkStep === "uploading" && !window.confirm("Abort uploads?")) return;
                  setIsBulkOpen(false);
                  setSelectedFiles([]);
                  setBulkStep("select");
                }}
                className="text-[#6a6f73] hover:text-[#1c1d1f] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 min-h-[300px]">
              
              {/* STEP: SELECT FILES */}
              {bulkStep === "select" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#d1d7dc] bg-[#f7f9fa] hover:bg-[#f1f3f4] transition-colors rounded-lg py-16 px-6 text-center cursor-pointer flex flex-col items-center justify-center"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <p className="text-3xl text-[#1c1d1f] mb-4">
                    Drop files here, <span className="text-[#5624d0] font-light underline">browse files</span> or import from:
                  </p>
                  
                  {/* Import providers */}
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex flex-col items-center text-lg text-[#6a6f73]">
                      <div className="w-10 h-10 border border-[#d1d7dc] rounded flex items-center justify-center mb-1 hover:bg-white transition-colors">
                        <svg className="w-5 h-5 text-[#5624d0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                      </div>
                      My Device
                    </div>
                    <div className="flex flex-col items-center text-lg text-[#6a6f73] opacity-50">
                      <div className="w-10 h-10 border border-[#d1d7dc] rounded flex items-center justify-center mb-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      </div>
                      Google Drive
                    </div>
                    <div className="flex flex-col items-center text-lg text-[#6a6f73] opacity-50">
                      <div className="w-10 h-10 border border-[#d1d7dc] rounded flex items-center justify-center mb-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      </div>
                      Dropbox
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: PREVIEW FILES */}
              {bulkStep === "preview" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl font-light text-[#1c1d1f]">{selectedFiles.length} files selected</span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xl font-light text-[#5624d0] hover:underline"
                    >
                      + Add more
                    </button>
                  </div>
                  
                  {/* Files Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {selectedFiles.map((sf, i) => (
                      <div key={i} className="relative border border-[#d1d7dc] bg-[#f7f9fa] p-4 flex flex-col items-center justify-center h-32 rounded-sm group">
                        <button
                          onClick={() => removeSelectedFile(i)}
                          className="absolute top-2 right-2 w-5 h-5 bg-white border border-[#d1d7dc] rounded-full flex items-center justify-center text-[#6a6f73] hover:text-[#1c1d1f] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <FileVideo className="w-8 h-8 text-[#6a6f73] mb-2" />
                        <span className="text-[11px] font-extralight text-[#1c1d1f] text-center line-clamp-2 px-1">
                          {sf.name}
                        </span>
                        <span className="text-[10px] text-[#6a6f73] mt-1">
                          {Math.round(sf.size / (1024 * 1024))} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: UPLOADING */}
              {bulkStep === "uploading" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl font-light text-[#1c1d1f]">Uploading {selectedFiles.length} files</span>
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="text-xl font-light text-[#5624d0] hover:underline flex items-center gap-1"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                  </div>

                  {/* Upload Grid with Progress Overlay */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {selectedFiles.map((sf, i) => {
                      const isFileUploading = sf.status === "uploading";
                      const isFileComplete = sf.status === "complete";
                      return (
                        <div key={i} className="relative border border-[#d1d7dc] bg-[#f7f9fa] p-4 flex flex-col items-center justify-center h-32 rounded-sm overflow-hidden">
                          {isFileUploading && (
                            <div className="absolute inset-0 bg-[#1c1d1f]/10 flex items-center justify-center z-10">
                              <div className="w-8 h-8 border-4 border-[#a435f0] border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {isFileComplete && (
                            <div className="absolute top-2 right-2 z-10 text-green-600">
                              <CheckCircle className="w-5 h-5 fill-white" />
                            </div>
                          )}
                          <FileVideo className="w-8 h-8 text-[#6a6f73] mb-2" />
                          <span className="text-[11px] font-extralight text-[#1c1d1f] text-center line-clamp-2 px-1">
                            {sf.name}
                          </span>
                          <span className="text-[10px] text-[#6a6f73] mt-1">
                            {sf.progress}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar info */}
                  <div className="border-t border-[#d1d7dc] pt-5">
                    <div className="flex justify-between text-lg text-[#6a6f73] mb-2">
                      <span>Uploading: {uploadProgress}%</span>
                      <span>ETA: 7m 12s left</span>
                    </div>
                    <div className="w-full bg-[#e4e8eb] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#a435f0] h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP: UPLOAD COMPLETE */}
              {bulkStep === "complete" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xl font-light text-green-600 flex items-center gap-1.5">
                      <CheckCircle className="w-5 h-5" /> Upload complete
                    </span>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {selectedFiles.map((sf, i) => (
                      <div key={i} className="relative border border-[#d1d7dc] bg-[#f7f9fa] p-4 flex flex-col items-center justify-center h-32 rounded-sm">
                        <div className="absolute top-2 right-2 text-green-600">
                          <CheckCircle className="w-5 h-5 fill-white" />
                        </div>
                        <FileVideo className="w-8 h-8 text-[#6a6f73] mb-2" />
                        <span className="text-[11px] font-extralight text-[#1c1d1f] text-center line-clamp-2 px-1">
                          {sf.name}
                        </span>
                        <span className="text-[10px] text-[#6a6f73] mt-1">
                          Complete
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-[#d1d7dc] flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setIsBulkOpen(false);
                  setSelectedFiles([]);
                  setBulkStep("select");
                }}
                className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-light text-xl px-5 py-2.5 transition-colors"
              >
                Cancel
              </button>
              
              {bulkStep === "preview" && (
                <button
                  onClick={startBulkUpload}
                  className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-light text-xl px-6 py-2.5 transition-colors"
                >
                  Upload {selectedFiles.length} files
                </button>
              )}

              {bulkStep === "complete" && (
                <button
                  onClick={handleBulkComplete}
                  className="bg-[#1c1d1f] hover:bg-[#2d2f31] text-white font-light text-xl px-6 py-2.5 transition-colors"
                >
                  Done
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCurriculumTab;