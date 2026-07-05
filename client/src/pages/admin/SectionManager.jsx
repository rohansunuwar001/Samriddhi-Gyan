import React, { useState } from "react";
import {
  Edit,
  Loader2,
  Plus,
  Trash2,
  Menu as DragIcon,
  FileText,
  X,
  PlayCircle,
  FileQuestion,
  Code2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import LectureItem from "./lecture/LectureItem";
import PropTypes from "prop-types";

import { useDeleteSectionMutation, useUpdateSectionMutation } from "@/features/api/sectionApi";
import { useCreateLectureMutation } from "@/features/api/lectureApi";

const SectionManager = ({ section, courseId, index = 1 }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(section.title);
  const [editedObjective, setEditedObjective] = useState(section.learningObjective || "");

  // Add Item controls
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState(null); // 'lecture' | 'quiz' | 'coding' | 'roleplay' | 'test' | 'assignment'
  const [newItemTitle, setNewItemTitle] = useState("");

  const [createLecture, { isLoading: isCreatingLecture }] = useCreateLectureMutation();
  const [deleteSection, { isLoading: isDeletingSection }] = useDeleteSectionMutation();
  const [updateSection, { isLoading: isUpdatingSection }] = useUpdateSectionMutation();

  const handleAddLecture = async () => {
    if (!newItemTitle.trim()) return;
    try {
      await createLecture({
        sectionId: section._id,
        title: newItemTitle.trim(),
        courseId
      }).unwrap();
      setNewItemTitle("");
      setActiveFormType(null);
      toast.success("Lecture added!");
    } catch (err) {
      toast.error("Failed to add lecture.");
    }
  };

  const handleAddMockItem = (typeLabel) => {
    if (!newItemTitle.trim()) return;
    toast.success(`Mock: Added new ${typeLabel} "${newItemTitle}"`);
    setNewItemTitle("");
    setActiveFormType(null);
  };

  const handleDeleteSection = async () => {
    if (window.confirm("Delete section and all lectures inside it? This cannot be undone.")) {
      try {
        await deleteSection({ sectionId: section._id, courseId }).unwrap();
        toast.success("Section deleted.");
      } catch (err) {
        toast.error("Failed to delete section.");
      }
    }
  };

  const handleUpdateSection = async () => {
    if (editedTitle.trim() === section.title && editedObjective.trim() === (section.learningObjective || "")) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateSection({
        sectionId: section._id,
        title: editedTitle.trim(),
        learningObjective: editedObjective.trim(),
        courseId,
      }).unwrap();
      setIsEditingTitle(false);
      toast.success("Section updated successfully.");
    } catch (err) {
      toast.error("Failed to update section.");
    }
  };

  // Drag and drop for lectures inside this section
  const handleLectureDragStart = (e, idx) => {
    e.dataTransfer.setData("text/plain", idx);
  };

  const handleLectureDragOver = (e) => {
    e.preventDefault();
  };

  const handleLectureDrop = async (e, targetIdx) => {
    const draggedIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(draggedIdx) || draggedIdx === targetIdx) return;

    const list = [...(section.lectures || [])];
    const [draggedItem] = list.splice(draggedIdx, 1);
    list.splice(targetIdx, 0, draggedItem);

    // Call updateSection API with the reordered lectures array of IDs
    const lectureIds = list.map(l => l._id);
    try {
      await updateSection({
        sectionId: section._id,
        lectures: lectureIds,
        courseId,
      }).unwrap();
      toast.success("Lectures reordered.");
    } catch {
      toast.error("Failed to reorder lectures.");
    }
  };

  return (
    <div className="border border-[#d1d7dc] bg-[#f7f9fa] mb-6 relative">
      
      {/* ── SECTION HEADER (Samriddhi Gyan Style) ── */}
      <div className="flex items-center justify-between p-4 bg-[#f7f9fa] border-b border-[#d1d7dc]">
        
        {isEditingTitle ? (
          <div className="flex-1 space-y-3 bg-white p-4 border border-[#1c1d1f]">
            <div className="flex items-center gap-3">
              <span className="font-normal text-base text-[#1c1d1f] w-24 shrink-0">Section Title:</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  maxLength={80}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full border border-[#6a6f73] px-3 py-1.5 pr-10 text-base text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#6a6f73]">
                  {80 - editedTitle.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-normal text-base text-[#1c1d1f] w-24 shrink-0">Objective:</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  maxLength={200}
                  value={editedObjective}
                  onChange={(e) => setEditedObjective(e.target.value)}
                  className="w-full border border-[#6a6f73] px-3 py-1.5 pr-10 text-base text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#6a6f73]">
                  {200 - editedObjective.length}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditedTitle(section.title);
                  setEditedObjective(section.learningObjective || "");
                }}
                className="text-base font-normal text-[#1c1d1f] hover:text-black px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingSection}
                onClick={handleUpdateSection}
                className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-normal text-base px-4 py-1.5 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <FileText className="w-4.5 h-4.5 text-[#6a6f73] shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-normal text-lg text-[#1c1d1f] shrink-0">Section {index}:</span>
              <span className="text-lg text-[#1c1d1f] truncate font-light">{section.title}</span>
              
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-[#6a6f73] hover:text-[#1c1d1f] p-1 transition-colors shrink-0"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteSection}
                disabled={isDeletingSection}
                className="text-[#6a6f73] hover:text-red-600 p-1 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {!isEditingTitle && (
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <DragIcon className="w-4 h-4 text-[#6a6f73] cursor-grab active:cursor-grabbing" />
          </div>
        )}
      </div>

      {/* ── SECTION CONTENT (LECTURES & ITEMS) ── */}
      <div className="p-5 bg-white space-y-4">
        
        {/* Lectures List */}
        <div className="space-y-2">
          {section.lectures?.length > 0 ? (
            section.lectures.map((lecture, idx) => (
              <div
                key={lecture._id}
                draggable
                onDragStart={(e) => handleLectureDragStart(e, idx)}
                onDragOver={handleLectureDragOver}
                onDrop={(e) => handleLectureDrop(e, idx)}
                className="group relative"
              >
                <LectureItem lecture={lecture} courseId={courseId} index={idx + 1} />
              </div>
            ))
          ) : (
            <p className="text-base text-[#6a6f73] italic py-2">No curriculum items yet in this section.</p>
          )}
        </div>

        {/* ── INLINE NEW ITEM FORM ── */}
        {activeFormType && (
          <div className="border border-[#1c1d1f] p-4 bg-white space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="font-normal text-base text-[#1c1d1f] capitalize">New {activeFormType}:</span>
              <div className="flex-grow relative">
                <input
                  type="text"
                  maxLength={80}
                  placeholder={`Enter a ${activeFormType} title`}
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full border border-[#6a6f73] px-3 py-2 pr-10 text-base text-[#1c1d1f] outline-none focus:border-[#1c1d1f]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#6a6f73]">
                  {80 - newItemTitle.length}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveFormType(null);
                  setNewItemTitle("");
                }}
                className="text-base font-normal text-[#1c1d1f] hover:text-black px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingLecture}
                onClick={() => {
                  if (activeFormType === "lecture") {
                    handleAddLecture();
                  } else {
                    handleAddMockItem(activeFormType);
                  }
                }}
                className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-normal text-base px-4 py-1.5 transition-colors disabled:opacity-50"
              >
                Add {activeFormType}
              </button>
            </div>
          </div>
        )}

        {/* ── + CURRICULUM ITEM TOGGLE BUTTON & DROPDOWN ── */}
        <div className="relative mt-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-base px-3 py-2 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Curriculum item
          </button>

          {/* Dropdown Menu (Samriddhi Gyan Design matching photo 4 & 5) */}
          {isMenuOpen && (
            <>
              {/* Back drop to close menu */}
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              
              <div className="absolute left-0 mt-1 w-[320px] bg-white border border-[#d1d7dc] shadow-xl z-50 rounded-sm overflow-hidden flex flex-col max-h-[360px] overflow-y-auto">
                
                {/* Watch or read */}
                <div className="px-4 py-2 bg-slate-50 border-b border-[#d1d7dc]">
                  <span className="text-[10px] font-normal text-[#6a6f73] uppercase tracking-wider">Watch or read</span>
                </div>
                <div
                  onClick={() => {
                    setActiveFormType("lecture");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-[#e4e8eb] transition-colors"
                >
                  <PlayCircle className="w-4.5 h-4.5 text-[#5624d0] mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-normal text-[#1c1d1f]">Lecture</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-normal px-1 py-0.2 rounded">With lab</span>
                    </div>
                    <p className="text-[10px] text-[#6a6f73]">Video or text lesson</p>
                  </div>
                </div>

                {/* Role play */}
                <div className="px-4 py-2 bg-slate-50 border-b border-[#d1d7dc]">
                  <span className="text-[10px] font-normal text-[#6a6f73] uppercase tracking-wider">Role play</span>
                </div>
                <div
                  onClick={() => {
                    setActiveFormType("practice role play");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-[#e4e8eb] transition-colors"
                >
                  <Users className="w-4.5 h-4.5 text-[#5624d0] mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-normal text-[#1c1d1f]">Practice role play</span>
                      <span className="bg-purple-100 text-purple-800 text-[9px] font-normal px-1 py-0.2 rounded">AI</span>
                    </div>
                    <p className="text-[10px] text-[#6a6f73]">Unscored conversation for free-form skill rehearsal</p>
                  </div>
                </div>

                {/* Coding & labs */}
                <div className="px-4 py-2 bg-slate-50 border-b border-[#d1d7dc]">
                  <span className="text-[10px] font-normal text-[#6a6f73] uppercase tracking-wider">Coding & labs</span>
                </div>
                <div
                  onClick={() => {
                    setActiveFormType("coding exercise");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-[#e4e8eb] transition-colors"
                >
                  <Code2 className="w-4.5 h-4.5 text-[#5624d0] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-base font-normal text-[#1c1d1f]">Coding exercise</span>
                    <p className="text-[10px] text-[#6a6f73]">Code challenges with instant feedback</p>
                  </div>
                </div>

                {/* Knowledge checks */}
                <div className="px-4 py-2 bg-slate-50 border-b border-[#d1d7dc]">
                  <span className="text-[10px] font-normal text-[#6a6f73] uppercase tracking-wider">Knowledge checks</span>
                </div>
                <div
                  onClick={() => {
                    setActiveFormType("quiz");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-[#e4e8eb] transition-colors"
                >
                  <FileQuestion className="w-4.5 h-4.5 text-[#5624d0] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-base font-normal text-[#1c1d1f]">Quiz</span>
                    <p className="text-[10px] text-[#6a6f73]">Quick comprehension check after a lesson</p>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setActiveFormType("practice test");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-[#e4e8eb] transition-colors"
                >
                  <FileQuestion className="w-4.5 h-4.5 text-[#5624d0] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-base font-normal text-[#1c1d1f]">Practice test</span>
                    <p className="text-[10px] text-[#6a6f73]">Timed exam to prep for certification</p>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setActiveFormType("assignment");
                    setIsMenuOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <FileQuestion className="w-4.5 h-4.5 text-[#5624d0] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-base font-normal text-[#1c1d1f]">Assignment</span>
                    <p className="text-[10px] text-[#6a6f73]">Task for learners to complete and submit</p>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

SectionManager.propTypes = {
  section: PropTypes.object.isRequired,
  courseId: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

export default SectionManager;