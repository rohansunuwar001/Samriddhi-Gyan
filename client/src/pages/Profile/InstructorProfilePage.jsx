// --- Imports ---
import { useParams } from 'react-router-dom';

import PropTypes from 'prop-types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Facebook, Instagram, Linkedin, Link as LinkIcon, Twitter } from "lucide-react";
import { useGetInstructorProfileQuery } from '@/features/api/userApi';


// --- SUGGESTION: You'll want to import your CourseCard component here ---
// import CourseCard from '@/components/CourseCard';

// --- Reusable Component for Social Links (No Changes) ---
const SocialLink = ({ icon: Icon, href = '#' }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="p-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
    <Icon className="w-5 h-5" />
  </a>
);

SocialLink.propTypes = {
  icon: PropTypes.elementType.isRequired,
  href: PropTypes.string,
};

// --- Configuration for social links (No Changes) ---
const socialLinksConfig = [
  { key: 'facebook', icon: Facebook, baseUrl: 'https://facebook.com/' },
  { key: 'instagram', icon: Instagram, baseUrl: 'https://instagram.com/' },
  { key: 'twitter', icon: Twitter, baseUrl: 'https://twitter.com/' },
  { key: 'linkedin', icon: Linkedin, baseUrl: 'https://linkedin.com/in/' }
];


// --- Main Profile View Page Component ---
const InstructorProfilePage = () => {
    const { instructorId } = useParams();
    const { data, isLoading, isError, error } = useGetInstructorProfileQuery(instructorId);

    const user = data?.user;
    const courses = data?.courses;

    // --- Loading, Error, and Not Found States ---
    if (isLoading) return <ProfilePageSkeleton />;
    if (isError) return <ProfilePageError error={error} />;
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-gray-600">Instructor not found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-black font-sans min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* --- Profile Header Section --- */}
                <section className="flex flex-col lg:flex-row lg:gap-12 items-start mb-12">
                    <div className="w-full lg:flex-1">
                        <p className="font-bold text-sm text-gray-500 tracking-wider">
                            INSTRUCTOR
                        </p>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mt-2">
                            {user.name}
                        </h1>
                        <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">{user.headline || "E-Learning Enthusiast"}</p>
                        <Badge className="mt-4 bg-purple-200 text-purple-800 text-sm font-semibold">
                            Samriddhi Gyan Instructor
                        </Badge>
                    </div>

                    {/* --- Right Side: Profile Card (Corrected) --- */}
                   <div className="w-full max-w-sm lg:w-80 mt-12 lg:mt-0 mx-auto lg:mx-0 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full text-center">
                            <Avatar className="w-36 h-36 rounded-full mx-auto border-4 border-white dark:border-gray-700 shadow-lg text-4xl">
                                <AvatarImage src={user.photoUrl} alt={user.name} />
                                <AvatarFallback>{user.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>

                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mt-4">{user.name}</h2>

                            {/* REMOVED: Email is private and not included in the public API response. */}
                            
                            <div className="mt-6 flex justify-center space-x-3">
                                {user.links?.website && <SocialLink icon={LinkIcon} href={user.links.website} />}
                                {socialLinksConfig
                                    .filter(link => user.links && user.links[link.key])
                                    .map(link => (
                                        <SocialLink
                                            key={link.key}
                                            icon={link.icon}
                                            href={`${link.baseUrl}${user.links[link.key]}`}
                                        />
                                    ))}
                            </div>

                            {/* REMOVED: The "Edit Profile" button should not be visible on a public profile page. */}
                        </div>
                    </div>
                </section>

                {/* --- About Me Section --- */}
                {user.description && (
                    <section className="max-w-4xl mb-12">
                        <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About me</h2>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {user.description}
                            </p>
                        </div>
                    </section>
                )}
                
                {/* --- Instructor's Courses Section --- */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Courses by {user.name}
                    </h2>
                    {courses && courses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* --- SUGGESTION: Replace this block with your actual CourseCard component --- */}
                            {/* You will need to import your CourseCard and map over the `courses` array */}
                            {/* Example: */}
                            {/* {courses.map(course => (
                                <CourseCard key={course._id} course={course} />
                            ))} */}
                            <p className="col-span-full text-gray-500">
                                Course cards will be rendered here. You need to implement and import a `CourseCard` component.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-gray-600 dark:text-gray-300">This instructor has not published any courses yet.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

// --- Skeleton and Error Components (No Changes Needed) ---
const ProfilePageSkeleton = () => (
  <div className="bg-slate-50 dark:bg-black font-sans min-h-screen animate-pulse">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section className="flex flex-col lg:flex-row lg:gap-12 items-start mb-12">
        <div className="w-full lg:flex-1 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="w-full max-w-sm lg:w-80 mt-12 lg:mt-0 mx-auto lg:mx-0 flex-shrink-0">
          <div className="bg-white/10 dark:bg-gray-800/50 rounded-2xl p-6 w-full text-center space-y-4">
            <Skeleton className="w-36 h-36 rounded-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        </div>
      </section>
      <section className="max-w-4xl">
        <div className="bg-white/10 dark:bg-gray-800/50 p-6 md:p-8 rounded-lg">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </section>
    </div>
  </div>
);

const ProfilePageError = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-8 text-center">
      <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        Failed to Load Profile
      </h2>
      <p className="text-red-600 dark:text-red-400 mb-6">
        {error?.data?.message || "An unexpected error occurred."}
      </p>
      <Button variant="destructive" onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  </div>
);

ProfilePageError.propTypes = {
  error: PropTypes.object,
};

export default InstructorProfilePage;