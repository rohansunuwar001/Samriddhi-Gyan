import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import PropTypes from 'prop-types';
// --- API Hooks ---
import {
  useLoadUserQuery,
  useUpdateUserAvatarMutation,
  useUpdateUserInfoMutation
} from '@/features/api/authApi';

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ProfileSidebar from './ProfileSideBar';

//================================================================================
// 1. Reusable Sidebar Component
// (You can move this to its own file like `src/components/ProfileSidebar.jsx`)
//================================================================================


//================================================================================
// 2. Main Profile Edit Page Component
//================================================================================
const socialLinksConfig = [
    { key: 'facebook', label: 'facebook.com/', placeholder: 'your.username' },
    { key: 'instagram', label: 'instagram.com/', placeholder: 'your.username' },
    { key: 'twitter', label: 'twitter.com/', placeholder: 'your_handle' },
    { key: 'linkedin', label: 'linkedin.com/in/', placeholder: 'your-profile' }
];

const ProfileEdit = () => {
  const navigate = useNavigate();

  // --- State and Logic ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState({ website: "", facebook: "", instagram: "", twitter: "", linkedin: "" });
  const [previewImage, setPreviewImage] = useState("");
  const fileInputRef = useRef(null);

  const { data, isLoading: isUserLoading, isError, error } = useLoadUserQuery();
  const [updateUserInfo, { isLoading: isInfoUpdating }] = useUpdateUserInfoMutation();
  const [updateUserAvatar, { isLoading: isAvatarUpdating }] = useUpdateUserAvatarMutation();

  const user = data?.user;

  useEffect(() => {
    if (user) {
      const [first = '', last = ''] = user.name?.split(' ') || [];
      setFirstName(first);
      setLastName(last);
      setHeadline(user.headline || "");
      setDescription(user.description || "");
      setLinks(prev => ({ ...prev, ...(user.links || {}) }));
      setPreviewImage(user.photoUrl || "");
    }
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('profilePhoto', file);
    try {
      await updateUserAvatar(formData).unwrap();
      toast.success("Avatar updated successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update avatar.");
      setPreviewImage(user?.photoUrl || "");
    }
  };

  const handleLinkChange = (key, value) => {
    setLinks(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    const updatedInfo = {
      name: `${firstName} ${lastName}`.trim(),
      headline,
      description,
      links,
    };
    try {
      await updateUserInfo(updatedInfo).unwrap();
      toast.success("Profile information saved!");
      navigate('/profile');
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save information.");
    }
  };

  if (isUserLoading) return <ProfileSkeleton />;
  if (isError) return <ProfileError error={error} />;

  return (
    <div className="bg-gray-50 dark:bg-black font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          <ProfileSidebar 
            user={user}
            previewImage={previewImage}
            isAvatarUpdating={isAvatarUpdating}
            fileInputRef={fileInputRef}
            onPhotoChange={handlePhotoChange}
            activePage="edit"
          />

          <main className="w-full md:w-3/4 bg-white dark:bg-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Update your information here.</p>
              <form onSubmit={handleUpdateInfo} className="mt-8 space-y-8">
                {/* Basics Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Basics</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required />
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required />
                  </div>
                  <div className="mt-4">
                    <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline (e.g., Full Stack Developer)" />
                  </div>
                </div>
                {/* Biography Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Biography</h3>
                  <div className="mt-4">
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="5" placeholder="Tell us a bit about yourself..." />
                  </div>
                </div>
                {/* Links Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Links</h3>
                  <div className="mt-4 space-y-4">
                    <Input 
                        type="url" 
                        value={links.website} 
                        onChange={(e) => handleLinkChange('website', e.target.value)} 
                        placeholder="Website (https://your-site.com)" 
                    />
                    {socialLinksConfig.map((link) => (
                      <div key={link.key} className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 text-sm">
                          {link.label}
                        </span>
                        <Input 
                          value={links[link.key] || ''} 
                          onChange={(e) => handleLinkChange(link.key, e.target.value)} 
                          placeholder={link.placeholder} 
                          className="rounded-l-none" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Action Button */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                   <Button type="submit" disabled={isInfoUpdating || isAvatarUpdating}>
                    {isInfoUpdating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

//================================================================================
// 3. Helper Components for Loading and Error States
//================================================================================
const ProfileSkeleton = () => (
  <div className="bg-gray-50 dark:bg-black font-sans">
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-8 animate-pulse">
        {/* Sidebar Skeleton */}
        <aside className="w-full md:w-1/4 flex-shrink-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="mt-8 space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="w-full md:w-3/4 bg-white/50 dark:bg-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-12" />
          <div className="space-y-8">
            {/* Basics Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <div className="grid grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              <Skeleton className="h-10 w-full" />
            </div>
            {/* Biography Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
            {/* Links Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
);

const ProfileError = ({ error }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-8 text-center">
      <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        Failed to Load Profile
      </h2>
      <p className="text-red-600 dark:text-red-400 mb-6">
        {error?.data?.message || "An unexpected error occurred."}
      </p>
      <Button 
        variant="destructive"
        onClick={() => window.location.reload()}
      >
        Try Again
      </Button>
    </div>
  </div>
);

ProfileEdit.propTypes = {
  user: PropTypes.object,
  isAvatarUpdating: PropTypes.bool,
  fileInputRef: PropTypes.object,
  updateAvatar: PropTypes.func,
  updateProfile: PropTypes.func,
  error: PropTypes.object,
  };

ProfileError.propTypes = {
  error: PropTypes.object.isRequired,
};

export default ProfileEdit;