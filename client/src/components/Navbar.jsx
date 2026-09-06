import { useLogoutUserMutation } from "@/features/api/authApi";
// --- NEW: Import the NotificationBell component ---
import {
  // --- REMOVED: `Bell` is no longer needed here as it's inside NotificationBell ---
  BookOpen,
  Heart,
  Home,
  Loader2,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  ChevronRight,
  TrendingUp,
  Globe,
  Compass,
  LayoutDashboard
} from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import NotificationBell from './NotificationBell';
import LanguageModal from "./LanguageModal";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import { useGetAllTopicsQuery } from "@/features/api/topicApi";
import { useGetIssuersQuery, useGetCertificationsQuery } from "@/features/api/certificationApi";
import { useGetMyLearningCoursesQuery } from "@/features/api/authApi";
import { useGetWishlistQuery } from "@/features/api/wishlistApi";
import { useGetCartQuery, useAddToCartMutation } from "@/features/api/cartApi";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader } from "./ui/sheet";
// --- NEW: Import the translation hook ---
import { useTranslation } from "react-i18next";

// --- My Learning Hover Dropdown ---
const MyLearningDropdown = ({ navigate }) => {
  const { data, isLoading } = useGetMyLearningCoursesQuery();
  const courses = data?.courses || [];

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-16 h-12 bg-gray-200 rounded shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-2 bg-gray-100 rounded w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-6 text-center text-base text-gray-500">
          <p className="font-light">No enrolled courses yet.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-light hover:underline"
          >
            Browse courses
          </button>
        </div>
      ) : (
        <div>
          {/* Course list — max 4 */}
          <ul className="divide-y divide-gray-100">
            {courses.slice(0, 4).map((course) => {
              const progress = course.progress || 0;
              const hasStarted = progress > 0;
              const thumbnail = course.thumbnail;

              return (
                <li key={course._id}>
                  <button
                    onClick={() => navigate(`/course-progress/${course._id}`)}
                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                  >
                    {/* Thumbnail — large square tile matching Samriddhi Gyan style */}
                    <div className="w-[72px] h-[72px] rounded overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-xl font-light">
                          {(course.title || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-light text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
                        {course.title}
                      </p>

                      {hasStarted ? (
                        <div className="mt-2">
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6d28d2] rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1 font-light">
                            {Math.round(progress)}% complete
                          </p>
                        </div>
                      ) : (
                        <p className="text-[13px] font-light text-[#6d28d2] hover:text-[#892de1] mt-1.5">
                          Start learning
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* CTA footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => navigate("/home/my-courses/learning")}
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-base font-light py-3 px-4 rounded transition-colors"
            >
              Go to My learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

MyLearningDropdown.propTypes = {
  navigate: PropTypes.func.isRequired,
};

// --- Wishlist Hover Dropdown ---
const WishlistDropdown = ({ navigate }) => {
  const { data, isLoading } = useGetWishlistQuery();
  const [addToCart] = useAddToCartMutation();
  const courses = data?.wishlist || [];

  const handleAddToCart = async (e, courseId) => {
    e.stopPropagation();
    try {
      await addToCart(courseId).unwrap();
      navigate("/cart");
    } catch {
      navigate("/cart");
    }
  };

  return (
    <div className="flex flex-col" style={{ minWidth: 340 }}>
      {isLoading ? (
        <div className="p-5 space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="flex gap-3">
                <div className="w-[72px] h-[72px] bg-gray-200 rounded shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-9 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-8 text-center text-base text-gray-500">
          <Heart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-normal text-gray-700">Your wishlist is empty.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-light hover:underline text-base"
          >
            Browse courses
          </button>
        </div>
      ) : (
        <div>
          {/* Course list — max 3, each is a self-contained card block */}
          <ul className="divide-y divide-gray-100">
            {courses.slice(0, 3).map((course) => {
              // Correct nested price fields: price.current & price.original
              const currentPrice = course.price?.current ?? 0;
              const originalPrice = course.price?.original ?? 0;
              const hasDiscount = originalPrice > currentPrice && originalPrice > 0;
              const instructor = course.creator?.name || "Instructor";

              return (
                <li key={course._id} className="px-4 pt-4 pb-3">
                  {/* Row: thumbnail + info */}
                  <div
                    onClick={() => navigate(`/course-detail/${course._id}`)}
                    className="flex gap-3 cursor-pointer group mb-3"
                  >
                    {/* Square thumbnail */}
                    <div className="w-[72px] h-[72px] rounded overflow-hidden shrink-0 bg-gray-100">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-2xl font-light">
                          {(course.title || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Title + instructor + price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-light text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
                        {course.title}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                        {instructor}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[14px] font-light text-[#1c1d1f]">
                          Rs.{currentPrice.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-[12px] text-gray-400 line-through font-normal">
                            Rs.{originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to cart — full-width outlined button inside the card */}
                  <button
                    onClick={(e) => handleAddToCart(e, course._id)}
                    className="w-full border border-[#6d28d2] text-[#6d28d2] hover:text-[#892de1] hover:bg-[#f5eeff] hover:border-[#892de1] text-[13px] font-light py-2.5 rounded transition-colors"
                  >
                    Add to cart
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Go to wishlist CTA */}
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => navigate("/home/my-courses/wishlist")}
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-[13.5px] font-light py-3 rounded transition-colors"
            >
              Go to wishlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

WishlistDropdown.propTypes = {
  navigate: PropTypes.func.isRequired,
};

// --- Cart Hover Dropdown ---
const CartDropdown = ({ navigate }) => {
  const { data, isLoading } = useGetCartQuery();
  const courses = data?.cart || [];

  const totalCurrent = courses.reduce((sum, c) => sum + (c.price?.current ?? 0), 0);
  const totalOriginal = courses.reduce((sum, c) => sum + (c.price?.original ?? 0), 0);
  const hasDiscount = totalOriginal > totalCurrent && totalOriginal > 0;

  return (
    <div className="flex flex-col" style={{ minWidth: 340 }}>
      {isLoading ? (
        <div className="p-5 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-[72px] h-[72px] bg-gray-200 rounded shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3 mt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-8 text-center text-base text-gray-500">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-normal text-gray-700">Your cart is empty.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-light hover:underline text-base"
          >
            Keep shopping
          </button>
        </div>
      ) : (
        <div>
          {/* Course list — max 3 */}
          <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
            {courses.slice(0, 3).map((course) => {
              const currentPrice = course.price?.current ?? 0;
              const originalPrice = course.price?.original ?? 0;
              const hasDiscount = originalPrice > currentPrice && originalPrice > 0;
              const instructor = course.creator?.name || "Instructor";

              return (
                <li
                  key={course._id}
                  className="p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/course-detail/${course._id}`)}
                >
                  {/* Thumbnail */}
                  <div className="w-[72px] h-[72px] rounded overflow-hidden shrink-0 bg-gray-100">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-2xl font-light">
                        {(course.title || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-light text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#6d28d2] transition-colors">
                      {course.title}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                      {instructor}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[14px] font-light text-[#1c1d1f]">
                        Rs.{currentPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-[12px] text-gray-400 line-through font-normal">
                          Rs.{originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pricing Total & Go to Cart CTA */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="mb-4">
              <span className="text-[15px] font-light text-slate-500 block">Total:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[18px] font-light text-[#1c1d1f]">
                  Rs.{totalCurrent.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-[14px] text-gray-400 line-through font-normal">
                    Rs.{totalOriginal.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate("/cart")}
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-[14px] font-light py-3 rounded transition-colors"
            >
              Go to cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

CartDropdown.propTypes = {
  navigate: PropTypes.func.isRequired,
};


// --- UserAvatar component with hover menu ---
const UserAvatar = ({ user, onLogout, t, cartCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const hoverTimerRef = useRef(null);
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  if (!user) return null;

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "SG";

  const displayEmail = user.email && user.email.length > 22 
    ? `${user.email.substring(0, 22)}...` 
    : user.email;

  const usernameSlug = user.name
    ? `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${user._id}`
    : "user";

  const publicProfilePath = user.role === "student" ? `/user/${usernameSlug}` : user.role === "admin" ? `/admin/${usernameSlug}` : `/instructor/${usernameSlug}`;
  const editProfilePath = user.role === "student" ? "/user/edit-profile/" : user.role === "admin" ? "/admin/profile/basic-information/" : "/instructor/profile/basic-information/";
  const accountSecurityPath = user.role === "student" ? "/user/edit-account/" : user.role === "admin" ? "/admin/account/security/" : "/instructor/account/security/";
  const manageSubscriptionsPath = user.role === "student" ? "/user/manage-subscriptions/" : "/subscribe";
  const paymentMethodsPath = user.role === "student" ? "/user/edit-payment-methods/" : "/payment-methods";

  return (
    <div 
      className="relative py-5 -my-5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="w-10 h-10 flex items-center justify-center rounded-full relative focus:outline-none"
        onClick={() => navigate(publicProfilePath)}
      >
        <Avatar className="h-10 w-10 border border-slate-200">
          <AvatarImage src={user.photoUrl} alt={user.name} className="object-cover" />
          <AvatarFallback className="font-normal text-white bg-[#1c1d1f]">{initials}</AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full w-68 bg-white border border-[#d1d7dc] shadow-2xl z-[200] rounded-none divide-y divide-[#d1d7dc] animate-in fade-in duration-200 font-sans"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ width: '270px' }}
        >
          {/* Section 1: Header Info */}
          <div className="p-4 flex gap-3 items-center">
            <Avatar className="h-16 w-16 border border-slate-200 shrink-0">
              <AvatarImage src={user.photoUrl} alt={user.name} className="object-cover" />
              <AvatarFallback className="font-normal text-white bg-[#1c1d1f] text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-normal text-[#1c1d1f] truncate leading-snug">{user.name}</p>
              <p className="text-sm text-gray-500 truncate mt-1.5" title={user.email}>{displayEmail}</p>
            </div>
          </div>

          {/* Conditional rendering based on role */}
          {user.role === "student" ? (
            <>
              {/* Section 2: My learning, My cart, Wishlist */}
              <div className="py-2 flex flex-col">
                <Link 
                  to="/home/my-courses/learning" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  My learning
                </Link>
                <Link 
                  to="/cart" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors flex justify-between items-center"
                >
                  <span>My cart</span>
                  {cartCount > 0 && (
                    <span className="bg-[#a435f0] text-white text-[11px] font-normal w-[22px] h-[22px] rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link 
                  to="/home/my-courses/wishlist" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-755 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Wishlist
                </Link>
              </div>

              {/* Section 2.5: Student Features */}
              <div className="py-2 flex flex-col">
                <span className="px-4 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider select-none">
                  Features
                </span>
                <Link 
                  to="/nearby-hub" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Nearby Hub
                </Link>
                <Link 
                  to="/career-roadmap" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Career Roadmap
                </Link>
              </div>

              {/* Section 3: Notifications, Messages */}
              <div className="py-2 flex flex-col">
                <Link 
                  to="/notifications" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Notifications
                </Link>
                <Link 
                  to="/messages" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Messages
                </Link>
              </div>

              {/* Section 4: Account security, Payment methods, Subscriptions, Purchase history */}
              <div className="py-2 flex flex-col">
                <Link 
                  to={accountSecurityPath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Account security
                </Link>
                <Link 
                  to={paymentMethodsPath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Payment methods
                </Link>
                <Link 
                  to={manageSubscriptionsPath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Subscriptions
                </Link>
                <Link 
                  to="/purchase-history" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Purchase history
                </Link>
              </div>

              {/* Section 5: Language Section */}
              <div className="py-2 flex flex-col">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    setIsLangModalOpen(true);
                  }}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors flex justify-between items-center w-full text-left"
                >
                  <span>Language</span>
                  <span className="flex items-center gap-1.5 text-slate-500 font-normal">
                    <span>{t(`languages.${i18n.language}`) || "English"}</span>
                    <Globe className="w-4 h-4" />
                  </span>
                </button>
              </div>

              {/* Section 6: Public profile, Edit profile */}
              <div className="py-2 flex flex-col">
                <Link 
                  to={publicProfilePath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Public profile
                </Link>
                <Link 
                  to={editProfilePath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Edit profile
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Instructor / Admin Menu */}
              {/* Section 1: Notifications */}
              <div className="py-2 flex flex-col">
                <Link 
                  to="/notifications" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Notifications
                </Link>
              </div>

              {/* Section 2: Account settings, Payout & tax settings */}
              <div className="py-2 flex flex-col">
                <Link 
                  to={accountSecurityPath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Account settings
                </Link>
                <Link 
                  to="/instructor/course/payouts" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Payout & tax settings
                </Link>
              </div>

              {/* Section 3: Public profile, Edit profile */}
              <div className="py-2 flex flex-col">
                <Link 
                  to={publicProfilePath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Public profile
                </Link>
                <Link 
                  to={editProfilePath} 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
                >
                  Edit profile
                </Link>
              </div>
            </>
          )}

          {/* Section 7: Help and Support, Log out (Common to all roles) */}
          <div className="py-2 flex flex-col">
            <Link 
              to="/help" 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors"
            >
              Help and Support
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-left px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors focus:outline-none font-normal"
            >
              Log out
            </button>
          </div>
        </div>
      )}
      {isLangModalOpen && (
        <LanguageModal isOpen={isLangModalOpen} onClose={() => setIsLangModalOpen(false)} />
      )}
    </div>
  );
};

UserAvatar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    photoUrl: PropTypes.string,
    role: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  cartCount: PropTypes.number,
};
// --- End of UserAvatar component ---


const Navbar = () => {
  const { pathname } = useLocation();
  // --- All your existing hooks and state definitions remain unchanged ---
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const usernameSlug = user?.name
    ? `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${user._id}`
    : "user";
  const publicProfilePath = user?.role === "student" ? `/user/${usernameSlug}` : user?.role === "admin" ? `/admin/${usernameSlug}` : `/instructor/${usernameSlug}`;
  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState({ suggestions: [], courses: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef(null);

  const [activeParent, setActiveParent] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  const [showFindCoursesDropdown, setShowFindCoursesDropdown] = useState(false);

  const [activeIssuer, setActiveIssuer] = useState(null);
  const [showGetCertifiedDropdown, setShowGetCertifiedDropdown] = useState(false);

  const [trendingSuggestions, setTrendingSuggestions] = useState([]);
  const [showMyLearningDropdown, setShowMyLearningDropdown] = useState(false);
  const myLearningTimeoutRef = useRef(null);
  const [showWishlistDropdown, setShowWishlistDropdown] = useState(false);
  const wishlistLeaveTimer = useRef(null);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const cartLeaveTimer = useRef(null);


  const handleMyLearningEnter = () => {
    if (myLearningTimeoutRef.current) clearTimeout(myLearningTimeoutRef.current);
    setShowMyLearningDropdown(true);
  };
  const handleMyLearningLeave = () => {
    myLearningTimeoutRef.current = setTimeout(() => setShowMyLearningDropdown(false), 150);
  };

  const { data: catData } = useGetAllCategoriesQuery();
  const { data: topicsData } = useGetAllTopicsQuery();
  const { data: issuersData } = useGetIssuersQuery();
  const { data: certsData } = useGetCertificationsQuery();
  const { data: cartData } = useGetCartQuery(undefined, { skip: !user || user?.role !== "student" });
  const cartCourses = cartData?.cart || [];
  const cartCount = cartCourses.length;

  const categoryTree = catData?.categoryTree || [];
  const topics = topicsData?.topics || [];
  const issuersList = issuersData?.issuers || [];
  const certsList = certsData?.certifications || [];

  const findCoursesTimeoutRef = useRef(null);
  const getCertifiedTimeoutRef = useRef(null);

  const handleFindCoursesEnter = () => {
    if (findCoursesTimeoutRef.current) clearTimeout(findCoursesTimeoutRef.current);
    setShowFindCoursesDropdown(true);
  };

  const handleFindCoursesLeave = () => {
    findCoursesTimeoutRef.current = setTimeout(() => {
      setShowFindCoursesDropdown(false);
      setActiveParent(null);
      setActiveChild(null);
    }, 200);
  };

  const handleGetCertifiedEnter = () => {
    if (getCertifiedTimeoutRef.current) clearTimeout(getCertifiedTimeoutRef.current);
    setShowGetCertifiedDropdown(true);
  };

  const handleGetCertifiedLeave = () => {
    getCertifiedTimeoutRef.current = setTimeout(() => {
      setShowGetCertifiedDropdown(false);
      setActiveIssuer(null);
    }, 200);
  };

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/v1/search/trending`,
          { credentials: "include" }
        );
        const data = await response.json();
        if (data?.success) {
          setTrendingSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error("Failed to load trending suggestions", err);
      }
    };
    loadTrending();
  }, []);

  // --- All your useEffects and handlers remain unchanged ---
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setResults({ suggestions: [], courses: [] });
      return;
    }
    const timerId = setTimeout(() => {
      const fetchSearchResults = async () => {
        setIsLoading(true);
        setIsDropdownVisible(true);
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/v1/search?q=${encodeURIComponent(
              searchQuery
            )}`,
            { credentials: "include" }
          );
          if (!response.ok) throw new Error("Search failed");
          const data = await response.json();

          // ── Client-side safety filter ──────────────────────────────────────
          // Build a Set of enrolled course IDs from the Redux user state.
          // This ensures purchased courses are NEVER shown in suggestions even
          // if the backend filter misses them (e.g. cookie not sent correctly).
          const enrolledSet = new Set(
            (user?.enrolledCourses || []).map((c) =>
              typeof c === "string" ? c : c?._id?.toString?.() ?? c?.toString()
            )
          );
          const filteredCourses = (data.courses || []).filter(
            (c) => !enrolledSet.has(c._id?.toString())
          );
          setResults({ ...data, courses: filteredCourses });
        } catch (error) {
          console.error("Failed to fetch search results:", error);
          setResults({ suggestions: [], courses: [] });
        } finally {
          setIsLoading(false);
        }
      };
      fetchSearchResults();
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchQuery, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoutHandler = async () => await logoutUser();
  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Logged out successfully");
      navigate("/login");
    }
  }, [isSuccess, data, navigate]);

  const handleLogoClick = () => {
    // Clear search whenever the logo / home button is clicked
    setSearchQuery("");
    setResults({ suggestions: [], courses: [] });
    setIsDropdownVisible(false);
    if (user?.role === "instructor") {
      navigate("/instructor/dashboard");
    } else if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  // Auto-clear search box whenever the user navigates away from the search page
  useEffect(() => {
    if (!pathname.startsWith("/course/search")) {
      setSearchQuery("");
      setResults({ suggestions: [], courses: [] });
      setIsDropdownVisible(false);
    }
  }, [pathname]);
  const handleInputChange = (e) => setSearchQuery(e.target.value);
  const handleSuggestionClick = (suggestion) => {
    navigate(`/course/search?query=${encodeURIComponent(suggestion)}`);
    setIsDropdownVisible(false);
  };
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/course/search?query=${encodeURIComponent(searchQuery)}`);
      setIsDropdownVisible(false);
    }
  };

  const dashboardLabel =
    user?.role === "instructor" ? (
      <span className="font-light text-4xl text-purple-700">
        {t("navbar.instructor_dashboard")}
      </span>
    ) : user?.role === "admin" ? (
      <span className="font-light text-4xl text-purple-700">
        {t("navbar.admin_dashboard") || "Admin Dashboard"}
      </span>
    ) : null;

  const welcomeText =
    user && (user.role === "instructor" || user.role === "admin") ? (
      <span className="ml-6 font-light text-xl text-gray-700">
        Welcome, {user.name}
      </span>
    ) : null;

  const renderAuthSection = () => {
    if (user) {
      return (
        <div className="flex items-center gap-4">
          <UserAvatar user={user} onLogout={logoutHandler} t={t} cartCount={cartCount} />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate("/login")} className="font-light">
          {t("navbar.login")}
        </Button>
        <Button onClick={() => navigate("/register")} className="font-light">
          {t("navbar.signup")}
        </Button>
      </div>
    );
  };

  const isInstructorOrAdmin =
    user?.role === "instructor" || user?.role === "admin";
  const isDashboardPage =
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/admin");

  return (
    <header className={`bg-white border-b border-gray-200 z-40 transition-all duration-300 ease-in-out h-16 ${isDashboardPage ? "md:ml-[72px]" : ""}`}>
      <div className="w-full px-6 md:px-8 h-16 flex justify-between items-center gap-6 relative">
        {/* --- Left side of Navbar (No Changes) --- */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Logo: hide only on instructor/admin dashboard pages, show everywhere else */}
          {!isDashboardPage && (
            <button onClick={handleLogoClick} className="focus:outline-none flex items-center justify-center -translate-y-[2px]">
              <img
                src="/samriddhi_logo1.png"
                alt="Samriddhi Logo"
                width="82"
                height="34"
                className="block object-contain"
              />
            </button>
          )}
          {/* Show nav links when NOT on a dashboard page (only for students/guests) */}
          {!isDashboardPage && (!user || user.role === "student") && (
            <div className="hidden lg:flex items-center gap-5 relative z-50">
              {/* Find Courses Hover Menu */}
              <div
                className="relative py-4"
                onMouseEnter={handleFindCoursesEnter}
                onMouseLeave={handleFindCoursesLeave}
              >
                <button className="text-lg font-light text-gray-700 hover:text-purple-600 transition-colors">
                  Find Courses
                </button>
                {showFindCoursesDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-lg flex z-50 text-slate-800 min-h-[400px] w-[700px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Column 1: Parent Categories */}
                    <div className="w-56 border-r border-gray-100 py-3 bg-gray-50/50 flex flex-col overflow-y-auto">
                      {categoryTree.map((parent) => (
                        <Link
                          key={parent._id}
                          to={`/topic/${parent.slug}`}
                          onClick={() => {
                            setShowFindCoursesDropdown(false);
                            setActiveParent(null);
                            setActiveChild(null);
                          }}
                          onMouseEnter={() => {
                            setActiveParent(parent);
                            setActiveChild(null);
                          }}
                          className={`px-4 py-2 text-lg font-light cursor-pointer flex items-center justify-between transition-colors ${
                            activeParent?._id === parent._id
                              ? "bg-purple-50 text-[#a435f0]"
                              : "hover:bg-gray-100 hover:text-purple-600"
                          }`}
                        >
                          <span>{parent.name}</span>
                          {parent.children?.length > 0 && <ChevronRight className="w-4 h-4 opacity-75" />}
                        </Link>
                      ))}
                    </div>

                    {/* Column 2: Child Categories */}
                    <div className="w-56 border-r border-gray-100 py-3 flex flex-col overflow-y-auto bg-white">
                      {activeParent?.children?.map((child) => (
                        <Link
                          key={child._id}
                          to={`/topic/${child.slug}`}
                          onClick={() => {
                            setShowFindCoursesDropdown(false);
                            setActiveParent(null);
                            setActiveChild(null);
                          }}
                          onMouseEnter={() => setActiveChild(child)}
                          className={`px-4 py-2 text-lg font-light cursor-pointer flex items-center justify-between transition-colors ${
                            activeChild?._id === child._id
                              ? "bg-purple-50 text-[#a435f0]"
                              : "hover:bg-gray-100 hover:text-purple-600"
                          }`}
                        >
                          <span>{child.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-75" />
                        </Link>
                      ))}
                      {!activeParent && (
                        <div className="px-4 py-8 text-center text-base text-gray-400">
                          Hover over a category to explore subcategories.
                        </div>
                      )}
                    </div>

                    {/* Column 3: Topics */}
                    <div className="w-60 py-3 flex flex-col overflow-y-auto bg-white">
                      <h4 className="px-4 py-1 text-base font-light text-gray-400 uppercase tracking-wider mb-2">
                        Popular topics
                      </h4>
                      {activeChild?.children?.length > 0 ? (
                        activeChild.children.map((subChild) => (
                          <Link
                            key={subChild._id}
                            to={`/topic/${subChild.slug}`}
                            onClick={() => {
                              setShowFindCoursesDropdown(false);
                              setActiveParent(null);
                              setActiveChild(null);
                            }}
                            className="px-4 py-2 text-lg font-light text-gray-700 hover:bg-purple-50 hover:text-[#a435f0] transition-colors"
                          >
                            {subChild.name}
                          </Link>
                        ))
                      ) : activeChild ? (
                        topics
                          .filter((t) => t.type === "topic" && t.parentCategory === activeChild.name)
                          .map((topic) => (
                            <Link
                              key={topic._id}
                              to={`/topic/${topic.slug}`}
                              onClick={() => {
                                setShowFindCoursesDropdown(false);
                                setActiveParent(null);
                                setActiveChild(null);
                              }}
                              className="px-4 py-2 text-lg font-light text-gray-700 hover:bg-purple-50 hover:text-[#a435f0] transition-colors"
                            >
                              {topic.name}
                            </Link>
                          ))
                      ) : (
                        <div className="px-4 py-8 text-center text-base text-gray-400">
                          Hover over a subcategory to see popular topics.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Get Certified Hover Menu */}
              <div
                className="relative py-4"
                onMouseEnter={handleGetCertifiedEnter}
                onMouseLeave={handleGetCertifiedLeave}
              >
                <button className="text-lg font-light text-gray-700 hover:text-purple-600 transition-colors">
                  Get Certified
                </button>
                {showGetCertifiedDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-lg flex z-50 text-slate-800 min-h-[350px] w-[550px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Column 1: Issuers */}
                    <div className="w-60 border-r border-gray-100 py-3 bg-gray-50/50 flex flex-col overflow-y-auto">
                      <h4 className="px-4 py-1 text-base font-light text-gray-400 uppercase tracking-wider mb-2">
                        Popular Issuers
                      </h4>
                      {issuersList.map((issuer) => (
                        <div
                          key={issuer._id}
                          onMouseEnter={() => setActiveIssuer(issuer._id)}
                          className={`px-4 py-2 text-lg font-light cursor-pointer flex items-center justify-between transition-colors ${
                            activeIssuer === issuer._id
                              ? "bg-purple-50 text-[#a435f0]"
                              : "hover:bg-gray-100 hover:text-purple-600"
                          }`}
                        >
                          <span>{issuer.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-75" />
                        </div>
                      ))}
                    </div>

                    {/* Column 2: Certifications */}
                    <div className="w-80 py-3 flex flex-col overflow-y-auto bg-white">
                      <h4 className="px-4 py-1 text-base font-light text-gray-400 uppercase tracking-wider mb-2">
                        Certifications
                      </h4>
                      {activeIssuer ? (
                        certsList
                          .filter((c) => c.issuer?._id === activeIssuer)
                          .map((c) => (
                            <Link
                              key={c._id}
                              to={`/certification/${c.slug}`}
                              onClick={() => {
                                setShowGetCertifiedDropdown(false);
                                setActiveIssuer(null);
                              }}
                              className="px-4 py-2 text-lg font-light text-gray-700 hover:bg-purple-50 hover:text-[#a435f0] transition-colors leading-snug"
                            >
                              {c.name}
                            </Link>
                          ))
                      ) : (
                        <div className="px-4 py-8 text-center text-base text-gray-400">
                          Hover over an issuer to see certifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Subscribe Link */}
              <Link
                to="/subscribe"
                className="text-lg font-light text-gray-700 hover:text-purple-600 transition-colors"
              >
                Subscribe
              </Link>
            </div>
          )}
        </div>

        {/* --- Search Bar: visible only for students/guests on non-dashboard pages --- */}
        {!isDashboardPage && (!user || user.role === "student") && (
          <div
            ref={searchContainerRef}
            className="flex-1 hidden md:flex items-center mx-6 relative"
          >
            <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
              <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 z-10 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder={t("navbar.search_placeholder") || "Search for anything"}
                className="w-full h-11 border border-slate-300 rounded-full pl-12 pr-4 text-base bg-[#f7f9fa] text-[#1c1d1f] hover:bg-[#e2e8f0] focus:bg-white focus:border-[#1c1d1f] focus:outline-none transition-all placeholder:text-slate-500"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => setIsDropdownVisible(true)}
                autoComplete="off"
              />
            </form>
            {isDropdownVisible && (
              <div className="absolute top-full w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-[70vh] overflow-y-auto p-2">
                {searchQuery.trim() === "" ? (
                  <div>
                    <h3 className="px-3 py-2 text-base font-light text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50">
                      <TrendingUp size={16} />
                      Trending Searches
                    </h3>
                    {trendingSuggestions.length > 0 ? (
                      <ul className="py-1">
                        {trendingSuggestions.map((suggestion) => (
                          <li key={suggestion}>
                            <button
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-4 px-3 py-3 text-xl font-light text-gray-800 hover:bg-gray-100 rounded-md text-left"
                            >
                              <TrendingUp size={20} className="text-gray-400" />
                              <span>{suggestion}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-3 py-4 text-lg text-gray-500">
                        No trending suggestions found.
                      </div>
                    )}
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <>
                    {!isLoading &&
                      results.suggestions.length === 0 &&
                      results.courses.length === 0 && (
                        <div className="p-4 text-lg text-center text-gray-500">
                          {t("navbar.no_results", { query: searchQuery })}
                        </div>
                      )}
                    {results.suggestions.length > 0 && (
                      <ul className="py-1">
                        {results.suggestions.map((suggestion) => (
                          <li key={suggestion}>
                            <button
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-4 px-3 py-3 text-xl font-light text-gray-800 hover:bg-gray-100 rounded-md"
                            >
                              <Search size={20} />
                              <span>{suggestion}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {results.suggestions.length > 0 &&
                      results.courses.length > 0 && <hr className="my-2" />}
                    {results.courses.length > 0 && (
                      <div>
                        <h3 className="px-3 py-1 text-base font-light text-gray-500 uppercase">
                          {t("navbar.courses_heading")}
                        </h3>
                        <ul>
                          {results.courses.map((course) => (
                            <li key={course._id}>
                              <Link
                                to={`/course-detail/${course._id}`}
                                className="flex items-center gap-3 p-2 rounded-md text-gray-800 hover:bg-gray-100"
                                onClick={() => setIsDropdownVisible(false)}
                              >
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="w-11 h-11 object-cover bg-gray-200"
                                />
                                <div className="flex flex-col">
                                  <span className="font-light text-lg leading-tight">
                                    {course.title}
                                  </span>
                                  <span className="text-base text-gray-500">
                                    {course.creatorName}
                                  </span>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Right side of Navbar (MAIN CHANGE IS HERE) --- */}
        <div className="hidden md:flex items-center gap-6">
          {/* Nav links: show only for students/guests on non-dashboard pages */}
          {!isDashboardPage && (!user || user.role === "student") && (
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/about" className="text-lg font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.about")}
              </Link>
              <Link to="/how-it-works" className="text-lg font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.how_it_works")}
              </Link>
              <Link to="/contact" className="text-lg font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.contact")}
              </Link>
              <Link to="/blog" className="text-lg font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.blog")}
              </Link>
            </div>
          )}
          <div className="h-full min-w-[220px] flex items-center justify-end">
            {user ? (
              <div className="flex items-center gap-6">
                {isInstructorOrAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(user.role === "instructor" ? "/instructor/dashboard" : "/admin/dashboard")}
                    className="text-base font-medium border border-[#1c1d1f] rounded-none hover:border-purple-600 hover:text-purple-600 h-10 px-4 transition-colors shrink-0 flex items-center justify-center gap-2 bg-white"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {user.role === "instructor" ? t("navbar.instructor_dashboard") : t("navbar.admin_dashboard") || "Admin Dashboard"}
                  </Button>
                )}



                {/* My Learning - students only, non-dashboard pages */}
                {user?.role === "student" && !isDashboardPage && (
                  <div
                    className="relative py-5"
                    onMouseEnter={handleMyLearningEnter}
                    onMouseLeave={handleMyLearningLeave}
                  >
                    <Link
                      to="/home/my-courses/learning"
                      className="text-base font-light text-gray-700 hover:text-[#a435f0] transition-colors"
                    >
                      {t("navbar.my_learning") || "My learning"}
                    </Link>

                    {/* My Learning Hover Dropdown */}
                    {showMyLearningDropdown && (
                      <div
                        className="absolute right-0 top-full w-[340px] bg-white border border-gray-200 shadow-2xl z-[200] rounded-sm"
                        onMouseEnter={handleMyLearningEnter}
                        onMouseLeave={handleMyLearningLeave}
                      >
                        <MyLearningDropdown navigate={navigate} />
                      </div>
                    )}
                  </div>
                )}
                {!isDashboardPage && user.role === "student" && (
                  <>
                    {/* Wishlist hover dropdown */}
                    <div
                      className="relative py-5 -my-5"
                      onMouseEnter={() => {
                        if (wishlistLeaveTimer.current) clearTimeout(wishlistLeaveTimer.current);
                        setShowWishlistDropdown(true);
                      }}
                      onMouseLeave={() => {
                        wishlistLeaveTimer.current = setTimeout(() => setShowWishlistDropdown(false), 150);
                      }}
                    >
                      <Link
                        to="/home/my-courses/wishlist"
                        className="text-[22px] text-gray-700 hover:text-purple-600 flex items-center"
                        aria-label={t("navbar.wishlist")}
                      >
                        <Heart className="w-6 h-6" />
                      </Link>

                      {showWishlistDropdown && (
                        <div
                          className="absolute right-0 top-full w-[340px] bg-white border border-gray-200 shadow-2xl z-[200] rounded-sm"
                          onMouseEnter={() => {
                            if (wishlistLeaveTimer.current) clearTimeout(wishlistLeaveTimer.current);
                            setShowWishlistDropdown(true);
                          }}
                          onMouseLeave={() => {
                            wishlistLeaveTimer.current = setTimeout(() => setShowWishlistDropdown(false), 150);
                          }}
                        >
                          <WishlistDropdown navigate={navigate} />
                        </div>
                      )}
                    </div>
                    {/* Cart hover dropdown */}
                    <div
                      className="relative py-5 -my-5 animate-none"
                      onMouseEnter={() => {
                        if (cartLeaveTimer.current) clearTimeout(cartLeaveTimer.current);
                        setShowCartDropdown(true);
                      }}
                      onMouseLeave={() => {
                        cartLeaveTimer.current = setTimeout(() => setShowCartDropdown(false), 150);
                      }}
                    >
                      <Link
                        to="/cart"
                        className="text-[22px] text-gray-700 hover:text-purple-600 flex items-center relative"
                        aria-label={t("navbar.cart")}
                      >
                        <ShoppingCart className="w-6 h-6" />
                        {cartCount > 0 && (
                          <span className="absolute -top-1.5 -right-2 bg-[#6d28d2] text-white text-[10px] font-light h-4 w-4 rounded-full flex items-center justify-center border border-white">
                            {cartCount}
                          </span>
                        )}
                      </Link>

                      {showCartDropdown && (
                        <div
                          className="absolute right-0 top-full w-[340px] bg-white border border-gray-200 shadow-2xl z-[200] rounded-sm"
                          onMouseEnter={() => {
                            if (cartLeaveTimer.current) clearTimeout(cartLeaveTimer.current);
                            setShowCartDropdown(true);
                          }}
                          onMouseLeave={() => {
                            cartLeaveTimer.current = setTimeout(() => setShowCartDropdown(false), 150);
                          }}
                        >
                          <CartDropdown navigate={navigate} />
                        </div>
                      )}
                    </div>
                  </>
                )}


                <NotificationBell />
                <UserAvatar user={user} onLogout={logoutHandler} t={t} cartCount={cartCount} />
              </div>
            ) : (
              renderAuthSection()
            )}
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden focus:outline-none text-3xl"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : <Menu />}
        </button>
      </div>

      {/* --- Mobile Menu (No Changes) --- */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader />
          <nav className="grid gap-4 mt-8">
            <button
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogoClick();
              }}
            >
              <Home size={16} /> {t("navbar.home")}
            </button>
            {/* Show normal nav links on non-dashboard pages only for students/guests */}
            {!isDashboardPage && (!user || user.role === "student") && (
              <>
                <Link to="/course/search" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  <BookOpen size={16} /> {t("navbar.courses_heading")}
                </Link>
                {user?.role === "student" && (
                  <>
                    <Link to="/home/my-courses/learning" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                      <BookOpen size={16} /> {t("navbar.my_learning")}
                    </Link>
                    <Link to="/career-roadmap" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                      <Compass size={16} /> Career Roadmap
                    </Link>
                    <Link to="/nearby-hub" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                      <Globe size={16} /> Nearby Hub
                    </Link>
                  </>
                )}
                <Link to="/about" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.about")}
                </Link>
                <Link to="/how-it-works" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.how_it_works")}
                </Link>
                <Link to="/contact" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.contact")}
                </Link>
                <Link to="/blog" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.blog")}
                </Link>
              </>
            )}
            {user && (
              <Link to={publicProfilePath} className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} /> {t("navbar.profile")}
              </Link>
            )}
            {/* Dashboard button in mobile - shown always for admin/instructor */}
            {isInstructorOrAdmin && (
              <button
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xl font-light hover:bg-gray-100 text-left w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(user?.role === "instructor" ? "/instructor/dashboard" : "/admin/dashboard");
                }}
              >
                <LayoutDashboard size={16} />
                {user?.role === "instructor" ? t("navbar.instructor_dashboard") : t("navbar.admin_dashboard") || "Admin Dashboard"}
              </button>
            )}
          </nav>
          <div className="mt-auto">
            {user ? (
              <Button
                variant="destructive"
                onClick={() => {
                  logoutHandler();
                  setMobileMenuOpen(false);
                }}
                className="w-full gap-2"
              >
                <LogOut size={16} /> {t("navbar.logout")}
              </Button>
            ) : (
              <div className="grid gap-2 w-full">
                <Button
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  {t("navbar.login")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate("/register");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  {t("navbar.signup")}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

// Add default props for user to prevent errors if user is null or undefined initially
UserAvatar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    photoUrl: PropTypes.string,
    role: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};


export default Navbar;