import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Star, Award, Users, Play } from 'lucide-react';
import { useGetInstructorProfileQuery } from '@/features/api/userApi';

const InstructorProfile = ({ instructor }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const id = instructor?._id;
    const name = instructor?.name || "Unknown Instructor";
    const headline = instructor?.headline || "";
    const photoUrl = instructor?.photoUrl || "https://github.com/shadcn.png";

    // Calculate slug for public profile link
    const usernameSlug = name
        ? `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id}`
        : "";

    // Fetch complete instructor profile data dynamically (ratings, students count, courses, etc.)
    const { data: profileData } = useGetInstructorProfileQuery(id, { skip: !id });

    const profileUser = profileData?.user;
    const courses = profileData?.courses || [];

    const coursesCount = courses.length;
    const totalLearners = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
    const totalReviews = courses.reduce((sum, c) => sum + (c.numOfReviews || 0), 0);
    const averageRating = coursesCount > 0 
        ? courses.reduce((sum, c) => sum + (c.ratings || 0), 0) / coursesCount 
        : 0;

    const descriptionText = profileUser?.description && profileUser.description !== "This user has not provided a description." 
        ? profileUser.description 
        : "";

    const isLongDescription = descriptionText.length > 300;
    const truncatedDescription = descriptionText.slice(0, 300) + "...";

    const role = profileUser?.role || instructor?.role;
    const profilePath = role === 'admin' ? 'admin' : 'instructor';

    return (
        <div className="font-sans text-left mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-3xl font-light text-[#1c1d1f] mb-4">Instructor</h2>
            
            <Link 
                to={`/${profilePath}/${usernameSlug}`} 
                className="text-2xl font-light text-[#5624d0] hover:text-[#3b1a90] underline transition-colors"
            >
                {name}
            </Link>
 
            <p className="text-lg text-gray-500 font-extralight mt-1">{headline}</p>
 
            <div className="flex flex-col sm:flex-row items-start gap-6 mt-6">
                <Link to={`/${profilePath}/${usernameSlug}`} className="shrink-0">
                    <img
                        src={photoUrl}
                        alt={name}
                        className="h-28 w-28 rounded-full object-cover hover:opacity-90 transition-opacity"
                    />
                </Link>
                <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3 text-base text-[#1c1d1f] font-extralight">
                        <Star className="h-4 w-4 text-[#b4690e] fill-[#b4690e] shrink-0" />
                        <span>{averageRating.toFixed(1)} Instructor Rating</span>
                    </div>
                    <div className="flex items-center gap-3 text-base text-[#1c1d1f] font-extralight">
                        <Award className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{totalReviews.toLocaleString()} Reviews</span>
                    </div>
                    <div className="flex items-center gap-3 text-base text-[#1c1d1f] font-extralight">
                        <Users className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{totalLearners.toLocaleString()} Students</span>
                    </div>
                    <div className="flex items-center gap-3 text-base text-[#1c1d1f] font-extralight">
                        <Play className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{coursesCount} Courses</span>
                    </div>
                </div>
            </div>

            {descriptionText && (
                <div className="mt-4">
                    <p className="text-lg text-[#1c1d1f] font-extralight leading-relaxed whitespace-pre-line">
                        {isExpanded || !isLongDescription ? descriptionText : truncatedDescription}
                    </p>
                    {isLongDescription && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className="text-[#5624d0] hover:text-[#3b1a90] font-light text-lg mt-2 flex items-center gap-1 focus:outline-none"
                        >
                            {isExpanded ? 'Show less' : 'Show more'}
                            <span>{isExpanded ? '▲' : '▼'}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

InstructorProfile.propTypes = {
    instructor: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        headline: PropTypes.string,
        photoUrl: PropTypes.string,
    }).isRequired,
};

export default InstructorProfile;