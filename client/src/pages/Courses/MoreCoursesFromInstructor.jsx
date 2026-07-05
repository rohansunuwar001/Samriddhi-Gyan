// file: src/pages/Courses/MoreCoursesFromInstructor.jsx

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Star } from 'lucide-react';
import { useGetInstructorProfileQuery } from '@/features/api/userApi';

const CourseCard = ({ course }) => {
    const navigate = useNavigate();
    
    // Support nested pricing object or flat pricing numbers
    const currentPrice = typeof course.price === 'object' ? course.price?.current : course.price;
    const originalPrice = typeof course.price === 'object' ? course.price?.original : course.price;
    const hasDiscount = originalPrice > currentPrice;

    return (
        <div 
            onClick={() => {
                navigate(`/course-detail/${course._id}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="border border-[#d1d7dc] bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full font-sans text-left"
        >
            <div className="w-full bg-gray-100 flex-shrink-0 animate-pulse-slow" style={{ aspectRatio: '16/9' }}>
                {course.thumbnail ? (
                    <img 
                        src={course.thumbnail} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-base font-light">
                        No Image
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-1">
                {/* Title */}
                <h3 className="text-base font-normal text-[#1c1d1f] line-clamp-2 leading-tight min-h-[40px] mb-1">
                    {course.title}
                </h3>
                
                {/* Subtitle / Achievements */}
                {course.subtitle && (
                    <p className="text-xs text-slate-500 font-light line-clamp-2 mb-2 leading-normal min-h-[32px]">
                        {course.subtitle}
                    </p>
                )}

                {/* Creator name and position */}
                <p className="text-xs text-slate-400 font-light truncate mb-2">
                    {course.creator?.name || "Instructor"}{course.creator?.headline ? `, ${course.creator.headline}` : ""}
                </p>

                {/* Info Capsules Row */}
                <div className="flex flex-wrap items-center gap-1.5 mt-auto mb-3">
                    <div className="border border-[#d1d7dc] px-1.5 py-0.5 rounded-sm flex items-center gap-1 text-[#b4690e] font-normal text-xs bg-amber-50/10">
                        <Star className="w-3 h-3 fill-current text-[#b4690e]" />
                        <span>{(course.ratings || 0).toFixed(1)}</span>
                    </div>
                    <div className="border border-[#d1d7dc] px-1.5 py-0.5 rounded-sm text-slate-500 font-light text-xs bg-slate-50/10">
                        {course.numOfReviews || 0} ratings
                    </div>
                    <div className="border border-[#d1d7dc] px-1.5 py-0.5 rounded-sm text-slate-500 font-light text-xs capitalize bg-slate-50/10">
                        {course.level || "All levels"}
                    </div>
                </div>

                {/* Price Section */}
                <div className="flex items-baseline gap-2">
                    <span className="text-base font-normal text-[#1c1d1f]">
                        {currentPrice ? `NPR ${currentPrice}` : "Free"}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm text-slate-400 line-through font-light">
                            NPR {originalPrice}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

CourseCard.propTypes = {
    course: PropTypes.object.isRequired,
};

const MoreCoursesFromInstructor = ({ instructor, currentCourseId }) => {
    const instructorId = instructor?._id;
    const name = instructor?.name || "Instructor";
    const headline = instructor?.headline || "";

    // Calculate slug for public profile link
    const usernameSlug = name
        ? `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${instructorId}`
        : "";

    // Fetch the instructor's public profile data (including all their published courses)
    const { data: profileData } = useGetInstructorProfileQuery(instructorId, { skip: !instructorId });

    const courses = profileData?.courses || [];

    // Filter out the current course being viewed
    const otherCourses = courses.filter(c => c._id !== currentCourseId);

    // If the instructor has no other published courses, do not show this section
    if (otherCourses.length === 0) return null;

    const role = profileData?.user?.role || instructor?.role;
    const profilePath = role === 'admin' ? 'admin' : 'instructor';

    return (
        <div className="pt-8 border-t border-gray-200 mt-8 font-sans">
            <h2 className="text-2xl font-normal text-[#1c1d1f] mb-6 text-left leading-normal">
                More Courses by{" "}
                <Link 
                    to={`/${profilePath}/${usernameSlug}`}
                    className="text-[#5624d0] hover:text-[#3b1a90] underline transition-colors"
                >
                    {name}
                    {headline ? `, ${headline}` : ""}
                </Link>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherCourses.map(course => (
                    <CourseCard key={course._id} course={course} />
                ))}
            </div>

            <button className="w-full border border-[#a435f0] text-[#a435f0] hover:bg-[#a435f0]/5 font-normal py-3 text-base mt-8 transition-colors rounded-sm focus:outline-none">
                Report abuse
            </button>
        </div>
    );
};

MoreCoursesFromInstructor.propTypes = {
    instructor: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        headline: PropTypes.string,
    }).isRequired,
    currentCourseId: PropTypes.string.isRequired,
};

export default MoreCoursesFromInstructor;
