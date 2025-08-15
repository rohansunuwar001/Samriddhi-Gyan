// src/components/MainContent.js

import PropTypes from "prop-types";
import React from "react";
import { FaFacebookF, FaLink, FaLinkedinIn, FaStar } from "react-icons/fa";
import ReviewsSection from "../Reviews/ReviewSection"; // This component now handles ALL review logic.

// A memoized, reusable component for circular progress to prevent unnecessary re-renders.
const CircularProgress = React.memo(function CircularProgress({ percent }) {
  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center my-4">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#22c55e"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.35s ease-out",
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="text-sm font-medium mt-2">
        {Math.round(percent)}% completed
      </div>
    </div>
  );
});
CircularProgress.propTypes = { percent: PropTypes.number.isRequired };

const MainContent = ({
  courseData,
  selectedLecture,
  progress = [],
  onLectureViewed,
}) => {
  const [selectedTab, setSelectedTab] = React.useState("overview");
  const [questionText, setQuestionText] = React.useState("");

  // Production-grade safeguard: Do not render anything until the core course data is available.
  if (!courseData?.course) {
    return (
      <div className="p-10 text-center font-semibold">Loading Content...</div>
    );
  }

  // Safely destructure after the safeguard check.
  const { course } = courseData;

  // Destructure with safe fallbacks for all properties used in the template.
  const ratings = course.ratings || 0;
  const numOfReviews = course.numOfReviews || 0;
  const studentCount = course.enrolledStudents?.length || 0;
  const language = course.language || "N/A";
  const level = course.level || "N/A";
  const instructor = course.creator || {};
  const instructorName = instructor.name || "Unknown Instructor";
  const instructorHeadline = instructor.headline || "";
  const instructorPhoto =
    instructor.photoUrl || "https://via.placeholder.com/100";
  const instructorLinks = instructor.links || {};

  const totalLectures = (course.sections || []).reduce(
    (sum, section) => sum + (section.lectures?.length || 0),
    0
  );

  // Performance Optimization: Memoize complex calculations.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const watchedDuration = React.useMemo(() => {
    return (course.sections || []).reduce(
      (sectionSum, section) =>
        sectionSum +
        (section.lectures || []).reduce((lectureSum, lecture) => {
          const isViewed = progress.some(
            (lp) => lp.lectureId === lecture._id && lp.viewed
          );
          return lectureSum + (isViewed ? lecture.durationInSeconds || 0 : 0);
        }, 0),
      0
    );
  }, [progress, course.sections]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const percent = React.useMemo(() => {
    return course.totalDurationInSeconds > 0
      ? (watchedDuration / course.totalDurationInSeconds) * 100
      : 0;
  }, [watchedDuration, course.totalDurationInSeconds]);

  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting question:", questionText); // Replace with actual mutation call
    setQuestionText("");
  };

  const formatDuration = (seconds = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex-grow bg-white p-6 md:p-10">
      {/* Video Player */}
      <div
        className="relative bg-black w-full"
        style={{ paddingTop: "56.25%" }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {selectedLecture?.videoUrl ? (
            <video
              key={selectedLecture._id}
              src={selectedLecture.videoUrl}
              controls
              autoPlay
              className="w-full h-full bg-black"
              onPlay={() => onLectureViewed(selectedLecture._id)}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center text-white text-center w-full h-full p-4 bg-gray-900">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="max-h-32 opacity-60 rounded"
              />
              <div className="mt-4 font-semibold text-lg">
                {selectedLecture?.title || "Select a lecture from the sidebar"}
              </div>
            </div>
          )}
        </div>
      </div>

      <CircularProgress percent={percent} />

      {/* Navigation Tabs */}
      <div className="mt-4 border-b border-gray-200">
        <nav className="flex space-x-8 -mb-px">
          <button
            className={`py-4 px-1 border-b-2 text-sm font-semibold transition-colors duration-200 ${
              selectedTab === "overview"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setSelectedTab("overview")}
          >
            Overview
          </button>
          <button
            className={`py-4 px-1 border-b-2 text-sm font-semibold transition-colors duration-200 ${
              selectedTab === "qna"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setSelectedTab("qna")}
          >
            Q&amp;A
          </button>
          <button
            className={`py-4 px-1 border-b-2 text-sm font-semibold transition-colors duration-200 ${
              selectedTab === "reviews"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setSelectedTab("reviews")}
          >
            Reviews
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {selectedTab === "overview" && (
          <article className="mt-8 max-w-4xl">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-lg mt-2 text-gray-700">{course.subtitles}</p>

            <div className="flex items-center space-x-4 mt-3 text-sm">
              <div className="flex items-center">
                <span className="font-bold text-orange-500 mr-1">
                  {ratings.toFixed(1)}
                </span>
                <FaStar className="text-orange-400" />
              </div>
              <span className="text-blue-600 underline">
                {numOfReviews} ratings
              </span>
              <span>{studentCount} students</span>
            </div>
            <p className="mt-2 text-sm">
              Language: {language} | Level: {level}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <span className="font-semibold">Skill Level:</span> {level}
              </div>
              <div>
                <span className="font-semibold">Students:</span> {studentCount}
              </div>
              <div>
                <span className="font-semibold">Languages:</span> {language}
              </div>
              <div>
                <span className="font-semibold">Video:</span> {totalLectures}{" "}
                lectures
              </div>
              <div>
                <span className="font-semibold">Total Duration:</span>{" "}
                {formatDuration(course.totalDurationInSeconds)}
              </div>
              <div>
                <span className="font-semibold">Captions:</span> Yes
              </div>
            </div>

            <div className="mt-10 prose max-w-none">
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <div dangerouslySetInnerHTML={{ __html: course.description }} />
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Instructor</h2>
              <div className="flex items-start">
                <img
                  src={instructorPhoto}
                  alt={instructorName}
                  className="rounded-full w-24 h-24"
                />
                <div className="ml-5">
                  <h3 className="text-lg font-bold text-blue-600 underline">
                    {instructorName}
                  </h3>
                  <p className="text-sm text-gray-600">{instructorHeadline}</p>
                  <div className="flex space-x-3 mt-2">
                    {instructorLinks.facebook && (
                      <a
                        href={instructorLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border rounded-full hover:bg-gray-100"
                      >
                        <FaFacebookF />
                      </a>
                    )}
                    {instructorLinks.linkedin && (
                      <a
                        href={instructorLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border rounded-full hover:bg-gray-100"
                      >
                        <FaLinkedinIn />
                      </a>
                    )}
                    {instructorLinks.website && (
                      <a
                        href={instructorLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border rounded-full hover:bg-gray-100"
                      >
                        <FaLink />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        {selectedTab === "qna" && (
          <section className="mt-8 max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Ask a Question</h2>
            <form onSubmit={handleQuestionSubmit}>
              <textarea
                className="w-full border rounded p-2 mb-2"
                rows={3}
                placeholder="Type your question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Submit Question
              </button>
            </form>
          </section>
        )}

        {selectedTab === "reviews" && (
          <section className="mt-8 max-w-4xl">
            {/* CORRECT & FINAL: This is the only line needed for the reviews tab. */}
            <ReviewsSection course={course} />
          </section>
        )}
      </div>
    </main>
  );
};

MainContent.propTypes = {
  courseData: PropTypes.object,
  selectedLecture: PropTypes.object,
  progress: PropTypes.array,
  onLectureViewed: PropTypes.func.isRequired,
};

export default MainContent;
