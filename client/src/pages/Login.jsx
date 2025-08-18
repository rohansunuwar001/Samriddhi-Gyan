import { useEffect, useState } from "react";
import { useLoginUserMutation } from "@/features/api/authApi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineMail } from "react-icons/md";
import { FiLoader } from "react-icons/fi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PropTypes from "prop-types";

// A reusable component for social login buttons
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

SocialButton.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

const LoginPage = () => {
  const [loginInput, setLoginInput] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [
    loginUser,
    { data: loginData, error: loginError, isLoading, isSuccess },
  ] = useLoginUserMutation();

  const navigate = useNavigate();

  const changeInputHandler = (e) => {
    setLoginInput({ ...loginInput, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginInput.email || !loginInput.password) {
      return toast.error("Please enter both email and password.");
    }
    await loginUser(loginInput);
  };

  useEffect(() => {
    if (isSuccess && loginData) {
      toast.success(loginData.message || "Login successful!");

      const role = loginData.user?.role?.toLowerCase();
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "instructor") navigate("/instructor/dashboard");
      else navigate("/");
    }
    if (loginError) {
      toast.error(loginError.data?.message || "Login failed.");
    }
  }, [isSuccess, loginData, loginError, navigate]);

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BASE_URL || "http://localhost:7777";
    window.location.href = `${backendUrl}/api/v1/user/google`;
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <div className="w-full max-w-md md:w-1/2 hidden md:block">
          <img
            src="/loginimg.webp"
            alt="Decorative illustration of a person working on a laptop"
            className="w-full h-auto"
          />
        </div>

        <div className="w-full max-w-md md:w-1/2">
          <div className="w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">
              Log in to continue your learning journey
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={loginInput.email}
                  onChange={changeInputHandler}
                  placeholder="Email"
                  className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={loginInput.password}
                  onChange={changeInputHandler}
                  placeholder="Password"
                  className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400"
              >
                {isLoading ? (
                  <FiLoader className="animate-spin h-5 w-5" />
                ) : (
                  <MdOutlineMail className="h-5 w-5" />
                )}
                <span>{isLoading ? "Logging in..." : "Log in"}</span>
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
            <div className="flex justify-center gap-4">
              <SocialButton
                icon={<FcGoogle size={24} />}
                label="Log in with Google"
                onClick={handleGoogleLogin}
              />
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-700">
                Don`t have an account?{" "}
                <Link
                  to="/register"
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
