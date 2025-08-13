// src/components/MainContent.js
import React from "react";
import {
  FaPlay,
  FaStar,
  FaFacebookF,
  FaLinkedinIn,
  FaLink,
  FaLock,
} from "react-icons/fa";
import PropTypes from "prop-types";
import ReviewsSection from "../Reviews/ReviewSection";
// adjust path as needed
import { toast } from "sonner"; // or your notification lib
import { useAddReviewMutation } from "@/features/api/purchaseApi";
import AddReviewForm from "../Reviews/AddReviewform";

// Import the CircularProgress component
const CircularProgress = ({ percent }) => {
  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

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
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="text-sm mt-2">{percent}% completed</div>
    </div>
  );
};

const MainContent = ({ courseData, selectedLecture, progress = [], onLectureViewed }) => { // Receive onLectureViewed here
  const [selectedTab, setSelectedTab] = React.useState("overview");
  const [reviewText, setReviewText] = React.useState("");
  const [questionText, setQuestionText] = React.useState("");
  const [submitReview, { isLoading: isSubmitting }] = useAddReviewMutation();
  const [rating, setRating] = React.useState(5); // Add a rating state if needed

  if (!courseData) return <div>Loading...</div>;

  const { course, purchaseStatus, allowReview } = courseData;

  // Fallbacks for missing data
  const ratings = course.ratings || 0;
  const numOfReviews = course.numOfReviews || 0;
  const studentCount = course.enrolledStudents
    ? course.enrolledStudents.length
    : 0;
  const language = course.language || "N/A";
  const level = course.level || "N/A";
  const price = course.price?.current ? `Rs${course.price.current}` : "N/A";
  const instructor = course.creator || {};
  const instructorName = instructor.name || "Unknown Instructor";
  const instructorHeadline = instructor.headline || "";
  const instructorPhoto =
    instructor.photoUrl || "https://via.placeholder.com/100";
  const instructorLinks = instructor.links || {};
  const totalDurationInSeconds
    = course.totalDurationInSeconds || 0 ;

  // Handlers for form submissions (replace with your logic)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText || !rating) {
      toast.error("Please provide both a rating and a comment.");
      return;
    }
    try {
      await submitReview({
        courseId: course._id,
        rating,           // <-- must be a number
        comment: reviewText, // <-- must be a string
      }).unwrap();
      toast.success("Review submitted!");
      setReviewText("");
      setRating(5);
      // Optionally, refetch reviews here if not using RTK Query tags
    } catch (err) {
      toast.error("Failed to submit review.");
    }
  };
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    // Submit questionText
    setQuestionText("");
  };

  // Helper to format duration in seconds to HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Helper to format total duration in seconds to "Xh Ym"
  const formatTotalDuration = (seconds) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Show selected lecture video or fallback image
  const videoUrl = selectedLecture?.videoUrl;
  const lectureTitle = selectedLecture?.title || "Select a lecture";

  // After you have course, progress, etc.
  const totalLectures = course.sections.reduce(
    (sum, section) => sum + (section.lectures?.length || 0),
    0
  );
  const viewedLectures = progress?.filter(lp => lp.viewed).length || 0;
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
        const isViewed = (Array.isArray(progress) ? progress : []).some(
          lp => lp.lectureId === lecture._id && lp.viewed
        );
        return lectureSum + (isViewed ? (lecture.durationInSeconds || 0) : 0);
      }, 0) || 0),
    0
  );

  const percent = totalDuration > 0 ? Math.round((watchedDuration / totalDuration) * 100) : 0;

  return (
    <main className="flex-grow bg-white p-6 md:p-10">
      {/* Video Player */}
      <div className="relative bg-black w-full" style={{ paddingTop: "56.25%" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full h-full max-h-96 bg-black"
              poster={course.thumbnail}
              onPlay={() => onLectureViewed && selectedLecture && onLectureViewed(selectedLecture._id)} // Now this will work
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <>
              <img src={course.thumbnail} alt={course.title} className="h-16" />
              <div className="text-white mt-2">{lectureTitle}</div>
            </>
          )}
        </div>
      </div>

      <CircularProgress percent={percent} />

      {/* Navigation Tabs */}
      <div className="mt-4 border-b border-gray-200">
        <nav className="flex space-x-8 -mb-px">
          <button
            className={`py-4 px-1 border-b-2 text-sm font-semibold ${
              selectedTab === "overview"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400"
            }`}
            onClick={() => setSelectedTab("overview")}
          >
            Overview
          </button>
          <button
            className={`py-4 px-1 border-b-2 text-sm font-semibold ${
              selectedTab === "qna"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400"
            }`}
            onClick={() => setSelectedTab("qna")}
          >
            Q&amp;A
          </button>
          <button
            className={`py-4 px-1 border-b-2 text-sm font-semibold ${
              selectedTab === "reviews"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-400"
            }`}
            onClick={() => setSelectedTab("reviews")}
          >
            Reviews
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="mt-8 max-w-4xl">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-lg mt-2 text-gray-700">{course.subtitles}</p>

          <div className="flex items-center space-x-4 mt-3 text-sm">
            <div className="flex items-center">
              <span className="font-bold text-orange-500 mr-1">{ratings}</span>
              <FaStar className="text-orange-400" />
            </div>
            <span className="text-blue-600 underline">
              {numOfReviews} ratings
            </span>
            <span>{studentCount} students</span>
            <span>
              {/* Price: <strong>{price}</strong> */}
            </span>
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
              <span className="font-semibold">Video:</span> {totalLectures} lectures
            </div>
            <div>
              <span className="font-semibold">Total Duration:</span>{" "}
              {formatDuration(totalDurationInSeconds)}
            </div>
            <div>
              <span className="font-semibold">Captions:</span> Yes
            </div>
          </div>

          {/* --- Description --- */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <p className="text-gray-800 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* --- Instructor --- */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Instructor</h2>
            <div className="flex items-start">
              <img
                src={instructorPhoto}
                alt="Instructor"
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
                      className="p-2 border border-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <FaFacebookF />
                    </a>
                  )}
                  {instructorLinks.linkedin && (
                    <a
                      href={instructorLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <FaLinkedinIn />
                    </a>
                  )}
                  {instructorLinks.website && (
                    <a
                      href={instructorLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-gray-700 rounded-full hover:bg-gray-100"
                    >
                      <FaLink />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- Progress Bar --- */}
        
        </div>
      )}

      {selectedTab === "qna" && (
        <div className="mt-8 max-w-2xl">
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
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {selectedTab === "reviews" && (
        <div className="mt-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Write a Review</h2>
          {allowReview ? (
            <AddReviewForm courseId={course._id} />
          ) : (
            <div className="text-gray-500">
              You must purchase the course to write a review.
            </div>
          )}
          <div className="mt-10">
            <ReviewsSection reviews={course?.reviews || []} />
          </div>
        </div>
      )}
    </main>
  );
};

MainContent.propTypes = {
  courseData: PropTypes.shape({
    course: PropTypes.object.isRequired,
    purchaseStatus: PropTypes.string,
    allowReview: PropTypes.bool,
    progress: PropTypes.arrayOf(
      PropTypes.shape({
        viewed: PropTypes.bool,
        // add other properties of progress items if needed
      })
    ),
  }),
  onLectureViewed: PropTypes.func.isRequired, // Add prop type validation
};

export default MainContent;