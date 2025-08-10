// pages/WishList/WishList.jsx

import { Button } from "@/components/ui/button"; // Assuming this is from shadcn/ui
import { useGetWishlistQuery, useRemoveFromWishlistMutation } from "@/features/api/wishlistApi";
import { Loader2, HeartCrack } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner"; // Using a toast library for better UX

const WishList = () => {
  // The 'data' object is automatically updated by RTK Query now
  const { data: wishlistData, isLoading, isError } = useGetWishlistQuery();
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();

  const handleRemove = async (courseId) => {
    try {
      await removeFromWishlist(courseId).unwrap(); // .unwrap() will throw an error on failure
      toast.success("Course removed from wishlist!");
    } catch (error) {
      toast.error("Failed to remove course. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="animate-spin h-10 w-10 text-gray-500" />
      </div>
    );
  }

  if (isError || !wishlistData) {
    return (
      <div className="text-center min-h-[300px] flex flex-col justify-center items-center">
         <HeartCrack className="h-12 w-12 text-red-500 mb-4" />
         <h3 className="text-xl font-semibold">Something went wrong</h3>
         <p>We couldn't load your wishlist. Please try again later.</p>
      </div>
    )
  }

  const { wishlist } = wishlistData;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-gray-600">The courses you're dreaming of learning.</p>
      </div>

      {wishlist?.length === 0 ? (
        <div className="text-center min-h-[300px] flex flex-col justify-center items-center">
            <HeartCrack className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold">Your Wishlist is Empty</h3>
            <p className="text-gray-500 mb-4">Looks like you haven't added any courses yet.</p>
            <Link to="/courses">
                <Button>Explore Courses</Button>
            </Link>
        </div>

      ) : (
        <ul className="space-y-4">
          {wishlist?.map((course) => (
            <li 
              key={course._id} 
              className="flex flex-col md:flex-row items-start md:items-center justify-between border rounded-lg p-4 transition-shadow hover:shadow-md"
            >
              <Link to={`/course-detail/${course._id}`} className="flex items-center space-x-4 mb-4 md:mb-0">
                  <img src={course.thumbnail || '/placeholder.jpg'} alt={course.title} className="w-24 h-16 object-cover rounded-md" />
                  <div>
                      <h4 className="font-semibold text-lg hover:text-blue-600">{course.title}</h4>
                      <p className="text-sm text-gray-500">By {course.instructor?.name || 'Instructor'}</p>
                  </div>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                disabled={isRemoving}
                onClick={() => handleRemove(course._id)}
              >
                {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WishList;