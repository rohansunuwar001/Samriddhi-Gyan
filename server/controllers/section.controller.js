import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { Section } from "../models/section.model.js";


/**
 * @desc    Create a new section within a course
 * @route   POST /api/v1/courses/:courseId/sections
 * @access  Private (Instructor only)
 */
export const createSection = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Section title is required." });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        // Create the new section
        const section = await Section.create({
            title,
            course: courseId,
        });

        // Add the new section's ID to the parent course's 'sections' array
        course.sections.push(section._id);
        await course.save();

        res.status(201).json({
            success: true,
            message: "Section created successfully.",
            section,
        });

    } catch (error) {
        console.error("Error creating section:", error);
        res.status(500).json({ message: "Failed to create section." });
    }
};

/**
 * @desc    Update a section's title
 * @route   PUT /api/v1/sections/:sectionId
 * @access  Private (Instructor only)
 */
export const updateSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Section title is required." });
        }

        const section = await Section.findByIdAndUpdate(
            sectionId,
            { title },
            { new: true }
        );

        if (!section) {
            return res.status(404).json({ message: "Section not found." });
        }

        res.status(200).json({
            success: true,
            message: "Section updated successfully.",
            section,
        });

    } catch (error) {
        console.error("Error updating section:", error);
        res.status(500).json({ message: "Failed to update section." });
    }
};


/**
 * @desc    Delete a section
 * @route   DELETE /api/v1/sections/:sectionId
 * @access  Private (Instructor only)
 */
export const deleteSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found." });
        }
        
        // Use Promise.all for efficient parallel operations
        await Promise.all([
            // 1. Delete all lectures within this section
            Lecture.deleteMany({ _id: { $in: section.lectures } }),
            
            // 2. Remove the section's ID from the parent course
            Course.findByIdAndUpdate(section.course, {
                $pull: { sections: sectionId }
            }),
            
            // 3. Finally, delete the section document itself
            Section.findByIdAndDelete(sectionId)
        ]);
        
        res.status(200).json({ success: true, message: "Section deleted successfully." });

    } catch (error) {
        console.error("Error deleting section:", error);
        res.status(500).json({ message: "Failed to delete section." });
    }
};