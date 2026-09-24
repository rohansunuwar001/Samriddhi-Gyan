import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Edit,
  Trash2,
  Menu as DragIcon,
  PlayCircle,
  FileText,
  X,
  Search,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Play,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  Loader2,
  FolderDown,
  Sparkles,
} from "lucide-react";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { useGetCourseByIdQuery } from "@/features/api/courseApi";
import {
  useUpdateLectureMutation,
  useDeleteLectureMutation,
  useAddLectureResourceLinkMutation,
  useUploadLectureResourceFileMutation,
  useDeleteLectureResourceMutation,
  useUpdateLectureLabMutation,
  useUploadLectureLabPdfMutation,
  useDeleteLectureLabMutation,
} from "@/features/api/lectureApi";
import { Link } from "react-router-dom";
import { BASE_URL } from "@/app/constant";
import BolaVideoPlayer from "./BolaVideoPlayer";
import { ChunkedUploader } from "@/utils/chunkedUploader";

const LectureItem = ({ lecture, courseId, index }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(lecture.title);

  // Content panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState("select-type"); // 'select-type' | 'add-video'
  const [videoTab, setVideoTab] = useState("upload"); // 'upload' | 'library'
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingVideoOverride, setIsEditingVideoOverride] = useState(false);

  // Single file upload states
  const [selectedFileToUpload, setSelectedFileToUpload] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null); // { name, progress, status }
  const uploaderRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Linked details state
  const [showDesc, setShowDesc] = useState(false);
  const [lectureDesc, setLectureDesc] = useState(lecture.description || "");

  // Resources states
  const [showResources, setShowResources] = useState(false);
  const [resourceTab, setResourceTab] = useState("file"); // "file" | "link"
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceLink, setResourceLink] = useState("");
  const resourceFileRef = useRef(null);

  // Lab states
  const [showLab, setShowLab] = useState(false);
  const [labTitle, setLabTitle] = useState(lecture.lab?.title || "");
  const [labDesc, setLabDesc] = useState(lecture.lab?.description || "");
  const [labUrl, setLabUrl] = useState(lecture.lab?.url || "");
  const [labPdfFile, setLabPdfFile] = useState(null);
  const labPdfRef = useRef(null);

  // Sync lab inputs if lecture updates
  useEffect(() => {
    if (lecture.lab) {
      setLabTitle(lecture.lab.title || "");
      setLabDesc(lecture.lab.description || "");
      setLabUrl(lecture.lab.url || "");
    }
  }, [lecture.lab]);

  // Video Preview controls
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);

  const { data: courseData, refetch: refetchCourse } = useGetCourseByIdQuery(courseId);
  const [updateLecture] = useUpdateLectureMutation();
  const [deleteLecture] = useDeleteLectureMutation();

  // Resources mutations
  const [addLectureResourceLink, { isLoading: isAddingLink }] = useAddLectureResourceLinkMutation();
  const [uploadLectureResourceFile, { isLoading: isUploadingResourceFile }] = useUploadLectureResourceFileMutation();
  const [deleteLectureResource, { isLoading: isDeletingResource }] = useDeleteLectureResourceMutation();

  // Lab mutations
  const [updateLectureLab, { isLoading: isUpdatingLab }] = useUpdateLectureLabMutation();
  const [uploadLectureLabPdf, { isLoading: isUploadingLabPdf }] = useUploadLectureLabPdfMutation();
  const [deleteLectureLab, { isLoading: isDeletingLab }] = useDeleteLectureLabMutation();

  const handleUpdateTitle = async () => {
    if (!editedTitle.trim()) return;
    try {
      await updateLecture({
        lectureId: lecture._id,
        title: editedTitle.trim(),
        courseId,
      }).unwrap();
      setIsEditingTitle(false);
      toast.success("Lecture title updated.");
    } catch {
      toast.error("Failed to update lecture title.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this lecture?")) {
      try {
        await deleteLecture({ lectureId: lecture._id, courseId }).unwrap();
        toast.success("Lecture deleted.");
      } catch {
        toast.error("Failed to delete lecture.");
      }
    }
  };

  // ── Resources Handlers ──────────────────────────────────────────────────────
  const handleAddLinkResource = async () => {
    if (!resourceLink.trim()) {
      toast.error("Please enter a valid URL (e.g. Google Drive, GitHub)");
      return;
    }
    const title = resourceTitle.trim() || resourceLink.trim();
    try {
      await addLectureResourceLink({
        lectureId: lecture._id,
        title,
        url: resourceLink.trim(),
        courseId,
      }).unwrap();
      setResourceTitle("");
      setResourceLink("");
      toast.success("External resource link added!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add resource link");
    }
  };

  const handleUploadResourceFile = async () => {
    if (!resourceFile) {
      toast.error("Please select a file or PDF to upload");
      return;
    }
    const formData = new FormData();
    formData.append("file", resourceFile);
    if (resourceTitle.trim()) {
      formData.append("title", resourceTitle.trim());
    }
    try {
      await uploadLectureResourceFile({
        lectureId: lecture._id,
        formData,
        courseId,
      }).unwrap();
      setResourceFile(null);
      setResourceTitle("");
      if (resourceFileRef.current) resourceFileRef.current.value = "";
      toast.success("File uploaded to Cloudinary successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to upload file to Cloudinary");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm("Delete this resource?")) return;
    try {
      await deleteLectureResource({
        lectureId: lecture._id,
        resourceId,
        courseId,
      }).unwrap();
      toast.success("Resource removed");
    } catch (err) {
      toast.error("Failed to delete resource");
    }
  };

  // ── Lab Handlers ────────────────────────────────────────────────────────────
  const handleSaveLab = async () => {
    if (!labTitle.trim() && !labUrl.trim() && !labPdfFile) {
      toast.error("Please provide a Lab title, workspace URL, or upload an assignment PDF");
      return;
    }
    try {
      await updateLectureLab({
        lectureId: lecture._id,
        title: labTitle.trim(),
        description: labDesc.trim(),
        url: labUrl.trim(),
        isActive: true,
        courseId,
      }).unwrap();

      if (labPdfFile) {
        const formData = new FormData();
        formData.append("file", labPdfFile);
        await uploadLectureLabPdf({
          lectureId: lecture._id,
          formData,
          courseId,
        }).unwrap();
        setLabPdfFile(null);
        if (labPdfRef.current) labPdfRef.current.value = "";
      }

      toast.success("Lab configuration saved!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save lab configuration");
    }
  };

  const handleDeleteLab = async () => {
    if (!window.confirm("Remove this lab configuration?")) return;
    try {
      await deleteLectureLab({ lectureId: lecture._id, courseId }).unwrap();
      setLabTitle("");
      setLabDesc("");
      setLabUrl("");
      setLabPdfFile(null);
      toast.success("Lab removed from this lecture");
    } catch (err) {
      toast.error("Failed to remove lab");
    }
  };

  const handleLinkVideo = async (video) => {
    try {
      await updateLecture({
        lectureId: lecture._id,
        videoUrl: video.url,
        status: "ready",
        durationInSeconds: video.durationInSeconds || 300,
        courseId,
      }).unwrap();
      setIsEditingVideoOverride(false);
      refetchCourse();
      setIsPanelOpen(false);
      toast.success(`Linked video: ${video.filename}`);
    } catch {
      toast.error("Failed to link video.");
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateLecture({
        lectureId: lecture._id,
        description: lectureDesc,
        courseId,
      }).unwrap();
      toast.success("Description updated.");
      setShowDesc(false);
    } catch {
      toast.error("Failed to save description.");
    }
  };

  const handleToggleDownloadable = async () => {
    const nextVal = !lecture.downloadable;
    try {
      await updateLecture({
        lectureId: lecture._id,
        downloadable: nextVal,
        courseId,
      }).unwrap();
      refetchCourse();
      toast.success(nextVal ? "Lecture is now downloadable for students." : "Lecture download disabled.");
    } catch {
      toast.error("Failed to update downloadable setting.");
    }
  };

  // Status Poller helper
  const startStatusPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${BASE_URL || "http://localhost:10000"}/api/v1/lectures/${lecture._id}/status`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          }
        });
        const data = await response.json();
        if (data.status === "ready") {
          clearInterval(pollTimerRef.current);
          setUploadingFile(null);
          toast.success("Video processing complete!");
          refetchCourse();
        } else if (data.status === "failed") {
          clearInterval(pollTimerRef.current);
          setUploadingFile(null);
          toast.error("Video processing failed.");
          refetchCourse();
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  // Start upload of video via Chunked Direct-to-Cloud
  const handleStartSingleUpload = async () => {
    if (!selectedFileToUpload) return;
    const file = selectedFileToUpload;
    setSelectedFileToUpload(null);

    setUploadingFile({
      name: file.name,
      progress: 0,
      status: "Initiating direct cloud upload…",
    });

    const uploader = new ChunkedUploader({
      file,
      lectureId: lecture._id,
      baseUrl: BASE_URL || "http://localhost:10000",
      token: localStorage.getItem("authToken") || "",
      chunkSize: 10 * 1024 * 1024,
      concurrency: 3,
      onProgress: (pct, stats) => {
        setUploadingFile((prev) =>
          prev
            ? {
                ...prev,
                progress: pct,
                status: stats?.speedFormatted
                  ? `Uploading • ${stats.speedFormatted} • ${stats.etaFormatted}`
                  : (prev.status || "Uploading chunks to cloud…"),
              }
            : null
        );
      },
      onStatusChange: (statusText) => {
        setUploadingFile((prev) => (prev ? { ...prev, status: statusText } : null));
      },
    });

    uploaderRef.current = uploader;

    try {
      await uploader.upload();
      setUploadingFile((prev) =>
        prev ? { ...prev, status: "Processing", progress: 100 } : null
      );
      setIsEditingVideoOverride(false);
      refetchCourse();
      startStatusPolling();
    } catch (err) {
      if (err.message !== "Upload cancelled" && err.message !== "Upload aborted") {
        toast.error(err.message || "Upload failed.");
      }
      setUploadingFile(null);
    } finally {
      uploaderRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (uploaderRef.current) {
      uploaderRef.current.abort();
    }
    setUploadingFile(null);
    toast.info("Upload cancelled.");
  };

  // Run polling if backend status is already transcoding on mount
  useEffect(() => {
    if (lecture.status === "transcoding") {
      setUploadingFile({
        name: "Video content",
        progress: 100,
        status: "Processing",
      });
      startStatusPolling();
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [lecture.status]);

  // Filter video library
  const libraryVideos = courseData?.course?.videoLibrary || [];
  const filteredVideos = libraryVideos.filter((vid) =>
    vid.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (secs) => {
    if (!secs) return "00:00";
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  const hasVideo = !!lecture.videoUrl;
  const showLinkedVideo = hasVideo && !isEditingVideoOverride;

  return (
    <div className="border border-[#d1d7dc] bg-white rounded-sm mb-4 overflow-hidden shadow-sm">
      
      {/* ── LECTURE ROW (Samriddhi Gyan curriculum view) ── */}
      <div className="flex items-center justify-between p-3.5 hover:bg-[#f7f9fa]/50 transition-colors">
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <PlayCircle className={`w-4.5 h-4.5 ${hasVideo ? "text-[#5624d0]" : "text-[#6a6f73]"} shrink-0`} />
          
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-grow max-w-[400px]">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
                className="border border-[#6a6f73] px-2 py-1 text-lg text-[#1c1d1f] w-full outline-none focus:border-[#1c1d1f]"
              />
              <button onClick={handleUpdateTitle} className="text-lg text-[#5624d0] font-light">Save</button>
              <button onClick={() => setIsEditingTitle(false)} className="text-lg text-[#6a6f73]">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg text-[#1c1d1f] font-light shrink-0">Lecture {index}:</span>
              <span className="text-lg text-[#1c1d1f] truncate">{lecture.title}</span>
              
              <button onClick={() => setIsEditingTitle(true)} className="text-[#6a6f73] hover:text-[#1c1d1f] p-0.5">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleDelete} className="text-[#6a6f73] hover:text-red-600 p-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3 shrink-0">
          {!hasVideo && (
            <button
              onClick={() => {
                setPanelType("select-type");
                setIsPanelOpen(true);
              }}
              className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-light text-lg px-3 py-1.5 transition-colors"
            >
              + Content
            </button>
          )}

          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="text-[#6a6f73] hover:text-[#1c1d1f] p-1"
          >
            {isPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <DragIcon className="w-4 h-4 text-[#6a6f73] cursor-grab active:cursor-grabbing" />
        </div>
      </div>

      {/* ── EXPANDED PANEL UNDER LECTURE ── */}
      {isPanelOpen && (
        <div className="border-t border-[#d1d7dc] bg-[#f7f9fa] p-5">
          
          {/* STATE 1: NOT LINKED - SELECT CONTENT TYPE (Photo 2) */}
          {!showLinkedVideo && !uploadingFile && panelType === "select-type" && (
            <div className="relative">
              <div className="flex items-center justify-between border-b border-[#d1d7dc] pb-3 mb-4">
                <span className="text-lg font-light text-[#1c1d1f]">Select content type</span>
                <button
                  onClick={() => {
                    if (hasVideo) {
                      setIsEditingVideoOverride(false);
                    } else {
                      setIsPanelOpen(false);
                    }
                  }}
                  className="text-[#6a6f73] hover:text-[#1c1d1f]"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <p className="text-lg text-[#6a6f73] mb-5">
                Select the main type of content. Files and links can be added as resources. <span className="text-[#5624d0] underline cursor-pointer">Learn about content types.</span>
              </p>

              {/* Square Choices Grid */}
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setPanelType("add-video")}
                  className="w-24 h-24 border border-[#d1d7dc] bg-white hover:border-[#1c1d1f] transition-all flex flex-col items-center justify-center p-3 text-center rounded-sm"
                >
                  <PlayCircle className="w-8 h-8 text-[#6a6f73] mb-2" />
                  <span className="text-[11px] font-light text-[#1c1d1f]">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info("Mashup creator is a premium feature under development.")}
                  className="w-24 h-24 border border-[#d1d7dc] bg-white hover:border-[#1c1d1f] transition-all flex flex-col items-center justify-center p-3 text-center rounded-sm opacity-60 cursor-not-allowed"
                >
                  <FileText className="w-8 h-8 text-[#6a6f73] mb-2" />
                  <span className="text-[11px] font-light text-[#1c1d1f] leading-tight">Video &amp; Slide Mashup</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info("Article creator is a premium feature under development.")}
                  className="w-24 h-24 border border-[#d1d7dc] bg-white hover:border-[#1c1d1f] transition-all flex flex-col items-center justify-center p-3 text-center rounded-sm opacity-60 cursor-not-allowed"
                >
                  <FileText className="w-8 h-8 text-[#6a6f73] mb-2" />
                  <span className="text-[11px] font-light text-[#1c1d1f]">Article</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: NOT LINKED - ADD VIDEO TABS (Photo 1 & 4 style) */}
          {!showLinkedVideo && !uploadingFile && panelType === "add-video" && (
            <div>
              <div className="flex items-center justify-between border-b border-[#d1d7dc] pb-3 mb-4">
                <span className="text-lg font-light text-[#1c1d1f]">Add Video</span>
                <button
                  onClick={() => {
                    if (hasVideo) {
                      setIsEditingVideoOverride(false);
                    } else {
                      setPanelType("select-type");
                    }
                  }}
                  className="text-[#6a6f73] hover:text-[#1c1d1f]"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-[#d1d7dc] mb-4">
                <button
                  onClick={() => setVideoTab("upload")}
                  className={`text-lg font-light pb-2 transition-all border-b-2 ${videoTab === "upload" ? "border-[#1c1d1f] text-[#1c1d1f]" : "border-transparent text-[#6a6f73] hover:text-[#1c1d1f]"}`}
                >
                  Upload Video
                </button>
                <button
                  onClick={() => setVideoTab("library")}
                  className={`text-lg font-light pb-2 transition-all border-b-2 ${videoTab === "library" ? "border-[#1c1d1f] text-[#1c1d1f]" : "border-transparent text-[#6a6f73] hover:text-[#1c1d1f]"}`}
                >
                  Add from library
                </button>
              </div>

              {/* TAB 1: UPLOAD VIDEO (Photo 1 & 2 style) */}
              {videoTab === "upload" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-grow border border-[#6a6f73] px-3 py-2.5 bg-white text-lg text-[#6a6f73] truncate">
                      {selectedFileToUpload ? selectedFileToUpload.name : "No file selected"}
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFileToUpload(file);
                        }
                      }}
                      className="hidden"
                      id={`file-input-${lecture._id}`}
                    />
                    <label
                      htmlFor={`file-input-${lecture._id}`}
                      className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-light text-lg px-5 py-2.5 transition-colors cursor-pointer"
                    >
                      Select Video
                    </label>
                  </div>
                  {selectedFileToUpload && (
                    <button
                      onClick={handleStartSingleUpload}
                      className="bg-[#5624d0] hover:bg-[#3b1990] text-white font-light text-lg px-5 py-2"
                    >
                      Upload Video
                    </button>
                  )}
                  <p className="text-[10px] text-[#6a6f73]">
                    <span className="font-light">Note:</span> All files should be at least 720p and less than 4.0 GB.
                  </p>
                </div>
              )}

              {/* TAB 2: ADD FROM LIBRARY */}
              {videoTab === "library" && (
                <div className="space-y-4">
                  {/* Search bar */}
                  <div className="relative max-w-[320px]">
                    <input
                      type="text"
                      placeholder="Search files by name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-[#6a6f73] pl-3 pr-10 py-2 text-lg text-[#1c1d1f] outline-none bg-white focus:border-[#1c1d1f]"
                    />
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-[#6a6f73]" />
                  </div>

                  {/* Videos Table */}
                  <div className="border border-[#d1d7dc] bg-white overflow-hidden">
                    <table className="w-full text-left text-lg text-[#1c1d1f] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-[#d1d7dc] text-[#6a6f73] font-light">
                          <th className="p-3">Filename</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVideos.length > 0 ? (
                          filteredVideos.map((vid, idx) => (
                            <tr key={idx} className="border-b border-[#e4e8eb] hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-extralight truncate max-w-[200px]">{vid.filename}</td>
                              <td className="p-3 text-[#6a6f73]">Video</td>
                              <td className="p-3 text-green-600 font-light flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Success
                              </td>
                              <td className="p-3 text-[#6a6f73]">
                                {vid.createdAt ? new Date(vid.createdAt).toLocaleDateString() : "07/03/2026"}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleLinkVideo(vid)}
                                  className="text-[#5624d0] hover:underline font-light"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-[#6a6f73] italic">
                              No videos found in library. Upload files under the Bulk Uploader first.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 3 & 4: UPLOADING PROGRESS OR PROCESSING STATUS TABLE (Photo 3, 4 & 5 style) */}
          {!showLinkedVideo && uploadingFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#d1d7dc] pb-3">
                <span className="text-lg font-light text-[#1c1d1f]">Video Status</span>
              </div>
              <div className="border border-[#d1d7dc] bg-white overflow-hidden">
                <table className="w-full text-left text-lg text-[#1c1d1f] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#d1d7dc] text-[#6a6f73] font-light">
                      <th className="p-3 w-1/3">Filename</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 w-1/3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e4e8eb] hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-extralight truncate max-w-[200px]">{uploadingFile.name}</td>
                      <td className="p-3 text-[#6a6f73]">Video</td>
                      <td className="p-3">
                        {uploadingFile.status === "uploading" ? (
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-sm overflow-hidden border">
                              <div className="bg-[#a435f0] h-full transition-all duration-300" style={{ width: `${uploadingFile.progress}%` }} />
                            </div>
                            <span className="text-[10px] text-[#6a6f73] font-mono shrink-0">{uploadingFile.progress}%</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-light">{uploadingFile.status}</span>
                        )}
                      </td>
                      <td className="p-3 text-[#6a6f73]">07/03/2026</td>
                      <td className="p-3 text-right">
                        {uploadingFile.status === "uploading" ? (
                          <button onClick={handleCancelUpload} className="text-[#6a6f73] hover:text-red-500 font-light p-1">
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedFileToUpload(null);
                              setUploadingFile(null);
                              setVideoTab("upload");
                              setPanelType("add-video");
                            }}
                            className="text-[#5624d0] hover:underline font-light"
                          >
                            Replace
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {uploadingFile.status === "Processing" && (
                <p className="text-[11px] text-[#6a6f73] font-light italic">
                  Note: This video is still being processed. We will send you an email when it is ready.
                </p>
              )}

              {/* description/resources pills visible during processing (Photo 5 style) */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowDesc(!showDesc)}
                  className={`border hover:bg-slate-50 text-[#1c1d1f] font-light text-[10px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${showDesc ? "border-[#1c1d1f] bg-[#f7f9fa]" : "border-[#6a6f73]"}`}
                >
                  <Plus className="w-3 h-3" /> Description
                </button>
                <button
                  onClick={() => setShowResources(!showResources)}
                  className={`border hover:bg-slate-50 text-[#1c1d1f] font-light text-[10px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${showResources ? "border-[#1c1d1f] bg-[#f7f9fa]" : "border-[#6a6f73]"}`}
                >
                  <Plus className="w-3 h-3" /> Resources
                </button>
                <button
                  onClick={() => setShowLab(!showLab)}
                  className={`border hover:bg-slate-50 text-[#1c1d1f] font-light text-[10px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${showLab ? "border-[#1c1d1f] bg-[#f7f9fa]" : "border-[#6a6f73]"}`}
                >
                  <Plus className="w-3 h-3" /> Lab
                </button>
              </div>

              {/* description text editor (Photo 5 style) */}
              {showDesc && (
                <div className="bg-white border border-[#d1d7dc] p-5 space-y-4">
                  <h4 className="font-light text-lg text-[#1c1d1f]">Lecture Description</h4>
                  <div className="flex gap-1.5 items-center border border-[#d1d7dc] bg-slate-50 p-1.5 text-lg text-[#6a6f73]">
                    <button className="font-light px-2 py-0.5 hover:bg-white border hover:border-[#d1d7dc]">B</button>
                    <button className="italic px-2 py-0.5 hover:bg-white border hover:border-[#d1d7dc]">I</button>
                    <button className="px-2 py-0.5 hover:bg-white border hover:border-[#d1d7dc]">List</button>
                  </div>
                  <textarea
                    rows={4}
                    value={lectureDesc}
                    onChange={(e) => setLectureDesc(e.target.value)}
                    placeholder="Add a description. Include what students will be able to do after completing the lecture."
                    className="w-full border border-[#6a6f73] p-3 text-lg text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                  />
                  <div className="flex justify-end gap-2.5">
                    <button onClick={() => setShowDesc(false)} className="text-lg text-[#6a6f73] font-light">Cancel</button>
                    <button onClick={handleSaveDescription} className="bg-[#1c1d1f] text-white font-light text-lg px-5 py-2 hover:bg-black transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 5: LINKED - DISPLAY VIDEO INFO & METADATA (Photo 1 style) */}
          {showLinkedVideo && (
            <div className="space-y-4">
              <div className="flex gap-4 items-start bg-white border border-[#d1d7dc] p-4 relative">
                
                {/* Thumbnail block - shows real thumbnail when available */}
                <div
                  className="w-40 aspect-video bg-neutral-900 border border-[#d1d7dc] relative flex items-center justify-center shrink-0 overflow-hidden"
                >
                  {lecture.thumbnail ? (
                    <img
                      src={lecture.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="w-8 h-8 text-[#6a6f73]" />
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/80 px-1 text-[10px] text-white font-mono">
                    {formatDuration(lecture.durationInSeconds)}
                  </span>
                </div>

                {/* Info details */}
                <div className="flex-grow min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-light text-[#1c1d1f] truncate max-w-[320px]">
                      {lecture.originalName || lecture.title}
                    </span>
                    <button
                      onClick={() => {
                        setIsEditingVideoOverride(true);
                        setPanelType("add-video");
                        setVideoTab("upload");
                      }}
                      className="text-[#5624d0] hover:underline text-[11px] font-light"
                    >
                      Edit Content
                    </button>
                    <span className="text-gray-300 text-[10px] select-none">|</span>
                    <Link
                      to={`/instructor/course/${courseId}/lecture/${lecture._id}`}
                      className="text-[#5624d0] hover:underline text-[11px] font-light"
                    >
                      Subtitles & Aligner
                    </Link>
                  </div>
                  <span className="text-[10px] text-[#6a6f73] block mt-1">
                    Duration: {formatDuration(lecture.durationInSeconds)}
                  </span>
                </div>

                {/* Preview & Download actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="relative">
                    <button
                      onClick={() => setShowPreviewDropdown(!showPreviewDropdown)}
                      className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-light text-lg py-2 px-4 flex items-center gap-1.5 transition-colors"
                    >
                      Preview <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {showPreviewDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowPreviewDropdown(false)} />
                        <div className="absolute right-0 mt-1.5 w-40 bg-white border border-[#d1d7dc] shadow-lg z-50 py-1 font-sans text-lg">
                          <button
                            onClick={() => {
                              setShowPreviewDropdown(false);
                              window.open(`/course-detail/${courseId}/content?lecture=${lecture._id}`, "_blank");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[#1c1d1f]"
                          >
                            as instructor
                          </button>
                          <button
                            onClick={() => {
                              setShowPreviewDropdown(false);
                              window.open(`/course-detail/${courseId}/content?lecture=${lecture._id}&instructorPreviewMode=student_v4`, "_blank");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-[#1c1d1f]"
                          >
                            as student
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Downloadable Toggle */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg text-[#6a6f73]">Downloadable:</span>
                    <button
                      onClick={handleToggleDownloadable}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${lecture.downloadable ? "bg-[#5624d0]" : "bg-[#d1d7dc]"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${lecture.downloadable ? "translate-x-4" : ""}`} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Pills toggles */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setShowDesc(!showDesc);
                    setShowResources(false);
                    setShowLab(false);
                  }}
                  className={`border hover:bg-slate-50 text-[#1c1d1f] font-light text-[10px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${showDesc ? "border-[#1c1d1f] bg-[#f7f9fa]" : "border-[#6a6f73]"}`}
                >
                  <Plus className="w-3 h-3" /> Description
                </button>
                <button
                  onClick={() => {
                    setShowResources(!showResources);
                    setShowDesc(false);
                    setShowLab(false);
                  }}
                  className={`border hover:bg-slate-50 text-[#1c1d1f] font-light text-[10px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${showResources ? "border-[#1c1d1f] bg-[#f7f9fa]" : "border-[#6a6f73]"}`}
                >
                  <Plus className="w-3 h-3" /> Resources {lecture.resources?.length > 0 ? `(${lecture.resources.length})` : ""}
                </button>
                <button
                  onClick={() => {
                    setShowLab(!showLab);
                    setShowDesc(false);
                    setShowResources(false);
                  }}
                  className={`border hover:bg-slate-50 text-[#1c1d1f] font-light text-[10px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5 ${showLab ? "border-[#1c1d1f] bg-[#f7f9fa]" : "border-[#6a6f73]"}`}
                >
                  <Plus className="w-3 h-3" /> Lab {lecture.lab?.title || lecture.lab?.pdfUrl ? "(Configured)" : ""}
                </button>
              </div>

              {/* description text editor (Photo 5 style) */}
              {showDesc && (
                <div className="bg-white border border-[#d1d7dc] p-5 space-y-4">
                  <h4 className="font-light text-lg text-[#1c1d1f]">Lecture Description</h4>
                  <div className="flex gap-1.5 items-center border border-[#d1d7dc] bg-slate-50 p-1.5 text-lg text-[#6a6f73]">
                    <button className="font-light px-2 py-0.5 hover:bg-white border hover:border-[#d1d7dc]">B</button>
                    <button className="italic px-2 py-0.5 hover:bg-white border hover:border-[#d1d7dc]">I</button>
                    <button className="px-2 py-0.5 hover:bg-white border hover:border-[#d1d7dc]">List</button>
                  </div>
                  <textarea
                    rows={4}
                    value={lectureDesc}
                    onChange={(e) => setLectureDesc(e.target.value)}
                    placeholder="Add a description. Include what students will be able to do after completing the lecture."
                    className="w-full border border-[#6a6f73] p-3 text-lg text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                  />
                  <div className="flex justify-end gap-2.5">
                    <button onClick={() => setShowDesc(false)} className="text-lg text-[#6a6f73] font-light">Cancel</button>
                    <button onClick={handleSaveDescription} className="bg-[#1c1d1f] text-white font-light text-lg px-5 py-2 hover:bg-black transition-colors">
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Resources Panel */}
              {showResources && (
                <div className="bg-white border border-[#d1d7dc] p-5 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg text-[#1c1d1f]">Lecture Resources</h4>
                      <p className="text-sm text-[#6a6f73]">
                        Upload downloadable files (PDFs, slides) directly via Cloudinary or paste external links (Google Drive, GitHub).
                      </p>
                    </div>
                    <button
                      onClick={() => setShowResources(false)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Attached Resources List */}
                  {lecture.resources && lecture.resources.length > 0 ? (
                    <div className="space-y-2 border-b border-[#d1d7dc] pb-4">
                      <h5 className="text-xs font-semibold text-[#1c1d1f] uppercase tracking-wider">
                        Attached Resources ({lecture.resources.length})
                      </h5>
                      <div className="divide-y divide-[#e4e8eb] border border-[#d1d7dc] rounded-sm bg-white">
                        {lecture.resources.map((item) => (
                          <div key={item._id} className="flex items-center justify-between p-3 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.type === "pdf" ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded border border-red-200">
                                  PDF
                                </span>
                              ) : item.type === "file" ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded border border-blue-200">
                                  FILE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded border border-purple-200">
                                  LINK
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#1c1d1f] truncate">{item.title}</p>
                                {item.size && <span className="text-xs text-[#6a6f73]">{item.size}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 text-[#5624d0] hover:underline font-medium px-2.5 py-1 bg-white border border-[#d1d7dc] rounded hover:border-[#5624d0]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> View / Download
                              </a>
                              <button
                                onClick={() => handleDeleteResource(item._id)}
                                disabled={isDeletingResource}
                                className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                title="Delete resource"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-dashed border-[#d1d7dc] text-center text-sm text-[#6a6f73]">
                      No resources attached yet. Upload a PDF or add a Google Drive link below.
                    </div>
                  )}

                  {/* Add Resource Tab Switcher */}
                  <div className="space-y-3 pt-2">
                    <div className="flex border-b border-[#d1d7dc] text-sm">
                      <button
                        onClick={() => setResourceTab("file")}
                        className={`pb-2 px-4 font-medium transition-colors ${
                          resourceTab === "file"
                            ? "border-b-2 border-[#1c1d1f] text-[#1c1d1f]"
                            : "text-[#6a6f73] hover:text-[#1c1d1f]"
                        }`}
                      >
                        Upload PDF / Document (Cloudinary)
                      </button>
                      <button
                        onClick={() => setResourceTab("link")}
                        className={`pb-2 px-4 font-medium transition-colors ${
                          resourceTab === "link"
                            ? "border-b-2 border-[#1c1d1f] text-[#1c1d1f]"
                            : "text-[#6a6f73] hover:text-[#1c1d1f]"
                        }`}
                      >
                        Add External Link (Google Drive / GitHub)
                      </button>
                    </div>

                    {resourceTab === "file" ? (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                            Choose PDF or Document file
                          </label>
                          <input
                            type="file"
                            ref={resourceFileRef}
                            accept=".pdf,.doc,.docx,.zip,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setResourceFile(file || null);
                              if (file && !resourceTitle) {
                                setResourceTitle(file.name);
                              }
                            }}
                            className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#1c1d1f] file:text-white hover:file:bg-black file:cursor-pointer cursor-pointer border border-[#d1d7dc] p-1.5 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                            Title / Display Name (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Lecture 1 Slides & Cheat Sheet"
                            value={resourceTitle}
                            onChange={(e) => setResourceTitle(e.target.value)}
                            className="w-full border border-[#d1d7dc] px-3 py-2 text-sm text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <button
                          onClick={handleUploadResourceFile}
                          disabled={isUploadingResourceFile || !resourceFile}
                          className="bg-[#1c1d1f] text-white text-sm font-medium px-4 py-2 hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploadingResourceFile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Uploading to Cloudinary…
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" /> Upload File to Cloudinary
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                            Resource Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Google Drive Lecture Slides, GitHub Starter Repo"
                            value={resourceTitle}
                            onChange={(e) => setResourceTitle(e.target.value)}
                            className="w-full border border-[#d1d7dc] px-3 py-2 text-sm text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                            External URL (Google Drive, GitHub, etc.)
                          </label>
                          <input
                            type="url"
                            placeholder="https://drive.google.com/... or https://github.com/..."
                            value={resourceLink}
                            onChange={(e) => setResourceLink(e.target.value)}
                            className="w-full border border-[#d1d7dc] px-3 py-2 text-sm text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <button
                          onClick={handleAddLinkResource}
                          disabled={isAddingLink || !resourceLink.trim()}
                          className="bg-[#1c1d1f] text-white text-sm font-medium px-4 py-2 hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingLink ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-4 h-4" /> Add External Link
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lab Panel */}
              {showLab && (
                <div className="bg-white border border-[#d1d7dc] p-5 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg text-[#1c1d1f]">Lab Configuration</h4>
                      <p className="text-sm text-[#6a6f73]">
                        Configure hands-on lab workspace (Google Colab, GitHub, Google Drive) and upload an assignment PDF via Cloudinary.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowLab(false)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Active Lab Card if configured */}
                  {(lecture.lab?.title || lecture.lab?.pdfUrl || lecture.lab?.url) && (
                    <div className="p-3.5 bg-purple-50 border border-purple-200 rounded flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-[#a435f0] text-white px-2 py-0.5 rounded">
                            ACTIVE LAB
                          </span>
                          <h5 className="font-semibold text-sm text-[#1c1d1f] truncate">
                            {lecture.lab.title || "Lecture Hands-on Lab"}
                          </h5>
                        </div>
                        {lecture.lab.description && (
                          <p className="text-xs text-[#6a6f73] line-clamp-2">{lecture.lab.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 pt-1 text-xs">
                          {lecture.lab.url && (
                            <a
                              href={lecture.lab.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#5624d0] hover:underline flex items-center gap-1 font-medium"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open Lab Workspace
                            </a>
                          )}
                          {lecture.lab.pdfUrl && (
                            <a
                              href={lecture.lab.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-700 hover:underline flex items-center gap-1 font-medium"
                            >
                              <FileText className="w-3.5 h-3.5 text-red-600" /> View Assignment PDF
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleDeleteLab}
                        disabled={isDeletingLab}
                        className="text-gray-400 hover:text-red-600 p-1 shrink-0"
                        title="Remove lab configuration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Lab Inputs Form */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                        Lab Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lab 1: React State & Todo App Project"
                        value={labTitle}
                        onChange={(e) => setLabTitle(e.target.value)}
                        className="w-full border border-[#d1d7dc] px-3 py-2 text-sm text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                        Lab Instructions / Objectives (optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Brief summary of steps students need to follow to complete this lab."
                        value={labDesc}
                        onChange={(e) => setLabDesc(e.target.value)}
                        className="w-full border border-[#d1d7dc] p-3 text-sm text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                        Lab Workspace URL (Google Colab, Google Drive, GitHub Classroom, etc.)
                      </label>
                      <input
                        type="url"
                        placeholder="https://colab.research.google.com/... or https://drive.google.com/..."
                        value={labUrl}
                        onChange={(e) => setLabUrl(e.target.value)}
                        className="w-full border border-[#d1d7dc] px-3 py-2 text-sm text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1c1d1f] mb-1">
                        Upload Lab Assignment PDF (via Cloudinary)
                      </label>
                      <input
                        type="file"
                        ref={labPdfRef}
                        accept=".pdf"
                        onChange={(e) => setLabPdfFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#1c1d1f] file:text-white hover:file:bg-black file:cursor-pointer cursor-pointer border border-[#d1d7dc] p-1.5 bg-slate-50"
                      />
                      {lecture.lab?.pdfName && !labPdfFile && (
                        <p className="text-xs text-[#6a6f73] mt-1">Current file: {lecture.lab.pdfName}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        onClick={() => setShowLab(false)}
                        className="px-4 py-2 border border-[#d1d7dc] text-sm text-[#6a6f73] hover:text-[#1c1d1f]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveLab}
                        disabled={isUpdatingLab || isUploadingLabPdf}
                        className="bg-[#1c1d1f] text-white text-sm font-medium px-5 py-2 hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUpdatingLab || isUploadingLabPdf ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving Lab…
                          </>
                        ) : (
                          "Save Lab Configuration"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>
          )}

        </div>
      )}

    </div>
  );
};

LectureItem.propTypes = {
  lecture: PropTypes.object.isRequired,
  courseId: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

export default LectureItem;