// file: src/pages/GoogleSuccess.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "@/features/authSlice";
import { authApi } from "@/features/api/authApi";
import { apiSlice } from "@/features/api/apiSlice";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Get the final JWT from the URL's query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // 2. Persist the token in localStorage for future sessions
      localStorage.setItem("authToken", token);

      // 3. Dispatch action to immediately update Redux state (token & isAuthenticated)
      dispatch(userLoggedIn({ token }));

      // 4. Invalidate the 'User' tag and initiate user fetch
      dispatch(apiSlice.util.invalidateTags(["User"]));
      dispatch(authApi.endpoints.loadUser.initiate(undefined, { forceRefetch: true }));

      // 5. Navigate to the homepage. The user is now authenticated.
      navigate("/");
    } else {
      // If no token is found for some reason, redirect back to login
      console.error("Google login error: Token not found in redirect URL.");
      navigate("/login");
    }
  }, [navigate, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-semibold mb-4 text-gray-800">
          Finalizing Login...
        </h2>
        <p className="text-gray-600">
          Please wait while we securely set up your session.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSuccess;
