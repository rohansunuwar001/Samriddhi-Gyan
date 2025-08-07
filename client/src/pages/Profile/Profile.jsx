
import { useLoadUserQuery } from "@/features/api/authApi";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
// --- UI & Icons ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// Import all icons needed for the config array
import { Facebook, Instagram, Linkedin, Link as LinkIcon, Pencil, Twitter } from "lucide-react";

// --- Reusable Component ---
const SocialLink = ({ icon: Icon, href = '#' }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="p-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
    <Icon className="w-5 h-5" />
  </a>
);

SocialLink.propTypes = {
  icon: PropTypes.elementType.isRequired, 
  href: PropTypes.string,
};

// --- NEW: Configuration for social links to drive the UI ---
const socialLinksConfig = [
  { key: 'facebook', icon: Facebook, baseUrl: 'https://facebook.com/' },
  { key: 'instagram', icon: Instagram, baseUrl: 'https://instagram.com/' },
  { key: 'twitter', icon: Twitter, baseUrl: 'https://twitter.com/' },
  { key: 'linkedin', icon: Linkedin, baseUrl: 'https://linkedin.com/in/' }
];


// --- Main Profile View Page Component ---
const Profile = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useLoadUserQuery();
  const user = data?.user;

  const handleNavigateToEdit = () => {
    navigate('/profile/edit');
  };

  if (isLoading) return <ProfilePageSkeleton />;
  if (isError) return <ProfilePageError error={error} />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
        <p className="text-gray-600 dark:text-gray-300">User not found or session has expired.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black font-sans min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <section className="flex flex-col lg:flex-row lg:gap-12 items-start mb-12">
          {/* Left Side: User Info */}
          <div className="w-full lg:flex-1">
            {user.role && (
              <p className="font-bold text-sm text-gray-500 dark:text-gray-400 tracking-wider">
                {user.role.toUpperCase()}
              </p>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mt-2">
              {user.name}
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">{user.headline || "E-Learning Enthusiast"}</p>
            {user.role === 'instructor' && (
              <Badge className="mt-4 bg-purple-200 text-purple-800 text-sm font-semibold">
                Samriddhi Gyan Instructor
              </Badge>
            )}
           
          </div>

          {/* Right Side: Profile Card */}
          <div className="w-full max-w-sm lg:w-80 mt-12 lg:mt-0 mx-auto lg:mx-0 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full text-center">
              <Avatar className="w-36 h-36 rounded-full mx-auto border-4 border-white dark:border-gray-700 shadow-lg text-4xl">
                <AvatarImage src={user.photoUrl} alt={user.name} />
                <AvatarFallback>{user.name?.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold text-gray-800 dark:text-white mt-4">{user.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>

              {/* --- UPDATED: Links section now uses .map() --- */}
              <div className="mt-6 flex justify-center space-x-3">
                {/* Handle website link separately as it has no base URL */}
                {user.links?.website && <SocialLink icon={LinkIcon} href={user.links.website} />}

                {/* Map over the social media links config */}
                {socialLinksConfig
                  .filter(link => user.links && user.links[link.key]) // Keep only links the user has provided
                  .map(link => (
                    <SocialLink
                      key={link.key}
                      icon={link.icon}
                      href={`${link.baseUrl}${user.links[link.key]}`}
                    />
                  ))}
              </div>

              <Button variant="outline" className="w-full mt-6 gap-2" onClick={handleNavigateToEdit}>
                <Pencil className="h-4 w-4" /> Edit Profile
              </Button>
            </div>
          </div>
        </section>

 {/* --- About Me Section --- */}
            <br />
            <p className="text-gray-600 dark:text-gray-400 mt-2">
            {user.description && (
              <section className="max-w-4xl">
                <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About me</h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {user.description}
                  </p>
                </div>
              </section>
            )}
            </p>
      </div>
    </div>
  );
};

// --- Skeleton and Error Components (Unchanged) ---
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
            <Skeleton className="h-10 w-full mt-2" />
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
  error: PropTypes.object.isRequired,
};

export default Profile;