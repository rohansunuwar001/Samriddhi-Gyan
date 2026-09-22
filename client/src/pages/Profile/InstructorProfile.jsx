// file: src/pages/admin/course/InstructorProfile.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetUserInfoQuery, useUpdateUserInfoMutation, useUpdateUserAvatarMutation } from "@/features/api/authApi";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const LANGUAGES = [
  "English (US)",
  "English (UK)",
  "Español",
  "Français",
  "Deutsch",
  "Português",
  "日本語",
  "한국어",
  "中文"
];

const InstructorProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: userData, isLoading, refetch } = useGetUserInfoQuery();
  const [updateUserInfo, { isLoading: isUpdatingInfo }] = useUpdateUserInfoMutation();
  const [updateUserAvatar, { isLoading: isUpdatingAvatar }] = useUpdateUserAvatarMutation();

  // Determine active tab from URL path
  const getTabFromPath = (path) => {
    if (path.includes("/profile/photo")) return "photo";
    if (path.includes("/profile/privacy")) return "privacy";
    return "profile"; // default/basic-information
  };

  const activeTab = getTabFromPath(location.pathname);

  // Basic Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [biography, setBiography] = useState("");
  const [language, setLanguage] = useState("English (US)");

  // Social Links States
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Privacy States
  const [showProfileToLoggedIn, setShowProfileToLoggedIn] = useState(true);
  const [showCoursesTaking, setShowCoursesTaking] = useState(true);

  // Load user data
  useEffect(() => {
    if (userData?.user) {
      const u = userData.user;
      const nameParts = (u.name || "").trim().split(/\s+/);
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");

      setHeadline(u.headline || "");
      setBiography(u.description && u.description !== "This user has not provided a description." ? u.description : "");
      setLanguage(u.language || "English (US)");

      setWebsite(u.links?.website || "");
      setFacebook(u.links?.facebook || "");
      setInstagram(u.links?.instagram || "");
      setLinkedin(u.links?.linkedin || "");
      setTiktok(u.links?.tiktok || "");
      setTwitter(u.links?.twitter || "");
      setYoutube(u.links?.youtube || "");

      setAvatarPreview(u.photoUrl || "");

      if (u.privacy) {
        setShowProfileToLoggedIn(u.privacy.showProfileToLoggedIn !== false);
        setShowCoursesTaking(u.privacy.showCoursesTaking !== false);
      }
    }
  }, [userData]);

  const bioWordCount = biography.trim() ? biography.trim().split(/\s+/).length : 0;

  const handleTabChange = (tabId) => {
    const prefix = location.pathname.startsWith("/admin") ? "/admin" : "/instructor";
    if (tabId === "profile") navigate(`${prefix}/profile/basic-information/`);
    else if (tabId === "photo") navigate(`${prefix}/profile/photo/`);
    else if (tabId === "privacy") navigate(`${prefix}/profile/privacy/`);
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
        links: {
          website,
          facebook,
          instagram,
          linkedin,
          tiktok,
          twitter,
          youtube
        }
      }).unwrap();
      toast.success("Profile saved successfully.");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile.");
    }
  };

  const handleSaveAvatar = async (e) => {
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
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update picture.");
    }
  };

  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo({
        privacy: {
          showProfileToLoggedIn,
          showCoursesTaking
        }
      }).unwrap();
      toast.success("Privacy settings saved successfully.");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update privacy settings.");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabClass = (tabId) => `
    pb-3 text-xl font-extralight transition-all border-b-2 cursor-pointer whitespace-nowrap
    ${activeTab === tabId 
      ? "border-[#1c1d1f] text-[#1c1d1f] font-light" 
      : "border-transparent text-[#6a6f73] hover:text-[#1c1d1f]"}
  `;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 font-extralight text-lg text-[#1c1d1f]">
      {/* Page Title */}
      <h1 className="text-4xl font-semibold text-[#1c1d1f] mb-8 font-sans">Profile & settings</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#d1d7dc] mb-8 overflow-x-auto">
        <button onClick={() => handleTabChange("profile")} className={tabClass("profile")}>
          Samriddhi Gyan profile
        </button>
        <button onClick={() => handleTabChange("photo")} className={tabClass("photo")}>
          Profile picture
        </button>
        <button onClick={() => handleTabChange("privacy")} className={tabClass("privacy")}>
          Privacy settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left Column: Basic Info */}
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus:border-[#1c1d1f] outline-none py-3 px-4 text-base transition-colors font-light"
              />
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus:border-[#1c1d1f] outline-none py-3 px-4 text-base transition-colors font-light"
              />
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Headline</label>
              <div className="relative flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] transition-colors w-full font-light">
                <input
                  type="text"
                  maxLength={60}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Headline"
                  className="flex-1 px-4 py-3 text-base text-[#1c1d1f] outline-none bg-transparent pr-12"
                />
                <span className="absolute right-4 text-base text-[#6a6f73] pointer-events-none">
                  {60 - (headline?.length || 0)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Biography</label>
              {/* Mock biography Rich-text toolbar */}
              <div className="border border-[#6a6f73] border-b-0 bg-white px-4 py-2 flex gap-4 text-base font-semibold select-none text-slate-700">
                <button type="button" className="hover:text-black">B</button>
                <button type="button" className="italic hover:text-black">I</button>
              </div>
              <textarea
                rows={6}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder="Biography"
                className="w-full border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus:border-[#1c1d1f] outline-none py-3 px-4 text-base transition-colors resize-y font-light"
              />
              <div className="mt-2 text-sm text-[#6a6f73] leading-relaxed space-y-1">
                <p>
                  To help learners learn more about you, your bio should reflect your Credibility, Empathy, Passion, and Personality.
                </p>
                {bioWordCount < 50 && (
                  <p className="flex items-center gap-1 text-[#b4690e]">
                    Your biography should have at least 50 words, links and coupon codes are not permitted. Current count: {bioWordCount} words.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full md:w-80 border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus:border-[#1c1d1f] outline-none py-3 px-4 text-base transition-colors font-light"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isUpdatingInfo}
                className="bg-[#a435f0] hover:bg-[#8710d8] disabled:bg-[#d1d7dc] text-white text-base font-semibold py-3 px-6 transition-all h-12 flex items-center justify-center"
              >
                {isUpdatingInfo ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                Save
              </button>
            </div>
          </div>

          {/* Right Column: Social Links */}
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold mb-2">Website</label>
              <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] font-light">
                <span className="px-3 border-r border-[#6a6f73] text-[#6a6f73] bg-[#f7f9fa] py-3 text-base shrink-0">
                  URL
                </span>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="URL"
                  className="flex-1 px-4 py-3 text-base outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Facebook</label>
              <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] font-light">
                <span className="px-3 border-r border-[#6a6f73] text-[#6a6f73] bg-[#f7f9fa] py-3 text-base shrink-0">
                  facebook.com/
                </span>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="Username"
                  className="flex-1 px-4 py-3 text-base outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Instagram</label>
              <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] font-light">
                <span className="px-3 border-r border-[#6a6f73] text-[#6a6f73] bg-[#f7f9fa] py-3 text-base shrink-0">
                  instagram.com/
                </span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Username"
                  className="flex-1 px-4 py-3 text-base outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">LinkedIn</label>
              <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] font-light">
                <span className="px-3 border-r border-[#6a6f73] text-[#6a6f73] bg-[#f7f9fa] py-3 text-base shrink-0">
                  linkedin.com/
                </span>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="Public profile URL"
                  className="flex-1 px-4 py-3 text-base outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">TikTok</label>
              <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] font-light">
                <span className="px-3 border-r border-[#6a6f73] text-[#6a6f73] bg-[#f7f9fa] py-3 text-base shrink-0">
                  tiktok.com/
                </span>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@Username"
                  className="flex-1 px-4 py-3 text-base outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">X</label>
              <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] font-light">
                <span className="px-3 border-r border-[#6a6f73] text-[#6a6f73] bg-[#f7f9fa] py-3 text-base shrink-0">
                  x.com/
                </span>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="Username"
                  className="flex-1 px-4 py-3 text-base outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">YouTube</label>
              <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] font-light">
                <span className="px-3 border-r border-[#6a6f73] text-[#6a6f73] bg-[#f7f9fa] py-3 text-base shrink-0">
                  youtube.com/
                </span>
                <input
                  type="text"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="Username"
                  className="flex-1 px-4 py-3 text-base outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Profile Picture */}
      {activeTab === "photo" && (
        <form onSubmit={handleSaveAvatar} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-[#1c1d1f] font-sans">Image preview</h2>
            <p className="text-base text-[#6a6f73]">Minimum 200x200 pixels, Maximum 6000x6000 pixels</p>
          </div>

          <div className="w-[300px] h-[300px] border border-[#d1d7dc] flex items-center justify-center bg-white p-4">
            <div className="w-[240px] h-[240px] rounded-full border border-gray-400 overflow-hidden flex items-center justify-center bg-[#f7f9fa]">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-32 h-32 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
          </div>

          <div className="flex max-w-xl font-light">
            <div className="flex-1 border border-[#6a6f73] bg-white py-3 px-4 text-base text-[#6a6f73] truncate flex items-center">
              {avatarFile ? avatarFile.name : "No file selected"}
            </div>
            <label className="border border-[#1c1d1f] hover:bg-[#f7f9fa] text-[#1c1d1f] text-base font-semibold py-3 px-6 cursor-pointer whitespace-nowrap select-none shrink-0 flex items-center justify-center">
              Upload image
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isUpdatingAvatar || !avatarFile}
              className="bg-[#a435f0] hover:bg-[#8710d8] disabled:bg-[#d1d7dc] disabled:text-[#6a6f73] text-white text-base font-semibold py-3 px-6 transition-all h-12 flex items-center justify-center"
            >
              {isUpdatingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Save
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Privacy Settings */}
      {activeTab === "privacy" && (
        <form onSubmit={handleSavePrivacy} className="space-y-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showProfileToLoggedIn}
                onChange={(e) => setShowProfileToLoggedIn(e.target.checked)}
                className="w-5 h-5 accent-[#a435f0] shrink-0 mt-0.5 border-[#6a6f73] rounded"
              />
              <span className="text-base font-light text-[#1c1d1f]">
                Show your profile to logged-in users
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCoursesTaking}
                onChange={(e) => setShowCoursesTaking(e.target.checked)}
                className="w-5 h-5 accent-[#a435f0] shrink-0 mt-0.5 border-[#6a6f73] rounded"
              />
              <span className="text-base font-light text-[#1c1d1f]">
                Show courses you're taking on your profile page
              </span>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isUpdatingInfo}
              className="bg-[#a435f0] hover:bg-[#8710d8] disabled:bg-[#d1d7dc] text-white text-base font-semibold py-3 px-6 transition-all h-12 flex items-center justify-center"
            >
              {isUpdatingInfo ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InstructorProfile;
