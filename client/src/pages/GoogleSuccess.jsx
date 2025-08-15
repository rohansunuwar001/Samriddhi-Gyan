// file: src/pages/GoogleSuccess.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { BASE_URL } from "@/app/constant";
import { userLoggedIn } from "@/features/authSlice";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const finalizeGoogleLogin = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const temporaryToken = urlParams.get("token");

        if (!temporaryToken) {
          throw new Error("Google auth token not found in URL.");
        }
        
        const response = await fetch(`${BASE_URL}/api/v1/user/me`, {
          headers: {
            'Authorization': `Bearer ${temporaryToken}`,
          },
          // This line is critical. It tells the browser to process the 'Set-Cookie'
          // header from the backend, which allows the session to persist on reload.
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error("Failed to validate user session with the server.");
        }

        const sessionData = await response.json(); // sessionData = { user, token }

        // Manually dispatch the action to update the Redux state with the session data.
        dispatch(userLoggedIn(sessionData));

        // Navigate to the homepage. The user is now fully authenticated.
        navigate("/");

      } catch (error) {
        console.error("Google login finalization failed:", error);
        navigate("/login");
      }
    };

    finalizeGoogleLogin();
  }, [navigate, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Finalizing Login...
        </h2>
        <p className="text-gray-600">Please wait while we securely set up your session.</p>
        <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSuccess;