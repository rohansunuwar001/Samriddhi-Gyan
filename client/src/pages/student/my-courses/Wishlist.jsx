import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetWishlistQuery } from "@/features/api/wishlistApi";
import { Skeleton } from "@/components/ui/skeleton";
import CourseCard from "../CourseCard";
import { Heart } from "lucide-react";

const Wishlist = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetWishlistQuery();

  const wishlistCourses = data?.wishlist || [];

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto my-10 text-center select-none">
        <div className="bg-white border border-[#d1d7dc] p-8 shadow-sm">
          <h2 className="text-base font-normal text-red-600 mb-2">
            Failed to load your wishlist
          </h2>
          <p className="text-sm text-[#6a6f73] mb-5">
            Please try refreshing the page or check your internet connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-3 rounded-none border border-[#d1d7dc] p-4 bg-white shadow-sm">
              <Skeleton className="w-full aspect-video rounded-none bg-gray-200" />
              <Skeleton className="h-4 w-3/4 bg-gray-200" />
              <Skeleton className="h-3 w-1/2 bg-gray-200" />
              <Skeleton className="h-3 w-full bg-gray-200" />
            </div>
          ))}
        </div>
      ) : wishlistCourses.length === 0 ? (
        <div className="bg-white rounded-none border border-[#d1d7dc] p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
          <Heart className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-normal text-[#2d2f31]">
            Your wishlist is empty
          </h3>
          <p className="text-sm text-[#6a6f73] leading-relaxed">
            Explore our course catalog and tap the heart icon to save courses to your wishlist.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate("/courses")}
              className="bg-[#2d2f31] hover:bg-black text-white px-5 py-2.5 text-sm font-normal transition-all"
            >
              Browse Courses
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
