
import PropTypes from 'prop-types';
import { useState } from 'react';
import { toast } from "sonner";

// --- API Hooks ---
import {
    useLoadUserQuery,
    useUpdateUserPasswordMutation
} from '@/features/api/authApi';

// --- UI Components & Icons ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
// NEW: Import Eye and EyeOff icons for the password toggle
import { Eye, EyeOff, Loader2 } from "lucide-react";
import ProfileSidebar from './ProfileSideBar';

// --- Import the Shared Sidebar Component ---
 // Adjust path if needed

// --- Main Account Security Page Component ---
const AccountSecurityPage = () => {

  // --- State for Password Form ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- NEW: State for password visibility ---
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // --- API Hooks ---
  const { data, isLoading: isUserLoading, isError, error } = useLoadUserQuery();
  const [updateUserPassword, { isLoading: isPasswordUpdating }] = useUpdateUserPasswordMutation();

  const user = data?.user;

  // --- Handler for Password Change Form Submission ---
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      await updateUserPassword({ currentPassword, newPassword }).unwrap();
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update password.");
    }
  };

  // --- Conditional Rendering ---
  if (isUserLoading) return <AccountSecurityPageSkeleton />;
  if (isError) return <AccountSecurityPageError error={error} />;

  return (
    <div className="bg-gray-50 dark:bg-black font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          <ProfileSidebar 
            user={user}
            previewImage={user?.photoUrl}
            isAvatarUpdating={false}
            activePage="security"
          />

          <main className="w-full md:w-3/4 bg-white dark:bg-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account</h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">Edit your account settings and change your password here.</p>
              
              <div className="mt-8 space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
                
                {/* Email Section (Button Removed) */}
                <section className="pt-8 first:pt-0">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Email:</h3>
                  <div>
                    <Input 
                      type="email" 
                      value={`Your email address is ${user?.email || ''}`} 
                      readOnly 
                      className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>
                </section>

                {/* Change Password Section with Visibility Toggle */}
                <form onSubmit={handlePasswordUpdate} className="pt-8">
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="text-sm font-semibold text-gray-800 dark:text-gray-200" htmlFor="current-password">Current password</label>
                      <div className="relative mt-2">
                        <Input 
                          id="current-password"
                          type={isCurrentPasswordVisible ? "text" : "password"} 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password" 
                          className="pr-10"
                          required
                        />
                        <button type="button" onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                          {isCurrentPasswordVisible ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                        </button>
                      </div>
                    </div>
                    {/* New Password */}
                    <div>
                      <label className="text-sm font-semibold text-gray-800 dark:text-gray-200" htmlFor="new-password">New password</label>
                       <div className="relative mt-2">
                        <Input 
                          id="new-password"
                          type={isNewPasswordVisible ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password" 
                          className="pr-10"
                          required
                        />
                         <button type="button" onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                          {isNewPasswordVisible ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                        </button>
                      </div>
                    </div>
                    {/* Confirm New Password */}
                    <div>
                      <label className="text-sm font-semibold text-gray-800 dark:text-gray-200" htmlFor="confirm-password">Confirm new password</label>
                      <div className="relative mt-2">
                        <Input 
                          id="confirm-password"
                          type={isConfirmPasswordVisible ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="pr-10"
                          required
                        />
                        <button type="button" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                          {isConfirmPasswordVisible ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button type="submit" disabled={isPasswordUpdating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {isPasswordUpdating ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing...</>
                      ) : (
                        "Change password"
                      )}
                    </Button>
                  </div>
                </form>

                {/* Multi-factor Authentication Section */}
                <section className="pt-8">
                    <div className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Multi-factor Authentication</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                            Increase your account security by requiring that a code emailed to you be entered when you log in. For more information, refer to our <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">Help Center article</a>.
                        </p>
                        <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" disabled>
                            Enable
                        </Button>
                    </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components for Loading and Error States ---
const AccountSecurityPageSkeleton = () => (
    <div className="bg-gray-50 dark:bg-black font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 animate-pulse">
          <aside className="w-full md:w-1/4 flex-shrink-0">
            <div className="flex flex-col items-center md:items-start space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="mt-8 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          </aside>
          <main className="w-full md:w-3/4 bg-white/50 dark:bg-gray-900/50 p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-72 mb-12" />
            <div className="space-y-8">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-4 pt-8 border-t border-gray-700">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
              <div className="space-y-4 pt-8 border-t border-gray-700">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-24 mt-2" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
);

const AccountSecurityPageError = ({ error }) => (
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

AccountSecurityPageError.propTypes = {
  error: PropTypes.object.isRequired,
};
export default AccountSecurityPage;