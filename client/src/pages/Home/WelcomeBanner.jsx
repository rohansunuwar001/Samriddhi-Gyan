// src/components/WelcomeBanner.jsx

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const WelcomeBanner = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  if (!user) return null;

  const initials = (user.name || "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="flex items-center gap-4 py-3">
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.name}
          className="h-14 w-14 rounded-full object-cover flex-shrink-0 border border-gray-200 shadow-sm"
        />
      ) : (
        <div className="h-14 w-14 rounded-full bg-[#1c1d1f] text-white flex items-center justify-center font-semibold text-xl flex-shrink-0 shadow-sm">
          {initials}
        </div>
      )}

      <div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#2d2f31] tracking-tight">
          Welcome back, {firstName}
        </h1>

        <div className="flex items-center gap-3 mt-1 flex-wrap text-[14px]">
          <p className="text-[#6a6f73]">
            {user.occupation || "Tell us what you do"}
          </p>
          <button
            onClick={() => navigate("/personalize")}
            className="text-[#a435f0] hover:text-[#8710d8] font-semibold hover:underline"
          >
            Edit occupation and interests
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
