import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  CheckCircle2,
  Circle,
  PlusCircle,
  Loader2,
  X,
  Info,
  Trash2,
  Menu,
} from "lucide-react";
import {
  useGetCourseByIdQuery,
  useEditCourseMutation,
  usePublishCourseMutation,
  useRemoveCourseMutation,
} from "@/features/api/courseApi";
import { useSelector } from "react-redux";
import CourseCurriculumTab from "../CourseCurriculumTab";
import CourseLandingPageTab from "./CourseLandingPageTab";
import CaptionsTab from "./CaptionsTab";
import PricingTab from "./PricingTab";

/* ─── sidebar menu definition ─── */
const SIDEBAR_SECTIONS = [
  {
    group: "Plan your course",
    items: [
      { id: "intended-learners", label: "Intended learners" },
      { id: "course-structure", label: "Course structure" },
      { id: "setup-test-video", label: "Setup & test video" },
    ],
  },
  {
    group: "Create your content",
    items: [
      { id: "film-edit", label: "Film & edit" },
      { id: "curriculum", label: "Curriculum" },
      { id: "captions", label: "Captions (optional)" },
      { id: "accessibility", label: "Accessibility (optional)" },
    ],
  },
  {
    group: "Publish your course",
    items: [
      { id: "landing-page", label: "Course landing page" },
      { id: "pricing", label: "Pricing" },
      { id: "promotions", label: "Promotions" },
      { id: "course-messages", label: "Course messages" },
    ],
  },
];

/* ─── character-limited input row ─── */
function LimitedInput({ value, onChange, placeholder, maxLen = 160 }) {
  return (
    <div className="relative flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] transition-colors w-full">
      <input
        type="text"
        maxLength={maxLen}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 text-lg text-[#1c1d1f] outline-none bg-transparent pr-16"
      />
      <span className="absolute right-4 text-base text-[#6a6f73] pointer-events-none">
        {maxLen - (value?.length || 0)}
      </span>
    </div>
  );
}

/* ─── learning objective row with hover reorder/delete ─── */
function LearningObjectiveRow({
  value,
  onChange,
  onRemove,
  canRemove,
  placeholder,
  index,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
}) {
  const [hovered, setHovered] = useState(false);
  const isDragging = draggedIndex === index;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 group relative w-full transition-all duration-150 py-1
        ${isDragging ? "opacity-30 border-2 border-dashed border-[#a435f0] p-1 bg-[#f0e6ff]/20" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Input container */}
      <div className="flex-1 min-w-0">
        <LimitedInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>

      {/* Action buttons (Trash & Drag Grip) on the right */}
      <div
        className="flex items-center gap-2 shrink-0 transition-opacity duration-150"
        style={{ opacity: hovered || isDragging ? 1 : 0 }}
      >
        {/* Delete button (disabled if <= 4 boxes total) */}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-11 h-11 border border-[#a435f0] hover:bg-[#f0e6ff] text-[#a435f0] flex items-center justify-center transition-colors focus:outline-none"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Drag/Grip handle for moving */}
        <div
          className="w-11 h-11 border border-[#a435f0] hover:bg-[#f0e6ff] text-[#a435f0] flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing focus:outline-none"
          title="Drag to reorder"
        >
          <Menu className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

/* ─── simple input row ─── */
function SimpleInput({ value, onChange, placeholder, onRemove, canRemove }) {
  return (
    <div className="relative flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] transition-colors">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 text-lg text-[#1c1d1f] outline-none bg-transparent pr-10"
      />
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 text-[#6a6f73] hover:text-[#1c1d1f]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   INTENDED LEARNERS PANEL
══════════════════════════════════════════════════════ */
function IntendedLearnersPanel({ courseId, courseData, onSaveStart, onSaveEnd, onRegisterSave, onValidationChange }) {
  const [learnings, setLearnings] = useState(["", "", "", ""]);
  const [requirements, setRequirements] = useState([""]);
  const [whoIsThisFor, setWhoIsThisFor] = useState([""]);
  const [editCourse] = useEditCourseMutation();

  useEffect(() => {
    if (courseData?.course) {
      const c = courseData.course;
      const l = c.learnings?.length >= 4 ? c.learnings : [...(c.learnings || []), "", "", "", ""].slice(0, Math.max(4, c.learnings?.length || 0));
      setLearnings(l.length >= 4 ? l : [...l, ...Array(4 - l.length).fill("")]);
      setRequirements(c.requirements?.length > 0 ? c.requirements : [""]);
      setWhoIsThisFor(c.whoIsThisFor?.length > 0 ? c.whoIsThisFor : [""]);
    }
  }, [courseData]);

  // Check validity reactively
  const isValid = learnings.filter(v => v.trim()).length >= 4;

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const handleSave = async () => {
    const activeLearnings = learnings.filter(v => v.trim());
    if (activeLearnings.length < 4) {
      toast.error("You must enter at least 4 learning objectives or outcomes.");
      return;
    }
    const formData = new FormData();
    activeLearnings.forEach(v => formData.append("learnings[]", v));
    requirements.filter(v => v.trim()).forEach(v => formData.append("requirements[]", v));
    whoIsThisFor.filter(v => v.trim()).forEach(v => formData.append("whoIsThisFor[]", v));
    onSaveStart?.();
    try {
      const res = await editCourse({ courseId, formData }).unwrap();
      toast.success(res.message || "Saved!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save.");
    }
    onSaveEnd?.();
  };

  // Keep a stable ref so onRegisterSave doesn't cause infinite re-registers
  const handleSaveRef = React.useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    onRegisterSave?.(() => handleSaveRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (idx) => {
    setDraggedIndex(idx);
  };

  const arrayChange = (setter, arr, idx, val) => {
    const next = [...arr];
    next[idx] = val;
    setter(next);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const next = [...learnings];
    const temp = next[draggedIndex];
    next[draggedIndex] = next[index];
    next[index] = temp;
    setDraggedIndex(index);
    setLearnings(next);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const addItem = (setter, arr) => setter([...arr, ""]);
  const removeItem = (setter, arr, idx) => setter(arr.filter((_, i) => i !== idx));

  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm">
      {/* Header */}
      <div className="border-b border-[#d1d7dc] pb-5 mb-8">
        <h2 className="text-4xl font-normal text-[#1c1d1f] mb-4">Intended learners</h2>
        <p className="text-lg text-[#1c1d1f] leading-relaxed">
          The following descriptions will be publicly visible on your{" "}
          <span className="text-[#5624d0] underline cursor-pointer">Course Landing Page</span>{" "}
          and will have a direct impact on your course performance. These descriptions will help
          learners decide if your course is right for them.
        </p>
      </div>

      {/* What will students learn */}
      <div className="mb-10">
        <h3 className="font-normal text-[#1c1d1f] mb-2">What will students learn in your course?</h3>
        <p className="text-lg text-[#1c1d1f] mb-4">
          You must enter at least 4{" "}
          <span className="text-[#5624d0] underline cursor-pointer">learning objectives or outcomes</span>{" "}
          that learners can expect to achieve after completing your course.
        </p>
        <div className="space-y-2 mb-3">
          {learnings.map((item, i) => (
            <LearningObjectiveRow
              key={i}
              value={item}
              onChange={(e) => arrayChange(setLearnings, learnings, i, e.target.value)}
              placeholder={[
                "Example: Define the roles and responsibilities of a project manager",
                "Example: Estimate project timelines and budgets",
                "Example: Identify and manage project risks",
                "Example: Complete a case study to manage a project from conception to completion",
              ][i] || "Example: Enter a learning objective"}
              canRemove={learnings.length > 4}
              onRemove={() => removeItem(setLearnings, learnings, i)}
              index={i}
              draggedIndex={draggedIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
        <button
          onClick={() => addItem(setLearnings, learnings)}
          className="flex items-center gap-1.5 text-lg font-normal text-[#5624d0] hover:text-[#4019a4] transition-colors mt-4"
        >
          <PlusCircle className="w-4.5 h-4.5" /> Add more to your response
        </button>
      </div>

      {/* Requirements */}
      <div className="mb-10">
        <h3 className="font-normal text-[#1c1d1f] mb-2">
          What are the requirements or prerequisites for taking your course?
        </h3>
        <p className="text-lg text-[#1c1d1f] mb-4">
          List the required skills, experience, tools or equipment learners should have prior to taking
          your course. If there are no requirements, use this space as an opportunity to lower the barrier
          for beginners.
        </p>
        <div className="space-y-2 mb-3">
          {requirements.map((item, i) => (
            <SimpleInput
              key={i}
              value={item}
              onChange={(e) => arrayChange(setRequirements, requirements, i, e.target.value)}
              placeholder="Example: No programming experience needed. You will learn everything you need to know"
              canRemove={requirements.length > 1}
              onRemove={() => removeItem(setRequirements, requirements, i)}
            />
          ))}
        </div>
        <button
          onClick={() => addItem(setRequirements, requirements)}
          className="flex items-center gap-1.5 text-lg font-normal text-[#5624d0] hover:text-[#4019a4] transition-colors mt-4"
        >
          <PlusCircle className="w-4.5 h-4.5" /> Add more to your response
        </button>
      </div>

      {/* Who is this course for */}
      <div className="mb-10">
        <h3 className="font-normal text-[#1c1d1f] mb-2">Who is this course for?</h3>
        <p className="text-lg text-[#1c1d1f] mb-4">
          Write a clear description of the{" "}
          <span className="text-[#5624d0] underline cursor-pointer">intended learners</span>{" "}
          for your course who will find your course content valuable. This will help you attract the right
          learners to your course.
        </p>
        <div className="space-y-2 mb-3">
          {whoIsThisFor.map((item, i) => (
            <SimpleInput
              key={i}
              value={item}
              onChange={(e) => arrayChange(setWhoIsThisFor, whoIsThisFor, i, e.target.value)}
              placeholder="Example: Beginner Python developers curious about data science"
              canRemove={whoIsThisFor.length > 1}
              onRemove={() => removeItem(setWhoIsThisFor, whoIsThisFor, i)}
            />
          ))}
        </div>
        <button
          onClick={() => addItem(setWhoIsThisFor, whoIsThisFor)}
          className="flex items-center gap-1.5 text-lg font-normal text-[#5624d0] hover:text-[#4019a4] transition-colors mt-4"
        >
          <PlusCircle className="w-4.5 h-4.5" /> Add more to your response
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COURSE STRUCTURE PANEL
══════════════════════════════════════════════════════ */
function CourseStructurePanel() {
  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm">
      <div className="border-b border-[#d1d7dc] pb-5 mb-8">
        <h2 className="text-4xl font-normal text-[#1c1d1f]">Course structure</h2>
      </div>

      <div className="flex gap-8 items-start mb-10">
        <div className="flex-1">
          <h3 className="text-3xl font-normal text-[#1c1d1f] mb-4">There's a course in you. Plan it out.</h3>
          <p className="text-lg text-[#1c1d1f] leading-relaxed">
            Planning your course carefully will create a clear learning path for students and help you once you film. Think down to the details of each lecture including the skill you'll teach, estimated video length, practical activities to include, and how you'll create introductions and summaries.
          </p>
        </div>
        {/* Right side box: Library of resources */}
        <div className="w-[280px] border border-[#d1d7dc] p-6 bg-white flex flex-col items-center text-center shrink-0">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6a6f73" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h4 className="font-normal text-[#1c1d1f] text-lg mb-2">Our library of resources</h4>
          <p className="text-base text-[#6a6f73] mb-4">
            Tips and guides to structuring a course students love.
          </p>
          <button className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-base py-2.5 px-4 transition-colors">
            Teaching Center
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mb-10">
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-5">Tips</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Start with your goals.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Setting goals for what learners will accomplish in your course (also known as <span className="text-[#5624d0] underline cursor-pointer">learning objectives</span>) at the beginning will help you determine what content to include and how you will teach the content to help your learners achieve the goals.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Create an outline.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Decide what skills you'll teach and how you'll teach them. Group related lectures into sections. Each section should have at least 3 lectures, and include at least one assignment or practical activity. <span className="text-[#5624d0] underline cursor-pointer">Learn more.</span>
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Introduce yourself and create momentum.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              People online want to start learning quickly. Make an introduction section that gives learners something to be excited about in the first 10 minutes.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Sections have a clear learning objective.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Introduce each section by describing the section's <span className="text-[#5624d0] underline cursor-pointer">goal and why it's important</span>. Give lectures and sections titles that reflect their content and have a logical flow.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Lectures cover one concept.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              A good lecture length is 2-7 minutes to keep students interested and help them study in short bursts. Cover a single topic in each lecture so learners can easily find and re-watch them later.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Mix and match your lecture types.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Alternate between filming yourself, your screen, and slides or other visuals. Showing yourself can help learners feel connected.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Practice activities create hands-on learning.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Help learners <span className="text-[#5624d0] underline cursor-pointer">apply your lessons</span> to their real world with projects, assignments, coding exercises, or worksheets.
            </p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-10">
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-4">Requirements</h3>
        <ul className="list-disc pl-5 space-y-2 text-lg text-[#1c1d1f]">
          <li>See the <span className="text-[#5624d0] underline cursor-pointer">complete list</span> of course quality requirements</li>
          <li>Your course must have at least five lectures</li>
          <li>All lectures must add up to at least 30+ minutes of total video</li>
          <li>Your course is composed of valuable educational content and free of promotional or distracting materials</li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-4">Resources</h3>
        <div className="space-y-4">
          <div>
            <span className="font-normal text-lg text-[#5624d0] hover:underline cursor-pointer block">Samriddhi Gyan Trust & Safety</span>
            <span className="text-base text-[#6a6f73]">Our policies for instructors and students</span>
          </div>
          <div>
            <span className="font-normal text-lg text-[#5624d0] hover:underline cursor-pointer block">Join the instructor community</span>
            <span className="text-base text-[#6a6f73]">A place to connect with other instructors</span>
          </div>
          <div>
            <span className="font-normal text-lg text-[#5624d0] hover:underline cursor-pointer block">Official Samriddhi Gyan Course: How to Create an Online Course</span>
            <span className="text-base text-[#6a6f73]">Learn about course creation from the Samriddhi Gyan Instructor Team and experienced instructors</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SETUP & TEST VIDEO PANEL
══════════════════════════════════════════════════════ */
function SetupTestVideoPanel() {
  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm">
      <div className="border-b border-[#d1d7dc] pb-5 mb-8">
        <h2 className="text-4xl font-normal text-[#1c1d1f]">Setup & test video</h2>
      </div>

      <div className="flex gap-8 items-start mb-10">
        <div className="flex-1">
          <h3 className="text-3xl font-normal text-[#1c1d1f] mb-4">Arrange your ideal studio and get early feedback</h3>
          <p className="text-lg text-[#1c1d1f] leading-relaxed">
            It's important to get your audio and video set up correctly now, because it's much more difficult to fix your videos after you've recorded. There are many creative ways to use what you have to create professional looking video.
          </p>
        </div>
        {/* Right side box: Free expert help */}
        <div className="w-[280px] border border-[#d1d7dc] p-6 bg-white flex flex-col items-center text-center shrink-0">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6a6f73" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
          </div>
          <h4 className="font-normal text-[#1c1d1f] text-lg mb-2">Free expert video help</h4>
          <p className="text-base text-[#6a6f73] mb-4">
            Get personalized advice on your audio and video.
          </p>
          <button className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-base py-2.5 px-4 transition-colors">
            Create a test video
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mb-10">
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-5">Tips</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Equipment can be easy.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              You don't need to buy fancy equipment. Most smartphone cameras can capture video in HD, and you can record audio on another phone or external microphone.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Students need to hear you.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              A good microphone is the most important piece of equipment you will choose. There are lot of affordable options. Make sure it's correctly plugged in and 6-12 inches (15-30 cm) from you.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Make a studio.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Clean up your background and arrange props. Almost any small space can be transformed with a backdrop made of colored paper or an ironed bed sheet.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Light the scene and your face.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Turn off overhead lights. Experiment with three-point lighting by placing two lamps in front of you and one behind aimed on the background.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Reduce noise and echo.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Turn off fans or air vents, and record at a time when it's quiet. Place acoustic foam or blankets on the walls, and bring in rugs or furniture to dampen echo.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Be creative.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Students won't see behind the scenes. No one will know if you're surrounded by pillows for soundproofing... unless you tell other instructors in the community!
            </p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-10">
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-4">Requirements</h3>
        <ul className="list-disc pl-5 space-y-2 text-lg text-[#1c1d1f]">
          <li>Film and export in HD to create videos of at least 720p, or 1080p if possible</li>
          <li>Audio should come out of both the left and right channels and be synced to your video</li>
          <li>Audio should be free of echo and background noise so as not to be distracting to students</li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-4">Resources</h3>
        <div className="space-y-4">
          <div>
            <span className="font-normal text-lg text-[#5624d0] hover:underline cursor-pointer block">Teaching Center: Guide to equipment</span>
            <span className="text-base text-[#6a6f73]">Make a home studio on a budget</span>
          </div>
          <div>
            <span className="font-normal text-lg text-[#5624d0] hover:underline cursor-pointer block">Samriddhi Gyan Trust & Safety</span>
            <span className="text-base text-[#6a6f73]">Our policies for instructors and students</span>
          </div>
          <div>
            <span className="font-normal text-lg text-[#5624d0] hover:underline cursor-pointer block">Join the community</span>
            <span className="text-base text-[#6a6f73]">A place to talk with other instructors</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FILM & EDIT PANEL
══════════════════════════════════════════════════════ */
function FilmEditPanel() {
  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm">
      <div className="border-b border-[#d1d7dc] pb-5 mb-8">
        <h2 className="text-4xl font-normal text-[#1c1d1f]">Film & edit</h2>
      </div>

      <div className="flex gap-8 items-start mb-10">
        <div className="flex-1">
          <h3 className="text-3xl font-normal text-[#1c1d1f] mb-4">You're ready to share your knowledge.</h3>
          <p className="text-lg text-[#1c1d1f] leading-relaxed">
            This is your moment! If you've structured your course and used our guides, you're well prepared for the actual shoot. Pace yourself, take time to make it just right, and fine-tune when you edit.
          </p>
        </div>
        {/* Right side box: In good company */}
        <div className="w-[280px] border border-[#d1d7dc] p-6 bg-white flex flex-col items-center text-center shrink-0">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6a6f73" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h4 className="font-normal text-[#1c1d1f] text-lg mb-2">You're in good company</h4>
          <p className="text-base text-[#6a6f73] mb-4">
            Chat and get production help with other Samriddhi Gyan instructors.
          </p>
          <button className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-base py-2.5 px-4 transition-colors">
            Join the community
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mb-10">
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-5">Tips</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Take breaks and review frequently.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Check often for any changes such as new noises. Be aware of your own energy levels--filming can tire you out and that translates to the screen.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Build rapport.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Students want to know who's teaching them. Even for a course that is mostly screencasts, film yourself for your introduction. Or go the extra mile and film yourself introducing each section!
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Being on camera takes practice.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Make eye contact with the camera and speak clearly. Do as many retakes as you need to get it right.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Set yourself up for editing success.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              You can edit out long pauses, mistakes, and ums or ahs. Film a few extra activities or images that you can add in later to cover those cuts.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">Create audio marks.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Clap when you start each take to easily locate the audio spike during editing. Use our guides to manage your recording day efficiently.
            </p>
          </div>

          <div>
            <h4 className="font-normal text-[#1c1d1f] text-lg mb-1.5">For screencasts, clean up.</h4>
            <p className="text-lg text-[#1c1d1f] leading-relaxed">
              Move unrelated files and folders off your desktop and open any tabs in advance. Make on-screen text at least 24pt and use zooming to highlight.
            </p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="mb-10">
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-4">Requirements</h3>
        <ul className="list-disc pl-5 space-y-2 text-lg text-[#1c1d1f]">
          <li>Film and export in HD to create videos of at least 720p, or 1080p if possible</li>
          <li>Audio should come out of both the left and right channels and be synced to your video</li>
          <li>Audio should be free of echo and background noise so as not to be distracting to students</li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h3 className="text-2xl font-normal text-[#1c1d1f] mb-4">Resources</h3>
        <div className="space-y-4">
          <div>
            <span className="font-normal text-lg text-[#5624d0] hover:underline cursor-pointer block">Create a test video</span>
            <span className="text-base text-[#6a6f73]">Get feedback before filming your whole course</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SETTINGS PANEL
══════════════════════════════════════════════════════ */
const ENROLLMENT_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private-invite", label: "Private (Invitation Only)" },
  { value: "private-password", label: "Private (Password Protected)" },
];

const PERMISSION_COLS = ["Visible", "Manage", "Captions", "Performance", "Q&A", "Assignments"];

function SettingsPanel({ courseId, courseData, onDelete }) {
  const [enrollment, setEnrollment] = useState("public");
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false);
  const [permissions, setPermissions] = useState({
    Visible: true, Manage: true, Captions: true, Performance: true, "Q&A": true, Assignments: true,
  });
  const [publishCourse, { isLoading: isPublishing }] = usePublishCourseMutation();
  const [editCourse] = useEditCourseMutation();
  const user = useSelector((s) => s.auth.user);

  const course = courseData?.course;
  const isPublished = course?.isPublished;

  useEffect(() => {
    if (course?.enrollmentType) {
      setEnrollment(course.enrollmentType);
    }
  }, [course]);

  const handlePublishToggle = async () => {
    try {
      const res = await publishCourse({ courseId, publish: isPublished ? "false" : "true" }).unwrap();
      toast.success(res.message);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status.");
    }
  };

  const handleSaveEnrollment = async () => {
    setIsSavingEnrollment(true);
    const formData = new FormData();
    formData.append("enrollmentType", enrollment);
    try {
      const res = await editCourse({ courseId, formData }).unwrap();
      toast.success(res.message || "Enrollment settings saved!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save.");
    }
    setIsSavingEnrollment(false);
  };

  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-normal text-[#1c1d1f]">Settings</h2>
        <button className="border border-[#6a6f73] hover:bg-[#f7f9fa] text-[#1c1d1f] text-lg font-normal px-4 py-2 flex items-center gap-1 transition-colors">
          Manage Email Notifications ▾
        </button>
      </div>

      {/* Course Status */}
      <div className="border border-[#d1d7dc] p-6 mb-6">
        <h3 className="font-normal text-[#1c1d1f] text-xl mb-1">Course Status</h3>
        <p className="text-lg text-[#1c1d1f] mb-5">
          {isPublished
            ? "This course is published on the marketplace."
            : "This course is not published on the marketplace."}
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <button
              onClick={handlePublishToggle}
              disabled={isPublishing}
              className="min-w-[120px] border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-lg py-2 px-4 transition-colors disabled:opacity-50"
            >
              {isPublished ? "Unpublish" : "Publish"}
            </button>
            <p className="text-lg text-[#6a6f73] mt-1">
              {isPublished
                ? "New students can find your course via search."
                : "New students cannot find your course via search, but existing students can still access content."}
            </p>
          </div>
          <div className="flex items-start gap-4">
            <button
              onClick={onDelete}
              className="min-w-[120px] border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-lg py-2 px-4 transition-colors"
            >
              Delete
            </button>
            <p className="text-lg text-[#6a6f73] mt-1">
              We promise students lifetime access, so courses cannot be deleted after students have enrolled.
            </p>
          </div>
        </div>
      </div>

      {/* Enrollment Privacy */}
      <div className="border border-[#d1d7dc] p-6 mb-6">
        <h3 className="font-normal text-[#1c1d1f] text-xl mb-4">Enrollment (Privacy)</h3>
        <div className="relative mb-3">
          <select
            value={enrollment}
            onChange={(e) => setEnrollment(e.target.value)}
            className="w-full border border-[#6a6f73] px-4 py-3 text-lg text-[#1c1d1f] outline-none focus:border-[#a435f0] bg-white appearance-none cursor-pointer"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a6f73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
            }}
          >
            {ENROLLMENT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="text-lg text-[#6a6f73] mb-5">
          {enrollment === "public"
            ? "Public courses show up in search results and are available for anyone to take on Samriddhi Gyan."
            : enrollment === "private-invite"
            ? "Only students with an invitation link can enroll in this course."
            : "Students can enroll with a password that you set and share with them."}
        </p>
        <button
          onClick={handleSaveEnrollment}
          disabled={isSavingEnrollment}
          className="bg-[#1c1d1f] hover:bg-[#2d2f31] text-white font-normal text-lg px-5 py-2.5 transition-colors disabled:opacity-50"
        >
          {isSavingEnrollment ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Manage instructor permissions */}
      <div className="border border-[#d1d7dc] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h3 className="font-normal text-[#1c1d1f] text-xl">Manage instructor permissions</h3>
            <Info className="w-4 h-4 text-[#6a6f73]" />
          </div>
          <button className="text-lg font-normal text-[#5624d0] hover:underline flex items-center gap-1">
            <PlusCircle className="w-4 h-4" /> Add instructor
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-lg">
            <thead>
              <tr className="border-b border-[#d1d7dc]">
                <th className="text-left py-2 pr-6 font-normal text-[#1c1d1f] min-w-[180px]">Instructor</th>
                {PERMISSION_COLS.map(col => (
                  <th key={col} className="text-center py-2 px-4 font-normal text-[#1c1d1f] whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#d1d7dc]">
                <td className="py-4 pr-6">
                  <div className="text-lg font-light text-[#1c1d1f]">{user?.name || "Instructor"}</div>
                  <span className="inline-block mt-1 bg-[#1c1d1f] text-white text-[10px] font-normal px-2 py-0.5 rounded">
                    Owner
                  </span>
                </td>
                {PERMISSION_COLS.map(col => (
                  <td key={col} className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={permissions[col] ?? true}
                      onChange={(e) => setPermissions(prev => ({ ...prev, [col]: e.target.checked }))}
                      className="w-4 h-4 accent-[#1c1d1f] cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <button className="mt-5 bg-[#1c1d1f] hover:bg-[#2d2f31] text-white font-normal text-lg px-5 py-2.5 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PLACEHOLDER PANEL
══════════════════════════════════════════════════════ */
function PlaceholderPanel({ title }) {
  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#f7f9fa] border border-[#d1d7dc] flex items-center justify-center mb-4">
        <Info className="w-7 h-7 text-[#6a6f73]" />
      </div>
      <h3 className="text-2xl font-normal text-[#1c1d1f] mb-2">{title}</h3>
      <p className="text-lg text-[#6a6f73] max-w-sm">
        This section is coming soon. Please check back later.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN EDIT COURSE PAGE
══════════════════════════════════════════════════════ */
const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("intended-learners");
  const [showSettings, setShowSettings] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const { data: courseData, isLoading } = useGetCourseByIdQuery(courseId);
  const [removeCourse] = useRemoveCourseMutation();

  const course = courseData?.course;
  const isPublished = course?.isPublished;

  const saveFnRef = React.useRef(null);

  const visitedKey = `visited_sections_${courseId}`;
  const [visitedSections, setVisitedSections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(visitedKey) || "[]");
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    if (activeSection && !visitedSections.includes(activeSection)) {
      const newVisited = [...visitedSections, activeSection];
      setVisitedSections(newVisited);
      localStorage.setItem(visitedKey, JSON.stringify(newVisited));
    }
  }, [activeSection, visitedSections, visitedKey]);

  const isItemCompleted = (item) => {
    if (item.id === "intended-learners") {
      return !!(course?.learnings && course.learnings.filter(v => v.trim()).length >= 4);
    }
    if (item.id === "curriculum") {
      return !!(course?.sections && course.sections.length > 0 && course.sections.some(s => s.lectures && s.lectures.length > 0));
    }
    if (item.id === "landing-page") {
      return !!(course?.title?.trim() && 
             course?.subtitle?.trim() && 
             course?.description?.trim() && 
             course?.category && 
             course?.thumbnail && 
             course?.promoVideoUrl && 
             course?.promoVideoStatus === "ready" &&
             course?.topics && course?.topics?.length > 0);
    }
    if (item.id === "promotions") {
      return true;
    }
    return visitedSections.includes(item.id);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this course? We promise students lifetime access, so courses cannot be deleted after students have enrolled."
    );
    if (confirmed) {
      try {
        await removeCourse(courseId).unwrap();
        toast.success("Course deleted.");
        navigate("/instructor/course");
      } catch (err) {
        toast.error(err?.data?.message || "Failed to delete.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#f7f9fa] flex items-center justify-center z-[200]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f7f9fa] z-[200] overflow-y-auto">
      {/* ══ TOP DARK NAVBAR ══ */}
      <div className="h-14 bg-[#1c1d1f] flex items-center px-6 gap-6 shrink-0 z-10 w-full">
        {/* Back to courses */}
        <button
          onClick={() => navigate("/instructor/course")}
          className="flex items-center gap-1.5 text-lg text-[#cec0fc] hover:text-white transition-colors whitespace-nowrap font-normal"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </button>

        {/* Course title */}
        <span className="font-normal text-white text-lg truncate max-w-[200px]">
          {course?.title || "Untitled Course"}
        </span>

        {/* Draft badge */}
        <span className="bg-[#3d3d3d] text-[#cec0fc] text-base font-normal px-2 py-0.5 rounded shrink-0">
          {isPublished ? "PUBLISHED" : "DRAFT"}
        </span>

        {/* Video minutes */}
        <span className="text-base text-[#9a9fa5] whitespace-nowrap">
          {(() => {
            const totalSeconds = course?.totalDurationInSeconds || 0;
            if (!totalSeconds) return "0 min of video content uploaded";
            const totalMinutes = Math.round(totalSeconds / 60);
            if (totalMinutes < 60) return `${totalMinutes} min of video content uploaded`;
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return mins > 0
              ? `${hours} hr ${mins} min of video content uploaded`
              : `${hours} hr of video content uploaded`;
          })()}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save button (hidden when settings panel open) */}
        {!showSettings && (
          <button
            disabled={!isValid}
            onClick={() => saveFnRef.current?.()}
            className={`text-lg font-normal px-5 py-2 transition-all border
              ${isValid
                ? "bg-transparent border-white text-white hover:bg-white/10 cursor-pointer"
                : "bg-[#2d2f31] border-[#4d5154] text-[#868c92] cursor-not-allowed"
              }`}
          >
            Save
          </button>
        )}

        {/* Settings gear */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded transition-colors ${showSettings ? "bg-[#5624d0] text-white" : "text-[#9a9fa5] hover:text-white"}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* ══ CENTRED WRAPPER CONTAINER ══ */}
      <div className="flex-1 w-full max-w-[1180px] mx-auto flex gap-12 py-10 px-6">
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-[220px] shrink-0">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.group} className="mb-8">
              <p className="text-base font-normal text-[#1c1d1f] uppercase tracking-wider mb-4">
                {section.group}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isSelected = activeSection === item.id && !showSettings;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveSection(item.id);
                          setShowSettings(false);
                        }}
                        className={`w-full flex items-center gap-3 text-lg py-2 px-1 text-left transition-all
                          ${isSelected
                            ? "text-[#1c1d1f] font-normal border-l-[4px] border-[#1c1d1f] pl-3.5"
                            : "text-[#6a6f73] hover:text-[#1c1d1f] pl-4"
                          }`}
                      >
                        {isItemCompleted(item) ? (
                          <CheckCircle2 className="w-5 h-5 text-[#1c1d1f] shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#6a6f73] shrink-0" />
                        )}
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Submit for review */}
          <div className="mt-6 pt-4 border-t border-[#d1d7dc]">
            <button className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-normal text-lg py-3 transition-colors">
              Submit for Review
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 min-w-0 pb-16">
          {showSettings ? (
            <SettingsPanel
              courseId={courseId}
              courseData={courseData}
              onDelete={handleDelete}
            />
          ) : activeSection === "intended-learners" ? (
            <IntendedLearnersPanel
              courseId={courseId}
              courseData={courseData}
              onSaveStart={() => {}}
              onSaveEnd={() => {}}
              onRegisterSave={(fn) => { saveFnRef.current = fn; }}
              onValidationChange={(valid) => setIsValid(valid)}
            />
          ) : activeSection === "course-structure" ? (
            <CourseStructurePanel />
          ) : activeSection === "setup-test-video" ? (
            <SetupTestVideoPanel />
          ) : activeSection === "film-edit" ? (
            <FilmEditPanel />
          ) : activeSection === "curriculum" ? (
            <CourseCurriculumTab />
          ) : activeSection === "captions" ? (
            <CaptionsTab />
          ) : activeSection === "landing-page" ? (
            <CourseLandingPageTab />
          ) : activeSection === "pricing" ? (
            <PricingTab />
          ) : (
            <PlaceholderPanel title={
              SIDEBAR_SECTIONS.flatMap(s => s.items).find(i => i.id === activeSection)?.label || "Section"
            } />
          )}
        </main>

      </div>
    </div>
  );
};

export default EditCourse;