import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { BASE_URL } from "@/app/constant";
import { userLoggedIn } from "@/features/authSlice";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      navigate("/login");
      return;
    } 

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/user/check`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();

        localStorage.setItem("token", token);

        dispatch(userLoggedIn({ user: data.user }));

        navigate("/");
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Completing login...</h2>
        <p>Please wait while we complete your Google login.</p>
      </div>
    </div>
  );
};

export default GoogleSuccess;
