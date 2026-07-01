import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Star, MoreVertical, Share2, ListPlus, Archive, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useArchiveCourseMutation, useUnarchiveCourseMutation } from "@/features/api/authApi";
import { toast } from "sonner";

const MyLearningCourseCard = ({ course, isArchived = false }) => {
  const navigate = useNavigate();
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  const [archiveCourse] = useArchiveCourseMutation();
  const [unarchiveCourse] = useUnarchiveCourseMutation();

  const {
    _id: courseId,
    title,
    thumbnail,
    creator = {},
    progress = 0,
  } = course;

  const instructorName = creator.name || "Unknown Instructor";

  const handleCardClick = () => {
    navigate(`/course-detail/${courseId}/content`);
  };

  const handleRatingStarClick = (star, e) => {
    e.stopPropagation();
    setUserRating(star);
    toast.success(`You rated this course ${star} stars!`);
  };

  const handleArchiveToggle = async (e) => {
    e.stopPropagation();
    try {
      if (isArchived) {
        await unarchiveCourse(courseId).unwrap();
        toast.success("Course unarchived successfully");
      } else {
        await archiveCourse(courseId).unwrap();
        toast.success("Course archived successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white flex flex-col group relative select-none border border-[#d1d7dc] hover:shadow-md transition-all cursor-pointer rounded-none overflow-hidden h-full"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Dropdown Options button */}
        <div className="absolute top-2.5 right-2.5 z-20" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full bg-white/95 hover:bg-white text-[#2d2f31] flex items-center justify-center shadow-md transition-all hover:scale-105 border border-gray-100 outline-none">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-[#d1d7dc] rounded-none p-1 shadow-lg text-[#2d2f31] z-30">
              <DropdownMenuItem className="text-base py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <Share2 className="h-3.5 w-3.5 mr-2" /> Share course
              </DropdownMenuItem>
              <DropdownMenuItem className="text-base py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none">
                <ListPlus className="h-3.5 w-3.5 mr-2" /> Add to lists
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#d1d7dc]" />
              <DropdownMenuItem 
                onClick={handleArchiveToggle}
                className={`text-base py-2 px-3 focus:bg-[#f7f9fa] cursor-pointer font-normal rounded-none ${
                  isArchived ? "text-[#5624d0]" : "text-red-600"
                }`}
              >
                {isArchived ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 mr-2" /> Unarchive course
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5 mr-2" /> Archive course
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-normal text-[#2d2f31] leading-snug line-clamp-2 hover:text-[#5624d0] transition-colors">
            {title}
          </h3>
          <p className="text-base text-[#6a6f73] font-normal truncate">
            {instructorName}
          </p>
        </div>

        {/* Bottom progress indicators */}
        <div className="space-y-2 pt-1">
          {/* Progress bar line */}
          <div className="w-full bg-gray-200 h-1.5 rounded-none overflow-hidden">
            <div 
              className="bg-[#5624d0] h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {progress === 0 ? (
            /* Unstarted Course option */
            <div className="flex justify-between items-center text-base font-normal text-[#5624d0] hover:text-[#3b1990] pt-1">
              <span>START COURSE</span>
            </div>
          ) : (
            /* In-progress course option */
            <div className="flex items-center justify-between gap-2 text-xs text-[#6a6f73]">
              <span className="font-normal text-gray-500">{progress}% complete</span>
              
              {/* Star interactive feedback */}
              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={(e) => handleRatingStarClick(star, e)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    title={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-3 w-3 ${
                        star <= (hoverRating || userRating)
                          ? "fill-[#b4690e] text-[#b4690e]"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-base font-normal text-[#5624d0] ml-1 hover:underline cursor-pointer">
                  Leave a rating
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

MyLearningCourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string.isRequired,
    creator: PropTypes.shape({
      name: PropTypes.string,
    }),
    progress: PropTypes.number,
  }).isRequired,
  isArchived: PropTypes.bool,
};

export default MyLearningCourseCard;
