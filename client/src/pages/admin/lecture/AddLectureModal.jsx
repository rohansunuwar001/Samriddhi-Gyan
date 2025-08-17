"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateLectureMutation, useGetSignatureForUploadQuery } from "@/features/api/lectureApi";
import { toast } from "sonner";

const AddLectureModal = ({ sectionId, courseId, isOpen, onClose, onLectureAdded }) => {
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [createLecture] = useCreateLectureMutation();
  const { data: signatureData } = useGetSignatureForUploadQuery();

  if (!isOpen) return null;

  const handleUploadToCloudinary = async (file) => {
    if (!file || !signatureData) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", "lms/lectures");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !videoFile) {
      toast.error("Title and video file are required.");
      return;
    }

    try {
      setLoading(true);

      // Upload video to Cloudinary
      const uploadedVideo = await handleUploadToCloudinary(videoFile);
      if (!uploadedVideo?.secure_url) throw new Error("Video upload failed");

      // Create lecture via RTK mutation
      const lectureData = {
        title,
        videoUrl: uploadedVideo.secure_url,
        publicId: uploadedVideo.public_id,
      };

      const res = await createLecture({ sectionId, lectureData, courseId }).unwrap();
      toast.success("Lecture added successfully!");
      onLectureAdded?.(res.lecture);

      // Reset form
      setTitle("");
      setVideoFile(null);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to add lecture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Lecture</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Lecture Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Upload Video</label>
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              required
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Lecture"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLectureModal;
