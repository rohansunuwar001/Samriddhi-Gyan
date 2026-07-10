import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Info, Upload, CheckCircle2, Circle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useGetCourseByIdQuery } from "@/features/api/courseApi";
import {
  useUploadCaptionMutation,
  useToggleCaptionsDisableMutation,
  useDeleteCaptionMutation,
} from "@/features/api/lectureApi";

const CaptionsTab = () => {
  const { courseId } = useParams();
  const [selectedLanguage, setSelectedLanguage] = useState("English (US)");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'uncaptioned'
  const [uploadingLectureId, setUploadingLectureId] = useState(null);

  const { data: courseData, isLoading, refetch } = useGetCourseByIdQuery(courseId);
  const [uploadCaption, { isLoading: isUploading }] = useUploadCaptionMutation();
  const [toggleCaptionsDisable, { isLoading: isToggling }] = useToggleCaptionsDisableMutation();
  const [deleteCaption] = useDeleteCaptionMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
      </div>
    );
  }

  const course = courseData?.course;
  const sections = course?.sections || [];
  const allLectures = sections.flatMap((sec) => sec.lectures || []);

  // Compute stats
  const totalLecturesCount = allLectures.length;
  const captionedLecturesCount = allLectures.filter((lec) => lec.captions && lec.captions.length > 0).length;
  const uncaptionedLecturesCount = totalLecturesCount - captionedLecturesCount;

  // Determine if captions are disabled (check if any has captionsDisabled or globally)
  // Let's assume the first lecture or course holds a state, or we toggle it on the active lectures
  const isGlobalDisabled = allLectures.every((l) => l.captionsDisabled);

  const handleToggleGlobalDisable = async () => {
    const nextVal = !isGlobalDisabled;
    try {
      // Toggle disable on all lectures of this course
      for (const lec of allLectures) {
        await toggleCaptionsDisable({ lectureId: lec._id, disabled: nextVal, courseId }).unwrap();
      }
      refetch();
      toast.success(nextVal ? "Captions disabled for all lectures." : "Captions enabled for all lectures.");
    } catch {
      toast.error("Failed to update captions disable status.");
    }
  };

  const handleFileUpload = async (e, lectureId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLectureId(lectureId);
    const formData = new FormData();
    formData.append("caption", file);
    formData.append("language", selectedLanguage);

    try {
      await uploadCaption({ lectureId, formData, courseId }).unwrap();
      toast.success(`Captions uploaded successfully for ${selectedLanguage}!`);
      refetch();
    } catch (err) {
      toast.error("Failed to upload captions.");
    } finally {
      setUploadingLectureId(null);
    }
  };

  const handleDeleteCaption = async (lectureId, captionId) => {
    if (window.confirm("Are you sure you want to delete this caption?")) {
      try {
        await deleteCaption({ lectureId, captionId, courseId }).unwrap();
        toast.success("Caption deleted.");
        refetch();
      } catch {
        toast.error("Failed to delete caption.");
      }
    }
  };

  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm relative font-sans text-lg font-normal text-[#1c1d1f]">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-[#d1d7dc] pb-5 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-normal">Captions</h2>
          
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border border-[#1c1d1f] px-3 py-1.5 text-lg font-normal outline-none bg-white"
          >
            <option value="English (US)">English (US)</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Nepali">Nepali</option>
          </select>

          <span className="text-lg text-[#6a6f73] flex items-center gap-1.5">
            {captionedLecturesCount}/{totalLecturesCount} published lectures captioned
            <Info className="w-4 h-4 text-[#6a6f73] cursor-pointer" />
          </span>
        </div>

        <button
          onClick={handleToggleGlobalDisable}
          disabled={isToggling}
          className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-lg px-5 py-2 transition-colors rounded-sm"
        >
          {isGlobalDisabled ? "Enable" : "Disable"}
        </button>
      </div>

      <p className="text-lg text-[#6a6f73] mb-6 font-light">
        Learners of all levels of language proficiency highly value subtitles as it helps follow, understand and memorize the content. Also having subtitles to ensure the content is accessible for those that are deaf or hard of hearing is crucial. <span className="text-[#5624d0] underline cursor-pointer">Learn more.</span>
      </p>

      {/* INFO CARD */}
      <div className="bg-[#f7f9fa] border border-[#d1d7dc] p-5 mb-8 flex gap-4 items-start rounded-sm">
        <Info className="w-6 h-6 text-[#5624d0] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-normal text-xl text-[#1c1d1f] mb-1">Reach more students with captions</h4>
          <p className="text-lg text-[#6a6f73] font-light">
            Skillera will add auto-generated captions to your course to make course content more accessible. Captions will be available within 48 hours of publishing your course. You can review and edit your captions on this page once they have been generated.
          </p>
          <p className="text-[#5624d0] hover:underline cursor-pointer text-lg font-normal mt-3">
            Find out more about captions here.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2 text-lg font-normal transition-colors border ${activeTab === "all" ? "bg-[#1c1d1f] text-white border-[#1c1d1f]" : "bg-white text-[#1c1d1f] border-[#d1d7dc] hover:bg-slate-50"}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("uncaptioned")}
          className={`px-5 py-2 text-lg font-normal transition-colors border ${activeTab === "uncaptioned" ? "bg-[#1c1d1f] text-white border-[#1c1d1f]" : "bg-white text-[#1c1d1f] border-[#d1d7dc] hover:bg-slate-50"}`}
        >
          Uncaptioned ({uncaptionedLecturesCount})
        </button>
      </div>

      {/* LECTURES LIST */}
      <div className="space-y-6">
        {sections.map((section, secIdx) => {
          // Filter lectures based on active tab
          const sectionLectures = (section.lectures || []).filter((lec) => {
            if (activeTab === "uncaptioned") {
              return !lec.captions || lec.captions.length === 0;
            }
            return true;
          });

          if (sectionLectures.length === 0) return null;

          return (
            <div key={section._id} className="space-y-4">
              <h3 className="text-xl font-normal text-[#1c1d1f] border-b border-[#e4e8eb] pb-2">
                {section.title}
              </h3>

              <div className="space-y-2">
                {sectionLectures.map((lecture, lecIdx) => {
                  const hasLecCaptions = lecture.captions && lecture.captions.length > 0;
                  const isUploadingLec = uploadingLectureId === lecture._id;

                  return (
                    <div
                      key={lecture._id}
                      className="flex items-center justify-between p-4 bg-white border border-[#d1d7dc] hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {hasLecCaptions ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#9a9fa5] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-lg text-[#1c1d1f] block truncate">
                            Lecture {lecIdx + 1}: {lecture.title}
                          </span>
                          {hasLecCaptions ? (
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {lecture.captions.map((cap) => (
                                <span
                                  key={cap._id}
                                  className="bg-purple-50 text-[#5624d0] border border-purple-100 text-base px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                                >
                                  {cap.language}
                                  <button
                                    onClick={() => handleDeleteCaption(lecture._id, cap._id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-base text-[#6a6f73] font-light block mt-0.5">
                              Uncaptioned
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 ml-4">
                        <input
                          type="file"
                          accept=".vtt,.srt"
                          onChange={(e) => handleFileUpload(e, lecture._id)}
                          className="hidden"
                          id={`caption-input-${lecture._id}`}
                        />
                        <label
                          htmlFor={`caption-input-${lecture._id}`}
                          className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] font-normal text-lg px-5 py-2.5 transition-colors cursor-pointer rounded-sm flex items-center gap-1.5"
                        >
                          {isUploadingLec ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          Upload
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {totalLecturesCount === 0 && (
          <div className="text-center py-12 text-[#6a6f73] italic">
            No lectures available. Please add some lectures in the Curriculum tab first.
          </div>
        )}
      </div>

    </div>
  );
};

export default CaptionsTab;
