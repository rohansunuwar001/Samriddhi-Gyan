import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRegisterUserMutation } from "@/features/api/authApi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { motion } from "framer-motion";

// Define password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password must be less than 32 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Signup = () => {
  const [registerUser] = useRegisterUserMutation();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(formSchema), 
  });

  const password = watch("password", "");
  const [serverError, setServerError] = useState(null);

  const onSubmit = async (data) => {
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...formData } = data;
      const response = await registerUser(formData).unwrap();
      toast.success(response?.message || "Registration successful");
      navigate("/login");
    } catch (error) {
      setServerError(error?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row items-center justify-center min-h-screen gap-12">
        {/* Illustration Section */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex flex-1 flex-col items-center justify-center"
        >
          <div className="relative w-full max-w-md">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-20 -right-10 w-32 h-32 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            <div className="relative p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Start Your Learning Journey
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Join thousands of students advancing their skills
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Signup Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              Get started with your free account
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4" /> Full Name
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="John Doe"
                  className="py-3 px-4"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="your@email.com"
                  className="py-3 px-4"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4" /> Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="py-3 px-4"
                />
                <PasswordStrengthMeter password={password} />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                  <Lock className="h-4 w-4" /> Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="••••••••"
                  className="py-3 px-4"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Server Error */}
              {serverError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{serverError}</p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>

              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Signup;