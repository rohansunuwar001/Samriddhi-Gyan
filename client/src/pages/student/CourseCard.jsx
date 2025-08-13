import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, PlayCircle, Star, Users } from "lucide-react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const CourseCard = ({ course, showRecommendationBadge }) => {
  // --- Data preparation for the "For Sale" view ---
  const hasDiscount =
    course.price?.original && course.price.original > course.price.current;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((course.price.original - course.price.current) /
          course.price.original) *
          100
      )
    : 0;

  const enrolledCount = Array.isArray(course.enrolledStudents)
    ? course.enrolledStudents.length
    : 0;

  const formatDuration = (seconds) => {
    if (!seconds) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // --- Primary Logic Switch ---
  // If the user has purchased the course, show the "Learning Portal" view.
  if (course.isPurchased) {
    const progressPercent = course.progress || 0;
    
    // This view is designed to be a direct link to the learning content.
    return (
      <Card className="overflow-hidden rounded-xl border bg-white shadow-lg h-full flex flex-col transition-transform duration-300 hover:-translate-y-1.5">
        {/* The Link now points to the user's specific learning page for this course */}
        <Link
          to={`/my-learning/courses/${course._id}`}
          className="group flex flex-col h-full"
        >
          <div className="relative">
            <img
              src={course.thumbnail || "/default-course-thumbnail.jpg"}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <PlayCircle className="w-16 h-16 text-white/90" />
            </div>
          </div>
          <CardHeader className="px-4 pt-4 pb-2">
            <h3 className="font-bold text-xl leading-tight line-clamp-2">
              {course.title}
            </h3>
          </CardHeader>
          <CardContent className="px-4 py-2 flex-1">
            <div className="w-full">
              <span className="text-xs text-gray-500 font-semibold mb-1 block">
                Your Progress
              </span>
              <Progress value={progressPercent} className="h-2 rounded" />
              <p className="text-xs text-gray-600 mt-1.5">
                {progressPercent}% Complete
              </p>
            </div>
          </CardContent>
          <CardFooter className="px-4 pb-4 mt-auto">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-3">
              Continue Learning
            </Button>
          </CardFooter>
        </Link>
      </Card>
    );
  }

  // --- Fallback "For Sale" View ---
  // If `course.isPurchased` is false, show the detailed product card.
  return (
    <Link
      to={`/course-detail/${course._id}`}
      className="group relative h-full"
    >
      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col hover:scale-[1.025]">
        <div className="relative">
          <img
            src={course.thumbnail || "/default-course-thumbnail.jpg"}
            alt={course.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2.5 py-1 text-xs font-bold shadow-lg">
              {discountPercentage}% OFF
            </Badge>
          )}
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white px-2.5 py-1 text-xs font-bold shadow-lg">
            {course.level || "N/A"}
          </Badge>

          {showRecommendationBadge && (
            <Badge className="absolute bottom-3 right-3 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
              Recommended
            </Badge>
          )}
        </div>

        <CardHeader className="px-5 pt-5 pb-3">
          <h3 className="font-extrabold text-xl leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors duration-200">
            {course.title}
          </h3>
        </CardHeader>

        <CardContent className="px-5 py-2 flex-1">
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
              <span className="ml-1 text-sm font-semibold text-gray-800">
                {course.ratings?.toFixed(1) || "0.0"}
              </span>
              <span className="text-gray-500 text-xs ml-1">
                ({course.numOfReviews || 0})
              </span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="ml-1 text-sm text-gray-800 font-medium">
                {enrolledCount} students
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDuration(course.totalDurationInSeconds)}
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {course.totalLectures || "0"} lessons
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-5 pb-5 pt-4 mt-auto border-t border-gray-100">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-2xl text-blue-800">
                  Rs{course.price.current}
                </span>
                {hasDiscount && (
                  <span className="text-gray-500 line-through text-base font-medium">
                    Rs{course.price.original}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border-2 border-white shadow">
                <AvatarImage
                  src={
                    course.creator?.photoUrl || "https://github.com/shadcn.png"
                  }
                  alt={course.creator?.name || "Instructor"}
                />
                <AvatarFallback>
                  {course.creator?.name?.charAt(0) || "I"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    price: PropTypes.shape({
      current: PropTypes.number.isRequired,
      original: PropTypes.number,
    }),
    progress: PropTypes.number, // isPurchased requires progress
    isPurchased: PropTypes.bool, // The switch to change the card's appearance
    level: PropTypes.string,
    ratings: PropTypes.number,
    numOfReviews: PropTypes.number,
    enrolledStudents: PropTypes.array,
    subtitle: PropTypes.string,
    totalDurationInSeconds: PropTypes.number,
    totalLectures: PropTypes.number,
    creator: PropTypes.shape({
      name: PropTypes.string,
      photoUrl: PropTypes.string,
    }),
  }).isRequired,
  showRecommendationBadge: PropTypes.bool,
};

export default CourseCard;