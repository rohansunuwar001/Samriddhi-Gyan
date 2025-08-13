import { useEffect, useState } from "react";
import { useLoginUserMutation } from "@/features/api/authApi"; // Your RTK Query hook
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineMail } from "react-icons/md";
import { FiLoader } from "react-icons/fi";

// The Google social login button remains.
const SocialButton = ({ icon, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="w-full flex items-center justify-center p-3 border border-gray-400 rounded-md hover:bg-gray-100 transition-colors duration-300"
  >
    {icon}
  </button>
);

const LoginPage = () => {
  const [loginInput, setLoginInput] = useState({ email: "", password: "" });

  const [
    loginUser,
    {
      data: loginData,
      error: loginError,
      isLoading: loginIsLoading, // Use this for loading state
      isSuccess: loginIsSuccess,
    },
  ] = useLoginUserMutation();

  const navigate = useNavigate();

  // This handler updates the state for both email and password fields.
  const changeInputHandler = (e) => {
    const { name, value } = e.target;
    setLoginInput({ ...loginInput, [name]: value });
  };

  // This function is called when the form is submitted.
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent page reload
    if (!loginInput.email || !loginInput.password) {
      toast.error("Please enter both email and password.");
      return;
    }
    await loginUser(loginInput);
  };

  // This effect runs when the API call status changes.
  useEffect(() => {
    if (loginIsSuccess && loginData) {
      toast.success(loginData?.message || "Login successful.");
      const role = loginData?.user?.role?.toLowerCase();
      // Navigate based on user role
      if (role === "instructor") {
        navigate("/instructor/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    }
    if (loginError) {
      toast.error(loginError?.data?.message || "Login failed. Please check your credentials.");
    }
  }, [loginIsSuccess, loginError, loginData, navigate]);

  // Placeholder for Google login
  const handleGoogleLogin = () => {
    // Replace with your actual backend URL
    const backendUrl = import.meta.env.VITE_BASE_URL || "http://localhost:8080";
    window.location.href = `${backendUrl}/api/v1/user/google`;
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        {/* Left Side: Image */}
        <div className="w-full max-w-md md:w-1/2 hidden md:block">
          <img
            src="/loginimg.webp"
            alt="Decorative illustration of a person working on a laptop"
            className="w-full h-auto"
          />
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md md:w-1/2">
          <div className="w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">
              Log in to continue your learning journey
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  id="email"
                  name="email" // 'name' attribute must match state key
                  type="email"
                  autoComplete="email"
                  required
                  value={loginInput.email} // Controlled component
                  onChange={changeInputHandler} // Use the combined handler
                  placeholder="Email"
                  className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <input
                  id="password"
                  name="password" // 'name' attribute must match state key
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginInput.password} // Controlled component
                  onChange={changeInputHandler} // Use the combined handler
                  placeholder="Password"
                  className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* "Forgot password?" link has been removed */}
              <button
                type="submit"
                disabled={loginIsLoading} // Disable button when API is loading
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400"
              >
                {/* Conditionally render the spinner based on API loading state */}
                {loginIsLoading ? (
                  <FiLoader className="animate-spin h-5 w-5" />
                ) : (
                  <MdOutlineMail className="h-5 w-5" />
                )}
                <span>{loginIsLoading ? "Logging in..." : "Log in"}</span>
              </button>
            </form>
            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or log in with
                </span>
              </div>
            </div>
            {/* Facebook and Apple buttons removed */}
            <div className="flex justify-center gap-4">
              <SocialButton
                icon={<FcGoogle size={24} />}
                label="Log in with Google"
                onClick={handleGoogleLogin}
              />
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-700">
                Don't have an account?{" "}
                <Link
                  to="/register" // Changed to React Router Link for better SPA navigation
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;