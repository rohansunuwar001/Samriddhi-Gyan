// src/components/WelcomeBanner.jsx

import { useState } from "react";
import { useSelector } from "react-redux";
import { useUpdateUserInfoMutation } from "@/features/api/authApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const WelcomeBanner = () => {
  const { user } = useSelector((state) => state.auth);
  const [updateUserInfo, { isLoading }] = useUpdateUserInfoMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [interestsInput, setInterestsInput] = useState(
    (user?.interests || []).join(", ")
  );

  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const firstName = user.name?.split(" ")[0];

  const handleSave = async () => {
    const interests = interestsInput
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    try {
      await updateUserInfo({ occupation, interests }).unwrap();
      toast.success("Occupation and interests updated.");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to update. Please try again."
      );
    }
  };

  const handleCancel = () => {
    setOccupation(user?.occupation || "");
    setInterestsInput((user?.interests || []).join(", "));
    setIsEditing(false);
  };

  return (
    <div className="flex items-start gap-4 mb-10">
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.name}
          className="h-14 w-14 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-14 w-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
          {initials}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {firstName}
        </h1>

        {!isEditing ? (
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-slate-500">
              {user.occupation || "Tell us what you do"}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-violet-600 text-sm font-medium hover:underline"
            >
              Edit occupation and interests
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3 max-w-md">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Occupation
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Full Stack Web Developer"
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g. React, Python, UI Design"
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeBanner;
