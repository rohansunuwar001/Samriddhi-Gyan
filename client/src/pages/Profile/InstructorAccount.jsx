// file: src/pages/admin/course/InstructorAccount.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetUserInfoQuery } from "@/features/api/authApi";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

const InstructorAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: userData, isLoading } = useGetUserInfoQuery();
  const user = userData?.user;

  // Determine active tab from URL path
  const getTabFromPath = (path) => {
    if (path.includes("/account/notifications")) return "notifications";
    if (path.includes("/account/messages")) return "messages";
    if (path.includes("/account/api-clients")) return "api";
    return "security"; // default
  };

  const activeTab = getTabFromPath(location.pathname);

  // States
  const [instructorNotif, setInstructorNotif] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  const [instructorAnnouncements, setInstructorAnnouncements] = useState(true);
  const [noEmails, setNoEmails] = useState(false);

  const [turnOffDirectMessaging, setTurnOffDirectMessaging] = useState(false);

  // API Clients list (mock data matching Samriddhi Gyan's interface)
  const [apiClients, setApiClients] = useState([]);

  const handleTabChange = (tabId) => {
    const prefix = location.pathname.startsWith("/admin") ? "/admin" : "/instructor";
    if (tabId === "security") navigate(`${prefix}/account/security/`);
    else if (tabId === "notifications") navigate(`${prefix}/account/notifications/`);
    else if (tabId === "messages") navigate(`${prefix}/account/messages/`);
    else if (tabId === "api") navigate(`${prefix}/account/api-clients/`);
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    toast.success("Notification preferences saved successfully.");
  };

  const handleSaveMessages = (e) => {
    e.preventDefault();
    toast.success("Direct messaging settings saved successfully.");
  };

  const tabClass = (tabId) => `
    pb-3 text-sm sm:text-base font-light transition-all border-b-2 cursor-pointer whitespace-nowrap
    ${activeTab === tabId 
      ? "border-[#1c1d1f] text-[#1c1d1f] font-normal" 
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
    <div className="max-w-4xl mx-auto py-10 px-6 font-light text-base text-[#1c1d1f]">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-[#1c1d1f] mb-8 font-sans">Account</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#d1d7dc] mb-8 overflow-x-auto">
        <button onClick={() => handleTabChange("security")} className={tabClass("security")}>
          Account security
        </button>
        <button onClick={() => handleTabChange("notifications")} className={tabClass("notifications")}>
          Notifications settings
        </button>
        <button onClick={() => handleTabChange("messages")} className={tabClass("messages")}>
          Communications
        </button>
        <button onClick={() => handleTabChange("api")} className={tabClass("api")}>
          API clients
        </button>
        <button disabled className="pb-3 text-sm sm:text-base font-light border-b-2 border-transparent text-[#d1d7dc] cursor-not-allowed whitespace-nowrap">
          GenAI program
        </button>
        <button disabled className="pb-3 text-sm sm:text-base font-light border-b-2 border-transparent text-[#d1d7dc] cursor-not-allowed whitespace-nowrap">
          Close account
        </button>
      </div>

      {/* Tab 1: Account Security */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-[600px]">
          <div>
            <label className="block text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              readOnly
              value={user?.email || ""}
              className="w-full border border-[#d1d7dc] bg-gray-50 text-gray-500 py-3 px-4 text-sm font-normal outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Password:</label>
            <div className="flex items-center border border-[#6a6f73] bg-white hover:border-[#1c1d1f] focus-within:border-[#1c1d1f] transition-colors w-full font-normal">
              <input
                type="password"
                readOnly
                value="********"
                className="flex-1 px-4 py-3 text-sm text-[#1c1d1f] outline-none bg-transparent"
              />
              <button 
                onClick={() => toast.info("Password change flow can be completed by updating credentials.")}
                className="p-3 bg-[#a435f0] text-white hover:bg-[#8710d8]"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multi-factor Authentication card */}
          <div className="border border-[#d1d7dc] p-6 space-y-4 bg-white mt-8">
            <h3 className="text-base font-bold font-sans">Multi-factor Authentication</h3>
            <p className="text-sm text-gray-650 leading-relaxed font-normal">
              Increase your account security by requiring a code emailed to you to be entered when you log in. For more information on how multi-factor authentication works, refer to our <span className="text-[#5624d0] underline cursor-pointer">Help Center article</span>.
            </p>
            <button
              onClick={() => toast.success("Multi-factor authentication enabled.")}
              className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-sm font-bold py-2.5 px-4 transition-all"
            >
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications Settings */}
      {activeTab === "notifications" && (
        <form onSubmit={handleSaveNotifications} className="space-y-8 max-w-[650px]">
          {/* As an instructor */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-sans">As an instructor, I want to receive:</h3>
            <div className="border border-[#a435f0] p-5 flex gap-4 bg-white">
              <input
                type="checkbox"
                checked={instructorNotif}
                onChange={(e) => setInstructorNotif(e.target.checked)}
                className="w-5 h-5 accent-[#a435f0] shrink-0 mt-0.5"
              />
              <div className="text-sm font-normal leading-relaxed text-[#1c1d1f]">
                <p className="font-bold mb-1">Helpful resources and important updates related to being an instructor on Samriddhi Gyan.</p>
                <p className="text-gray-550 text-xs">To adjust this preference by course, leave this box checked and go to 'Course Settings' on the course management dashboard to opt in or out of specific notifications.</p>
              </div>
            </div>
          </div>

          {/* As a student */}
          <div className="space-y-4">
            <h3 className="text-base font-bold font-sans">As a student, I want to receive:</h3>
            
            {/* Promotions */}
            <div className="border border-[#d1d7dc] p-5 flex gap-4 bg-white">
              <input
                type="checkbox"
                checked={promotionalEmails}
                onChange={(e) => {
                  setPromotionalEmails(e.target.checked);
                  if (e.target.checked) setNoEmails(false);
                }}
                className="w-5 h-5 accent-[#a435f0] shrink-0 mt-0.5"
              />
              <div className="text-sm font-normal leading-relaxed text-gray-550">
                <p className="font-bold text-[#1c1d1f] mb-1">Promotions, course recommendations, and helpful resources from Samriddhi Gyan.</p>
                <p className="text-xs">Because you are an instructor, you will not receive course promotional emails from Samriddhi Gyan.</p>
              </div>
            </div>

            {/* Announcements */}
            <div className="border border-[#a435f0] p-5 flex gap-4 bg-white">
              <input
                type="checkbox"
                checked={instructorAnnouncements}
                onChange={(e) => {
                  setInstructorAnnouncements(e.target.checked);
                  if (e.target.checked) setNoEmails(false);
                }}
                className="w-5 h-5 accent-[#a435f0] shrink-0 mt-0.5"
              />
              <div className="text-sm font-normal leading-relaxed text-[#1c1d1f]">
                <p className="font-bold mb-1">Announcements from instructors whose course(s) I'm enrolled in.</p>
                <p className="text-gray-550 text-xs">To adjust this preference by course, leave this box checked and go to the course dashboard and click on "Options" to opt in or out of specific announcements.</p>
              </div>
            </div>

            {/* Don't send emails */}
            <div className="border border-[#d1d7dc] p-5 flex gap-4 bg-white">
              <input
                type="checkbox"
                checked={noEmails}
                onChange={(e) => {
                  setNoEmails(e.target.checked);
                  if (e.target.checked) {
                    setPromotionalEmails(false);
                    setInstructorAnnouncements(false);
                  }
                }}
                className="w-5 h-5 accent-[#a435f0] shrink-0 mt-0.5"
              />
              <div className="text-sm font-normal leading-relaxed text-gray-550">
                <p className="font-bold text-[#1c1d1f] mb-1">Don't send me any promotional emails.</p>
                <p className="text-xs">If this box is checked, please note that you will continue to receive important transactional emails like purchase receipts.</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-sm font-bold py-3 px-6 transition-all h-12 flex items-center justify-center"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Communications */}
      {activeTab === "messages" && (
        <form onSubmit={handleSaveMessages} className="space-y-6 max-w-[650px]">
          <div className="border border-[#d1d7dc] p-5 flex gap-4 bg-white">
            <input
              type="checkbox"
              checked={turnOffDirectMessaging}
              onChange={(e) => setTurnOffDirectMessaging(e.target.checked)}
              className="w-5 h-5 accent-[#a435f0] shrink-0 mt-0.5"
            />
            <div className="text-sm font-normal leading-relaxed text-gray-550">
              <p className="font-bold text-[#1c1d1f] mb-1">Turn off direct messaging</p>
              <p className="text-xs">When you turn off direct messages, you will no longer be able to send or receive direct messages as an instructor.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-sm font-bold py-3 px-6 transition-all h-12 flex items-center justify-center"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: API clients */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-[#d1d7dc] pb-5">
            <div>
              <h2 className="text-xl font-bold font-sans">API Clients</h2>
              <p className="text-xs text-gray-500 mt-1 font-normal">Create and list your API clients.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold font-sans">Affiliate API</h3>
            <p className="text-sm text-gray-650 leading-relaxed font-normal">
              To request access to the Affiliate API, please read our Affiliate API terms first. If you agree to the terms, click the button below. You can find more information in our <span className="text-[#5624d0] underline cursor-pointer">Samriddhi Gyan Affiliate API documentation</span>.
            </p>
            <button
              onClick={() => toast.success("Affiliate API client requested.")}
              className="bg-[#a435f0] hover:bg-[#8710d8] text-white text-sm font-bold py-2.5 px-4 transition-all"
            >
              Request Affiliate API Client
            </button>
          </div>

          {/* Info notification */}
          <div className="border border-[#d1d7dc] p-5 bg-white flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#1c1d1f] text-white flex items-center justify-center text-xs font-bold font-sans">!</div>
            <span className="text-sm font-normal text-gray-650">You don't have any API clients yet.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAccount;
