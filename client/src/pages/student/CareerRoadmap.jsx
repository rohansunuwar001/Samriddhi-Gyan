import { useState, useEffect } from "react";
import { Compass, BookOpen, CheckCircle2, Lock, ChevronRight, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "@/app/constant";

const CareerRoadmap = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch list of available categories on load
  useEffect(() => {
    fetch(`${BASE_URL}/api/v1/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setSelectedCategory(data.categories[0].name);
          }
        }
      })
      .catch((err) => console.error("Failed to load categories:", err.message));
  }, []);

  const fetchRoadmap = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${BASE_URL}/api/v1/pathways/career-roadmap?targetCategory=${encodeURIComponent(selectedCategory)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await res.json();
      console.log("Career roadmap response:", data);
      if (data.success) {
        setRoadmap(data.path);
        toast.success(`Roadmap for ${selectedCategory} generated!`);
      } else {
        toast.error(data.message || "Failed to generate learning path.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error generating career path.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex p-3 rounded-full bg-purple-100 text-purple-700">
          <Compass className="h-8 w-8 animate-spin-slow" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          A* Career Skill Roadmap Planner
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Choose your dream technology goal. Our advanced pathfinding algorithm will calculate your optimal prerequisite path.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end mb-12">
        <div className="space-y-2">
          <label htmlFor="target-category" className="text-sm font-semibold text-slate-700">
            Select Your Target Career Goal
          </label>
          <select
            id="target-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-11 px-4 border border-slate-300 rounded-lg text-slate-800 bg-white focus:border-purple-600 outline-none"
          >
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name} Developer
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={fetchRoadmap}
          disabled={loading || !selectedCategory}
          className="h-11 px-6 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Calculating Path...
            </>
          ) : (
            "Generate Learning Path"
          )}
        </Button>
      </div>

      {/* Pathway Display */}
      {roadmap ? (
        <div className="relative border-l-2 border-dashed border-purple-300 ml-6 pl-10 space-y-12">
          {roadmap.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No courses matching this category are currently available. Check back soon!
            </div>
          ) : (
            roadmap.map((course, idx) => {
              const isLocked = idx > 0 && !roadmap[idx - 1].isCompleted && !course.isCompleted;

              return (
                <div key={course._id} className="relative group">
                  {/* Timeline bullet */}
                  <span
                    className={`absolute -left-[54px] top-1.5 flex h-10 w-10 items-center justify-center rounded-full border-4 bg-white shadow-sm transition-all ${
                      course.isCompleted
                        ? "border-green-500 text-green-500"
                        : isLocked
                        ? "border-slate-300 text-slate-400"
                        : "border-purple-600 text-purple-600 animate-pulse"
                    }`}
                  >
                    {course.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 fill-current bg-white rounded-full" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </span>

                  {/* Course Node Card */}
                  <div
                    onClick={() => navigate(`/course-detail/${course._id}`)}
                    className={`border p-6 rounded-xl cursor-pointer transition-all shadow-sm ${
                      course.isCompleted
                        ? "bg-green-50/20 border-green-200 hover:bg-green-50/40"
                        : isLocked
                        ? "bg-slate-50/40 border-slate-200 opacity-70 hover:opacity-100"
                        : "bg-white border-purple-200 hover:border-purple-400 shadow-md scale-[1.01]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                            course.isCompleted
                              ? "bg-green-100 text-green-800"
                              : isLocked
                              ? "bg-slate-100 text-slate-600"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          Step {idx + 1}: {course.category}
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 leading-snug group-hover:text-purple-700">
                          {course.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Estimated Learning Duration: {course.durationInHours} hours
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-purple-600 font-bold text-sm">
                        <span>Details</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {roadmap.length > 0 && roadmap.every((c) => c.isCompleted) && (
            <div className="relative group text-center border-2 border-double border-green-200 bg-green-50/10 p-8 rounded-xl shadow-sm flex flex-col items-center gap-3">
              <Award className="h-12 w-12 text-yellow-600" />
              <h3 className="text-2xl font-extrabold text-slate-900">Career Goal Achieved!</h3>
              <p className="text-slate-600 max-w-sm">
                You have completed all prerequisite steps in the {selectedCategory} developer learning roadmap!
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-slate-200 bg-slate-50/50 p-12 rounded-xl text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Learning Path Generated Yet</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Choose a target category from the dropdown above and click generate to compute your custom roadmap.
          </p>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmap;
