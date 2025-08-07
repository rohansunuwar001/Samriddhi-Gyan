
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

// --- API Hooks ---


// --- UI Components & Icons ---
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, User as UserIcon } from "lucide-react";

// --- Import the Shared Sidebar Component ---

import { useLoadUserQuery, useUpdateUserAvatarMutation } from '@/features/api/authApi';
import ProfileSidebar from './ProfileSideBar';

// --- Main Photo Page Component ---
const PhotoPage = () => {
  const navigate = useNavigate();

  // --- State for this specific page ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const fileInputRef = useRef(null); // Ref for the hidden file input

  // --- API Hooks ---
  const { data, isLoading: isUserLoading, isError, error } = useLoadUserQuery();
  const [updateUserAvatar, { isLoading: isAvatarUpdating }] = useUpdateUserAvatarMutation();

  const user = data?.user;

  // Effect to set the initial preview image from the user's current photo
  useEffect(() => {
    if (user?.photoUrl) {
      setPreviewImage(user.photoUrl);
    }
  }, [user]);

  // Handler for when a user selects a file from the dialog
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Store the actual file object
      setPreviewImage(URL.createObjectURL(file)); // Set the preview to the new file
    }
  };

  // Handler for the main "Save" button
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image to upload.");
      return;
    }
    const formData = new FormData();
    // The key 'profilePhoto' must match your backend's multer middleware: upload.single('profilePhoto')
    formData.append('profilePhoto', selectedFile);

    try {
      await updateUserAvatar(formData).unwrap();
      toast.success("Photo updated successfully!");
      navigate('/profile'); // Navigate to the main profile page on success
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update photo.");
      // If the upload fails, revert the preview back to the original photo
      setPreviewImage(user?.photoUrl || "");
      setSelectedFile(null);
    }
  };

  if (isUserLoading) return <ProfilePhotoPageSkeleton />;
  if (isError) return <ProfilePhotoPageError error={error} />;

  return (
    <div className="bg-gray-50 dark:bg-black font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* --- Render the Sidebar --- */}
          {/* Note: The sidebar's own photo logic is separate from this page's logic */}
          <ProfileSidebar 
            user={user}
            previewImage={user?.photoUrl} // The sidebar always shows the *current* saved photo
            isAvatarUpdating={false} // The main page handles the loading state
            fileInputRef={null} // Not used here
            onPhotoChange={() => {}} // Not used here
            activePage="photo" // Set the "Photo" link as active
          />

          {/* --- Main Content Area for Photo Upload --- */}
          <main className="w-full md:w-3/4 bg-white dark:bg-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Photo</h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Add a nice photo of yourself for your profile.</p>

              <div className="mt-8 space-y-8">
                {/* --- Image Preview Section --- */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Image preview</h3>
                  <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt="Profile preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center text-gray-500">
                        <UserIcon className="mx-auto h-24 w-24" />
                      </div>
                    )}
                  </div>
                </div>

                {/* --- File Upload Section --- */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Add / Change Image</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">
                      {selectedFile ? selectedFile.name : "No file selected"}
                    </div>
                    {/* This button opens the hidden file input */}
                    <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                      Upload Image
                    </Button>
                  </div>
                  {/* The actual file input is hidden from the user */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                  />
                </div>

                {/* --- Action Button --- */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-start">
                   <Button onClick={handleUpload} disabled={isAvatarUpdating}>
                    {isAvatarUpdating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components for Loading and Error States ---
const ProfilePhotoPageSkeleton = () => (
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
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-72 mb-12" />
            <div className="space-y-8">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-24" />
            </div>
          </main>
        </div>
      </div>
    </div>
);

const ProfilePhotoPageError = ({ error }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-8 text-center">
      <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        Failed to Load Data
      </h2>
      <p className="text-red-600 dark:text-red-400 mb-6">
        {error?.data?.message || "An error occurred."}
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

ProfilePhotoPageError.propTypes = {
  error: PropTypes.object.isRequired,
};

export default PhotoPage;