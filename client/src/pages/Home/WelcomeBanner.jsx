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
    <div className="flex items-center gap-4 py-2">
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.name}
          className="h-16 w-16 rounded-full object-cover flex-shrink-0 border border-slate-100"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-normal text-lg flex-shrink-0">
          {initials}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-normal text-[#1c1d1f]">
          Welcome back, {firstName}
        </h1>

        <div className="flex items-center gap-3 mt-1 flex-wrap text-sm">
          <p className="text-slate-500 font-normal">
            {user.occupation || "Tell us what you do"}
          </p>
          <button
            onClick={() => navigate("/personalize")}
            className="text-violet-600 font-normal hover:underline"
          >
            Edit occupation and interests
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
