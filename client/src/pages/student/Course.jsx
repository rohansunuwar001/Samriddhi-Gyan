import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
const Course = ({ course }) => {
  // Calculate discount percentage if discounted
  const hasDiscount = course.originalPrice && course.originalPrice > course.coursePrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((course.originalPrice - course.coursePrice) / course.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/course-detail/${course._id}`} className="group">
      <Card className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className="relative">
          <img
            src={course.courseThumbnail}
            alt={course.courseTitle}
            className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity duration-300"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs font-bold">
              {discountPercentage}% OFF
            </Badge>
          )}
          <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs font-bold">
            {course.courseLevel}
          </Badge>
        </div>
        
        <CardHeader className="px-4 pt-4 pb-2">
          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {course.courseTitle}
          </h3>
        </CardHeader>
        
        <CardContent className="px-4 py-2 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm font-medium">
                {course.rating?.toFixed(1) || '4.5'}
              </span>
              <span className="text-gray-500 text-xs ml-1">({course.enrollments || '1000'})</span>
            </div>
            
            <div className="flex items-center ml-3">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="ml-1 text-sm text-gray-500">
                {course.enrolledStudents || '1.2k'} students
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
            {course.shortDescription || 'Master this subject with our comprehensive course designed for all skill levels.'}
          </p>
          
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {course.duration || '8 hours'}
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {course.lessonsCount || '12'} lessons
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between w-full">
            <div>
              {hasDiscount && (
                <span className="text-gray-400 dark:text-gray-500 line-through text-sm mr-2">
                  ₹{course.originalPrice}
                </span>
              )}
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                ₹{course.coursePrice}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800">
                <AvatarImage 
                  src={course.creator?.photoUrl || "https://github.com/shadcn.png"} 
                  alt={course.creator?.name || 'Instructor'} 
                />
                <AvatarFallback>
                  {course.creator?.name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

Course.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    id: PropTypes.string,
    courseTitle: PropTypes.string.isRequired,
    courseThumbnail: PropTypes.string.isRequired,
    coursePrice: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    courseLevel: PropTypes.string.isRequired,
    rating: PropTypes.number,
    enrollments: PropTypes.number,
    enrolledStudents: PropTypes.number,
    duration: PropTypes.string,
    lessonsCount: PropTypes.number,
    shortDescription: PropTypes.string,
    creator: PropTypes.shape({
      name: PropTypes.string,
      photoUrl: PropTypes.string,
    }),
  }),
};

export default Course;