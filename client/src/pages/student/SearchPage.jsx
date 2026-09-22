import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  HelpCircle,
  Code2,
  FileEdit,
  Users,
  ChevronDown,
  X,
  Star,
  Check,
  RotateCcw,
  AlertCircle,
  LayoutGrid,
  List,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetSearchCourseQuery, useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import LoadingSpinner from "@/components/LoadingSpinner";
import SearchCourseCard from "./SearchCourseCard";
import SearchResult from "./SearchResult";

const SORT_OPTIONS = [
  { label: "Most Relevant", value: "relevant" },
  { label: "Highest Rated", value: "rating" },
  { label: "Most Reviewed", value: "reviews" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "low" },
  { label: "Price: High to Low", value: "high" },
];

const RATINGS_OPTIONS = [
  { label: "4.5 & up", value: 4.5 },
  { label: "4.0 & up", value: 4.0 },
  { label: "3.5 & up", value: 3.5 },
  { label: "3.0 & up", value: 3.0 },
];

const LEVEL_OPTIONS = ["All Levels", "Beginner", "Intermediate", "Expert"];
const LANGUAGE_OPTIONS = ["English", "Nepali", "Hindi", "Spanish"];
const PRICE_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Free", value: "free" },
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("relevant");
  const [minRating, setMinRating] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedPriceType, setSelectedPriceType] = useState(null);
  
  // Feature toggle pills
  const [filterQuizzes, setFilterQuizzes] = useState(false);
  const [filterCoding, setFilterCoding] = useState(false);
  const [filterPractice, setFilterPractice] = useState(false);
  const [filterRolePlay, setFilterRolePlay] = useState(false);

  // Drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' (default matching screenshot) or 'list'

  // Categories list
  const { data: catData } = useGetAllCategoriesQuery();
  const allCategories = useMemo(
    () => (catData?.categories || []).map((c) => c.name),
    [catData]
  );

  // Search API query
  const { data, isLoading, isError } = useGetSearchCourseQuery({
    searchQuery: query,
    categories: selectedCategories,
    sortByPrice: sortBy === "low" || sortBy === "high" ? sortBy : "",
  });

  // Client-side refinement based on filters
  const filteredCourses = useMemo(() => {
    let courses = data?.courses || [];

    if (minRating) {
      courses = courses.filter(
        (c) => (c.ratings ?? c.rating ?? 4.5) >= minRating
      );
    }

    if (selectedLevel && selectedLevel !== "All Levels") {
      courses = courses.filter(
        (c) => c.level?.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    if (selectedLanguage) {
      courses = courses.filter((c) => {
        const lang = c.language || "English";
        return lang.toLowerCase() === selectedLanguage.toLowerCase();
      });
    }

    if (selectedPriceType === "free") {
      courses = courses.filter(
        (c) => (c.price?.current ?? c.coursePrice ?? 0) === 0
      );
    } else if (selectedPriceType === "paid") {
      courses = courses.filter(
        (c) => (c.price?.current ?? c.coursePrice ?? 0) > 0
      );
    }

    // Feature filters
    if (filterPractice) {
      courses = courses.filter(
        (c) => c.isPracticeExam || c.title?.toLowerCase().includes("practice") || c.subtitle?.toLowerCase().includes("exam")
      );
    }

    // Sort order
    if (sortBy === "rating") {
      courses = [...courses].sort(
        (a, b) => (b.ratings ?? b.rating ?? 0) - (a.ratings ?? a.rating ?? 0)
      );
    } else if (sortBy === "reviews") {
      courses = [...courses].sort(
        (a, b) => (b.numOfReviews ?? b.numRatings ?? 0) - (a.numOfReviews ?? a.numRatings ?? 0)
      );
    } else if (sortBy === "newest") {
      courses = [...courses].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    return courses;
  }, [
    data,
    minRating,
    selectedLevel,
    selectedLanguage,
    selectedPriceType,
    filterPractice,
    sortBy,
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = selectedCategories.length;
    if (minRating) count++;
    if (selectedLevel) count++;
    if (selectedLanguage) count++;
    if (selectedPriceType) count++;
    if (filterQuizzes) count++;
    if (filterCoding) count++;
    if (filterPractice) count++;
    if (filterRolePlay) count++;
    return count;
  }, [
    selectedCategories,
    minRating,
    selectedLevel,
    selectedLanguage,
    selectedPriceType,
    filterQuizzes,
    filterCoding,
    filterPractice,
    filterRolePlay,
  ]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setMinRating(null);
    setSelectedLevel(null);
    setSelectedLanguage(null);
    setSelectedPriceType(null);
    setFilterQuizzes(false);
    setFilterCoding(false);
    setFilterPractice(false);
    setFilterRolePlay(false);
    setSortBy("relevant");
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white text-[#2d2f31]">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Header & Result Query Notice */}
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#2d2f31] tracking-tight">
            {query ? `${filteredCourses.length} results for "${query}"` : "Explore All Courses"}
          </h1>
        </div>

        {/* 2. Filter Pills Row Matching Udemy Screenshot */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-4 mb-6">
          {/* Left: Scrollable Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1">
            {/* All Filters Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                activeFiltersCount > 0
                  ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                  : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>All filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-[#a435f0] text-white text-[11px] font-semibold h-5 w-5 rounded-full flex items-center justify-center ml-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Quick Feature Pills */}
            <button
              type="button"
              onClick={() => setFilterQuizzes(!filterQuizzes)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                filterQuizzes
                  ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                  : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
              }`}
            >
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <span>Quizzes</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterCoding(!filterCoding)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                filterCoding
                  ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                  : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
              }`}
            >
              <Code2 className="w-4 h-4 text-gray-500" />
              <span>Coding Exercises</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterPractice(!filterPractice)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                filterPractice
                  ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                  : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
              }`}
            >
              <FileEdit className="w-4 h-4 text-gray-500" />
              <span>Practice Tests</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterRolePlay(!filterRolePlay)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                filterRolePlay
                  ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                  : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
              }`}
            >
              <Users className="w-4 h-4 text-gray-500" />
              <span>Role Plays</span>
            </button>

            {/* Language Dropdown Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                    selectedLanguage
                      ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                      : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
                  }`}
                >
                  <span>{selectedLanguage || "Language"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white border border-gray-200 shadow-xl rounded-md p-1">
                <DropdownMenuItem
                  onClick={() => setSelectedLanguage(null)}
                  className="text-[14px] cursor-pointer"
                >
                  All Languages
                </DropdownMenuItem>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className="text-[14px] cursor-pointer flex items-center justify-between"
                  >
                    <span>{lang}</span>
                    {selectedLanguage === lang && <Check className="w-4 h-4 text-[#a435f0]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Ratings Dropdown Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                    minRating
                      ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                      : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
                  }`}
                >
                  <span>{minRating ? `${minRating} & up` : "Ratings"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white border border-gray-200 shadow-xl rounded-md p-1">
                <DropdownMenuItem
                  onClick={() => setMinRating(null)}
                  className="text-[14px] cursor-pointer"
                >
                  All Ratings
                </DropdownMenuItem>
                {RATINGS_OPTIONS.map((r) => (
                  <DropdownMenuItem
                    key={r.value}
                    onClick={() => setMinRating(r.value)}
                    className="text-[14px] cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#b4690e] text-[#b4690e]" />
                      <span>{r.label}</span>
                    </div>
                    {minRating === r.value && <Check className="w-4 h-4 text-[#a435f0]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Level Dropdown Pill */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[14px] font-semibold shrink-0 transition-all ${
                    selectedLevel
                      ? "border-[#2d2f31] bg-[#2d2f31] text-white"
                      : "border-gray-300 text-[#2d2f31] hover:bg-gray-50"
                  }`}
                >
                  <span>{selectedLevel || "Level"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white border border-gray-200 shadow-xl rounded-md p-1">
                <DropdownMenuItem
                  onClick={() => setSelectedLevel(null)}
                  className="text-[14px] cursor-pointer"
                >
                  All Levels
                </DropdownMenuItem>
                {LEVEL_OPTIONS.map((lvl) => (
                  <DropdownMenuItem
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className="text-[14px] cursor-pointer flex items-center justify-between"
                  >
                    <span>{lvl}</span>
                    {selectedLevel === lvl && <Check className="w-4 h-4 text-[#a435f0]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[13px] font-semibold text-[#a435f0] hover:text-[#8710d8] px-2 py-1 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Sort By Dropdown & View Mode Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[14px] font-semibold text-[#2d2f31] hover:text-[#a435f0] transition-colors"
                >
                  <span>{SORT_OPTIONS.find((s) => s.value === sortBy)?.label || "Most Relevant"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-xl rounded-md p-1 z-50">
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className="text-[14px] cursor-pointer flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="w-4 h-4 text-[#a435f0]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex items-center border border-gray-300 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-gray-100 text-[#1c1d1f]" : "text-gray-400 hover:text-gray-700"}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-gray-100 text-[#1c1d1f]" : "text-gray-400 hover:text-gray-700"}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Main Course Grid View (3 Columns matching Screenshot) */}
        {filteredCourses.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <SearchCourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <SearchResult key={course._id} course={course} />
              ))}
            </div>
          )
        ) : (
          <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-200 p-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-2xl font-semibold text-[#2d2f31] mb-1">
              No results found for "{query}"
            </h3>
            <p className="text-gray-600 text-[14px] max-w-md mx-auto mb-6">
              Try checking for spelling errors, adjusting your keyword, or clearing some active filters.
            </p>
            {activeFiltersCount > 0 ? (
              <Button
                onClick={clearAllFilters}
                className="bg-[#2d2f31] hover:bg-black text-white font-semibold px-6 py-2 rounded-sm text-[14px]"
              >
                Clear all filters
              </Button>
            ) : (
              <Link to="/course/search">
                <Button className="bg-[#a435f0] hover:bg-[#8710d8] text-white font-semibold px-6 py-2 rounded-sm text-[14px]">
                  Browse all courses
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 4. "All Filters" Sliding Sheet / Drawer */}
      <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto bg-white p-6">
          <SheetHeader className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-semibold text-[#2d2f31]">
                All Filters
              </SheetTitle>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[13px] font-semibold text-[#a435f0] hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </SheetHeader>

          <div className="space-y-6 text-left">
            {/* Ratings */}
            <div>
              <h4 className="font-semibold text-[15px] text-[#2d2f31] mb-3">Ratings</h4>
              <div className="space-y-2">
                {RATINGS_OPTIONS.map((r) => (
                  <label
                    key={r.value}
                    onClick={() => setMinRating(minRating === r.value ? null : r.value)}
                    className="flex items-center gap-3 cursor-pointer text-[14px] text-gray-700 hover:text-black"
                  >
                    <input
                      type="radio"
                      name="drawer_rating"
                      checked={minRating === r.value}
                      onChange={() => {}}
                      className="accent-[#a435f0] w-4 h-4"
                    />
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#b4690e] text-[#b4690e]" />
                      <span className="font-normal">{r.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Categories */}
            <div>
              <h4 className="font-semibold text-[15px] text-[#2d2f31] mb-3">Topic & Category</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {allCategories.map((cat) => (
                  <label
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    className="flex items-center gap-3 cursor-pointer text-[14px] text-gray-700 hover:text-black"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => {}}
                      className="accent-[#a435f0] w-4 h-4 rounded"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Level */}
            <div>
              <h4 className="font-semibold text-[15px] text-[#2d2f31] mb-3">Level</h4>
              <div className="space-y-2">
                {LEVEL_OPTIONS.map((lvl) => (
                  <label
                    key={lvl}
                    onClick={() => setSelectedLevel(selectedLevel === lvl ? null : lvl)}
                    className="flex items-center gap-3 cursor-pointer text-[14px] text-gray-700 hover:text-black"
                  >
                    <input
                      type="radio"
                      name="drawer_level"
                      checked={selectedLevel === lvl}
                      onChange={() => {}}
                      className="accent-[#a435f0] w-4 h-4"
                    />
                    <span>{lvl}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Price */}
            <div>
              <h4 className="font-semibold text-[15px] text-[#2d2f31] mb-3">Price</h4>
              <div className="space-y-2">
                {PRICE_OPTIONS.map((p) => (
                  <label
                    key={p.value}
                    onClick={() => setSelectedPriceType(selectedPriceType === p.value ? null : p.value)}
                    className="flex items-center gap-3 cursor-pointer text-[14px] text-gray-700 hover:text-black"
                  >
                    <input
                      type="radio"
                      name="drawer_price"
                      checked={selectedPriceType === p.value}
                      onChange={() => {}}
                      className="accent-[#a435f0] w-4 h-4"
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-2">
              <Button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full bg-[#1c1d1f] hover:bg-black text-white font-semibold h-11 text-[14px] rounded-sm"
              >
                Show {filteredCourses.length} results
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SearchPage;