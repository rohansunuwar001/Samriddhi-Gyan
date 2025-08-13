import { useState } from "react";
import { useRegisterUserMutation } from "@/features/api/authApi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FaFacebookF, FaApple, FaEye, FaEyeSlash } from "react-icons/fa"; // Added Eye icons
import { FcGoogle } from "react-icons/fc";
import { FiLoader } from "react-icons/fi";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"; // Assuming this component exists

// A reusable social button component
const SocialButton = ({ icon, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="flex-1 flex items-center justify-center p-3 border border-gray-400 rounded-md hover:bg-gray-100 transition-colors duration-300"
  >
    {icon}
  </button>
);

const Signup = () => {
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const navigate = useNavigate();

  // State hooks for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // NEW: State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for managing validation and server errors
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!name || name.length < 2)
      newErrors.name = "Full name must be at least 2 characters";
    if (!email || !/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Please enter a valid email address";
    if (!password || password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        password
      )
    ) {
      newErrors.password =
        "Password requires uppercase, lowercase, number, & special characters.";
    }
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const apiData = { name, email, password };
      const response = await registerUser(apiData).unwrap();
      toast.success(response?.message || "Registration successful!");
      navigate("/login");
    } catch (error) {
      const errorMessage =
        error?.data?.message || "Registration failed. Please try again.";
      setErrors({ api: errorMessage });
      toast.error(errorMessage);
    }
  };

  const handleSocialRegister = (provider) => {
    toast.info(`Sign up with ${provider} is not implemented.`);
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <div className="w-full max-w-md md:w-1/2 hidden md:block">
          <img
            src="/loginimg.webp"
            alt="Decorative illustration"
            className="w-full h-auto"
          />
        </div>

        <div className="w-full max-w-md md:w-1/2">
          <div className="w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">
              Sign up to start your learning journey
            </h1>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name Input */}
              <div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email Input */}
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="text-black w-full px-4 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {errors.api && (
                <p className="text-sm text-red-600 text-center">{errors.api}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400"
              >
                {isLoading && <FiLoader className="animate-spin h-5 w-5" />}
                <span>{isLoading ? "Creating account..." : "Sign Up"}</span>
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
                  Other sign-up options
                </span>
              </div>
            </div>
            {/* <div className="flex justify-center gap-4">
              <SocialButton
                icon={<FcGoogle size={24} />}
                label="Sign up with Google"
                onClick={() => handleSocialRegister("Google")}
              />
            </div> */}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-700">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
