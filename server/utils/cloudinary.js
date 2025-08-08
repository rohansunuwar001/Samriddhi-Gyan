import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({});

cloudinary.config({
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
  secure: true, // It's good practice to enforce HTTPS
});


/**
 * @description Uploads a generic file (optimized for images) to Cloudinary
 * @param {string} localFilePath - The local path to the file to upload
 * @returns {object | null} - The Cloudinary upload response object or null on failure
 */
export const uploadMedia = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically detect the resource type (good for images)
            // You can add folders or transformations here if needed
        });
        
        // After successful upload, remove the local file
        fs.unlinkSync(localFilePath);
        return uploadResponse;

    } catch (error) {
        // If an error occurs, still remove the locally saved temporary file
        fs.unlinkSync(localFilePath); 
        console.error("Cloudinary media upload failed:", error);
        return null;
    }
};

/**
 * @description Uploads a video file to Cloudinary with video-specific settings
 * @param {string} localFilePath - The local path to the video file
 * @returns {object | null} - The Cloudinary upload response with video metadata, or null on failure
 */
export const uploadVideo = async (localFilePath) => {
    if (!localFilePath) return null;
    
    try {
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "video", // EXPLICITLY set for videos
            // This is powerful: It requests the video duration and format info in the response
            eager_async: true, // Recommended for better performance on larger videos
        });

        // The Cloudinary response for video will include a `duration` field.
        fs.unlinkSync(localFilePath);
        return uploadResponse;

    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.error("Cloudinary video upload failed:", error);
        return null;
    }
};

/**
 * @description Deletes any media (image or video) from Cloudinary
 * @param {string} publicId - The public_id of the media to delete
 * @param {string} resource_type - Optional: "video", "image". Defaults to "image".
 */
export const deleteFromCloudinary = async (publicId, resource_type = "image") => {
    if (!publicId) return;

    try {
        // This single function can handle both videos and images by specifying the resource_type
        await cloudinary.uploader.destroy(publicId, { resource_type });
        console.log(`Successfully deleted ${resource_type} with public_id: ${publicId}`);

    } catch (error) {
        console.error(`Failed to delete ${resource_type} from Cloudinary:`, error);
    }
};

// --- Your OLD Functions can now be removed or kept for backward compatibility ---
// The new `deleteFromCloudinary` function makes these two redundant.
/*
export const deleteMediaFromCloudinary = async (publicId) => { ... }
export const deleteVideoFromCloudinary = async (publicId) => { ... }
*/