import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  PlusCircle,
  Search,
  ChevronDown,
  Loader2,
  BookOpen,
  Package,
  Info,
  X,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { useGetCreatorCourseQuery, useRemoveCourseMutation } from "@/features/api/courseApi";
import LoadingSpinner from "@/components/LoadingSpinner";

/* ─────────── helpers ─────────── */
const SORT_OPTIONS = ["Newest", "Oldest", "A–Z", "Z–A"];

function completionPercent(course) {
  // Estimate based on fields filled: title, thumbnail, price, description, lectures
  let score = 0;
  if (course.title) score += 20;
  if (course.courseThumbnail) score += 20;
  if (course.coursePrice ?? course.price?.current) score += 20;
  if (course.description) score += 20;
  if ((course.totalLectures || 0) > 0) score += 20;
  return score;
}

/* ─────────── CourseThumbnail ─────────── */
function CourseThumbnail({ src, alt, large = false }) {
  const w = large ? "w-[120px]" : "w-[88px]";
  const h = large ? "h-[76px]" : "h-[56px]";
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${w} ${h} object-cover rounded`}
      />
    );
  }
  return (
    <div className={`${w} ${h} rounded bg-[#d1d7dc] flex flex-col items-center justify-center gap-1 shrink-0`}>
      <div className="flex gap-1">
        <div className="w-6 h-6 bg-[#b4b8bd] rounded-sm flex items-center justify-center">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
        <div className="w-6 h-6 bg-[#b4b8bd] rounded-sm flex items-center justify-center">
          <ImageIcon className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─────────── CourseRow ─────────── */
function CourseRow({ course, index, navigate, onDelete, isDeleting }) {
  const pct = completionPercent(course);
  const isPublished = course.isPublished;

  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-5 border border-[#d1d7dc] bg-white px-6 py-5 cursor-pointer transition-colors min-h-[96px]"
      style={{ backgroundColor: hovered ? "#f7f9fa" : "#fff" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`${course._id}`)}
    >
      {/* Thumbnail — bigger */}
      <div className="shrink-0">
        <CourseThumbnail src={course.courseThumbnail} alt={course.title} large />
      </div>

      {/* Title + DRAFT Public */}
      <div className="min-w-0 w-52 shrink-0">
        <p
          className="font-normal text-[#1c1d1f] text-lg leading-snug truncate"
          style={{ opacity: hovered ? 0.45 : 1 }}
        >
          {course.title}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-base text-[#6a6f73] uppercase font-normal tracking-wide">
            {isPublished ? "Published" : "Draft"}
          </span>
          <span className="text-base font-normal text-[#1c1d1f]">
            {course.courseLevel || "Public"}
          </span>
        </div>
      </div>

      {/* Middle: progress bar OR hover link */}
      <div className="flex-1 min-w-0 flex items-center">
        {hovered ? (
          /* Hover state: show Edit / manage course text */
          <span
            className="text-xl font-normal text-[#5624d0] whitespace-nowrap"
            onClick={(e) => { e.stopPropagation(); navigate(`${course._id}`); }}
          >
            Edit / manage course
          </span>
        ) : (
          /* Default: show progress bar */
          <div className="flex items-center gap-4 w-full">
            <span className="text-base text-[#6a6f73] whitespace-nowrap shrink-0">
              {pct < 100 ? "Finish your course" : "Course complete"}
            </span>
            <div className="flex-1 bg-[#d1d7dc] rounded-full h-1.5">
              <div
                className="bg-[#5624d0] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete — only show when NOT hovered */}
      {!hovered && (
        <div
          className="flex items-center shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="text-base text-red-500 font-normal border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
            onClick={() => onDelete(course._id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────── Course Bundles placeholder ─────────── */
function CourseBundles({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Illustration */}
      <div className="mb-8 w-[340px] bg-[#f7f9fa] rounded-lg border border-[#d1d7dc] p-5 select-none">
        <p className="text-lg font-normal text-[#1c1d1f] mb-3">Bundle title</p>
        <div className="space-y-2">
          {/* item 1 */}
          <div className="flex items-center gap-3 bg-white border border-[#d1d7dc] rounded p-2">
            <div className="w-10 h-10 bg-[#d1d7dc] rounded flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-[#9ea5ad] fill-[#9ea5ad]" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 bg-[#d1d7dc] rounded w-3/4" />
              <div className="h-2 bg-[#d1d7dc] rounded w-1/2" />
            </div>
          </div>
          {/* divider with + */}
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#b4b8bd] flex items-center justify-center">
              <PlusCircle className="w-3 h-3 text-[#b4b8bd]" />
            </div>
          </div>
          {/* item 2 */}
          <div className="flex items-center gap-3 bg-white border border-[#d1d7dc] rounded p-2">
            <div className="w-10 h-10 bg-[#d1d7dc] rounded flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-[#9ea5ad] fill-[#9ea5ad]" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 bg-[#d1d7dc] rounded w-full" />
              <div className="h-2 bg-[#d1d7dc] rounded w-2/3" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <span className="text-base text-[#6a6f73]">Total:</span>
            <div className="h-2 w-10 bg-[#d1d7dc] rounded" />
          </div>
          <div className="px-3 py-1 bg-[#5624d0] rounded text-[10px] text-white font-normal">
            Add all to cart
          </div>
        </div>
      </div>

      {/* CTA text */}
      <p className="text-xl font-normal text-[#1c1d1f] mb-2">
        Create your first course bundle
      </p>
      <p className="text-lg text-[#6a6f73] text-center max-w-xs mb-6">
        Curate and combine your courses to increase the{" "}
        <span className="text-[#5624d0]">visibility</span> of your courses.
      </p>

      {/* Create button */}
      <button
        className="flex items-center gap-2 bg-[#5624d0] hover:bg-[#4019a4] text-white font-normal text-lg px-6 py-3 rounded transition-colors"
        onClick={() => toast.success("Course bundle creation coming soon!")}
      >
        <PlusCircle className="w-4 h-4" />
        Create course bundle
      </button>
    </div>
  );
}

/* ─────────── Main Component ─────────── */
let CourseTable = () => {
  const { data, isLoading, isError, refetch } = useGetCreatorCourseQuery();
  const [removeCourse, { isLoading: isRemoving }] = useRemoveCourseMutation();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("courses"); // "courses" | "bundles"
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [appBannerDismissed, setAppBannerDismissed] = useState(false);

  const handleDelete = async (courseId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the course.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        setDeletingId(courseId);
        await removeCourse(courseId).unwrap();
        toast.success("Course removed!");
        refetch();
      } catch {
        toast.error("Failed to remove course.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const courses = useMemo(() => {
    let list = data?.courses || [];
    if (search.trim()) {
      list = list.filter((c) =>
        c.title?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sort === "Newest") list = [...list].reverse();
    if (sort === "Oldest") {
      // keep original order
    }
    if (sort === "A–Z") list = [...list].sort((a, b) => a.title?.localeCompare(b.title));
    if (sort === "Z–A") list = [...list].sort((a, b) => b.title?.localeCompare(a.title));
    return list;
  }, [data, search, sort]);

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <div className="text-center text-red-500 py-10">
        Failed to load courses. Please try again.
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="px-8 pt-8 pb-0">
        <h1 className="text-5xl font-normal text-[#1c1d1f] mb-6">Courses</h1>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#d1d7dc]">
          {["courses", "bundles"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-3 text-lg font-normal capitalize transition-colors ${
                activeTab === tab
                  ? "text-[#1c1d1f] border-b-2 border-[#1c1d1f] -mb-px"
                  : "text-[#6a6f73] hover:text-[#1c1d1f]"
              }`}
            >
              {tab === "courses" ? "Courses" : "Course bundles"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "courses" ? (
        <div className="px-8 pt-6 pb-12">
          {/* App suggestion banner */}
          {!appBannerDismissed && (
            <div className="flex items-start gap-4 border border-[#d1d7dc] rounded p-4 mb-6">
              <Info className="w-5 h-5 text-[#5624d0] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-lg font-normal text-[#1c1d1f]">
                  Get a better mobile experience with the Skillera app.
                </p>
                <p className="text-base text-[#5624d0] mt-0.5">
                  View key course metrics, reply to your students, and get instant
                  notifications.
                </p>
                <div className="flex gap-3 mt-3">
                  <button className="text-base font-normal border border-[#1c1d1f] px-3 py-1.5 rounded hover:bg-[#f7f9fa] transition-colors text-[#1c1d1f]">
                    Get the app
                  </button>
                  <button
                    className="text-base font-normal text-[#1c1d1f] hover:underline"
                    onClick={() => setAppBannerDismissed(true)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                className="text-[#6a6f73] hover:text-[#1c1d1f]"
                onClick={() => setAppBannerDismissed(true)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Toolbar: search + sort + new course */}
          <div className="flex items-center gap-3 mb-6">
            {/* Search */}
            <div className="flex items-center border border-[#d1d7dc] rounded overflow-hidden">
              <input
                type="text"
                placeholder="Search your courses"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 text-lg text-[#1c1d1f] outline-none w-48 bg-white"
              />
              <button className="px-3 py-2 bg-[#f7f9fa] border-l border-[#d1d7dc] hover:bg-[#ebebeb] transition-colors">
                <Search className="w-4 h-4 text-[#1c1d1f]" />
              </button>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 border border-[#5624d0] text-[#5624d0] text-lg font-normal px-3 py-2 rounded hover:bg-[#f0e6ff] transition-colors"
                onClick={() => setSortOpen(!sortOpen)}
              >
                {sort}
                <ChevronDown className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d7dc] shadow-lg rounded z-10 min-w-[140px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      className={`w-full text-left px-4 py-2 text-lg hover:bg-[#f7f9fa] transition-colors ${
                        sort === opt ? "font-normal text-[#5624d0]" : "text-[#1c1d1f]"
                      }`}
                      onClick={() => {
                        setSort(opt);
                        setSortOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* New course button */}
            <button
              className="flex items-center gap-2 bg-[#5624d0] hover:bg-[#4019a4] text-white font-normal text-lg px-5 py-2.5 rounded transition-colors"
              onClick={() => navigate("create")}
            >
              New course
            </button>
          </div>

          {/* Course rows */}
          {courses.length > 0 ? (
            <div className="space-y-3">
              {courses.map((course, index) => (
                <CourseRow
                  key={course._id}
                  course={course}
                  index={index}
                  navigate={navigate}
                  onDelete={handleDelete}
                  isDeleting={isRemoving && deletingId === course._id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BookOpen className="w-12 h-12 text-[#d1d7dc] mb-4" />
              <p className="text-2xl font-normal text-[#1c1d1f] mb-1">
                {search ? "No courses match your search" : "You haven't created any courses yet"}
              </p>
              {!search && (
                <button
                  className="mt-4 bg-[#5624d0] hover:bg-[#4019a4] text-white font-normal text-lg px-5 py-2.5 rounded transition-colors"
                  onClick={() => navigate("create")}
                >
                  Create your first course
                </button>
              )}
            </div>
          )}

          {/* Footer hint */}
          {courses.length > 0 && (
            <p className="text-center text-lg text-[#6a6f73] mt-10">
              Based on your experience, we think these resources will be helpful.
            </p>
          )}
        </div>
      ) : (
        <CourseBundles navigate={navigate} />
      )}
    </div>
  );
};

export default CourseTable;