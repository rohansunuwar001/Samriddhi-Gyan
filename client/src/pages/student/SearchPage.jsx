import React, { useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import Filter from "./Filter";
import SearchResult from "./SearchResult";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGetSearchCourseQuery } from "@/features/api/courseApi";
import LoadingSpinner from "@/components/LoadingSpinner";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortByPrice, setSortByPrice] = useState("");

  const { data, isLoading, isError } = useGetSearchCourseQuery({
    searchQuery: query,
    categories: selectedCategories,
    sortByPrice
  });

  const isEmpty = !isLoading && !isError && data?.courses?.length === 0;

  const handleFilterChange = useCallback((categories, price) => {
    setSelectedCategories(categories);
    setSortByPrice(price);
  }, []);

  const renderContent = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, idx) => (
        <CourseSkeleton key={`skeleton-${idx}`} />
      ));
    }

    if (isError) {
      return <ErrorState />;
    }

    if (isEmpty) {
      return <CourseNotFound searchQuery={query} />;
    }

    return data?.courses?.map((course) => (
      <SearchResult key={`course-${course._id}`} course={course} />
    ));
  }, [isLoading, isError, isEmpty, data, query]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <header className="my-6 space-y-2">
        <h1 className="font-normal text-2xl md:text-3xl">
          Search results for "{query}"
        </h1>
        {query && (
          <p className="text-gray-600 dark:text-gray-400">
            Showing results for{" "}
            <span className="text-blue-600 dark:text-blue-400 font-normal italic">
              {query}
            </span>
          </p>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        <aside className="w-full md:w-64 flex-shrink-0">
          <Filter 
            handleFilterChange={handleFilterChange} 
            selectedCategories={selectedCategories}
            currentSort={sortByPrice}
          />
        </aside>
        
        <main className="flex-1">
          <div className="space-y-4">
            {renderContent}
          </div>
        </main>
      </div>
    </div>
  );
};

const CourseNotFound = ({ searchQuery }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 dark:bg-gray-900 p-6 rounded-lg bg-gray-50">
      <AlertCircle className="text-red-500 h-16 w-16 mb-4" />
      <h1 className="font-normal text-3xl md:text-5xl text-gray-800 dark:text-gray-200 mb-2 text-center">
        {searchQuery ? "No courses found" : "Search for courses"}
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-4 text-center">
        {searchQuery 
          ? `We couldn't find any courses matching "${searchQuery}"`
          : "Try searching for topics, categories, or instructors"}
      </p>
      <Link to="/courses">
        <Button variant="default" className="gap-2">
          Browse Popular Courses
        </Button>
      </Link>
    </div>
  );
};

const ErrorState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 dark:bg-gray-900 p-6 rounded-lg bg-gray-50">
      <AlertCircle className="text-red-500 h-16 w-16 mb-4" />
      <h1 className="font-normal text-3xl md:text-5xl text-gray-800 dark:text-gray-200 mb-2">
        Error Loading Results
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
        We encountered an issue while loading search results.
      </p>
      <Button 
        variant="default" 
        onClick={() => window.location.reload()}
        className="gap-2"
      >
        Try Again
      </Button>
    </div>
  );
};

const CourseSkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 last:border-0">
      <Skeleton className="aspect-video w-full md:w-64 rounded-lg" />
      
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      <div className="flex md:flex-col justify-between items-start md:items-end">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
};

export default SearchPage;