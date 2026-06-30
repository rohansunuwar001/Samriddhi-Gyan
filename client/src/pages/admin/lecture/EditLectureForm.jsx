import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDeleteLectureMutation, useGetLectureByIdQuery, useUpdateLectureMutation } from "@/features/api/lectureApi";

import { CheckCircle2, AlertCircle, Upload, Film, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_BASE_URL ;

// ─── Small sub-components ─────────────────────────────────────────────────────

const StatusBadge = ({ status, phase, progress }) => {
  const config = {
    pending:      { label: "No video yet",   cls: "bg-gray-100 text-gray-600" },
    transcoding:  { label: phase || "Transcoding…",  cls: "bg-amber-100 text-amber-700" },
    uploading_r2: { label: phase || "Uploading…",    cls: "bg-blue-100 text-blue-700" },
    ready:        { label: "Live",           cls: "bg-green-100 text-green-700" },
    failed:       { label: "Failed",         cls: "bg-red-100 text-red-700" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.cls}`}>
      {status === "transcoding" && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === "ready"       && <CheckCircle2 className="w-3 h-3" />}
      {status === "failed"      && <AlertCircle className="w-3 h-3" />}
      {c.label}
      {progress > 0 && progress < 100 && ` (${progress}%)`}
    </span>
  );
};

const ProgressBar = ({ value, label, color = "bg-blue-500" }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{label}</span><span>{value}%</span>
    </div>
    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const EditLectureForm = () => {
  const { lectureId, courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [selectedFile, setSelectedFile]     = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading]       = useState(false);
  const [processingStatus, setProcessingStatus]   = useState("pending");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingPhase, setProcessingPhase]       = useState("");
  const [pollEnabled, setPollEnabled] = useState(false);
  const fileInputRef = useRef(null);
  const xhrRef       = useRef(null);

  const { data: lectureData, isLoading } = useGetLectureByIdQuery(lectureId);
  const [updateLecture, { isLoading: isSaving }] = useUpdateLectureMutation();
  const [deleteLecture, { isLoading: isDeleting }] = useDeleteLectureMutation();

  // Populate form from fetched lecture
  useEffect(() => {
    if (lectureData?.lecture) {
      setTitle(lectureData.lecture.title || "");
      setDescription(lectureData.lecture.description || "");
      setIsPreview(lectureData.lecture.isPreview || false);
      setProcessingStatus(lectureData.lecture.status || "pending");
    }
  }, [lectureData]);

  // Poll transcoding status every 3s while processing
  useEffect(() => {
    if (!pollEnabled || !lectureId) return;
    if (["ready", "failed", "pending"].includes(processingStatus)) {
      setPollEnabled(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/v1/lectures/${lectureId}/status`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }
        );
        const data = await res.json();
        if (data.success) {
          setProcessingStatus(data.status);
          setProcessingProgress(data.progress || 0);
          setProcessingPhase(data.phase || "");
          if (data.status === "ready") {
            setPollEnabled(false);
            toast.success("Video is live and ready to stream!");
          }
          if (data.status === "failed") {
            setPollEnabled(false);
            toast.error(`Processing failed: ${data.error || "Unknown error"}`);
          }
        }
      } catch {
        // Network blip — keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pollEnabled, processingStatus, lectureId]);

  // ── Video upload via XHR (fetch has no upload progress) ──────────────────
  const handleUpload = async () => {
    if (!selectedFile || !lectureId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStatus("transcoding");

    const formData = new FormData();
    formData.append("video", selectedFile);

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else {
            try { reject(new Error(JSON.parse(xhr.responseText).message || "Upload failed")); }
            catch { reject(new Error("Upload failed")); }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.open("POST", `${BACKEND_URL}/api/v1/lectures/${lectureId}/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("authToken")}`);
        xhr.send(formData);
      });

      toast.info("Video uploaded! Transcoding started in background…");
      setSelectedFile(null);
      setPollEnabled(true);
    } catch (err) {
      toast.error(err.message);
      setProcessingStatus(lectureData?.lecture?.status || "pending");
    } finally {
      setIsUploading(false);
      xhrRef.current = null;
    }
  };

  // ── Save title / isPreview (JSON, not FormData) ───────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    try {
      const res = await updateLecture({
        lectureId,
        title: title.trim(),
        description: description.trim(),
        isPreview,
        courseId,
      }).unwrap();
      toast.success(res.message || "Lecture updated!");
    } catch (err) {
      toast.error(err?.data?.message || "Update failed.");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm("Delete this lecture? This is permanent.")) return;
    try {
      await deleteLecture({ lectureId, courseId }).unwrap();
      toast.success("Lecture deleted.");
      navigate(`/instructor/course/${courseId}`);
    } catch (err) {
      toast.error(err?.data?.message || "Deletion failed.");
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  };

  if (isLoading) return <p className="text-center p-8">Loading lecture editor…</p>;

  const lecture = lectureData?.lecture;
  const isProcessing = ["transcoding", "uploading_r2"].includes(processingStatus);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Editing: "{lecture?.title}"</CardTitle>
            <CardDescription>Update the title or upload a new video.</CardDescription>
          </div>
          <StatusBadge
            status={processingStatus}
            phase={processingPhase}
            progress={processingProgress}
          />
        </div>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="space-y-6">

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Lecture Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lecture title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Lecture Description
            </Label>

            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lecture description..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Video upload */}
          <div className="space-y-3">
            <Label>Video</Label>

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <ProgressBar value={uploadProgress} label="Uploading to server…" color="bg-blue-500" />
                <button
                  type="button"
                  onClick={() => xhrRef.current?.abort()}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            )}

            {/* Transcoding progress */}
            {isProcessing && !isUploading && (
              <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <ProgressBar
                  value={processingProgress}
                  label={processingPhase || "FFmpeg transcoding…"}
                  color="bg-amber-500"
                />
                <p className="text-xs text-amber-700">
                  You can close this — processing continues in the background.
                </p>
              </div>
            )}

            {/* Drop zone */}
            {!isUploading && !isProcessing && (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-secondary/30 transition-colors"
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f?.type.startsWith("video/")) setSelectedFile(f);
                  else toast.error("Please drop a video file");
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />

                {selectedFile ? (
                  <div className="space-y-1">
                    <Film className="w-8 h-8 text-primary mx-auto" />
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Drop video here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP4, MOV, MKV · Up to 20 GB · Up to 4K supported
                    </p>
                    {processingStatus === "ready" && (
                      <p className="text-xs text-green-600 mt-1">
                        Current video is live. Upload to replace it.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload button */}
            {selectedFile && !isUploading && (
              <Button type="button" className="w-full" onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload &amp; Process Video
              </Button>
            )}
          </div>

          {/* Free preview toggle */}
          <div className="flex items-center space-x-2">
            <Switch id="is-preview" checked={isPreview} onCheckedChange={setIsPreview} />
            <Label htmlFor="is-preview">Allow Free Preview</Label>
          </div>

        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Lecture"}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EditLectureForm;
