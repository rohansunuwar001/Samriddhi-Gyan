import Note from "../models/note.model.js";

// Fetch all notes for a specific user and course
export const getCourseNotes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const { lectureId, sort } = req.query;

    const filter = { userId, courseId };
    if (lectureId && lectureId !== "all") {
      filter.lectureId = lectureId;
    }

    let sortOption = { createdAt: -1 }; // default: most recent
    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "timestamp") {
      sortOption = { timestamp: 1 };
    }

    const notes = await Note.find(filter).sort(sortOption).lean();

    return res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("getCourseNotes error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching notes." });
  }
};

// Create a new note at timestamp
export const createNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, lectureId, lectureTitle, timestamp, content } = req.body;

    if (!courseId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course ID and note content are required.",
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Note content cannot exceed 1000 characters.",
      });
    }

    const note = await Note.create({
      userId,
      courseId,
      lectureId: lectureId || "general",
      lectureTitle: lectureTitle || "Lecture Note",
      timestamp: Math.max(0, Math.floor(Number(timestamp) || 0)),
      content: content.trim(),
    });

    return res.status(201).json({
      success: true,
      note,
      message: "Note created successfully.",
    });
  } catch (error) {
    console.error("createNote error:", error);
    return res.status(500).json({ success: false, message: "Server error creating note." });
  }
};

// Update an existing note
export const updateNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const { noteId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content cannot be empty.",
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Note content cannot exceed 1000 characters.",
      });
    }

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { content: content.trim() },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      note,
      message: "Note updated successfully.",
    });
  } catch (error) {
    console.error("updateNote error:", error);
    return res.status(500).json({ success: false, message: "Server error updating note." });
  }
};

// Delete a note
export const deleteNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const { noteId } = req.params;

    const note = await Note.findOneAndDelete({ _id: noteId, userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (error) {
    console.error("deleteNote error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting note." });
  }
};
