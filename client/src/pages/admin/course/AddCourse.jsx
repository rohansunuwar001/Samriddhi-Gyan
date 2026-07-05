import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Play, ClipboardList, BookOpen } from "lucide-react";
import { useCreateCourseMutation } from "@/features/api/courseApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";

/* ─── progress bar fills per step ─── */
const STEP_PROGRESS = { 1: 25, 2: 50, 3: 75, 4: 100 };

const TIME_OPTIONS = [
  "I'm very busy right now (0-2 hours)",
  "I'll work on this on the side (2-4 hours)",
  "I have lots of flexibility (5+ hours)",
  "I haven't yet decided if I have time",
];

/* ─── tiny helper: flat list → 3-level hierarchy ─── */
function useCategoryHierarchy(categories) {
  return useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c._id] = c; });

    const level = (cat) => {
      const p = cat.parent?._id || cat.parent || null;
      if (!p) return 0;
      const parent = map[p];
      if (!parent) return 1;
      const gp = parent.parent?._id || parent.parent || null;
      return gp ? 2 : 1;
    };

    return { map, level };
  }, [categories]);
}

/* ═══════════════════════════════════════════════════
   STEP 1 — Course type
═══════════════════════════════════════════════════ */
function Step1({ value, onChange }) {
  const options = [
    {
      id: "course",
      icon: <Play className="w-8 h-8 text-[#1c1d1f]" />,
      label: "Course",
      desc: "Create rich learning experiences with the help of video lectures, quizzes, coding exercises, etc.",
    },
    {
      id: "practice",
      icon: <ClipboardList className="w-8 h-8 text-[#1c1d1f]" />,
      label: "Practice Test",
      desc: "Help students prepare for certification exams by providing practice questions.",
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-normal text-[#1c1d1f] text-center mb-12">
        First, let's find out what type of course you're making.
      </h1>
      <div className="flex gap-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`w-[168px] min-h-[180px] border-2 rounded p-5 flex flex-col items-center text-center transition-all cursor-pointer
              ${value === opt.id
                ? "border-[#1c1d1f] bg-white"
                : "border-[#d1d7dc] bg-white hover:border-[#8c8c8c]"
              }`}
          >
            <div className="mb-4">{opt.icon}</div>
            <p className="font-normal text-lg text-[#1c1d1f] mb-2">{opt.label}</p>
            <p className="text-base text-[#6a6f73] leading-relaxed">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 2 — Working title
═══════════════════════════════════════════════════ */
function Step2({ value, onChange }) {
  const MAX = 60;
  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      <h1 className="text-4xl font-normal text-[#1c1d1f] text-center mb-3">
        How about a working title?
      </h1>
      <p className="text-lg text-[#6a6f73] text-center mb-8">
        It's ok if you can't think of a good title now. You can change it later.
      </p>
      <div className="relative w-full">
        <input
          type="text"
          maxLength={MAX}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Learn Photoshop CS6 from Scratch"
          className="w-full border border-[#6a6f73] focus:border-[#a435f0] outline-none px-4 py-3 text-lg text-[#1c1d1f] pr-12 transition-colors"
          style={{ borderWidth: "1.5px" }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-[#6a6f73]">
          {MAX - value.length}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 3 — Category
═══════════════════════════════════════════════════ */
function Step3({ value, onChange, categories }) {
  const { map, level } = useCategoryHierarchy(categories);
  const parents = categories.filter((c) => level(c) === 0);

  // Derive selected parent from value (category name)
  const selected = categories.find((c) => c.name === value);
  const selectedId = selected?._id || "";
  const selectedLevel = selected ? level(selected) : -1;

  // resolve parentId for filtering children
  const parentId = useMemo(() => {
    if (!selected) return "";
    const lvl = level(selected);
    if (lvl === 0) return selected._id;
    if (lvl === 1) return selected.parent?._id || selected.parent || "";
    const parent = map[selected.parent?._id || selected.parent];
    return parent?.parent?._id || parent?.parent || "";
  }, [selected, map]);

  const childId = useMemo(() => {
    if (!selected) return "";
    const lvl = level(selected);
    if (lvl === 0) return "";
    if (lvl === 1) return selected._id;
    return selected.parent?._id || selected.parent || "";
  }, [selected]);

  const children = categories.filter(
    (c) => level(c) === 1 && (c.parent?._id || c.parent) === parentId
  );
  const subChildren = categories.filter(
    (c) => level(c) === 2 && (c.parent?._id || c.parent) === childId
  );

  const handleParent = (id) => {
    const cat = categories.find((c) => c._id === id);
    onChange(cat ? cat.name : "");
  };
  const handleChild = (id) => {
    const cat = categories.find((c) => c._id === id);
    onChange(cat ? cat.name : "");
  };
  const handleSubChild = (id) => {
    const cat = categories.find((c) => c._id === id);
    onChange(cat ? cat.name : "");
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      <h1 className="text-4xl font-normal text-[#1c1d1f] text-center mb-3">
        What category best fits the knowledge you'll share?
      </h1>
      <p className="text-lg text-[#6a6f73] text-center mb-8">
        If you're not sure about the right category, you can change it later.
      </p>

      {/* Parent */}
      <div className="w-full mb-3">
        <select
          value={parentId}
          onChange={(e) => handleParent(e.target.value)}
          className="w-full border border-[#6a6f73] px-4 py-3 text-lg text-[#1c1d1f] outline-none focus:border-[#a435f0] bg-white appearance-none cursor-pointer"
          style={{ borderWidth: "1.5px", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a6f73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
        >
          <option value="">Choose a category</option>
          {parents.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Child */}
      {children.length > 0 && (
        <div className="w-full mb-3">
          <select
            value={childId}
            onChange={(e) => handleChild(e.target.value)}
            className="w-full border border-[#6a6f73] px-4 py-3 text-lg text-[#1c1d1f] outline-none focus:border-[#a435f0] bg-white appearance-none cursor-pointer"
            style={{ borderWidth: "1.5px", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a6f73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
          >
            <option value="">Choose a subcategory</option>
            {children.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-child */}
      {subChildren.length > 0 && (
        <div className="w-full">
          <select
            value={selectedLevel === 2 ? selectedId : ""}
            onChange={(e) => handleSubChild(e.target.value)}
            className="w-full border border-[#6a6f73] px-4 py-3 text-lg text-[#1c1d1f] outline-none focus:border-[#a435f0] bg-white appearance-none cursor-pointer"
            style={{ borderWidth: "1.5px", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a6f73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
          >
            <option value="">Choose a topic</option>
            {subChildren.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 4 — Time commitment
═══════════════════════════════════════════════════ */
function Step4({ value, onChange }) {
  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      <h1 className="text-4xl font-normal text-[#1c1d1f] text-center mb-3">
        How much time can you spend creating your course per week?
      </h1>
      <p className="text-lg text-[#6a6f73] text-center mb-8">
        There's no wrong answer. We can help you achieve your goals even if you don't have much time.
      </p>
      <div className="w-full space-y-2">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`w-full flex items-center gap-4 border px-5 py-4 text-lg text-left transition-colors rounded-sm
              ${value === opt
                ? "border-[#1c1d1f] bg-white"
                : "border-[#d1d7dc] hover:border-[#8c8c8c] bg-white"
              }`}
          >
            {/* Custom radio circle */}
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
              ${value === opt ? "border-[#1c1d1f]" : "border-[#6a6f73]"}`}>
              {value === opt && (
                <span className="w-2 h-2 rounded-full bg-[#1c1d1f]" />
              )}
            </span>
            <span className="text-[#1c1d1f]">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN WIZARD
═══════════════════════════════════════════════════ */
const AddCourse = () => {
  const navigate = useNavigate();
  const { step: stepParam } = useParams();
  const step = parseInt(stepParam || "1", 10);

  const [courseType, setCourseType] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [timeCommitment, setTimeCommitment] = useState("");

  const [createCourse, { data, isLoading, isSuccess, isError, error }] = useCreateCourseMutation();
  const { data: categoryData } = useGetAllCategoriesQuery();
  const categories = categoryData?.categories || [];

  // redirect to step 1 if invalid step
  useEffect(() => {
    if (isNaN(step) || step < 1 || step > 4) {
      navigate("/instructor/course/create/1", { replace: true });
    }
  }, [step, navigate]);

  useEffect(() => {
    if (isSuccess && data?.course?._id) {
      toast.success(data.message || "Course created!");
      navigate(`/instructor/course/${data.course._id}`);
    }
    if (isError) {
      toast.error(error?.data?.message || "Something went wrong.");
    }
  }, [isSuccess, isError, data, error, navigate]);

  const canContinue = () => {
    if (step === 1) return !!courseType;
    if (step === 2) return title.trim().length > 0;
    if (step === 3) return !!category;
    if (step === 4) return !!timeCommitment;
    return false;
  };

  const handleContinue = () => {
    if (step < 4) {
      navigate(`/instructor/course/create/${step + 1}`);
    } else {
      // Final step → create the course
      createCourse({ title, category, price: { original: 0, current: 0 } });
    }
  };

  const handleBack = () => {
    if (step > 1) navigate(`/instructor/course/create/${step - 1}`);
  };

  const progress = STEP_PROGRESS[step] || 25;
  const active = canContinue();
  const isLastStep = step === 4;

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-[200]">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-8 h-14 border-b border-[#d1d7dc] shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/instructor/course")}>
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#a435f0] to-[#5624d0] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-normal text-[#1c1d1f] text-xl tracking-tight">
            Samriddhi<span className="text-[#a435f0]">Gyan</span>
          </span>
        </div>

        {/* Step indicator */}
        <span className="text-lg font-light text-[#1c1d1f]">
          Step {step} of 4
        </span>

        {/* Exit */}
        <button
          onClick={() => navigate("/instructor/course")}
          className="text-lg font-normal text-[#5624d0] hover:underline"
        >
          Exit
        </button>
      </div>

      {/* ── Purple progress bar ── */}
      <div className="h-1 bg-[#d1d7dc] shrink-0">
        <div
          className="h-full bg-[#a435f0] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto">
        {step === 1 && <Step1 value={courseType} onChange={setCourseType} />}
        {step === 2 && <Step2 value={title} onChange={setTitle} />}
        {step === 3 && <Step3 value={category} onChange={setCategory} categories={categories} />}
        {step === 4 && <Step4 value={timeCommitment} onChange={setTimeCommitment} />}
      </div>

      {/* ── Bottom navigation ── */}
      <div className="flex items-center justify-between px-8 py-5 border-t border-[#d1d7dc] shrink-0">
        {/* Previous */}
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`px-5 py-2.5 text-lg font-normal border transition-colors
            ${step === 1
              ? "border-[#d1d7dc] text-[#d1d7dc] cursor-not-allowed"
              : "border-[#1c1d1f] text-[#1c1d1f] hover:bg-[#f7f9fa]"
            }`}
        >
          Previous
        </button>

        {/* Continue / Create Course */}
        <button
          onClick={handleContinue}
          disabled={!active || isLoading}
          className={`px-6 py-2.5 text-lg font-normal transition-all
            ${active
              ? "bg-[#a435f0] text-white hover:bg-[#8710d8] cursor-pointer"
              : "bg-[#d1d7dc] text-[#6a6f73] cursor-not-allowed"
            }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </span>
          ) : isLastStep ? (
            "Create Course"
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
};

export default AddCourse;