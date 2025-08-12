import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Progress } from "@/components/ui/progress"; // Make sure you have a Progress component

const CourseCard = ({ course }) => {
  // Calculate discount percentage if discounted
console.log("Course Card Data:", course);

  const hasDiscount =
    course.originalPrice && course.originalPrice > course.coursePrice;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((course.originalPrice - course.coursePrice) / course.originalPrice) *
          100
      )
    : 0;

  // Get enrolled students count (if array)
  const enrolledCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : course.enrolledStudents || 0;

  // Format duration (if in seconds)
  const formatDuration = (seconds) => {
    if (!seconds) return "8 hours";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m ${seconds}s`;
  };

  // Example: progress in percentage (0-100)
  const progressPercent = course.progress ;
  console.log("Course progress:", progressPercent);

  return (
    <Link to={`/course-detail/${course._id}`} className="group">
      <Card className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-blue-950 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col hover:scale-[1.025]">
        <div className="relative">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity duration-300"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-2 py-1 text-xs font-bold shadow">
              {discountPercentage}% OFF
            </Badge>
          )}
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white px-2 py-1 text-xs font-bold shadow">
            {course.level}
          </Badge>
        </div>

        <CardHeader className="px-5 pt-5 pb-2">
          <h3 className="font-extrabold text-xl leading-tight line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
            {course.title}
          </h3>
        </CardHeader>

        <CardContent className="px-5 py-2 flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center bg-yellow-50 dark:bg-yellow-900 rounded px-2 py-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                {course.rating?.toFixed(1) || "4.5"}
              </span>
              <span className="text-gray-500 text-xs ml-1">
                ({course.ratingCount || enrolledCount})
              </span>
            </div>

            <div className="flex items-center bg-blue-50 dark:bg-blue-900 rounded px-2 py-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="ml-1 text-sm text-blue-700 dark:text-blue-300 font-medium">
                {enrolledCount} students
              </span>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 mb-4 italic">
            {course.subtitles ||
              "Master this subject with our comprehensive course designed for all skill levels."}
          </p>

          <div className="flex items-center gap-5 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDuration(course.totalDurationInSeconds)}
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {course.totalLectures || "12"} lessons
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between w-full">
            {/* Price or Progress Section */}
            <div className="flex flex-col items-start w-40">
              {course.isPurchased ? (
                <div className="w-full">
                  <span className="inline-block text-black bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold mb-2">
                    Owned
                  </span>
                  <span className="text-xs text-black font-semibold dark:text-green-300 mb-1 block">
                    Progress
                  </span>
                  <Progress
                    value={course.progress}
                    className="h-2 rounded bg-gray-200 dark:bg-gray-800"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300 mt-1 block">
                    {course.progress}% completed
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {hasDiscount && (
                      <span className="text-gray-400 dark:text-gray-500 line-through text-base font-medium">
                        Rs{course.price.original}
                      </span>
                    )}
                    <span
                      className={`font-bold text-2xl ${
                        hasDiscount
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-800 dark:text-blue-200"
                      }`}
                    >
                      Rs{course.price.current}
                    </span>
                  </div>
                  {hasDiscount && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                      You save Rs{course.originalPrice - course.coursePrice}!
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Instructor Section */}
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-800 shadow">
                <AvatarImage
                  src={
                    course.creator?.photoUrl ||
                    "https://github.com/shadcn.png"
                  }
                  alt={course.creator?.name || "Instructor"}
                />
                <AvatarFallback>
                  {course.creator?.name?.charAt(0) || "I"}
                </AvatarFallback>
              </Avatar>
              <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                {course.creator?.name || "Instructor"}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

CourseCard.propTypes = {
  course: PropTypes.object.isRequired,
};

export default CourseCard;