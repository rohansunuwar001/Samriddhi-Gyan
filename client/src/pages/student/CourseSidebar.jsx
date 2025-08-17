// src/components/CourseSidebar.js
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const CourseSidebar = ({
  courseData,
  selectedLecture,
  setSelectedLecture,
  progress = [],
}) => {
  if (!courseData)
    return (
      <aside className="w-[380px] bg-white border-l border-gray-200 flex-shrink-0 p-4">
        Loading...
      </aside>
    );

  const { course, purchaseStatus, allowReview } = courseData;

  // Auto-expand all sections for purchased courses
  const [openSections, setOpenSections] = useState([]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (course?.sections?.length) {
      setOpenSections(course.sections.map((_, idx) => idx));
    }
  }, [course]);

  const toggleSection = (idx) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatSectionDuration = (seconds) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Calculate watched duration
  const totalDuration = course.sections.reduce(
    (sectionSum, section) =>
      sectionSum +
      (section.lectures?.reduce(
        (lectureSum, lecture) => lectureSum + (lecture.durationInSeconds || 0),
        0
      ) || 0),
    0
  );

  const watchedDuration = course.sections.reduce(
    (sectionSum, section) =>
      sectionSum +
      (section.lectures?.reduce((lectureSum, lecture) => {
        const isViewed = progress.some(
          (lp) => lp.lectureId === lecture._id && lp.viewed
        );
        return lectureSum + (isViewed ? lecture.durationInSeconds || 0 : 0);
      }, 0) || 0),
    0
  );

  const percent =
    totalDuration > 0 ? Math.round((watchedDuration / totalDuration) * 100) : 0;

  return (
    <aside className="w-[380px] bg-white border-l border-gray-200 flex-shrink-0">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Course content</h2>
        </div>

        {/* Course summary */}
        <div className="mb-2 text-xs text-gray-600">
          {course.sections?.length || 0} sections •{" "}
          {course.sections.reduce(
            (sum, s) => sum + (s.lectures?.length || 0),
            0
          )}{" "}
          lectures
        </div>

        {/* Sections */}
        <div className="space-y-2">
          {course.sections?.map((section, idx) => {
            const sectionDuration = section.lectures?.reduce(
              (sum, lecture) => sum + (lecture.durationInSeconds || 0),
              0
            );

            return (
              <div key={section._id}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(idx)}
                  className="w-full flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-t-md hover:bg-gray-100"
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    <p className="text-xs text-gray-500">
                      {section.lectures?.length || 0} lectures •{" "}
                      {formatSectionDuration(sectionDuration)}
                    </p>
                  </div>
                  {openSections.includes(idx) ? "▲" : "▼"}
                </button>

                {/* Lectures */}
                {openSections.includes(idx) && (
                  <ul className="border border-t-0 border-gray-200 rounded-b-md p-2">
                    {section.lectures?.map((lecture) => {
                      const isViewed = progress.some(
                        (lp) => lp.lectureId === lecture._id && lp.viewed
                      );

                      return (
                        <li
                          key={lecture._id}
                          className={`p-3 text-sm cursor-pointer ${
                            selectedLecture?._id === lecture._id
                              ? "bg-blue-100 text-blue-800 font-semibold"
                              : "text-gray-800 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedLecture(lecture)}
                        >
                          {lecture.title}
                          {lecture.durationInSeconds && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({formatDuration(lecture.durationInSeconds)})
                            </span>
                          )}
                          {isViewed && (
                            <span className="ml-2 text-green-500 text-xs">
                              ✓
                            </span>
                          )}
                          {lecture.isPreview && (
                            <span className="ml-2 text-green-600 text-xs">
                              Preview
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress info */}
        <div className="mt-4 text-sm text-gray-600">
          Progress: {percent}% ({formatDuration(watchedDuration)} /{" "}
          {formatDuration(totalDuration)})
        </div>

        {/* Review access */}
        {allowReview && purchaseStatus === "completed" && (
          <div className="mt-6 text-blue-600 text-sm font-medium">
            You can review this course!
          </div>
        )}
      </div>
    </aside>
  );
};

CourseSidebar.propTypes = {
  courseData: PropTypes.shape({
    course: PropTypes.shape({
      sections: PropTypes.array,
    }),
    purchaseStatus: PropTypes.string,
    allowReview: PropTypes.bool,
  }),
  selectedLecture: PropTypes.object,
  setSelectedLecture: PropTypes.func.isRequired,
  progress: PropTypes.array,
};

export default CourseSidebar;
