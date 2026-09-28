import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link2,
  Trash2,
  Edit2,
  ChevronDown,
  Plus,
  Play,
  Loader2,
} from "lucide-react";
import {
  useGetCourseNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/features/api/noteApi";
import { toast } from "sonner";

const CourseNotesTab = ({
  courseId,
  selectedLecture,
  currentVideoTime = 0,
  onSeekTo,
  isEditorOpenInitially = false,
  onEditorStateChange,
}) => {
  const [isCreating, setIsCreating] = useState(isEditorOpenInitially);
  const [noteTimestamp, setNoteTimestamp] = useState(Math.floor(currentVideoTime || 0));
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Filters and sorting
  const [lectureFilter, setLectureFilter] = useState("all"); // 'all' or 'current'
  const [sortBy, setSortBy] = useState("recent"); // 'recent' or 'oldest'

  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);

  // Sync external open request (e.g. from Video Player's Add Note button)
  useEffect(() => {
    if (isEditorOpenInitially) {
      setIsCreating(true);
      setNoteTimestamp(Math.floor(currentVideoTime || 0));
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isEditorOpenInitially, currentVideoTime]);

  // Keep parent notified of editor state
  useEffect(() => {
    if (onEditorStateChange) {
      onEditorStateChange(isCreating);
    }
  }, [isCreating, onEditorStateChange]);

  // RTK Query hooks
  const {
    data: notesData,
    isLoading: isNotesLoading,
  } = useGetCourseNotesQuery({
    courseId,
    lectureId: lectureFilter === "current" ? selectedLecture?._id : undefined,
    sort: sortBy === "oldest" ? "oldest" : undefined,
  }, { skip: !courseId });

  const [createNote, { isLoading: isCreatingNote }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isUpdatingNote }] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  const notes = notesData?.notes || [];

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (timeInSeconds = 0) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcut: Press 'B' to trigger note creation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || document.activeElement?.isContentEditable) {
        return;
      }
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        openCreateEditor();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentVideoTime]);

  const openCreateEditor = () => {
    setIsCreating(true);
    setNoteTimestamp(Math.floor(currentVideoTime || 0));
    setEditingNoteId(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const closeCreateEditor = () => {
    setIsCreating(false);
    setContent("");
  };

  // Rich toolbar helper for formatting text
  const applyFormat = (syntax, isWrap = true, ref = textareaRef, setter = setContent, val = content) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = val.substring(start, end);

    let replacement = "";
    let newCursorPos = 0;

    if (isWrap) {
      replacement = `${syntax}${selectedText || "text"}${syntax}`;
      newCursorPos = selectedText ? start + replacement.length : start + syntax.length;
    } else {
      // Prefix like list '- '
      replacement = `${syntax} ${selectedText}`;
      newCursorPos = start + replacement.length;
    }

    const nextVal = val.substring(0, start) + replacement + val.substring(end);
    if (nextVal.length <= 1000) {
      setter(nextVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    }
  };

  // Handle Save Note
  const handleSaveNote = async () => {
    if (!content.trim()) return;
    try {
      await createNote({
        courseId,
        lectureId: selectedLecture?._id || "general",
        lectureTitle: selectedLecture?.title || "Course Lecture",
        timestamp: noteTimestamp,
        content: content.trim(),
      }).unwrap();
      toast.success("Note saved!");
      closeCreateEditor();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save note");
    }
  };

  // Handle Update Note
  const handleUpdateNote = async (noteId) => {
    if (!editContent.trim()) return;
    try {
      await updateNote({
        noteId,
        content: editContent.trim(),
      }).unwrap();
      toast.success("Note updated!");
      setEditingNoteId(null);
      setEditContent("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update note");
    }
  };

  // Handle Delete Note
  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId).unwrap();
      toast.success("Note deleted");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete note");
    }
  };

  return (
    <div className="max-w-4xl py-2 space-y-6 text-[#1c1d1f]">
      {/* ── Active Note Creation Editor (Matches Reference Picture Exactly) ── */}
      {isCreating ? (
        <div className="flex items-start gap-3 w-full animate-in fade-in duration-200">
          {/* Timestamp Pill (e.g. 0:14) */}
          <div className="shrink-0 mt-1">
            <span className="bg-[#1c1d1f] text-white text-[12px] font-bold px-2 py-0.5 rounded-sm font-mono tracking-wider shadow-xs">
              {formatTime(noteTimestamp)}
            </span>
          </div>

          {/* Editor Container with Purple Border Outline */}
          <div className="flex-1 space-y-3">
            <div className="border-2 border-[#a435f0] rounded-xs bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#a435f0]/30 transition-all">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 text-xs text-gray-700 bg-white select-none">
                <div className="flex items-center space-x-1.5">
                  {/* Styles Dropdown */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1 font-medium hover:text-[#a435f0] px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    >
                      <span>Styles</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <div className="hidden group-hover:flex absolute top-full left-0 bg-white border border-gray-200 shadow-lg rounded py-1 w-32 flex-col z-20 text-[12px]">
                      <button
                        type="button"
                        onClick={() => applyFormat("### ", false)}
                        className="text-left px-3 py-1.5 hover:bg-gray-100 font-bold"
                      >
                        Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("> ", false)}
                        className="text-left px-3 py-1.5 hover:bg-gray-100 italic"
                      >
                        Quote
                      </button>
                    </div>
                  </div>

                  <span className="text-gray-300">|</span>

                  {/* Bold */}
                  <button
                    type="button"
                    onClick={() => applyFormat("**", true)}
                    className="p-1.5 hover:bg-gray-100 rounded hover:text-[#a435f0] transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  {/* Italic */}
                  <button
                    type="button"
                    onClick={() => applyFormat("*", true)}
                    className="p-1.5 hover:bg-gray-100 rounded hover:text-[#a435f0] transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  {/* Bullet list */}
                  <button
                    type="button"
                    onClick={() => applyFormat("- ", false)}
                    className="p-1.5 hover:bg-gray-100 rounded hover:text-[#a435f0] transition-colors"
                    title="Bulleted list"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>

                  {/* Numbered list */}
                  <button
                    type="button"
                    onClick={() => applyFormat("1. ", false)}
                    className="p-1.5 hover:bg-gray-100 rounded hover:text-[#a435f0] transition-colors"
                    title="Numbered list"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>

                  {/* Code */}
                  <button
                    type="button"
                    onClick={() => applyFormat("`", true)}
                    className="p-1.5 hover:bg-gray-100 rounded hover:text-[#a435f0] transition-colors font-mono"
                    title="Code"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>

                  {/* Link */}
                  <button
                    type="button"
                    onClick={() => applyFormat("[Link](url)", false)}
                    className="p-1.5 hover:bg-gray-100 rounded hover:text-[#a435f0] transition-colors"
                    title="Insert link"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Character Counter (1000 max) */}
                <div className="text-gray-400 font-sans text-[12px] font-medium pr-1">
                  {1000 - content.length}
                </div>
              </div>

              {/* Text Input Area */}
              <textarea
                ref={textareaRef}
                value={content}
                maxLength={1000}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Create a new note at ${formatTime(noteTimestamp)}...`}
                rows={4}
                className="w-full p-3.5 outline-none text-sm text-[#1c1d1f] placeholder-gray-400 resize-none font-sans leading-relaxed bg-transparent"
              />
            </div>

            {/* Cancel & Save Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-1">
              <button
                type="button"
                onClick={closeCreateEditor}
                className="text-xs font-bold text-gray-700 hover:text-black px-3 py-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!content.trim() || isCreatingNote}
                onClick={handleSaveNote}
                className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-xs font-bold px-4 py-2 rounded-xs shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
              >
                {isCreatingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save note
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Prompt Box to Open Editor (When Not Creating) ── */
        <div
          onClick={openCreateEditor}
          className="flex items-center gap-3 w-full border border-gray-300 hover:border-gray-500 rounded-xs p-3.5 bg-white cursor-pointer transition-colors group"
        >
          <span className="bg-[#1c1d1f] text-white text-[12px] font-bold px-2 py-0.5 rounded-sm font-mono tracking-wider shrink-0 shadow-xs">
            {formatTime(Math.floor(currentVideoTime || 0))}
          </span>
          <span className="text-sm text-gray-500 group-hover:text-gray-700 font-sans flex-1">
            Create a new note at {formatTime(Math.floor(currentVideoTime || 0))}...
          </span>
          <Plus className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
        </div>
      )}

      {/* ── Filters & Sorting Row (Matches Screenshot) ── */}
      <div className="flex items-center gap-3 pt-2">
        {/* Lecture Filter */}
        <div className="relative">
          <select
            value={lectureFilter}
            onChange={(e) => setLectureFilter(e.target.value)}
            className="appearance-none border border-gray-300 hover:border-gray-500 bg-white text-xs font-bold text-gray-800 px-3.5 py-2 pr-8 rounded-xs cursor-pointer outline-none transition-colors"
          >
            <option value="all">All lectures</option>
            <option value="current">Current lecture</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Sort Filter */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none border border-gray-300 hover:border-gray-500 bg-white text-xs font-bold text-gray-800 px-3.5 py-2 pr-8 rounded-xs cursor-pointer outline-none transition-colors"
          >
            <option value="recent">Sort by most recent</option>
            <option value="oldest">Sort by oldest</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ── Notes Listing ── */}
      <div className="space-y-4 pt-2">
        {isNotesLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading notes...</span>
          </div>
        ) : notes.length === 0 ? (
          /* Empty state matching Udemy instruction line */
          <div className="py-14 text-center text-xs text-gray-500 font-sans tracking-wide">
            Click the &quot;Create a new note&quot; box, the &quot;+&quot; button, or press &quot;B&quot; to make your first note.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="border-b border-gray-200 pb-5 pt-2 flex items-start gap-3.5 group/note"
            >
              {/* Clickable Timestamp Pill (Jumps video to timestamp) */}
              <button
                type="button"
                onClick={() => onSeekTo?.(note.timestamp)}
                className="shrink-0 bg-[#1c1d1f] hover:bg-[#a435f0] text-white text-[12px] font-bold px-2 py-0.5 rounded-sm font-mono tracking-wider transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                title={`Seek video to ${formatTime(note.timestamp)}`}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{formatTime(note.timestamp)}</span>
              </button>

              {/* Note Content / Inline Edit Form */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-semibold text-gray-700 truncate max-w-[70%]">
                    {note.lectureTitle}
                  </span>
                  <div className="flex items-center space-x-2 opacity-0 group-hover/note:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(note._id);
                        setEditContent(note.content);
                        setTimeout(() => editTextareaRef.current?.focus(), 80);
                      }}
                      className="p-1 hover:text-[#a435f0] transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note._id)}
                      className="p-1 hover:text-red-600 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {editingNoteId === note._id ? (
                  <div className="mt-2 space-y-2 border-2 border-[#a435f0] rounded-xs p-2.5 bg-white">
                    <textarea
                      ref={editTextareaRef}
                      value={editContent}
                      maxLength={1000}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full text-sm outline-none resize-none font-sans text-[#1c1d1f]"
                    />
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                      <span className="text-gray-400 font-mono text-[11px]">
                        {1000 - editContent.length} left
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditContent("");
                          }}
                          className="font-bold text-gray-600 hover:text-black px-2 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!editContent.trim() || isUpdatingNote}
                          onClick={() => handleUpdateNote(note._id)}
                          className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold px-3 py-1 rounded-xs cursor-pointer disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[#1c1d1f] font-sans whitespace-pre-wrap leading-relaxed select-text mt-1">
                    {note.content}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

CourseNotesTab.propTypes = {
  courseId: PropTypes.string.isRequired,
  selectedLecture: PropTypes.object,
  currentVideoTime: PropTypes.number,
  onSeekTo: PropTypes.func,
  isEditorOpenInitially: PropTypes.bool,
  onEditorStateChange: PropTypes.func,
};

export default CourseNotesTab;
