import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useGetMyLearningCoursesQuery } from "@/features/api/authApi";
import {
  useCreateReminderMutation,
  useUpdateReminderMutation,
} from "@/features/api/reminderApi";
import { X, Search, Clock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ReminderWizardModal = ({ isOpen, onClose, reminderToEdit, onSaveSuccess }) => {
  const { data: coursesData } = useGetMyLearningCoursesQuery();
  const [createReminder, { isLoading: isCreating }] = useCreateReminderMutation();
  const [updateReminder, { isLoading: isUpdating }] = useUpdateReminderMutation();

  const enrolledCourses = coursesData?.courses || [];

  // Wizard Step State
  const [step, setStep] = useState(1);

  // Field States
  const [name, setName] = useState("Learning reminder");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [time, setTime] = useState("12:00 PM");
  const [selectedDays, setSelectedDays] = useState(["Monday"]);
  const [calendarSynced, setCalendarSynced] = useState("None");

  // Prefill when editing
  useEffect(() => {
    if (reminderToEdit) {
      setName(reminderToEdit.name || "Learning reminder");
      setSelectedCourseId(reminderToEdit.courseId?._id || reminderToEdit.courseId || "");
      setFrequency(reminderToEdit.frequency || "Weekly");
      setTime(reminderToEdit.time || "12:00 PM");
      setSelectedDays(reminderToEdit.days || ["Monday"]);
      setCalendarSynced(reminderToEdit.calendarSynced || "None");
      setStep(1);
    } else {
      setName("Learning reminder");
      setSelectedCourseId("");
      setFrequency("Weekly");
      setTime("12:00 PM");
      setSelectedDays(["Monday"]);
      setCalendarSynced("None");
      setStep(1);
    }
  }, [reminderToEdit, isOpen]);

  if (!isOpen) return null;

  const filteredCourses = enrolledCourses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name,
        courseId: selectedCourseId || null,
        time,
        days: selectedDays,
        frequency,
        calendarSynced,
      };

      if (reminderToEdit) {
        await updateReminder({ reminderId: reminderToEdit._id, ...payload }).unwrap();
        toast.success("Learning reminder updated!");
      } else {
        await createReminder(payload).unwrap();
        toast.success("Learning reminder created!");
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to save reminder.");
    }
  };

  const handleCalendarSync = (type) => {
    setCalendarSynced(type);
    const matchedCourse = enrolledCourses.find((c) => c._id === selectedCourseId);
    const courseTitle = matchedCourse ? matchedCourse.title : "LMS Learning";

    if (type === "Google") {
      const text = encodeURIComponent(name);
      const details = encodeURIComponent(`Study session for: ${courseTitle}`);
      const recurrence =
        frequency === "Daily"
          ? "&recur=FREQ=DAILY"
          : frequency === "Weekly"
          ? "&recur=FREQ=WEEKLY"
          : "";
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}${recurrence}`;
      window.open(url, "_blank");
      toast.success("Google Calendar event configuration opened!");
    } else if (type === "Apple" || type === "Outlook") {
      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${name}`,
        `DESCRIPTION:Study Session for: ${courseTitle}`,
        `DTSTART:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      ];
      if (frequency === "Daily") icsContent.push("RRULE:FREQ=DAILY");
      else if (frequency === "Weekly") icsContent.push("RRULE:FREQ=WEEKLY");

      icsContent.push("END:VEVENT");
      icsContent.push("END:VCALENDAR");

      const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name.toLowerCase().replace(/\s+/g, "_")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} calendar reminder downloaded!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[500] px-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col text-[#2d2f31]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-2xl font-light text-[#1c1d1f]">Learning reminders</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-black p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5 flex-1">
          <p className="text-base text-[#6a6f73] font-light">Step {step} of 3</p>

          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-lg font-light text-[#1c1d1f]">Name</label>
                  <span className="text-[10px] text-gray-400 font-light">optional</span>
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Learning reminder"
                  className="w-full border border-gray-300 px-3 py-2 text-lg focus:border-black outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-lg font-light text-[#1c1d1f] block">Attach content (optional)</label>
                <p className="text-base text-[#6a6f73] font-light">Most recent courses or labs:</p>
                
                {/* Courses List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {filteredCourses.map((course) => (
                    <label 
                      key={course._id} 
                      className="flex items-start gap-2.5 text-base text-[#2d2f31] font-light cursor-pointer hover:bg-slate-50 p-1.5"
                    >
                      <input 
                        type="radio" 
                        name="attached_course"
                        checked={selectedCourseId === course._id}
                        onChange={() => setSelectedCourseId(course._id)}
                        className="mt-0.5 accent-[#6d28d2]"
                      />
                      <span>Course: {course.title}</span>
                    </label>
                  ))}

                  <label className="flex items-center gap-2.5 text-base text-[#2d2f31] font-light cursor-pointer hover:bg-slate-50 p-1.5">
                    <input 
                      type="radio" 
                      name="attached_course"
                      checked={selectedCourseId === ""}
                      onChange={() => setSelectedCourseId("")}
                      className="accent-[#6d28d2]"
                    />
                    <span>None</span>
                  </label>
                </div>

                {/* Search Bar */}
                <div className="relative pt-1">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full border border-gray-300 pl-9 pr-3 py-2 text-lg focus:border-black outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
              <div className="space-y-2">
                <label className="text-lg font-light text-[#1c1d1f] block">Frequency</label>
                <div className="flex gap-2">
                  {["Daily", "Weekly", "Once"].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`px-4 py-2 text-base font-light border transition-colors ${
                        frequency === freq
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "border-gray-300 text-[#2d2f31] hover:bg-slate-50"
                      }`}
                      style={{ borderRadius: 20 }}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-lg font-light text-[#1c1d1f] block">Time</label>
                <div className="relative max-w-[200px]">
                  <input 
                    type="text" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-gray-300 pl-3 pr-9 py-2 text-lg focus:border-black outline-none transition-colors"
                    placeholder="12:00 PM"
                  />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
              <div className="space-y-1.5">
                <label className="text-lg font-light text-[#1c1d1f] block">Add to calendar (optional)</label>
                <div className="flex flex-wrap gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => handleCalendarSync("Google")}
                    className={`flex items-center gap-1.5 px-4 py-2 border text-base font-light transition-all ${
                      calendarSynced === "Google" ? "border-black bg-slate-50" : "border-gray-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-red-500 font-light">G</span> Sign in with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalendarSync("Apple")}
                    className={`flex items-center gap-1.5 px-4 py-2 border text-base font-light transition-all ${
                      calendarSynced === "Apple" ? "border-black bg-slate-50" : "border-gray-300 hover:bg-slate-50"
                    }`}
                  >
                    🍎 Apple
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalendarSync("Outlook")}
                    className={`flex items-center gap-1.5 px-4 py-2 border text-base font-light transition-all ${
                      calendarSynced === "Outlook" ? "border-black bg-slate-50" : "border-gray-300 hover:bg-slate-50"
                    }`}
                  >
                    💻 Outlook
                  </button>
                </div>
                <p className="text-[11px] text-[#6a6f73] leading-relaxed pt-2">
                  Follow all calendar prompts and save before moving forward. Apple and outlook will download an ics file. Open this file to add it to your calendar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="text-[#6d28d2] hover:text-[#892de1] text-base font-light transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-[#6d28d2] hover:bg-[#892de1] text-white text-base font-light py-2.5 px-5 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isCreating || isUpdating}
                className="bg-[#6d28d2] hover:bg-[#892de1] text-white text-base font-light py-2.5 px-5 transition-colors flex items-center gap-1"
              >
                {(isCreating || isUpdating) && <Loader2 className="h-3 w-3 animate-spin" />}
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

ReminderWizardModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reminderToEdit: PropTypes.object,
  onSaveSuccess: PropTypes.func.isRequired,
};

export default ReminderWizardModal;
