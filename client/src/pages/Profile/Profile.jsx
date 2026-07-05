// file: src/pages/Profile/Profile.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import PropTypes from 'prop-types';
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Facebook, Instagram, Linkedin, Link as LinkIcon, Pencil, Twitter, Youtube, Star } from "lucide-react";
import { useLoadUserQuery } from "@/features/api/authApi";
import { useGetInstructorProfileQuery } from "@/features/api/userApi";
import InstructorSidebar from "../admin/InstructorSidebar";
import AdminSidebar from "../admin/AdminSidebar";

const SocialLink = ({ icon: Icon, href = '#' }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="p-3 border border-gray-350 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
    <Icon className="w-5 h-5" />
  </a>
);

SocialLink.propTypes = {
  icon: PropTypes.elementType.isRequired, 
  href: PropTypes.string,
};

const socialLinksConfig = [
  { key: 'facebook', icon: Facebook, baseUrl: 'https://facebook.com/' },
  { key: 'instagram', icon: Instagram, baseUrl: 'https://instagram.com/' },
  { key: 'twitter', icon: Twitter, baseUrl: 'https://twitter.com/' },
  { key: 'linkedin', icon: Linkedin, baseUrl: 'https://linkedin.com/in/' },
  { key: 'youtube', icon: Youtube, baseUrl: 'https://youtube.com/' }
];

// Reusable Course Card for Public Profiles
const ProfileCourseCard = ({ course }) => {
  const navigate = useNavigate();
  const creatorName = course.creator?.name || "Instructor";
  const creatorHeadline = course.creator?.headline || "";

  // Support nested pricing object or flat pricing numbers
  const currentPrice = typeof course.price === 'object' ? course.price?.current : course.price;
  const originalPrice = typeof course.price === 'object' ? course.price?.original : course.price;
  const hasDiscount = originalPrice > currentPrice;

  return (
    <div 
      onClick={() => navigate(`/course-detail/${course._id}`)}
      className="border border-[#d1d7dc] bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full font-sans text-left"
    >
      <div className="aspect-video w-full bg-gray-100">
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

        {/* Instructor name and position */}
        <p className="text-xs text-slate-400 font-light truncate mb-2">
          {creatorName}{creatorHeadline ? `, ${creatorHeadline}` : ""}
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

ProfileCourseCard.propTypes = {
  course: PropTypes.object.isRequired,
};

const Profile = () => {
  const navigate = useNavigate();
  const { username } = useParams();

  // Load currently logged in user to check ownership
  const { data: loggedInData } = useLoadUserQuery();
  const loggedInUser = loggedInData?.user;

  // Resolve slug from logged in user name
  const usernameSlug = loggedInUser?.name
    ? `${loggedInUser.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${loggedInUser._id}`
    : "";

  // Auto redirect /profile to correct role-based URL
  useEffect(() => {
    if (!username && loggedInUser) {
      if (loggedInUser.role === "student") {
        navigate(`/user/${usernameSlug}`, { replace: true });
      } else if (loggedInUser.role === "admin") {
        navigate(`/admin/${usernameSlug}`, { replace: true });
      } else {
        navigate(`/instructor/${usernameSlug}`, { replace: true });
      }
    }
  }, [username, loggedInUser, usernameSlug, navigate]);

  // Query public profile data by username parameter
  const { data: profileData, isLoading, isError, error } = useGetInstructorProfileQuery(
    username || usernameSlug,
    { skip: !username && !usernameSlug }
  );

  const profileUser = profileData?.user;
  const createdCourses = profileData?.courses || [];

  // Expand/collapse description state
  const [isExpanded, setIsExpanded] = useState(false);

  const descriptionText = profileUser?.description && profileUser.description !== "This user has not provided a description." 
    ? profileUser.description 
    : "No description provided.";
  const isLongDescription = descriptionText.length > 350;
  const displayDescription = descriptionText;
  const truncatedDescription = descriptionText.slice(0, 350) + "...";

  // Summary stats for instructor
  const totalLearners = createdCourses.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0);
  const totalReviews = createdCourses.reduce((sum, course) => sum + (course.numOfReviews || 0), 0);

  // Tabs management
  const [activeTab, setActiveTab] = useState("");

  // Initialize active tab based on user role
  useEffect(() => {
    if (profileUser) {
      if (profileUser.role === "student") {
        setActiveTab("learning");
      } else {
        setActiveTab("courses");
      }
    }
  }, [profileUser]);

  const handleNavigateToEdit = () => {
    if (profileUser?.role === 'student') {
      navigate('/user/edit-profile/');
    } else if (profileUser?.role === 'admin') {
      navigate('/admin/profile/');
    } else {
      navigate('/instructor/profile/');
    }
  };

  const wrapWithSidebar = (content) => {
    if (loggedInUser?.role === "admin") {
      return (
        <div className="flex h-screen bg-background">
          <AdminSidebar />
          <div className="flex-1 overflow-y-auto">
            {content}
          </div>
        </div>
      );
    }
    if (loggedInUser?.role === "instructor") {
      return (
        <div className="flex h-screen bg-background">
          <InstructorSidebar />
          <div className="flex-1 overflow-y-auto">
            {content}
          </div>
        </div>
      );
    }
    return content;
  };

  if (isLoading || (!username && !usernameSlug)) return wrapWithSidebar(<ProfilePageSkeleton />);
  if (isError) return wrapWithSidebar(<ProfilePageError error={error} />);

  if (!profileUser) {
    return wrapWithSidebar(
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-600">User not found or session has expired.</p>
      </div>
    );
  }

  const initials = profileUser.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "SG";

  const isOwnProfile = loggedInUser?._id === profileUser?._id;

  const isStudent = profileUser.role === "student";

  return wrapWithSidebar(
    <div className="bg-white font-sans min-h-screen text-[#1c1d1f]">
      {/* Banner header section */}
      <div className={isStudent ? "bg-[#1c1d1f] text-white py-12 px-6 md:px-12" : "bg-[#f8f9fb] text-[#1c1d1f] border-b border-[#d1d7dc] py-16 px-6 md:px-12"}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <span className={`text-sm font-normal tracking-widest uppercase ${isStudent ? "text-[#d1d7dc]" : "text-[#6a6f73]"}`}>
              {profileUser.role === "student" ? "Learner" : profileUser.role === "admin" ? "Admin" : "Instructor"}
            </span>
            <h1 className={`text-5xl font-normal mt-2 ${isStudent ? "text-white" : "text-[#1c1d1f]"}`}>
              {profileUser.name}
            </h1>
            {profileUser.headline && (
              <p className={`text-xl mt-2 font-normal ${isStudent ? "text-gray-300" : "text-[#1c1d1f]"}`}>
                {profileUser.headline}
              </p>
            )}
            {!isStudent && (
              <div className="inline-block mt-3 px-3 py-1 bg-[#ecebfa] text-[#5022c3] text-sm font-normal rounded-sm shadow-sm">
                Instructor Partner
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main section */}
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Left side: Stats, About & Courses */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Summary Stats Block for Instructors */}
          {!isStudent && profileUser.role !== "admin" && (
            <div className="flex gap-16 mb-6">
              <div>
                <div className="text-3xl font-normal text-[#1c1d1f]">
                  {totalLearners.toLocaleString()}
                </div>
                <div className="text-sm text-[#6a6f73] font-light mt-1">Total learners</div>
              </div>
              <div>
                <div className="text-3xl font-normal text-[#1c1d1f]">
                  {totalReviews.toLocaleString()}
                </div>
                <div className="text-sm text-[#6a6f73] font-light mt-1">Reviews</div>
              </div>
            </div>
          )}

          {/* Biography Area with Collapse Toggle */}
          <div>
            <h2 className="text-2xl font-normal pb-3 mb-3">About me</h2>
            <div 
              className="text-gray-700 leading-relaxed text-base font-normal"
              dangerouslySetInnerHTML={{ __html: isExpanded || !isLongDescription ? displayDescription : truncatedDescription }}
            />
            {isLongDescription && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[#5022c3] font-normal text-base hover:underline mt-2 flex items-center gap-1"
              >
                {isExpanded ? "Show less" : "Show more"}
                <span>{isExpanded ? "▲" : "▼"}</span>
              </button>
            )}
          </div>

          {/* Role-based panels / courses display */}
          {profileUser.role !== "admin" && (
            isStudent ? (
              <div>
                {/* Role-based tabs section for Students */}
                <div className="flex border-b border-[#d1d7dc] mb-6 overflow-x-auto gap-6">
                  <button
                    onClick={() => setActiveTab("learning")}
                    className={`pb-3 text-lg font-normal transition-all border-b-2 whitespace-nowrap ${
                      activeTab === "learning"
                        ? "border-[#1c1d1f] text-[#1c1d1f] font-normal"
                        : "border-transparent text-gray-500 hover:text-[#1c1d1f]"
                    }`}
                  >
                    Learning
                  </button>
                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className={`pb-3 text-lg font-normal transition-all border-b-2 whitespace-nowrap ${
                      activeTab === "wishlist"
                        ? "border-[#1c1d1f] text-[#1c1d1f] font-normal"
                        : "border-transparent text-gray-500 hover:text-[#1c1d1f]"
                    }`}
                  >
                    Wishlist
                  </button>
                </div>

                {/* Panels */}
                {activeTab === "learning" && (
                  <div>
                    {profileUser.enrolledCourses && profileUser.enrolledCourses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profileUser.enrolledCourses.map((course) => (
                          <ProfileCourseCard key={course._id} course={course} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-gray-500">Not enrolled in any courses yet.</p>
                    )}
                  </div>
                )}

                {activeTab === "wishlist" && (
                  <div>
                    {profileUser.wishlist && profileUser.wishlist.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profileUser.wishlist.map((course) => (
                          <ProfileCourseCard key={course._id} course={course} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-gray-500">Wishlist is empty.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Directly render courses grid for Instructors
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-2xl font-normal mb-6">
                  My courses ({createdCourses.length})
                </h2>
                {createdCourses && createdCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdCourses.map((course) => (
                      <ProfileCourseCard key={course._id} course={course} />
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-gray-500">No courses created yet.</p>
                )}
              </div>
            )
          )}
        </div>

        {/* Right side: floating avatar card */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="border border-[#d1d7dc] p-6 text-center space-y-6 bg-white shadow-md rounded-sm">
            <Avatar className="w-36 h-36 mx-auto border border-gray-200">
              <AvatarImage src={profileUser.photoUrl} alt={profileUser.name} className="object-cover" />
              <AvatarFallback className="text-5xl font-normal text-white bg-[#1c1d1f]">{initials}</AvatarFallback>
            </Avatar>

            {/* Social media links outlined in purple */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {profileUser.links?.website && (
                <a
                  href={profileUser.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 border border-[#a435f0] text-[#a435f0] hover:bg-[#a435f0]/5 rounded-sm flex items-center justify-center transition-colors"
                >
                  <LinkIcon className="w-5 h-5" />
                </a>
              )}
              {socialLinksConfig
                .filter(link => profileUser.links && profileUser.links[link.key])
                .map(link => {
                  const href = `${link.baseUrl}${profileUser.links[link.key]}`;
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 border border-[#a435f0] text-[#a435f0] hover:bg-[#a435f0]/5 rounded-sm flex items-center justify-center transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
            </div>

            {isOwnProfile && (
              <button
                onClick={handleNavigateToEdit}
                className="w-full border border-[#1c1d1f] hover:bg-gray-50 text-[#1c1d1f] font-normal py-3 text-base transition-colors mt-4"
              >
                Edit profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePageSkeleton = () => (
  <div className="bg-slate-50 font-sans min-h-screen animate-pulse">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section className="flex flex-col lg:flex-row lg:gap-12 items-start mb-12">
        <div className="w-full lg:flex-1 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="w-full max-w-sm lg:w-80 mt-12 lg:mt-0 mx-auto lg:mx-0 flex-shrink-0">
          <div className="bg-white rounded-2xl p-6 w-full text-center space-y-4">
            <Skeleton className="w-36 h-36 rounded-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-10 w-full mt-2" />
          </div>
        </div>
      </section>
    </div>
  </div>
);

const ProfilePageError = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
      <h2 className="text-xl font-bold text-red-700 mb-2">Failed to Load Profile</h2>
      <p className="text-red-650 mb-6">{error?.data?.message || "An error occurred."}</p>
      <Button variant="destructive" onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  </div>
);

ProfilePageError.propTypes = {
  error: PropTypes.object,
};

export default Profile;