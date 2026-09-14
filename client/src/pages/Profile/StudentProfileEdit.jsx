import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { userLoggedOut } from "@/features/authSlice";
import {
  useGetUserInfoQuery,
  useUpdateUserInfoMutation,
  useUpdateUserAvatarMutation,
  useUpdateUserPasswordMutation,
  useDeleteAccountMutation,
} from "@/features/api/authApi";
import { useGetSubscriptionPlansQuery } from "@/features/api/subscriptionPlansApi";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  User,
  ShieldCheck,
  Check,
  Upload,
  Globe,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LANGUAGES = [
  "English (US)", "English (UK)", "Español", "Français",
  "Deutsch", "Português", "日本語", "한국어", "中文",
];

const getWordCount = (text) => {
  const clean = text.replace(/<[^>]*>/g, " ").trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
};

const StudentProfileEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const getTabFromPath = (path) => {
    if (path.includes("/edit-photo")) return "photo";
    if (path.includes("/edit-account")) return "security";
    if (path.includes("/manage-subscriptions")) return "subscriptions";
    if (path.includes("/edit-payment-methods")) return "payment";
    if (path.includes("/edit-privacy")) return "privacy";
    if (path.includes("/edit-notification-preferences")) return "notifications";
    if (path.includes("/edit-api-clients")) return "api";
    if (path.includes("/close-account")) return "close";
    return "profile";
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const dispatch = useDispatch();
  const { data: userData, isLoading, refetch } = useGetUserInfoQuery();
  const [updateUserInfo, { isLoading: isSavingInfo }] = useUpdateUserInfoMutation();
  const [updateUserAvatar, { isLoading: isSavingAvatar }] = useUpdateUserAvatarMutation();
  const [updateUserPassword, { isLoading: isSavingPwd }] = useUpdateUserPasswordMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();
  const { data: plansData } = useGetSubscriptionPlansQuery();

  const user = userData?.user;
  const plans = plansData?.plans || [];

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [biography, setBiography] = useState("");
  const [language, setLanguage] = useState("English (US)");
  
  // Links
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  // Photo
  const fileInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Password Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Privacy
  const [showProfileToLoggedIn, setShowProfileToLoggedIn] = useState(true);
  const [showCoursesTaking, setShowCoursesTaking] = useState(true);

  // Notification Preferences
  const [updatesOfferingsEnabled, setUpdatesOfferingsEnabled] = useState(true);
  const [productLaunches, setProductLaunches] = useState(true);
  const [offersPromotions, setOffersPromotions] = useState(true);

  const [learningNotificationsEnabled, setLearningNotificationsEnabled] = useState(true);
  const [learningStats, setLearningStats] = useState(true);
  const [inspiration, setInspiration] = useState(true);
  const [recommendations, setRecommendations] = useState(true);
  const [instructorNotifs, setInstructorNotifs] = useState(true);

  // Payment Methods
  const [showSavedPaymentMethods, setShowSavedPaymentMethods] = useState(true);

  // Populate data
  useEffect(() => {
    if (!user) return;
    const parts = (user.name || "").split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setHeadline(user.headline || "");
    setBiography(user.description && user.description !== "This user has not provided a description." ? user.description : "");
    setLanguage(user.language || "English (US)");
    setWebsite(user.links?.website || "");
    setFacebook(user.links?.facebook || "");
    setInstagram(user.links?.instagram || "");
    setLinkedin(user.links?.linkedin || "");
    setTiktok(user.links?.tiktok || "");
    setTwitter(user.links?.twitter || "");
    setYoutube(user.links?.youtube || "");
    setShowProfileToLoggedIn(user.privacy?.showProfileToLoggedIn ?? true);
    setShowCoursesTaking(user.privacy?.showCoursesTaking ?? true);
    if (user.photoUrl) setAvatarPreview(user.photoUrl);
  }, [user]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const pathMap = {
      profile: "/user/edit-profile/",
      photo: "/user/edit-photo/",
      security: "/user/edit-account/",
      subscriptions: "/user/manage-subscriptions/",
      payment: "/user/edit-payment-methods/",
      privacy: "/user/edit-privacy/",
      notifications: "/user/edit-notification-preferences/",
      api: "/user/edit-api-clients/",
      close: "/user/close-account/",
    };
    navigate(pathMap[tabId] || "/user/edit-profile/");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      toast.error("Please enter your name.");
      return;
    }
    try {
      await updateUserInfo({
        name: fullName,
        headline,
        description: biography,
        language,
        links: { website, facebook, instagram, linkedin, tiktok, twitter, youtube },
      }).unwrap();
      toast.success("Profile saved successfully.");
      refetch();
    } catch {
      toast.error("Failed to save profile.");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      toast.error("Please select a profile picture first.");
      return;
    }
    const formData = new FormData();
    formData.append("profilePhoto", avatarFile);
    try {
      await updateUserAvatar(formData).unwrap();
      toast.success("Profile picture updated successfully.");
      setAvatarFile(null);
      refetch();
    } catch {
      toast.error("Failed to update profile picture.");
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    try {
      await updateUserPassword({ newPassword, confirmPassword }).unwrap();
      toast.success("Password changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to change password.");
    }
  };

  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo({
        privacy: { showProfileToLoggedIn, showCoursesTaking },
      }).unwrap();
      toast.success("Privacy settings saved successfully.");
      refetch();
    } catch {
      toast.error("Failed to save privacy settings.");
    }
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    toast.success("Notification preferences saved successfully.");
  };

  const initials = (user?.name || "SG")
    .split(" ").map((n) => n[0]).join("").toUpperCase();

  const bioWordCount = getWordCount(biography);
  const bioMeetsRequirement = bioWordCount >= 50;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin w-8 h-8 text-purple-600" />
      </div>
    );
  }

  // Generate public profile URL slug dynamically
  const usernameSlug = user?.name
    ? `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${user._id}`
    : "user";

  const Sidebar = () => (
    <aside className="w-full lg:w-64 shrink-0 font-sans p-6">
      <div className="flex flex-col items-center pb-6 border-b border-gray-200">
        <Avatar className="h-28 w-28 border border-gray-200">
          <AvatarImage src={avatarPreview || user?.photoUrl} alt={user?.name} className="object-cover" />
          <AvatarFallback className="text-4xl font-normal text-white bg-[#1c1d1f]">{initials}</AvatarFallback>
        </Avatar>
        <p className="mt-3 text-lg font-normal text-[#1c1d1f]">{user?.name}</p>
      </div>

      <nav className="mt-4 flex flex-col">
        <Link
          to={`/user/${usernameSlug}`}
          className="block px-4 py-2.5 text-base text-[#5624d0] hover:text-[#401b9c] font-light border-b border-gray-100"
        >
          View public profile
        </Link>
        {[
          { id: "profile", label: "Profile", tab: "profile" },
          { id: "photo", label: "Photo", tab: "photo" },
          { id: "security", label: "Account Security", tab: "security" },
          { id: "subscriptions", label: "Subscriptions", tab: "subscriptions" },
          { id: "payment", label: "Payment methods", tab: "payment" },
          { id: "privacy", label: "Privacy", tab: "privacy" },
          { id: "notifications", label: "Notification Preferences", tab: "notifications" },
          { id: "api", label: "API clients", tab: "api" },
          { id: "close", label: "Close account", tab: "close" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.tab)}
            className={`w-full text-left px-4 py-2.5 text-base transition-colors border-l-[3px] ${
              activeTab === item.tab
                ? "border-[#1c1d1f] bg-[#f7f9fa] font-normal text-[#1c1d1f]"
                : "border-transparent font-normal text-[#2d2f31] hover:bg-[#f7f9fa]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-[#1c1d1f]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-0 border border-[#d1d7dc]">
          <Sidebar />

          <div className="flex-1 min-w-0 border-l border-[#d1d7dc] p-10 bg-white">
            {/* Tab: Profile */}
            {activeTab === "profile" && (
              <div>
                <div className="border-b border-gray-200 pb-5 mb-8 text-center">
                  <h1 className="text-3xl font-normal">Public profile</h1>
                  <p className="text-base text-gray-500 mt-1">Add information about yourself</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-8 max-w-[700px]">
                  <div>
                    <h2 className="text-base font-normal mb-3">Basics:</h2>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full border border-[#d1d7dc] px-4 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full border border-[#d1d7dc] px-4 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                      />
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Headline"
                          value={headline}
                          maxLength={60}
                          onChange={(e) => setHeadline(e.target.value)}
                          className="w-full border border-[#d1d7dc] px-4 py-2.5 pr-12 text-base focus:outline-none focus:border-[#1c1d1f]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          {60 - headline.length}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Add a professional headline like, "Instructor at Samriddhi Gyan" or "Architect."
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-normal mb-3">Biography</h2>
                    <div className="border border-[#d1d7dc] border-b-0 px-3 py-2 flex gap-3 bg-white">
                      <button type="button" onClick={() => document.execCommand("bold")} className="font-normal text-base">B</button>
                      <button type="button" onClick={() => document.execCommand("italic")} className="italic text-base">I</button>
                    </div>
                    <textarea
                      value={biography}
                      onChange={(e) => setBiography(e.target.value)}
                      placeholder="Biography"
                      rows={5}
                      className="w-full border border-[#d1d7dc] px-4 py-3 text-base focus:outline-none focus:border-[#1c1d1f] resize-none"
                    />
                    {!bioMeetsRequirement && biography.trim().length > 0 && (
                      <p className="text-sm text-[#c91a0f] mt-1">
                        Your biography should have at least 50 words, links and coupon codes are not permitted. Current count: {bioWordCount} words.
                      </p>
                    )}
                    {biography.trim().length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Links and coupon codes are not permitted in this section.
                      </p>
                    )}
                  </div>

                  <div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border border-[#d1d7dc] px-4 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f] bg-white"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h2 className="text-base font-normal mb-3">Links:</h2>
                    <div className="space-y-3">
                      <input
                        type="url"
                        placeholder="Website (https://...)"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full border border-[#d1d7dc] px-4 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                      />
                      <div>
                        <div className="flex">
                          <span className="border border-r-0 border-[#d1d7dc] px-3 py-2.5 text-base text-gray-500 bg-gray-50 whitespace-nowrap">facebook.com/</span>
                          <input
                            type="text"
                            placeholder="Username"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className="flex-1 border border-[#d1d7dc] px-3 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Input your Facebook username (e.g. johnsmith).</p>
                      </div>
                      <div>
                        <div className="flex">
                          <span className="border border-r-0 border-[#d1d7dc] px-3 py-2.5 text-base text-gray-500 bg-gray-50 whitespace-nowrap">instagram.com/</span>
                          <input
                            type="text"
                            placeholder="Username"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="flex-1 border border-[#d1d7dc] px-3 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Input your Instagram username (e.g. johnsmith).</p>
                      </div>
                      <div>
                        <div className="flex">
                          <span className="border border-r-0 border-[#d1d7dc] px-3 py-2.5 text-base text-gray-500 bg-gray-50 whitespace-nowrap">linkedin.com/</span>
                          <input
                            type="text"
                            placeholder="Public Profile URL"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="flex-1 border border-[#d1d7dc] px-3 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Input your LinkedIn public profile URL (e.g. in/johnsmith, company/Samriddhi Gyan).</p>
                      </div>
                      <div>
                        <div className="flex">
                          <span className="border border-r-0 border-[#d1d7dc] px-3 py-2.5 text-base text-gray-500 bg-gray-50 whitespace-nowrap">tiktok.com/</span>
                          <input
                            type="text"
                            placeholder="@Username"
                            value={tiktok}
                            onChange={(e) => setTiktok(e.target.value)}
                            className="flex-1 border border-[#d1d7dc] px-3 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Input your TikTok username (e.g. @johnsmith).</p>
                      </div>
                      <div>
                        <div className="flex">
                          <span className="border border-r-0 border-[#d1d7dc] px-3 py-2.5 text-base text-gray-500 bg-gray-50 whitespace-nowrap">x.com/</span>
                          <input
                            type="text"
                            placeholder="Username"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            className="flex-1 border border-[#d1d7dc] px-3 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Add your X username (e.g. johnsmith).</p>
                      </div>
                      <div>
                        <div className="flex">
                          <span className="border border-r-0 border-[#d1d7dc] px-3 py-2.5 text-base text-gray-500 bg-gray-50 whitespace-nowrap">youtube.com/</span>
                          <input
                            type="text"
                            placeholder="Username"
                            value={youtube}
                            onChange={(e) => setYoutube(e.target.value)}
                            className="flex-1 border border-[#d1d7dc] px-3 py-2.5 text-base focus:outline-none focus:border-[#1c1d1f]"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Input your Youtube username (e.g. johnsmith).</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-base font-normal px-5 py-2.5 flex items-center gap-2 transition-colors"
                  >
                    {isSavingInfo && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Photo */}
            {activeTab === "photo" && (
              <div>
                <div className="border-b border-gray-200 pb-5 mb-8 text-center">
                  <h1 className="text-3xl font-normal">Photo</h1>
                  <p className="text-base text-gray-500 mt-1">Add a nice photo of yourself for your profile.</p>
                </div>

                <form onSubmit={handleSavePhoto} className="max-w-[700px] space-y-6">
                  <div>
                    <p className="text-base font-normal mb-3">Image preview</p>
                    <div className="border border-[#d1d7dc] bg-[#f7f9fa] flex items-center justify-center h-52 w-full max-w-sm">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User className="w-24 h-24 text-gray-300" strokeWidth={1} />
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-base font-normal mb-3">Add / Change Image</p>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={avatarFile ? avatarFile.name : "No file selected"}
                        className="flex-1 border border-r-0 border-[#d1d7dc] px-4 py-2.5 text-base text-gray-500 bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-[#a435f0] text-[#a435f0] hover:bg-purple-50 px-4 py-2.5 text-base font-normal flex items-center gap-2 transition-colors whitespace-nowrap"
                      >
                        Upload image
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingAvatar || !avatarFile}
                    className="bg-[#a435f0] hover:bg-[#8710d8] disabled:opacity-50 text-white text-base font-normal px-5 py-2.5 flex items-center gap-2 transition-colors"
                  >
                    {isSavingAvatar && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Account Security */}
            {activeTab === "security" && (
              <div>
                <div className="border-b border-gray-200 pb-5 mb-8 text-center">
                  <h1 className="text-3xl font-normal">Account</h1>
                  <p className="text-base text-gray-500 mt-1">Edit your account settings and change your password here.</p>
                </div>

                <div className="max-w-[700px] space-y-8">
                  <div className="border-b border-gray-200 pb-6">
                    <label className="text-base font-normal block mb-2">Email:</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border border-[#d1d7dc] px-4 py-2.5 text-base text-gray-600 bg-[#f7f9fa]">
                        Your email address is <span className="font-normal text-[#1c1d1f]">{user?.email}</span>
                      </div>
                      <button
                        type="button"
                        className="border border-[#d1d7dc] p-2.5 text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={() => toast.info("Email editing is disabled.")}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSavePassword} className="space-y-4">
                    <div>
                      <label className="text-base font-normal block mb-2">New password</label>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full border border-[#d1d7dc] px-4 py-2.5 pr-11 text-base focus:outline-none focus:border-[#1c1d1f]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-base font-normal block mb-2">Confirm new password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Re-type new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-[#d1d7dc] px-4 py-2.5 pr-11 text-base focus:outline-none focus:border-[#1c1d1f]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPwd || !newPassword || !confirmPassword}
                      className="bg-[#a435f0] hover:bg-[#8710d8] disabled:opacity-50 text-white text-base font-normal px-5 py-2.5 flex items-center gap-2 transition-colors"
                    >
                      {isSavingPwd && <Loader2 className="w-4 h-4 animate-spin" />}
                      Change password
                    </button>
                  </form>

                  <div className="border border-[#d1d7dc] p-6">
                    <h3 className="text-base font-normal mb-2">Multi-factor Authentication</h3>
                    <p className="text-base text-gray-600 mb-4 leading-relaxed">
                      Increase your account security by requiring that a code emailed to you be entered
                      when you log in. For more information on how multi-factor authentication works,
                      refer to our <a href="#" className="text-[#5624d0] hover:underline">Help Center article</a>.
                    </p>
                    <button
                      type="button"
                      onClick={() => toast.info("MFA is not enabled for your region.")}
                      className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-base font-normal px-5 py-2.5 transition-colors"
                    >
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Subscriptions */}
            {activeTab === "subscriptions" && (
              <div>
                <div className="pb-5 mb-8">
                  <h1 className="text-4xl font-normal">Subscriptions</h1>
                  <p className="text-base text-gray-500 mt-1">Manage your Samriddhi Gyan subscriptions</p>
                </div>

                <div className="mb-10">
                  <h2 className="text-lg font-normal mb-4">Active plans</h2>
                  <div className="border border-dashed border-[#d1d7dc] p-8">
                    {user?.subscription && user.subscription.status === "active" ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-normal">{user.subscription.planName || "Personal Plan"}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {user.subscription.startsAt && user.subscription.expiresAt
                              ? `${new Date(user.subscription.startsAt).toLocaleDateString()} – ${new Date(user.subscription.expiresAt).toLocaleDateString()}`
                              : "Subscription period active"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-normal text-green-700 bg-green-50 border border-green-200 px-2.5 py-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      </div>
                    ) : (
                      <p className="text-base text-gray-500 text-center">You don't have any active subscriptions</p>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-normal mb-4">Subscription plans available</h2>
                  <div className="flex flex-col lg:flex-row gap-0 border border-[#d1d7dc] overflow-hidden">
                    <div className="flex-1 p-6">
                      <h3 className="text-lg font-normal mb-3">{plans[0]?.name || "Personal Plan"}</h3>
                      <p className="text-base text-gray-600 mb-4">
                        New opportunities await. Sign up for Personal Plan to get all this and more:
                      </p>
                      <ul className="space-y-2 mb-6">
                        {(plans[0]?.features || [
                          "Access to 28,000+ top courses",
                          "Courses in tech, business, and more",
                          "Practice tests, exercises, and Q&A",
                        ]).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-base text-gray-600">
                            <Check className="w-4 h-4 text-[#5624d0] mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => navigate("/subscribe")}
                          className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-base font-normal px-5 py-2.5 transition-colors"
                        >
                          Subscribe
                        </button>
                        <Link to="/subscribe" className="text-base font-light text-[#1c1d1f] hover:text-[#5624d0]">
                          Learn more
                        </Link>
                      </div>
                      <p className="text-sm text-gray-400 mt-4">
                        Starting at Rs {plans[0]?.price || "999"} per month. Cancel anytime.
                      </p>
                    </div>
                    <div className="bg-[#e8f9f5] lg:w-64 flex items-center justify-center p-6">
                      <ShieldCheck className="w-20 h-20 text-[#00b8a9]" strokeWidth={1} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Payment methods */}
            {activeTab === "payment" && (
              <div>
                <div className="pb-5 mb-8 border-b border-gray-200">
                  <h1 className="text-4xl font-normal">Payment methods</h1>
                </div>

                <div className="max-w-[700px] space-y-6">
                  <div className="flex items-start gap-3 bg-[#f7f9fa] p-4 border border-[#d1d7dc]">
                    <input
                      type="checkbox"
                      id="showSavedPaymentMethods"
                      checked={showSavedPaymentMethods}
                      onChange={(e) => setShowSavedPaymentMethods(e.target.checked)}
                      className="mt-1 accent-[#a435f0]"
                    />
                    <label htmlFor="showSavedPaymentMethods" className="text-base font-normal text-gray-700">
                      Show my saved payment methods on the checkout step.
                    </label>
                  </div>

                  <div>
                    <h2 className="text-lg font-normal mb-4">Your saved payment methods</h2>
                    <div className="border border-dashed border-[#d1d7dc] p-12 text-center text-gray-500 text-base">
                      You don't have any saved payment method
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Privacy */}
            {activeTab === "privacy" && (
              <div>
                <div className="border-b border-gray-200 pb-5 mb-8 text-center">
                  <h1 className="text-3xl font-normal">Privacy</h1>
                  <p className="text-base text-gray-500 mt-1">Modify your privacy settings here.</p>
                </div>

                <form onSubmit={handleSavePrivacy} className="max-w-[700px] space-y-6">
                  <div>
                    <p className="text-base font-normal mb-4">Profile page settings</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showProfileToLoggedIn"
                          checked={showProfileToLoggedIn}
                          onChange={(e) => setShowProfileToLoggedIn(e.target.checked)}
                          className="accent-[#a435f0] w-4.5 h-4.5"
                        />
                        <label htmlFor="showProfileToLoggedIn" className="text-base font-normal text-gray-700">
                          Show your profile to logged-in users
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showCoursesTaking"
                          checked={showCoursesTaking}
                          onChange={(e) => setShowCoursesTaking(e.target.checked)}
                          className="accent-[#a435f0] w-4.5 h-4.5"
                        />
                        <label htmlFor="showCoursesTaking" className="text-base font-normal text-gray-700">
                          Show courses you're taking on your profile page
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="bg-[#a435f0] hover:bg-[#8710d8] disabled:opacity-50 text-white text-base font-normal px-5 py-2.5 flex items-center gap-2 transition-colors"
                  >
                    {isSavingInfo && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Notification Preferences */}
            {activeTab === "notifications" && (
              <div>
                <div className="border-b border-gray-200 pb-5 mb-8 text-center">
                  <h1 className="text-3xl font-normal">Notification preferences</h1>
                  <p className="text-base text-gray-500 mt-1">Manage the types of communications you receive.</p>
                </div>

                <form onSubmit={handleSaveNotifications} className="max-w-[700px] space-y-6">
                  {/* Updates and Offerings */}
                  <div className="border border-[#d1d7dc] p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-normal">Updates and offerings</span>
                      <button
                        type="button"
                        onClick={() => setUpdatesOfferingsEnabled(!updatesOfferingsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          updatesOfferingsEnabled ? "bg-[#7b7e80]" : "bg-gray-250"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            updatesOfferingsEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    {updatesOfferingsEnabled && (
                      <div className="space-y-3 pl-2 pt-2 border-t border-gray-150">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="prodLaunches"
                            checked={productLaunches}
                            onChange={(e) => setProductLaunches(e.target.checked)}
                            className="accent-[#a435f0] w-4 h-4"
                          />
                          <label htmlFor="prodLaunches" className="text-base font-normal text-gray-600">
                            Product launches and announcements
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="offersPromos"
                            checked={offersPromotions}
                            onChange={(e) => setOffersPromotions(e.target.checked)}
                            className="accent-[#a435f0] w-4 h-4"
                          />
                          <label htmlFor="offersPromos" className="text-base font-normal text-gray-600">
                            Offers and promotions
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Your Learning */}
                  <div className="border border-[#d1d7dc] p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-normal">Your learning</span>
                      <button
                        type="button"
                        onClick={() => setLearningNotificationsEnabled(!learningNotificationsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          learningNotificationsEnabled ? "bg-[#7b7e80]" : "bg-gray-250"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            learningNotificationsEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    {learningNotificationsEnabled && (
                      <div className="space-y-3 pl-2 pt-2 border-t border-gray-150">
                        {[
                          { id: "stats", label: "Learning stats", val: learningStats, setter: setLearningStats },
                          { id: "insp", label: "Inspiration (tips, stories, etc.)", val: inspiration, setter: setInspiration },
                          { id: "recs", label: "Course recommendations", val: recommendations, setter: setRecommendations },
                          { id: "inst", label: "Notifications from instructors", val: instructorNotifs, setter: setInstructorNotifs },
                        ].map(({ id, label, val, setter }) => (
                          <div key={id} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={id}
                              checked={val}
                              onChange={(e) => setter(e.target.checked)}
                              className="accent-[#a435f0] w-4 h-4"
                            />
                            <label htmlFor={id} className="text-base font-normal text-gray-600">
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    Note: It may take a few hours for changes to be reflected in your preferences. You'll still receive transactional emails related to your account and purchases if you unsubscribe.
                  </p>

                  <button
                    type="submit"
                    className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-base font-normal px-5 py-2.5 transition-colors"
                  >
                    Save
                  </button>
                </form>
              </div>
            )}

            {/* Tab: API Clients */}
            {activeTab === "api" && (
              <div>
                <div className="border-b border-gray-200 pb-5 mb-8 text-center">
                  <h1 className="text-3xl font-normal">API Clients</h1>
                  <p className="text-base text-gray-500 mt-1">Create and list your API clients.</p>
                </div>

                <div className="max-w-[700px] space-y-6">
                  <div>
                    <h2 className="text-2xl font-normal mb-3">Affiliate API</h2>
                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                      The Samriddhi Gyan Affiliate API exposes functionalities of Samriddhi Gyan to help developers build
                      client applications and integrations with Samriddhi Gyan. To see more details, please visit{" "}
                      <a href="#" className="text-[#5624d0] underline font-light">
                        Samriddhi Gyan Affiliate API
                      </a>
                    </p>

                    <button
                      type="button"
                      className="border border-[#a435f0] text-[#a435f0] hover:bg-purple-50 px-5 py-2.5 text-base font-normal transition-colors"
                    >
                      Request Affiliate API Client
                    </button>
                  </div>

                  {/* Alert box with info icon */}
                  <div className="flex items-center gap-4 border border-[#d1d7dc] p-5 rounded-md bg-white">
                    <Info className="w-6 h-6 text-[#1c1d1f] shrink-0" />
                    <span className="text-base font-normal">You don't have any API clients yet.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Close Account */}
            {activeTab === "close" && (
              <div>
                <div className="border-b border-gray-200 pb-5 mb-8 text-center">
                  <h1 className="text-3xl font-normal">Close Account</h1>
                  <p className="text-base text-gray-500 mt-1">Close your account permanently.</p>
                </div>

                <div className="max-w-[700px] space-y-5">
                  <p className="text-base leading-relaxed">
                    <span className="text-[#b32d0f] font-normal">Warning:</span> If you close your account, you will be unsubscribed from all <span className="font-normal">0</span> of your courses and will lose access to your account and data associated with your account forever, even if you choose to create a new account using the same email address in the future.
                  </p>
                  <p className="text-base text-gray-650 leading-relaxed">
                    Please note, if you want to reinstate your account after submitting a deletion request, you will have 14 days after the initial submission date to reach out to <a href="mailto:privacy@Samriddhi Gyan.com" className="text-[#5624d0] hover:underline">privacy@Samriddhi Gyan.com</a> to cancel this request.
                  </p>

                  <button
                    type="button"
                    disabled={isDeletingAccount}
                    onClick={async () => {
                      const confirmed = window.confirm(
                        "Are you absolutely sure you want to permanently delete your account and personal data? This action cannot be undone."
                      );
                      if (!confirmed) return;
                      try {
                        await deleteAccount().unwrap();
                        localStorage.removeItem("authToken");
                        dispatch(userLoggedOut());
                        toast.success("Your account and associated personal data have been deleted.");
                        navigate("/");
                      } catch (err) {
                        toast.error(err?.data?.message || "Failed to delete account. Please try again.");
                      }
                    }}
                    className="bg-[#b32d0f] hover:bg-[#8f240c] text-white text-base font-normal px-5 py-2.5 transition-colors disabled:opacity-50"
                  >
                    {isDeletingAccount ? "Deleting account..." : "Close account permanently"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileEdit;
