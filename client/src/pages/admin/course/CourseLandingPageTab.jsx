import { BASE_URL } from "@/app/constant";
import RichTextEditor from "@/components/RichTextEditor";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import {
  useDeletePromoVideoMutation,
  useEditCourseMutation,
  useGetCourseByIdQuery,
  usePublishCourseMutation,
} from "@/features/api/courseApi";
import { useSearchTopicsQuery } from "@/features/api/topicApi";
import BolaVideoPlayer from "@/pages/admin/lecture/BolaVideoPlayer";
import axios from "axios";
import { useGetCertificationsQuery } from "@/features/api/certificationApi";
import { AlertTriangle, Info, Loader2, PlayCircle, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const LANGUAGES = ["English (US)", "Spanish", "French", "German", "Nepali", "Hindi"];

/* ─── Small reusable Skillera-style character-counted input ─── */
function LimitedTextInput({ label, name, value, onChange, maxLen, placeholder, hint, className = "" }) {
  const len = value?.length || 0;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xl font-normal text-[#1c1d1f]">{label}</label>
      <div className="relative flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] transition-colors w-full">
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          maxLength={maxLen}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 text-lg font-normal bg-transparent outline-none text-[#1c1d1f] placeholder-[#9a9fa5]"
        />
        <span className="pr-4 text-base font-light text-[#6a6f73] shrink-0">{len}</span>
      </div>
      {hint && <p className="text-base font-light text-[#6a6f73]">{hint}</p>}
    </div>
  );
}

/* ─── Placeholder illustration matching Skillera's dashed media box ─── */
function MediaPlaceholder() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px] bg-[#f7f9fa] border border-[#d1d7dc]">
      <div className="grid grid-cols-2 gap-2 p-4 opacity-30">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`w-14 h-14 bg-[#c1c8cd] rounded-sm flex items-center justify-center ${i === 2 ? "mt-2" : ""}`}>
            {i % 2 === 0 ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="2" y="3" width="20" height="14" rx="2" /><polygon points="10,8 16,12 10,16" fill="#c1c8cd" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="8" x2="17" y2="8" stroke="#c1c8cd" strokeWidth="2"/><line x1="7" y1="12" x2="17" y2="12" stroke="#c1c8cd" strokeWidth="2"/></svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const CourseLandingPageTab = () => {
  const { courseId } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [details, setDetails] = useState({
    title: "",
    subtitle: "",
    description: "",
    language: "English (US)",
    level: "All Levels",
    category: "",
    price: { current: "", original: "" },
    thumbnailFile: null,
    promoVideoFile: null,
    learnings: [""],
    requirements: [""],
    whoIsThisFor: [""],
    topics: [],
    courseIncludes: {
      codingExercises: 0,
      articles: 0,
      downloadableResources: 0,
      hasMobileAccess: true,
      hasCertificate: true,
    },
    includedInSubscription: false,
    primaryTopic: "",
    promoVideoUrl: "",
    promoVideoStatus: "none",
    promoVideoProgress: 0,
    promoVideoThumbnail: "",
    relatedCertificates: [],
  });

  const [previewThumbnail, setPreviewThumbnail] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const thumbnailInputRef = useRef(null);
  const promoInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showTopicTooltip, setShowTopicTooltip] = useState(false);
  const [showRepTooltip, setShowRepTooltip] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [activeProgress, setActiveProgress] = useState(0);
  const [isProgressActive, setIsProgressActive] = useState(false);
  const abortControllerRef = useRef(null);

  const { data: suggestionsData } = useSearchTopicsQuery(searchQuery, {
    skip: !searchQuery.trim(),
  });
  const suggestions = suggestionsData?.topics || [];

  const { data: courseData, isLoading: isLoadingCourse, refetch } = useGetCourseByIdQuery(courseId);
  const { data: categoryData, isLoading: isLoadingCategories } = useGetAllCategoriesQuery();
  const { data: certsData, isLoading: loadingCertifications } = useGetCertificationsQuery();
  const [editCourse, { isLoading: isUpdating }] = useEditCourseMutation();
  const [publishCourse, { isLoading: isPublishing }] = usePublishCourseMutation();
  const [deletePromoVideo, { isLoading: isDeletingPromo }] = useDeletePromoVideoMutation();

  const certificationsList = certsData?.certifications || [];

  const availableCategories = categoryData?.categories || [];

  const categoryMap = useMemo(() => {
    const map = {};
    availableCategories.forEach((c) => { map[c._id] = c; });
    return map;
  }, [availableCategories]);

  const getCategoryLevel = (category) => {
    const pId = category.parent?._id || category.parent || null;
    if (!pId) return 0;
    const parentCat = categoryMap[pId];
    if (!parentCat) return 1;
    const gpId = parentCat.parent?._id || parentCat.parent || null;
    return gpId ? 2 : 1;
  };

  const parents = useMemo(
    () => availableCategories.filter((c) => getCategoryLevel(c) === 0),
    [availableCategories, categoryMap]
  );

  const selectedHierarchy = useMemo(() => {
    const selected = availableCategories.find((c) => c.name === details.category);
    if (!selected) return { parentId: "", childId: "", subChildId: "" };
    const pId = selected.parent?._id || selected.parent || null;
    if (!pId) return { parentId: selected._id, childId: "", subChildId: "" };
    const parentCat = availableCategories.find((c) => c._id === pId);
    if (!parentCat) return { parentId: "", childId: selected._id, subChildId: "" };
    const gpId = parentCat.parent?._id || parentCat.parent || null;
    if (!gpId) return { parentId: parentCat._id, childId: selected._id, subChildId: "" };
    return { parentId: gpId, childId: parentCat._id, subChildId: selected._id };
  }, [details.category, availableCategories]);

  const topicCategories = useMemo(() => {
    return availableCategories.map((cat) => {
      const pId = cat.parent?._id || cat.parent || null;
      let label = cat.name;
      if (pId) {
        const parent = availableCategories.find((c) => c._id === pId);
        if (parent) {
          label = `${parent.name} > ${cat.name}`;
          const gpId = parent.parent?._id || parent.parent || null;
          if (gpId) {
            const grandparent = availableCategories.find((c) => c._id === gpId);
            if (grandparent) label = `${grandparent.name} > ${parent.name} > ${cat.name}`;
          }
        }
      }
      return { category: cat, label };
    });
  }, [availableCategories]);

  useEffect(() => {
    if (courseData?.course) {
      const { course } = courseData;
      setDetails({
        title: course.title || "",
        subtitle: course.subtitle || "",
        description: course.description || "",
        language: course.language || "English (US)",
        level: course.level || "All Levels",
        category: course.category || "",
        price: { current: course.price?.current || "", original: course.price?.original || "" },
        learnings: course.learnings?.length > 0 ? course.learnings : [""],
        requirements: course.requirements?.length > 0 ? course.requirements : [""],
        whoIsThisFor: course.whoIsThisFor?.length > 0 ? course.whoIsThisFor : [""],
        topics: course.topics?.length > 0 ? course.topics : [],
        courseIncludes: {
          codingExercises: course.courseIncludes?.codingExercises ?? 0,
          articles: course.courseIncludes?.articles ?? 0,
          downloadableResources: course.courseIncludes?.downloadableResources ?? 0,
          hasMobileAccess: course.courseIncludes?.hasMobileAccess ?? true,
          hasCertificate: course.courseIncludes?.hasCertificate ?? true,
        },
        includedInSubscription: course.includedInSubscription ?? false,
        thumbnailFile: null,
        promoVideoFile: null,
        primaryTopic: course.primaryTopic || "",
        promoVideoUrl: course.promoVideoUrl || "",
        promoVideoStatus: course.promoVideoStatus || "none",
        promoVideoProgress: course.promoVideoProgress || 0,
        promoVideoThumbnail: course.promoVideoThumbnail || "",
        relatedCertificates: course.relatedCertificates?.length > 0
          ? course.relatedCertificates.map((c) => c._id || c)
          : [],
      });
      setPreviewThumbnail(course.thumbnail || "");
    }
  }, [courseData]);

  // Auto-poll every 5s while video is being transcoded
  useEffect(() => {
    if (details.promoVideoStatus !== "processing") return;
    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [details.promoVideoStatus, refetch]);

  // Handle unified uploading and transcoding progress state machine
  useEffect(() => {
    if (details.promoVideoStatus === "processing") {
      setIsProgressActive(true);
      setActiveProgress(50 + Math.round((details.promoVideoProgress || 0) * 0.5));
    } else if (details.promoVideoStatus === "ready") {
      if (isProgressActive) {
        setActiveProgress(100);
        const timer = setTimeout(() => {
          setIsProgressActive(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else {
      if (!isVideoUploading) {
        setIsProgressActive(false);
      }
    }
  }, [details.promoVideoStatus, details.promoVideoProgress, isVideoUploading, isProgressActive]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e, index, field) => {
    const updatedList = [...details[field]];
    updatedList[index] = e.target.value;
    setDetails((prev) => ({ ...prev, [field]: updatedList }));
  };

  const addArrayItem = (field) =>
    setDetails((prev) => ({ ...prev, [field]: [...prev[field], ""] }));

  const removeArrayItem = (index, field) => {
    if (details[field].length > 1) {
      const updatedList = details[field].filter((_, i) => i !== index);
      setDetails((prev) => ({ ...prev, [field]: updatedList }));
    }
  };

  const handleAddTopic = (topicName) => {
    setDetails((prev) => {
      if (prev.topics.includes(topicName)) {
        return prev;
      }
      const newTopics = [...prev.topics, topicName];
      const newPrimaryTopic = newTopics.length === 1 ? topicName : prev.primaryTopic;
      return {
        ...prev,
        topics: newTopics,
        primaryTopic: newPrimaryTopic,
      };
    });
    setSearchQuery("");
    setShowSearchInput(false);
  };

  const handleRemoveTopic = (topicName) => {
    setDetails((prev) => {
      const newTopics = prev.topics.filter((t) => t !== topicName);
      let newPrimaryTopic = prev.primaryTopic;
      if (prev.primaryTopic === topicName || newTopics.length < 2) {
        newPrimaryTopic = newTopics.length === 1 ? newTopics[0] : "";
      }
      return {
        ...prev,
        topics: newTopics,
        primaryTopic: newPrimaryTopic,
      };
    });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDetails((prev) => ({ ...prev, thumbnailFile: file }));
      setPreviewThumbnail(URL.createObjectURL(file));
    }
  };

  const handlePromoVideoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    setIsVideoUploading(true);
    setIsProgressActive(true);
    setActiveProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const formData = new FormData();
    formData.append("coursePromoVideo", file);

    try {
      const token = localStorage.getItem("authToken");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios.put(
        `${BASE_URL}/api/v1/course/${courseId}`,
        formData,
        {
          headers,
          signal: controller.signal,
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
            setActiveProgress(Math.round(percent * 0.5));
          },
        }
      );

      if (response.data?.success) {
        setIsVideoUploading(false);
        setActiveProgress(50);
        toast.success("Promo video uploaded successfully. Transcoding started in background.");
        refetch();
      } else {
        toast.error("Failed to upload promo video.");
        setIsVideoUploading(false);
        setIsProgressActive(false);
        setActiveProgress(0);
      }
    } catch (err) {
      if (axios.isCancel(err) || err.name === "AbortError") {
        toast.info("Upload cancelled.");
      } else {
        console.error(err);
        toast.error("Failed to upload promo video.");
      }
      setIsVideoUploading(false);
      setUploadProgress(null);
      setIsProgressActive(false);
      setActiveProgress(0);
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsVideoUploading(false);
    setUploadProgress(null);
    setIsProgressActive(false);
    setActiveProgress(0);
    if (promoInputRef.current) promoInputRef.current.value = "";
  };

  const handleDeletePromoVideo = async () => {
    if (isProgressActive || details.promoVideoUrl || details.promoVideoStatus !== "none") {
      try {
        await deletePromoVideo(courseId).unwrap();
        setDetails((prev) => ({ ...prev, promoVideoUrl: "", promoVideoStatus: "none", promoVideoProgress: 0, promoVideoThumbnail: "" }));
        setIsProgressActive(false);
        setActiveProgress(0);
        setUploadProgress(null);
        setIsVideoUploading(false);
        if (promoInputRef.current) promoInputRef.current.value = "";
        toast.success("Promo video removed.");
        refetch();
      } catch (err) {
        console.error(err);
        toast.error("Failed to remove promo video.");
      }
    } else if (details.promoVideoFile) {
      setDetails((prev) => ({ ...prev, promoVideoFile: null }));
      if (promoInputRef.current) promoInputRef.current.value = "";
      setUploadProgress(null);
      setIsProgressActive(false);
      setActiveProgress(0);
      toast.success("Selected video cleared locally.");
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    const skipKeys = [
      "price",
      "learnings",
      "requirements",
      "whoIsThisFor",
      "topics",
      "courseIncludes",
      "thumbnailFile",
      "promoVideoFile",
      "relatedCertificates",
    ];
    Object.entries(details).forEach(([key, value]) => {
      if (!skipKeys.includes(key)) formData.append(key, value);
    });
    formData.append("price[current]", details.price.current);
    formData.append("price[original]", details.price.original);
    details.topics.forEach((t) => formData.append("topics[]", t));
    formData.append("courseIncludes[codingExercises]", details.courseIncludes.codingExercises);
    formData.append("courseIncludes[articles]", details.courseIncludes.articles);
    formData.append("courseIncludes[downloadableResources]", details.courseIncludes.downloadableResources);
    formData.append("courseIncludes[hasMobileAccess]", details.courseIncludes.hasMobileAccess);
    formData.append("courseIncludes[hasCertificate]", details.courseIncludes.hasCertificate);
    if (details.thumbnailFile) formData.append("courseThumbnail", details.thumbnailFile);
    if (details.promoVideoFile) formData.append("coursePromoVideo", details.promoVideoFile);
    formData.append("relatedCertificates", JSON.stringify(details.relatedCertificates || []));
    try {
      await editCourse({ courseId, formData }).unwrap();
      toast.success("Course details saved!");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save changes.");
    }
  };

  // Instructor profile completeness check
  const instructorBioWords = (user?.description || "").trim().split(/\s+/).filter(Boolean).length;
  const hasPhoto = !!(user?.photoUrl);
  const profileIncomplete = instructorBioWords < 50 || !hasPhoto;

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
      </div>
    );
  }

  return (
    <>
    <div className="bg-white border border-[#d1d7dc] shadow-sm font-sans text-[#1c1d1f]">

      {/* ── HEADER ── */}
      <div className="px-10 pt-10 pb-6 border-b border-[#d1d7dc]">
        <h2 className="text-3xl font-normal text-[#1c1d1f]">Course landing page</h2>
      </div>

      <div className="px-10 py-8 space-y-10">

        {/* Intro description */}
        <p className="text-lg font-light text-[#6a6f73] leading-relaxed max-w-3xl">
          Your course landing page is crucial to your success on our platform. If it&apos;s done right, it can also help you gain
          visibility in search engines like Google. As you complete this section, think about creating a compelling Course
          Landing Page that demonstrates why someone would want to enroll in your course. Learn more about{" "}
          <span className="text-[#5624d0] underline cursor-pointer">creating your course landing page</span> and{" "}
          <span className="text-[#5624d0] underline cursor-pointer">course title standards</span>.
        </p>

        {/* ── COURSE TITLE ── */}
        <LimitedTextInput
          label="Course title"
          name="title"
          value={details.title}
          onChange={handleChange}
          maxLen={60}
          placeholder="Insert your course title."
          hint="Your title should be a mix of attention-grabbing, informative, and optimized for search"
        />

        {/* ── COURSE SUBTITLE ── */}
        <LimitedTextInput
          label="Course subtitle"
          name="subtitle"
          value={details.subtitle}
          onChange={handleChange}
          maxLen={120}
          placeholder="Insert your course subtitle."
          hint="Use 1 or 2 related keywords, and mention 3-4 of the most important areas that you've covered during your course."
        />

        {/* ── COURSE DESCRIPTION ── */}
        <div className="space-y-1.5">
          <label className="block text-xl font-normal text-[#1c1d1f]">Course description</label>
          <div className="border border-[#6a6f73] focus-within:border-[#1c1d1f] transition-colors">
            <RichTextEditor
              value={details.description}
              onChange={(val) => setDetails((prev) => ({ ...prev, description: val }))}
            />
          </div>
          <p className="text-base font-light text-[#6a6f73]">Description should have minimum 200 words.</p>
        </div>

        {/* ── BASIC INFO ── */}
        <div className="space-y-3">
          <label className="block text-xl font-normal text-[#1c1d1f]">Basic info</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Language */}
            <select
              value={details.language}
              onChange={(e) => setDetails((prev) => ({ ...prev, language: e.target.value }))}
              className="border border-[#6a6f73] px-4 py-3 text-lg font-normal bg-white outline-none focus:border-[#1c1d1f] transition-colors"
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {/* Level */}
            <select
              value={details.level}
              onChange={(e) => setDetails((prev) => ({ ...prev, level: e.target.value }))}
              className="border border-[#6a6f73] px-4 py-3 text-lg font-normal bg-white outline-none focus:border-[#1c1d1f] transition-colors"
            >
              <option value="">-- Select Level --</option>
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {/* Parent category */}
            <select
              value={selectedHierarchy.parentId}
              onChange={(e) => {
                const cat = availableCategories.find((c) => c._id === e.target.value);
                setDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
              }}
              className="border border-[#6a6f73] px-4 py-3 text-lg font-normal bg-white outline-none focus:border-[#1c1d1f] transition-colors"
            >
              <option value="">-- Select Category --</option>
              {parents.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          {/* Sub-category (Child) */}
          {selectedHierarchy.parentId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <select
                value={selectedHierarchy.childId}
                onChange={(e) => {
                  const cat = availableCategories.find((c) => c._id === e.target.value);
                  setDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
                }}
                className="border border-[#6a6f73] px-4 py-3 text-lg font-normal bg-white outline-none focus:border-[#1c1d1f] transition-colors"
              >
                <option value="">-- Select Subcategory --</option>
                {availableCategories
                  .filter((c) => {
                    const pId = c.parent?._id || c.parent || null;
                    return pId === selectedHierarchy.parentId;
                  })
                  .map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {/* Sub-child (Grandchild) */}
          {selectedHierarchy.childId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              <select
                value={selectedHierarchy.subChildId}
                onChange={(e) => {
                  const cat = availableCategories.find((c) => c._id === e.target.value);
                  setDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
                }}
                className="border border-[#6a6f73] px-4 py-3 text-lg font-normal bg-white outline-none focus:border-[#1c1d1f] transition-colors"
              >
                <option value="">-- Select Sub-category (optional) --</option>
                {availableCategories
                  .filter((c) => {
                    const pId = c.parent?._id || c.parent || null;
                    return pId === selectedHierarchy.childId;
                  })
                  .map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* ── WHAT IS PRIMARILY TAUGHT ── */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center gap-2 relative">
              <label className="text-xl font-light text-[#1c1d1f]">
                What is primarily taught in your course?
              </label>
              <div 
                className="relative flex items-center"
                onMouseEnter={() => setShowTopicTooltip(true)}
                onMouseLeave={() => setShowTopicTooltip(false)}
              >
                <Info className="w-5 h-5 text-[#6a6f73] cursor-pointer shrink-0" />
                {showTopicTooltip && (
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-80 bg-white border border-[#d1d7dc] shadow-xl rounded-sm p-5 z-50 text-sm font-light text-[#1c1d1f] leading-relaxed">
                    Each individual topic chosen should comprehensively describe your course's content without being too broad. E.g. "The Complete Tennis Course" should have "Tennis" – not "Tennis Serve" (specific, but not comprehensive) and not "Sports" (comprehensive, but not specific). <span className="text-[#5624d0] underline cursor-pointer font-light">Learn more.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Display Selected Topic Tags */}
            {details.topics && details.topics.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {details.topics.map((topic) => (
                  <div 
                    key={topic} 
                    className="bg-[#5624d0] text-white text-sm font-light rounded-full px-4 py-2 flex items-center gap-2 shrink-0 transition-all"
                  >
                    <span>{topic}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="hover:text-purple-200 focus:outline-none transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input field and autocomplete suggestions */}
            {(details.topics.length === 0 || showSearchInput) && (
              <div className="relative max-w-md w-full pt-1.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Landscape Photography"
                  className="w-full border border-[#6a6f73] px-4 py-3 text-lg font-light bg-white outline-none focus:border-[#1c1d1f] transition-colors"
                />

                {/* Suggestions Dropdown */}
                {searchQuery.trim() && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#d1d7dc] shadow-xl rounded-sm p-4 z-50 max-h-60 overflow-y-auto flex flex-col gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.slug}
                        type="button"
                        onClick={() => handleAddTopic(suggestion.name)}
                        className="w-full border border-[#d1d7dc] hover:border-[#5624d0] rounded-full px-5 py-2 text-left hover:bg-slate-50 cursor-pointer text-sm font-light text-[#1c1d1f] transition-all focus:outline-none"
                      >
                        {suggestion.name}
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim() && suggestions.length === 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#d1d7dc] shadow-xl rounded-sm p-4 z-50 text-sm font-light text-[#6a6f73] text-center">
                    No matching topics found. Please type another topic.
                  </div>
                )}
              </div>
            )}

            {/* Propose another topic... link */}
            {details.topics.length > 0 && !showSearchInput && (
              <button
                type="button"
                onClick={() => setShowSearchInput(true)}
                className="text-[#5624d0] hover:text-[#3b1a91] text-sm font-light underline transition-colors block w-max self-start pt-1 focus:outline-none"
              >
                Propose another topic...
              </button>
            )}
          </div>

          {/* Representative Topic Selection */}
          {details.topics && details.topics.length >= 2 && (
            <div className="flex flex-col space-y-2 mt-4">
              <div className="flex items-center gap-2 relative">
                <label className="text-xl font-light text-[#1c1d1f]">
                  From the topics you have selected, which is the most representative topic?
                </label>
                <div 
                  className="relative flex items-center"
                  onMouseEnter={() => setShowRepTooltip(true)}
                  onMouseLeave={() => setShowRepTooltip(false)}
                >
                  <Info className="w-5 h-5 text-[#6a6f73] cursor-pointer shrink-0" />
                  {showRepTooltip && (
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-80 bg-white border border-[#d1d7dc] shadow-xl rounded-sm p-5 z-50 text-sm font-light text-[#1c1d1f] leading-relaxed">
                      Which topic do you spend the most time covering in your course? If you believe two topics are equally representative of your entire course, select either one. All of the topics listed will still count as being taught in your course. <span className="text-[#5624d0] underline cursor-pointer font-light">Learn more.</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative max-w-md w-full">
                <select
                  value={details.primaryTopic}
                  onChange={(e) => setDetails(prev => ({ ...prev, primaryTopic: e.target.value }))}
                  className="w-full border border-[#6a6f73] px-4 py-3 text-lg font-light bg-white outline-none focus:border-[#1c1d1f] transition-colors appearance-none cursor-pointer"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a6f73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                  }}
                >
                  <option value="">Select a primary topic</option>
                  {details.topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {/* Related Certifications (Udemy-Style linkage) */}
          <div className="flex flex-col space-y-3 mt-6 pt-6 border-t border-slate-100">
            <label className="text-xl font-normal text-[#1c1d1f]">
              Prepares students for Certifications
            </label>
            <p className="text-sm text-slate-500 font-light">
              Select one or more certifications this course prepares learners for. These courses will be suggested to students on the respective certification details pages.
            </p>
            {loadingCertifications ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="animate-spin" size={16} /> Loading certifications...
              </div>
            ) : certificationsList.length === 0 ? (
              <p className="text-sm text-slate-400">No certifications categories found in Admin panel.</p>
            ) : (
              <div className="space-y-4">
                <div className="max-w-md">
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      setDetails((prev) => {
                        const exists = prev.relatedCertificates?.includes(val);
                        if (exists) return prev;
                        return {
                          ...prev,
                          relatedCertificates: [...(prev.relatedCertificates || []), val]
                        };
                      });
                      e.target.value = ""; // Reset dropdown selection
                    }}
                    className="w-full border border-[#6a6f73] px-4 py-3 text-lg font-normal bg-white outline-none focus:border-[#1c1d1f] transition-colors"
                  >
                    <option value="">-- Select Certification --</option>
                    {certificationsList.map((cert) => (
                      <option key={cert._id} value={cert._id}>
                        {cert.name} ({cert.issuer?.name || "Generic"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Certifications Tags */}
                <div className="flex flex-wrap gap-2">
                  {(details.relatedCertificates || []).map((certId) => {
                    const cert = certificationsList.find(c => c._id === certId);
                    if (!cert) return null;
                    return (
                      <div
                        key={certId}
                        className="flex items-center gap-2 bg-purple-50 border border-purple-300 text-purple-950 text-sm font-medium px-3 py-1.5 rounded-full shadow-sm"
                      >
                        <span>{cert.name}</span>
                        <span className="text-xs text-slate-400">({cert.issuer?.name})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDetails((prev) => ({
                              ...prev,
                              relatedCertificates: prev.relatedCertificates.filter(id => id !== certId)
                            }));
                          }}
                          className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-purple-200 text-purple-700 hover:text-purple-950 font-bold text-xs"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── COURSE IMAGE ── */}
        <div className="space-y-3">
          <label className="block text-xl font-normal text-[#1c1d1f]">Course image</label>
          <div className="flex gap-6 items-start">
            <div className="w-64 shrink-0 border border-[#d1d7dc] overflow-hidden">
              {previewThumbnail ? (
                <img src={previewThumbnail} alt="Course thumbnail" className="w-full h-full object-cover aspect-video" />
              ) : (
                <MediaPlaceholder />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-light text-[#6a6f73] leading-relaxed mb-4">
                Upload your course image here. It must meet our{" "}
                <span className="text-[#5624d0] underline cursor-pointer">course image quality standards</span> to be accepted.
                Important guidelines: 750x422 pixels; .jpg, .jpeg, .gif, or .png, no text on the image.
              </p>
              <div className="flex items-center gap-2">
                <div className="border border-[#6a6f73] px-4 py-2.5 flex-1 text-lg font-light text-[#6a6f73] truncate">
                  {details.thumbnailFile ? details.thumbnailFile.name : "No file selected"}
                </div>
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="border border-[#5624d0] text-[#5624d0] hover:bg-purple-50 font-normal text-lg px-5 py-2.5 transition-colors shrink-0"
                >
                  Upload File
                </button>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── PROMOTIONAL VIDEO ── */}
        <div className="space-y-3">
          <label className="block text-xl font-normal text-[#1c1d1f]">Promotional video</label>
          <div className="flex gap-6 items-start">
            <div className="w-64 shrink-0 border border-[#d1d7dc] aspect-video bg-[#f7f9fa] flex items-center justify-center relative overflow-hidden">
              {isProgressActive ? (
                <div className="flex flex-col items-center justify-center gap-2 p-4 text-center h-full w-full bg-white z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
                  <span className="text-base font-light text-[#1c1d1f]">Uploading & processing...</span>
                  <span className="text-lg font-light text-[#a435f0]">{activeProgress}%</span>
                </div>
              ) : details.promoVideoStatus === "ready" && details.promoVideoUrl ? (
                <div className="relative group w-full h-full cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors flex items-center justify-center z-10">
                    <PlayCircle className="w-14 h-14 text-white fill-white/10" />
                  </div>
                  {details.promoVideoThumbnail ? (
                    <img src={details.promoVideoThumbnail} alt="Promo preview" className="w-full h-full object-cover" />
                  ) : previewThumbnail ? (
                    <img src={previewThumbnail} alt="Promo preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#e3e7ea] flex items-center justify-center text-sm font-normal text-[#1c1d1f]">
                      Play Promo Video
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-sm font-light text-[#6a6f73] leading-relaxed bg-white h-full w-full flex items-center justify-center">
                  Save the changes in order to complete the upload of your file. Once you save it, we will process it to ensure it works smoothly on Skillera.
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-light text-[#6a6f73] leading-relaxed mb-4">
                Your promo video is a quick and compelling way for students to preview what they'll learn in your course.
                Students considering your course are more likely to enroll if your promo video is well-made.{" "}
                <span className="text-[#5624d0] underline cursor-pointer">Learn how to make your promo video awesome!</span>
              </p>

              {isProgressActive ? (
                <div className="flex items-center gap-2 max-w-xl w-full">
                  <div className="relative border border-[#d1d7dc] bg-[#e3e7ea] h-11 flex-1 overflow-hidden">
                    <div 
                      className="bg-[#a435f0] h-full transition-all duration-300 flex items-center justify-center"
                      style={{ width: `${activeProgress}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-base font-light text-white mix-blend-difference">
                      {activeProgress}%
                    </span>
                  </div>
                  {isVideoUploading ? (
                    <button
                      type="button"
                      onClick={handleCancelUpload}
                      className="border border-[#5624d0] text-[#5624d0] hover:bg-purple-50 font-normal text-lg px-6 py-2 transition-colors shrink-0 h-11"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDeletePromoVideo}
                      className="border border-[#5624d0] text-[#5624d0] hover:bg-purple-50 font-normal text-lg px-6 py-2 transition-colors shrink-0 h-11"
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : (details.promoVideoUrl || details.promoVideoStatus === "ready") ? (
                <div className="flex items-center gap-2 max-w-xl w-full">
                  <div 
                    onClick={() => promoInputRef.current?.click()}
                    className="border border-[#6a6f73] px-4 py-2.5 flex-1 text-lg font-light text-[#6a6f73] truncate cursor-pointer hover:border-[#1c1d1f] transition-colors h-11"
                  >
                    {details.promoVideoUrl ? "Uploaded master playlist (master.m3u8)" : "Promo Video (Ready)"}
                  </div>
                  <button
                    type="button"
                    onClick={handleDeletePromoVideo}
                    className="border border-[#5624d0] text-[#5624d0] hover:bg-purple-50 font-normal text-lg px-6 py-2.5 transition-colors shrink-0 h-11 flex items-center justify-center"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 max-w-xl w-full">
                  <div 
                    onClick={() => promoInputRef.current?.click()}
                    className="border border-[#6a6f73] px-4 py-2.5 flex-1 text-lg font-light text-[#6a6f73] truncate cursor-pointer hover:border-[#1c1d1f] transition-colors h-11"
                  >
                    No file selected
                  </div>
                  <button
                    type="button"
                    onClick={() => promoInputRef.current?.click()}
                    className="border border-[#5624d0] text-[#5624d0] hover:bg-purple-50 font-normal text-lg px-5 py-2 transition-colors shrink-0 h-11"
                  >
                    Upload File
                  </button>
                </div>
              )}

              <input
                ref={promoInputRef}
                type="file"
                accept="video/*"
                onChange={handlePromoVideoChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* ── INSTRUCTOR PROFILE(S) ── */}
        <div className="space-y-4">
          <label className="block text-xl font-light text-[#1c1d1f]">Instructor profile(s)</label>

          {profileIncomplete && (
            <div className="bg-red-50/50 border border-red-300 p-5 flex gap-3 items-start rounded-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-base font-light text-[#1c1d1f]">
                <span className="font-normal">All visible instructors of this course must complete their profile before the course can be published.</span>{" "}
                This includes name, image, and a short summary of your background 50 words minimum.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {profileIncomplete && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${user?.photoUrl ? "" : "bg-[#1c1d1f]"}`}>
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-lg text-[#5624d0] hover:underline cursor-pointer font-light">
              {user?.name || "Instructor"}
            </span>
          </div>

          {profileIncomplete && (
            <div className="border border-red-300 bg-red-50/40 rounded-sm p-5 space-y-1">
              <p className="text-lg font-light text-[#1c1d1f]">Incomplete</p>
              {instructorBioWords < 50 && (
                <p className="text-base font-light text-[#6a6f73]">Your instructor biography must have at least 50 words.</p>
              )}
              {!hasPhoto && (
                <p className="text-base font-light text-[#6a6f73]">Your instructor image is required.</p>
              )}
              <a href="/instructor/profile" className="text-[#5624d0] underline text-sm font-light block mt-1">
                Update your profile.
              </a>
            </div>
          )}
        </div>

        {/* ── SAVE BUTTON ── */}
        <div className="border-t border-[#d1d7dc] pt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="bg-[#a435f0] hover:bg-[#8710d8] disabled:bg-slate-300 text-white font-normal text-lg px-7 py-3 transition-colors"
          >
            {isUpdating ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
            ) : "Save"}
          </button>
        </div>

      </div>
    </div>

    {/* ── HLS PROMO VIDEO PREVIEW MODAL ── */}
    {isPreviewOpen && details.promoVideoUrl && (
      <div
        onClick={() => setIsPreviewOpen(false)}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl bg-black border border-[#3e4143] shadow-2xl"
        >
          <button
            onClick={() => setIsPreviewOpen(false)}
            className="absolute -top-9 right-0 text-white hover:text-gray-300 text-base font-light flex items-center gap-1"
          >
            Close ×
          </button>
          <div className="aspect-video w-full">
            <BolaVideoPlayer src={details.promoVideoUrl} />
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default CourseLandingPageTab;
