import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { Section } from "../models/section.model.js";
import { deleteFromCloudinary, uploadVideo } from "../utils/cloudinary.js"; // Assuming you have an `uploadVideo` helper

/**
 * @desc    Create a new lecture within a specific section
 * @route   POST /api/v1/sections/:sectionId/lectures
 * @access  Private (Instructor only)
 */
export const createLecture = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title, durationInSeconds = 0 } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Lecture title is required." });
        }

        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found." });
        }

        // Create the new lecture, linking it to its parent section
        const lecture = await Lecture.create({
            title,
            durationInSeconds: Number(durationInSeconds),
            section: sectionId,
        });

        // Use Promise.all for efficient parallel updates
        await Promise.all([
            // Add lecture to section and update section's duration
            Section.findByIdAndUpdate(sectionId, {
                $push: { lectures: lecture._id },
                $inc: { totalDurationInSeconds: lecture.durationInSeconds }
            }),
            // Update the parent course's total duration and lecture count
            Course.findByIdAndUpdate(section.course, {
                $inc: {
                    totalDurationInSeconds: lecture.durationInSeconds,
                    totalLectures: 1
                }
            })
        ]);

        res.status(201).json({
            success: true,
            message: "Lecture created successfully.",
            lecture,
        });

    } catch (error) {
        console.error("Error creating lecture:", error);
        res.status(500).json({ message: "Failed to create lecture." });
    }
};

/**
 * @desc    Update a lecture (title, video, etc.)
 * @route   PUT /api/v1/lectures/:lectureId
 * @access  Private (Instructor only)
 */
export const updateLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const { title, durationInSeconds, isPreview } = req.body;
        const videoFile = req.file;

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found." });
        }
        
        const oldDuration = lecture.durationInSeconds;

        // --- Handle Video Upload ---
        if (videoFile) {
            // Delete old video if it exists
            if (lecture.publicId) {
                await deleteFromCloudinary(lecture.publicId);
            }
            // Upload new video
            const videoData = await uploadVideo(videoFile.path); // You may need to create an uploadVideo helper
            lecture.videoUrl = videoData.secure_url;
            lecture.publicId = videoData.public_id;
            // You can also get duration from videoData if your uploader provides it
        }
        
        // --- Update Lecture Fields ---
        lecture.title = title || lecture.title;
        lecture.isPreview = isPreview !== undefined ? isPreview : lecture.isPreview;
        if(durationInSeconds) lecture.durationInSeconds = Number(durationInSeconds);

        const updatedLecture = await lecture.save();
        const durationChange = updatedLecture.durationInSeconds - oldDuration;

        // If duration changed, update parent totals
        if(durationChange !== 0) {
            const section = await Section.findById(updatedLecture.section);
            await Promise.all([
                Section.findByIdAndUpdate(section._id, { $inc: { totalDurationInSeconds: durationChange } }),
                Course.findByIdAndUpdate(section.course, { $inc: { totalDurationInSeconds: durationChange } })
            ]);
        }
        
        res.status(200).json({
            success: true,
            message: "Lecture updated successfully.",
            lecture: updatedLecture,
        });

    } catch (error) {
        console.error("Error updating lecture:", error);
        res.status(500).json({ message: "Failed to update lecture." });
    }
};

/**
 * @desc    Delete a lecture
 * @route   DELETE /api/v1/lectures/:lectureId
 * @access  Private (Instructor only)
 */
export const deleteLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found." });
        }

        // If lecture has a video, delete it from Cloudinary
        if (lecture.publicId) {
            await deleteVideoFromCloudinary(lecture.publicId);
        }

        const section = await Section.findById(lecture.section);
        const durationToSubtract = -lecture.durationInSeconds;

        await Promise.all([
            // Remove lecture from section and update section's duration
            Section.findByIdAndUpdate(section._id, {
                $pull: { lectures: lectureId },
                $inc: { totalDurationInSeconds: durationToSubtract }
            }),
            // Update the parent course's totals
            Course.findByIdAndUpdate(section.course, {
                $inc: {
                    totalDurationInSeconds: durationToSubtract,
                    totalLectures: -1
                }
            }),
            // Delete the lecture document itself
            Lecture.findByIdAndDelete(lectureId)
        ]);
        
        res.status(200).json({ success: true, message: "Lecture deleted successfully." });

    } catch (error) {
        console.error("Error deleting lecture:", error);
        res.status(500).json({ message: "Failed to delete lecture." });
    }
};

/**
 * @desc    Get a single lecture's details
 * @route   GET /api/v1/lectures/:lectureId
 * @access  Public (or Private if content is protected)
 */
export const getLectureById = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found!" });
        }
        res.status(200).json({ success: true, lecture });
    } catch (error) {
        console.error("Error getting lecture:", error);
        res.status(500).json({ message: "Failed to get lecture." });
    }
};