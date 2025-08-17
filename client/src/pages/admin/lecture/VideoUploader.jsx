// file: components/VideoUploader.jsx (or a suitable path)

import { Button } from "@/components/ui/button";
import { useGetSignatureForUploadQuery } from "@/features/api/lectureApi";
import { UploadCloud, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

/**
 * A button component that handles the entire direct-to-Cloudinary upload process.
 * @param {function} onUploadSuccess - A callback function that receives the uploaded video metadata.
 */
const VideoUploader = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { data: signatureData, refetch } = useGetSignatureForUploadQuery();

  const handleUploadClick = async () => {
    // Ensure we have a fresh signature before opening the widget
    const { data: freshSignature } = await refetch();

    if (!freshSignature) {
      toast.error("Could not get upload credentials. Please try again.");
      return;
    }
    
    const widget = window.cloudinary.openUploadWidget(
      {
        cloudName: freshSignature.cloudName,
        apiKey: freshSignature.apiKey,
        uploadSignature: freshSignature.signature,
        uploadSignatureTimestamp: freshSignature.timestamp,
        folder: 'lms/lectures', // This folder must match the one signed on your backend
        cropping: false, // Or enable other features
      },
      (error, result) => {
        if (error) {
          setIsUploading(false);
          toast.error("Upload failed. Please check the console for details.");
          console.error("Cloudinary Widget Error:", error);
          return;
        }

        if (result.event === 'uploading') {
          setIsUploading(true);
        }

        if (result.event === 'success') {
          setIsUploading(false);
          toast.success("Video uploaded successfully!");
          
          // Construct the metadata object for the parent form
          const videoMetadata = {
            videoUrl: result.info.eager[0].secure_url, // URL of the processed 720p video
            publicId: result.info.public_id,
            durationInSeconds: Math.floor(result.info.duration),
          };

          // Pass the data up to the parent component
          onUploadSuccess(videoMetadata);
        }
      }
    );
    widget.open();
  };

  return (
    <Button type="button" variant="outline" onClick={handleUploadClick} disabled={isUploading}>
      {isUploading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UploadCloud className="mr-2 h-4 w-4" />
      )}
      {isUploading ? 'Uploading...' : 'Upload/Replace Video'}
    </Button>
  );
};

export default VideoUploader;