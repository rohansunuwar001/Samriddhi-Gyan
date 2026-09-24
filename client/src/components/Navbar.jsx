import { useLogoutUserMutation, useSaveSearchTermMutation } from "@/features/api/authApi";
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
  LayoutDashboard,
  Building2
} from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import NotificationBell from './NotificationBell';
import LanguageModal from "./LanguageModal";
import RequestDemoModal from "@/pages/business/RequestDemoModal";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import { useGetAllTopicsQuery } from "@/features/api/topicApi";
import { useGetPublicExploreSectionsQuery } from "@/features/api/exploreSectionApi";
import { renderExploreIcon } from "@/pages/admin/ExploreMenuManager";
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
        <div className="p-6 text-center text-lg text-gray-500">
          <p className="font-extralight">No enrolled courses yet.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-extralight hover:underline"
          >
            Browse courses
          </button>
        </div>
      ) : (
        <div>
          {/* Course list — max 4 */}
          <ul className="divide-y divide-gray-100">
            {courses.slice(0, 4).map((course, idx) => {
              const progress = course.progress || 0;
              const hasStarted = progress > 0;
              const thumbnail = course.thumbnail;

              return (
                <li key={course._id || course.id || `my-course-${idx}`}>
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
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-2xl font-extralight">
                          {(course.title || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-extralight text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
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
                          <p className="text-[11px] text-gray-400 mt-1 font-extralight">
                            {Math.round(progress)}% complete
                          </p>
                        </div>
                      ) : (
                        <p className="text-[13px] font-extralight text-[#6d28d2] hover:text-[#892de1] mt-1.5">
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
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-lg font-extralight py-3 px-4 rounded transition-colors"
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
        <div className="p-8 text-center text-lg text-gray-500">
          <Heart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-light text-gray-700">Your wishlist is empty.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-extralight hover:underline text-lg"
          >
            Browse courses
          </button>
        </div>
      ) : (
        <div>
          {/* Course list — max 3, each is a self-contained card block */}
          <ul className="divide-y divide-gray-100">
            {courses.slice(0, 3).map((course, idx) => {
              // Correct nested price fields: price.current & price.original
              const currentPrice = course.price?.current ?? 0;
              const originalPrice = course.price?.original ?? 0;
              const hasDiscount = originalPrice > currentPrice && originalPrice > 0;
              const instructor = course.creator?.name || "Instructor";

              return (
                <li key={course._id || course.id || `wishlist-course-${idx}`} className="px-4 pt-4 pb-3">
                  {/* Row: thumbnail + info */}
                  <div
                    onClick={() => navigate(`/course/${course.slug || course._id}`)}
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
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-3xl font-extralight">
                          {(course.title || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Title + instructor + price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-extralight text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
                        {course.title}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                        {instructor}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[14px] font-extralight text-[#1c1d1f]">
                          Rs.{currentPrice.toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span className="text-[12px] text-gray-400 line-through font-light">
                            Rs.{originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add to cart — full-width outlined button inside the card */}
                  <button
                    onClick={(e) => handleAddToCart(e, course._id)}
                    className="w-full border border-[#6d28d2] text-[#6d28d2] hover:text-[#892de1] hover:bg-[#f5eeff] hover:border-[#892de1] text-[13px] font-extralight py-2.5 rounded transition-colors"
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
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-[13.5px] font-extralight py-3 rounded transition-colors"
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
        <div className="p-8 text-center text-lg text-gray-500">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-light text-gray-700">Your cart is empty.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-extralight hover:underline text-lg"
          >
            Keep shopping
          </button>
        </div>
      ) : (
        <div>
          {/* Course list — max 3 */}
          <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
            {courses.slice(0, 3).map((course, idx) => {
              const currentPrice = course.price?.current ?? 0;
              const originalPrice = course.price?.original ?? 0;
              const hasDiscount = originalPrice > currentPrice && originalPrice > 0;
              const instructor = course.creator?.name || "Instructor";

              return (
                <li
                  key={course._id || course.id || `cart-course-${idx}`}
                  className="p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/course/${course.slug || course._id}`)}
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
                      <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-3xl font-extralight">
                        {(course.title || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-extralight text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#6d28d2] transition-colors">
                      {course.title}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                      {instructor}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[14px] font-extralight text-[#1c1d1f]">
                        Rs.{currentPrice.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-[12px] text-gray-400 line-through font-light">
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
              <span className="text-[15px] font-extralight text-slate-500 block">Total:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[18px] font-extralight text-[#1c1d1f]">
                  Rs.{totalCurrent.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-[14px] text-gray-400 line-through font-light">
                    Rs.{totalOriginal.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate("/cart")}
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-[14px] font-extralight py-3 rounded transition-colors"
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

// --- Business Hover Dropdown ---
const BusinessDropdown = ({ navigate, onOpenDemoModal, onClose }) => {
  return (
    <div className="p-7 w-[340px] bg-white text-center flex flex-col items-center">
      <h3 className="font-semibold text-[#1c1d1f] text-[18px] leading-snug mb-2.5">
        Get your team access to top courses, anytime, anywhere.
      </h3>
      <p className="text-[14px] text-[#6a6f73] leading-relaxed mb-6">
        Upskill your employees with on-demand business, tech, and leadership training.
      </p>

      <div className="w-full space-y-3">
        <button
          onClick={() => {
            onClose?.();
            navigate("/business/plans");
          }}
          className="w-full bg-[#1c1d1f] hover:bg-[#2d2f31] text-white font-semibold h-11 text-[15px] rounded-none transition-colors"
        >
          Compare Plans
        </button>

        <button
          onClick={() => {
            onClose?.();
            navigate("/business/request-demo");
          }}
          className="w-full border border-[#1c1d1f] hover:bg-gray-50 text-[#1c1d1f] font-semibold h-11 text-[15px] rounded-none transition-colors"
        >
          Request a Demo
        </button>
      </div>
    </div>
  );
};

BusinessDropdown.propTypes = {
  navigate: PropTypes.func.isRequired,
  onOpenDemoModal: PropTypes.func.isRequired,
  onClose: PropTypes.func,
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
          <AvatarFallback className="font-light text-white bg-[#1c1d1f]">{initials}</AvatarFallback>
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
              <AvatarFallback className="font-light text-white bg-[#1c1d1f] text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-light text-[#1c1d1f] truncate leading-snug">{user.name}</p>
              <p className="text-base text-gray-500 truncate mt-1.5" title={user.email}>{displayEmail}</p>
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
                    <span className="bg-[#a435f0] text-white text-[11px] font-light w-[22px] h-[22px] rounded-full flex items-center justify-center">
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
                  <span className="flex items-center gap-1.5 text-slate-500 font-light">
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
              className="w-full text-left px-4 py-2 text-[14px] text-slate-750 hover:text-[#5624d0] hover:bg-slate-50 transition-colors focus:outline-none font-light"
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
  const [saveSearchTerm] = useSaveSearchTermMutation();
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
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const businessLeaveTimer = useRef(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isNavLangModalOpen, setIsNavLangModalOpen] = useState(false);

  const handleBusinessEnter = () => {
    if (businessLeaveTimer.current) clearTimeout(businessLeaveTimer.current);
    setShowBusinessDropdown(true);
  };
  const handleBusinessLeave = () => {
    businessLeaveTimer.current = setTimeout(() => setShowBusinessDropdown(false), 150);
  };

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
  const { data: exploreSectionData } = useGetPublicExploreSectionsQuery();
  const exploreSectionItems = exploreSectionData?.items || [];

  const featuredSectionItems = useMemo(
    () => exploreSectionItems.filter((item) => item.section === "featured"),
    [exploreSectionItems]
  );

  const goalSectionItems = useMemo(
    () => exploreSectionItems.filter((item) => item.section === "goal"),
    [exploreSectionItems]
  );

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
    }, 200);
  };

  // --- Category Nav Bar Hover State & Data ---
  const DEFAULT_CATEGORIES = [
    {
      name: "Development",
      slug: "development",
      subcategories: [
        { name: "Web Development", slug: "web-development" },
        { name: "Data Science", slug: "data-science" },
        { name: "Mobile Development", slug: "mobile-development" },
        { name: "Programming Languages", slug: "programming-languages" },
        { name: "Game Development", slug: "game-development" },
        { name: "Database Design & Development", slug: "database-design-development" },
        { name: "Software Testing", slug: "software-testing" },
        { name: "Software Engineering", slug: "software-engineering" },
        { name: "Software Development Tools", slug: "software-development-tools" },
        { name: "No-Code Development", slug: "no-code-development" },
      ],
    },
    {
      name: "Business",
      slug: "business",
      subcategories: [
        { name: "Entrepreneurship", slug: "entrepreneurship" },
        { name: "Communication", slug: "communication" },
        { name: "Management", slug: "management" },
        { name: "Sales", slug: "sales" },
        { name: "Business Strategy", slug: "business-strategy" },
        { name: "Operations", slug: "operations" },
        { name: "Project Management", slug: "project-management" },
        { name: "Business Law", slug: "business-law" },
        { name: "Business Analytics & Intelligence", slug: "business-analytics-intelligence" },
        { name: "Human Resources", slug: "human-resources" },
      ],
    },
    {
      name: "Finance & Accounting",
      slug: "finance-accounting",
      subcategories: [
        { name: "Accounting & Bookkeeping", slug: "accounting-bookkeeping" },
        { name: "Cryptocurrency & Blockchain", slug: "cryptocurrency-blockchain" },
        { name: "Finance", slug: "finance" },
        { name: "Financial Modeling & Analysis", slug: "financial-modeling-analysis" },
        { name: "Investing & Trading", slug: "investing-trading" },
        { name: "Money Management Tools", slug: "money-management-tools" },
        { name: "Taxes", slug: "taxes" },
        { name: "Economics", slug: "economics" },
      ],
    },
    {
      name: "IT & Software",
      slug: "it-software",
      subcategories: [
        { name: "IT Certifications", slug: "it-certifications" },
        { name: "Network & Security", slug: "network-security" },
        { name: "Hardware", slug: "hardware" },
        { name: "Operating Systems & Servers", slug: "operating-systems-servers" },
        { name: "Other IT & Software", slug: "other-it-software" },
      ],
    },
    {
      name: "Office Productivity",
      slug: "office-productivity",
      subcategories: [
        { name: "Microsoft", slug: "microsoft" },
        { name: "Apple", slug: "apple" },
        { name: "Google", slug: "google" },
        { name: "SAP", slug: "sap" },
        { name: "Oracle", slug: "oracle" },
        { name: "Other Office Productivity", slug: "other-office-productivity" },
      ],
    },
    {
      name: "Personal Development",
      slug: "personal-development",
      subcategories: [
        { name: "Personal Transformation", slug: "personal-transformation" },
        { name: "Personal Productivity", slug: "personal-productivity" },
        { name: "Leadership", slug: "leadership" },
        { name: "Career Development", slug: "career-development" },
        { name: "Parenting & Relationships", slug: "parenting-relationships" },
        { name: "Happiness", slug: "happiness" },
        { name: "Memory & Study Skills", slug: "memory-study-skills" },
      ],
    },
    {
      name: "Design",
      slug: "design",
      subcategories: [
        { name: "Web Design", slug: "web-design" },
        { name: "Graphic Design & Illustration", slug: "graphic-design-illustration" },
        { name: "Design Tools", slug: "design-tools" },
        { name: "User Experience Design", slug: "user-experience-design" },
        { name: "Game Design", slug: "game-design" },
        { name: "3D & Animation", slug: "3d-animation" },
        { name: "Fashion Design", slug: "fashion-design" },
        { name: "Architectural Design", slug: "architectural-design" },
      ],
    },
    {
      name: "Marketing",
      slug: "marketing",
      subcategories: [
        { name: "Digital Marketing", slug: "digital-marketing" },
        { name: "Search Engine Optimization (SEO)", slug: "search-engine-optimization" },
        { name: "Social Media Marketing", slug: "social-media-marketing" },
        { name: "Branding", slug: "branding" },
        { name: "Marketing Fundamentals", slug: "marketing-fundamentals" },
        { name: "Marketing Analytics & Automation", slug: "marketing-analytics-automation" },
        { name: "Public Relations", slug: "public-relations" },
        { name: "Paid Advertising", slug: "paid-advertising" },
      ],
    },
    {
      name: "Health & Fitness",
      slug: "health-fitness",
      subcategories: [
        { name: "Fitness", slug: "fitness" },
        { name: "General Health", slug: "general-health" },
        { name: "Sports", slug: "sports" },
        { name: "Nutrition & Diet", slug: "nutrition-diet" },
        { name: "Yoga", slug: "yoga" },
        { name: "Mental Health", slug: "mental-health" },
        { name: "Martial Arts & Self Defense", slug: "martial-arts-self-defense" },
        { name: "Safety & First Aid", slug: "safety-first-aid" },
      ],
    },
    {
      name: "Music",
      slug: "music",
      subcategories: [
        { name: "Instruments", slug: "instruments" },
        { name: "Music Production", slug: "music-production" },
        { name: "Music Fundamentals", slug: "music-fundamentals" },
        { name: "Vocal", slug: "vocal" },
        { name: "Music Techniques", slug: "music-techniques" },
        { name: "Music Software", slug: "music-software" },
        { name: "Other Music", slug: "other-music" },
      ],
    },
  ];

  const [activeNavCategory, setActiveNavCategory] = useState(null);
  const navCategoryTimer = useRef(null);

  const handleNavCategoryEnter = (cat) => {
    if (navCategoryTimer.current) clearTimeout(navCategoryTimer.current);
    setActiveNavCategory(cat);
  };

  const handleNavCategoryLeave = () => {
    navCategoryTimer.current = setTimeout(() => {
      setActiveNavCategory(null);
    }, 150);
  };

  // Merge API categoryTree with default categories for rich coverage
  const displayNavCategories = DEFAULT_CATEGORIES.map((defCat) => {
    const matched = categoryTree.find(
      (c) => c.name?.toLowerCase() === defCat.name.toLowerCase()
    );
    if (matched && matched.children && matched.children.length > 0) {
      // Gather sub-child topics (level 2 categories)
      const subChildList = [];
      matched.children.forEach((child) => {
        if (child.children && child.children.length > 0) {
          child.children.forEach((subChild) => {
            subChildList.push({
              name: subChild.name,
              slug: subChild.slug || subChild.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              _id: subChild._id,
            });
          });
        }
      });

      const matchedTopics = subChildList.length > 0
        ? subChildList
        : topics
            .filter((t) => t.type === "topic" && matched.children.some((c) => c.name === t.parentCategory))
            .map((t) => ({ name: t.name, slug: t.slug, _id: t._id }));

      return {
        ...defCat,
        _id: matched._id,
        slug: matched.slug || defCat.slug,
        subcategories: matchedTopics,
      };
    }
    return {
      ...defCat,
      subcategories: [],
    };
  });

  const displayExploreCategories = useMemo(() => {
    if (Array.isArray(categoryTree) && categoryTree.length > 0) {
      return categoryTree;
    }
    return DEFAULT_CATEGORIES;
  }, [categoryTree]);

  const parentChildren = useMemo(() => {
    if (!activeParent) return [];
    if (activeParent.isCustom) {
      return activeParent.column2Items || [];
    }
    if (Array.isArray(activeParent.children) && activeParent.children.length > 0) {
      return activeParent.children;
    }
    if (Array.isArray(activeParent.subcategories) && activeParent.subcategories.length > 0) {
      return activeParent.subcategories;
    }
    return [];
  }, [activeParent]);

  const getChildHasSubChildren = (child) => {
    if (!child) return false;
    if (activeParent?.isCustom) {
      return Array.isArray(child.subItems) && child.subItems.length > 0;
    }
    if (Array.isArray(child.children) && child.children.length > 0) return true;
    if (
      Array.isArray(topics) &&
      topics.some(
        (t) =>
          t.type === "topic" &&
          (t.parentCategory?.toLowerCase() === child.name?.toLowerCase() ||
           String(t.parentCategory) === String(child._id))
      )
    ) {
      return true;
    }
    return false;
  };

  const activeChildSubChildren = useMemo(() => {
    if (!activeChild) return [];
    if (activeParent?.isCustom) {
      return (activeChild.subItems || []).map((s, idx) => ({
        _id: s._id || `sub-${idx}`,
        name: s.name,
        slug: s.link?.startsWith("/topic/") ? s.link.replace("/topic/", "") : null,
        link: s.link,
      }));
    }

    const list = [];
    const seen = new Set();

    // 1. Direct children from categoryTree
    if (Array.isArray(activeChild.children)) {
      activeChild.children.forEach((sc) => {
        const slug = sc.slug || (sc.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const key = slug.toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push({
            _id: sc._id,
            name: sc.name,
            slug,
          });
        }
      });
    }

    // 2. Direct topics matching child
    if (Array.isArray(topics)) {
      topics
        .filter(
          (t) =>
            t.type === "topic" &&
            (t.parentCategory?.toLowerCase() === activeChild.name?.toLowerCase() ||
             String(t.parentCategory) === String(activeChild._id))
        )
        .forEach((t) => {
          const slug = t.slug || (t.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const key = slug.toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            list.push({
              _id: t._id,
              name: t.name,
              slug,
            });
          }
        });
    }

    return list;
  }, [activeChild, activeParent, topics]);

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
    // Persist suggestion click as a search term (fire-and-forget, only for logged-in users)
    if (user) saveSearchTerm(suggestion);
  };
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/course/search?query=${encodeURIComponent(searchQuery)}`);
      setIsDropdownVisible(false);
      // Persist the search term in DB (fire-and-forget, only for logged-in users)
      if (user) saveSearchTerm(searchQuery.trim());
    }
  };

  const dashboardLabel =
    user?.role === "instructor" ? (
      <span className="font-extralight text-5xl text-purple-700">
        {t("navbar.instructor_dashboard")}
      </span>
    ) : user?.role === "admin" ? (
      <span className="font-extralight text-5xl text-purple-700">
        {t("navbar.admin_dashboard") || "Admin Dashboard"}
      </span>
    ) : null;

  const welcomeText =
    user && (user.role === "instructor" || user.role === "admin") ? (
      <span className="ml-6 font-extralight text-2xl text-gray-700">
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
      <div className="flex items-center gap-3">
        {/* Samriddhi Business Hover Menu */}
        <div
          className="relative py-4 hidden lg:block"
          onMouseEnter={handleBusinessEnter}
          onMouseLeave={handleBusinessLeave}
        >
          <Link
            to="/business/plans"
            className="text-[14px] font-light text-gray-800 hover:text-[#a435f0] transition-colors whitespace-nowrap block"
          >
            Samriddhi Business
          </Link>

          {showBusinessDropdown && (
            <div
              className="absolute left-0 top-full bg-white border border-gray-200 shadow-2xl z-[200] rounded-sm animate-in fade-in slide-in-from-top-1 duration-150"
              onMouseEnter={handleBusinessEnter}
              onMouseLeave={handleBusinessLeave}
            >
              <BusinessDropdown
                navigate={navigate}
                onOpenDemoModal={() => setIsDemoModalOpen(true)}
                onClose={() => setShowBusinessDropdown(false)}
              />
            </div>
          )}
        </div>

        <Link
          to="/signup"
          className="text-[14px] font-light text-gray-800 hover:text-[#a435f0] transition-colors hidden lg:block whitespace-nowrap"
        >
          Teach on Samriddhi
        </Link>

        {/* Cart Icon for Guest */}
        <div
          className="relative py-4"
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
            className="text-gray-800 hover:text-[#a435f0] flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            aria-label={t("navbar.cart") || "Cart"}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#a435f0] text-white text-[10px] font-semibold h-4 w-4 rounded-full flex items-center justify-center border border-white">
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

        {/* Log In Button */}
        <button
          onClick={() => navigate("/login")}
          className="border border-[#1c1d1f] text-[#1c1d1f] hover:bg-gray-50 font-semibold px-4 py-2 h-10 rounded-sm text-[14px] transition-all duration-150 whitespace-nowrap"
        >
          {t("navbar.login") || "Log in"}
        </button>

        {/* Sign Up Button */}
        <button
          onClick={() => navigate("/register")}
          className="bg-[#1c1d1f] hover:bg-[#2d2f31] text-white font-semibold px-4 py-2 h-10 rounded-sm text-[14px] transition-all duration-150 shadow-sm whitespace-nowrap"
        >
          {t("navbar.signup") || "Sign up"}
        </button>

        {/* Language Globe Button */}
        <button
          onClick={() => setIsNavLangModalOpen(true)}
          className="border border-[#1c1d1f] hover:bg-gray-100 text-[#1c1d1f] h-10 w-10 rounded-sm flex items-center justify-center transition-colors shrink-0"
          aria-label="Select language"
        >
          <Globe className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const isInstructorOrAdmin =
    user?.role === "instructor" || user?.role === "admin";
  const isDashboardPage =
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/admin");
  const isHomePage = pathname === "/" || pathname === "/home";

  return (
    <header className={`bg-white border-b border-gray-200 relative z-40 transition-all duration-300 ease-in-out ${isDashboardPage ? "md:ml-[72px] h-16" : ""}`}>
      <div className="w-full px-6 md:px-8 h-[72px] flex justify-between items-center gap-6 relative z-40">
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
            <div className="hidden lg:flex items-center gap-6 relative z-50">
              {/* Find Courses / Explore Hover Menu */}
              <div
                className="relative py-4"
                onMouseEnter={handleFindCoursesEnter}
                onMouseLeave={handleFindCoursesLeave}
              >
                <button className="text-[14px] font-light text-gray-800 hover:text-[#a435f0] transition-colors">
                  Explore
                </button>
                {showFindCoursesDropdown && (
                  <div
                    onMouseEnter={handleFindCoursesEnter}
                    onMouseLeave={handleFindCoursesLeave}
                    className="absolute top-full left-0 bg-white border border-gray-200 shadow-2xl rounded-2xl flex z-50 text-[#2d2f31] min-h-[460px] max-h-[580px] w-fit overflow-hidden animate-in fade-in duration-150"
                  >
                    {/* Column 1: Sections & Categories (Width increased to 300px) */}
                    <div className="w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-100 py-3 flex flex-col overflow-y-auto bg-white max-h-[580px]">
                      {/* Section 1: New & Featured (Rendered ONLY if admin added items) */}
                      {featuredSectionItems.length > 0 && (
                        <div className="mb-2">
                          <h4 className="px-4 pt-1 pb-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                            New & Featured
                          </h4>
                          {featuredSectionItems.map((item) => {
                            const isItemActive = activeParent?._id === item._id;
                            const hasChildren = Array.isArray(item.column2Items) && item.column2Items.length > 0;

                            return (
                              <div
                                key={item._id}
                                role="button"
                                tabIndex={0}
                                onMouseEnter={() => {
                                  setActiveParent({ isCustom: true, ...item });
                                  setActiveChild(null);
                                }}
                                className={`px-4 py-2.5 text-[14px] cursor-pointer flex items-center justify-between transition-colors select-none ${
                                  isItemActive
                                    ? "text-[#5624d0] font-medium bg-gray-50/80"
                                    : "text-[#2d2f31] font-normal hover:text-[#5624d0] hover:bg-gray-50/50"
                                }`}
                              >
                                <span className="flex items-center gap-2.5 truncate pr-2">
                                  {renderExploreIcon(item.badgeOrIcon, "w-4 h-4 shrink-0")}
                                  <span className="truncate">{item.title}</span>
                                </span>
                                {hasChildren && (
                                  <ChevronRight
                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                      isItemActive ? "text-[#5624d0]" : "text-gray-400"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                          {/* Divider line */}
                          <div className="my-2 border-b border-gray-200 mx-4" />
                        </div>
                      )}

                      {/* Section 2: Explore by goal (Rendered ONLY if admin added items) */}
                      {goalSectionItems.length > 0 && (
                        <div className="mb-2">
                          <h4 className="px-4 pt-1 pb-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                            Explore by goal
                          </h4>
                          {goalSectionItems.map((item) => {
                            const isItemActive = activeParent?._id === item._id;
                            const hasChildren = Array.isArray(item.column2Items) && item.column2Items.length > 0;

                            return (
                              <div
                                key={item._id}
                                role="button"
                                tabIndex={0}
                                onMouseEnter={() => {
                                  setActiveParent({ isCustom: true, ...item });
                                  setActiveChild(null);
                                }}
                                className={`px-4 py-2.5 text-[14px] cursor-pointer flex items-center justify-between transition-colors select-none ${
                                  isItemActive
                                    ? "text-[#5624d0] font-medium bg-gray-50/80"
                                    : "text-[#2d2f31] font-normal hover:text-[#5624d0] hover:bg-gray-50/50"
                                }`}
                              >
                                <span className="flex items-center gap-2.5 truncate pr-2">
                                  {renderExploreIcon(item.badgeOrIcon, "w-4 h-4 shrink-0")}
                                  <span className="truncate">{item.title}</span>
                                </span>
                                {hasChildren && (
                                  <ChevronRight
                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                      isItemActive ? "text-[#5624d0]" : "text-gray-400"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                          {/* Divider line */}
                          <div className="my-2 border-b border-gray-200 mx-4" />
                        </div>
                      )}

                      {/* Section 3: Course Categories */}
                      <div>
                        {displayExploreCategories.map((parent, pIdx) => {
                          const isParentActive =
                            !activeParent?.isCustom &&
                            (activeParent?._id === parent._id ||
                              activeParent?.name?.toLowerCase() === parent.name?.toLowerCase() ||
                              activeParent?.slug === parent.slug);
                          const hasChildren =
                            (parent.children && parent.children.length > 0) ||
                            (parent.subcategories && parent.subcategories.length > 0);

                          return (
                            <div
                              key={parent._id || parent.slug || `cat-parent-${pIdx}`}
                              role="button"
                              tabIndex={0}
                              onMouseEnter={() => {
                                setActiveParent(parent);
                                setActiveChild(null);
                              }}
                              className={`px-4 py-2.5 text-[14px] cursor-pointer flex items-center justify-between transition-colors select-none ${
                                isParentActive
                                  ? "text-[#5624d0] font-medium bg-gray-50/80"
                                  : "text-[#2d2f31] font-normal hover:text-[#5624d0] hover:bg-gray-50/50"
                              }`}
                            >
                              <span className="truncate pr-2">{parent.name}</span>
                              {hasChildren && (
                                <ChevronRight
                                  className={`w-4 h-4 shrink-0 transition-colors ${
                                    isParentActive ? "text-[#5624d0]" : "text-gray-400"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Child Categories or Custom Column 2 Items (Width increased to 300px) */}
                    {activeParent && parentChildren.length > 0 && (
                      <div className="w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-100 py-3 flex flex-col overflow-y-auto bg-white max-h-[580px] animate-in fade-in duration-150">
                        {activeParent.isCustom && activeParent.column2Header && (
                          <h4 className="px-4 pt-1 pb-2 text-[12px] font-bold text-gray-500 uppercase tracking-wider select-none">
                            {activeParent.column2Header}
                          </h4>
                        )}

                        {parentChildren.map((child, cIdx) => {
                          const isChildActive =
                            activeChild?._id === child._id ||
                            activeChild?.name?.toLowerCase() === child.name?.toLowerCase() ||
                            (child.slug && activeChild?.slug === child.slug);
                          const hasSubChildren = getChildHasSubChildren(child);
                          const isDirectLink = activeParent.isCustom && !hasSubChildren && child.link;

                          if (isDirectLink) {
                            return (
                              <Link
                                key={child._id || `custom-c2-${cIdx}`}
                                to={child.link}
                                onClick={() => {
                                  setShowFindCoursesDropdown(false);
                                  setActiveParent(null);
                                  setActiveChild(null);
                                }}
                                className="px-4 py-2.5 text-[14px] cursor-pointer flex items-center justify-between transition-colors select-none text-[#2d2f31] font-normal hover:text-[#5624d0] hover:bg-gray-50/50"
                              >
                                <span className="truncate pr-2">{child.name}</span>
                              </Link>
                            );
                          }

                          return (
                            <div
                              key={child._id || child.slug || `cat-child-${cIdx}`}
                              role="button"
                              tabIndex={0}
                              onMouseEnter={() => setActiveChild(child)}
                              className={`px-4 py-2.5 text-[14px] cursor-pointer flex items-center justify-between transition-colors select-none ${
                                isChildActive
                                  ? "text-[#5624d0] font-medium bg-gray-50/80"
                                  : "text-[#2d2f31] font-normal hover:text-[#5624d0] hover:bg-gray-50/50"
                              }`}
                            >
                              <span className="truncate pr-2">{child.name}</span>
                              {hasSubChildren && (
                                <ChevronRight
                                  className={`w-4 h-4 shrink-0 transition-colors ${
                                    isChildActive ? "text-[#5624d0]" : "text-gray-400"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Column 3: Topics / Sub-Child Categories (Width increased to 300px) */}
                    {activeChild && activeChildSubChildren.length > 0 && (
                      <div className="w-[300px] min-w-[300px] max-w-[300px] py-3 flex flex-col overflow-y-auto bg-white max-h-[580px] animate-in fade-in duration-150">
                        <h4 className="px-4 pt-1 pb-2 text-[12px] font-bold text-gray-500 uppercase tracking-wider select-none">
                          Popular topics
                        </h4>
                        {activeChildSubChildren.map((subChild, sIdx) => {
                          const destination =
                            subChild.link ||
                            (subChild.slug ? `/topic/${subChild.slug}` : `/course/search?q=${encodeURIComponent(subChild.name)}`);

                          return (
                            <Link
                              key={subChild._id || subChild.slug || `cat-subchild-${sIdx}`}
                              to={destination}
                              onClick={() => {
                                setShowFindCoursesDropdown(false);
                                setActiveParent(null);
                                setActiveChild(null);
                              }}
                              className="px-4 py-2.5 text-[14px] font-normal text-[#2d2f31] hover:text-[#5624d0] hover:bg-gray-50/80 transition-colors select-none truncate block"
                            >
                              {subChild.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subscribe Link */}
              <Link
                to="/subscribe"
                className="text-[14px] font-light text-gray-800 hover:text-[#a435f0] transition-colors"
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
            className="flex-1 hidden md:flex items-center mx-6 relative z-50"
          >
            <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
              <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 z-10 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder={t("navbar.search_placeholder") || "Search for anything"}
                className="w-full h-11 border border-slate-300 rounded-full pl-12 pr-4 text-lg bg-[#f7f9fa] text-[#1c1d1f] hover:bg-[#e2e8f0] focus:bg-white focus:border-[#1c1d1f] focus:outline-none transition-all placeholder:text-slate-500"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => setIsDropdownVisible(true)}
                autoComplete="off"
              />
            </form>
            {isDropdownVisible && (
              <div className="absolute top-full w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto p-2">
                {searchQuery.trim() === "" ? (
                  <div>
                    <h3 className="px-3 py-2 text-lg font-extralight text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50">
                      <TrendingUp size={16} />
                      Trending Searches
                    </h3>
                    {trendingSuggestions.length > 0 ? (
                      <ul className="py-1">
                        {trendingSuggestions.map((suggestion, sIdx) => (
                          <li key={suggestion ? `trend-${suggestion}-${sIdx}` : `trend-${sIdx}`}>
                            <button
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-4 px-3 py-3 text-2xl font-extralight text-gray-800 hover:bg-gray-100 rounded-md text-left"
                            >
                              <TrendingUp size={20} className="text-gray-400" />
                              <span>{suggestion}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-3 py-4 text-xl text-gray-500">
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
                        <div className="p-4 text-xl text-center text-gray-500">
                          {t("navbar.no_results", { query: searchQuery })}
                        </div>
                      )}
                    {results.suggestions.length > 0 && (
                      <ul className="py-1">
                        {results.suggestions.map((suggestion, sIdx) => (
                          <li key={suggestion ? `sug-${suggestion}-${sIdx}` : `sug-${sIdx}`}>
                            <button
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-4 px-3 py-3 text-2xl font-extralight text-gray-800 hover:bg-gray-100 rounded-md"
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
                        <h3 className="px-3 py-1 text-lg font-extralight text-gray-500 uppercase">
                          {t("navbar.courses_heading")}
                        </h3>
                        <ul>
                          {results.courses.map((course, cIdx) => (
                            <li key={course._id || course.id || `search-course-${cIdx}`}>
                              <Link
                                to={`/course/${course.slug || course._id}`}
                                className="flex items-center gap-3 p-2 rounded-md text-gray-800 hover:bg-gray-100"
                                onClick={() => setIsDropdownVisible(false)}
                              >
                                <img
                                  src={course.thumbnail}
                                  alt={course.title}
                                  className="w-11 h-11 object-cover bg-gray-200"
                                />
                                <div className="flex flex-col">
                                  <span className="font-extralight text-xl leading-tight">
                                    {course.title}
                                  </span>
                                  <span className="text-lg text-gray-500">
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

        {/* --- Right side of Navbar --- */}
        <div className="hidden md:flex items-center gap-4">
          <div className="h-full flex items-center justify-end">
            {user ? (
              <div className="flex items-center gap-6">
                {isInstructorOrAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(user.role === "instructor" ? "/instructor/dashboard" : "/admin/dashboard")}
                    className="text-lg font-normal border border-[#1c1d1f] rounded-none hover:border-purple-600 hover:text-purple-600 h-10 px-4 transition-colors shrink-0 flex items-center justify-center gap-2 bg-white"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {user.role === "instructor" ? t("navbar.instructor_dashboard") : t("navbar.admin_dashboard") || "Admin Dashboard"}
                  </Button>
                )}



                {/* Samriddhi Business - students only, non-dashboard pages */}
                {user?.role === "student" && !isDashboardPage && (
                  <div
                    className="relative py-5 hidden lg:block"
                    onMouseEnter={handleBusinessEnter}
                    onMouseLeave={handleBusinessLeave}
                  >
                    <Link
                      to="/business/plans"
                      className="text-lg font-extralight text-gray-700 hover:text-[#a435f0] transition-colors whitespace-nowrap block"
                    >
                      Samriddhi Business
                    </Link>

                    {showBusinessDropdown && (
                      <div
                        className="absolute right-0 top-full bg-white border border-gray-200 shadow-2xl z-[200] rounded-sm animate-in fade-in slide-in-from-top-1 duration-150"
                        onMouseEnter={handleBusinessEnter}
                        onMouseLeave={handleBusinessLeave}
                      >
                        <BusinessDropdown
                          navigate={navigate}
                          onOpenDemoModal={() => setIsDemoModalOpen(true)}
                          onClose={() => setShowBusinessDropdown(false)}
                        />
                      </div>
                    )}
                  </div>
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
                      className="text-lg font-extralight text-gray-700 hover:text-[#a435f0] transition-colors"
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
                          <span className="absolute -top-1.5 -right-2 bg-[#6d28d2] text-white text-[10px] font-extralight h-4 w-4 rounded-full flex items-center justify-center border border-white">
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
          className="md:hidden focus:outline-none text-4xl"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : <Menu />}
        </button>
      </div>

      {/* --- Secondary Horizontal Category Navigation Bar (Udemy Style: Shown only on Logged-in Student Home Page) --- */}
      {isHomePage && user && user.role === "student" && (
        <nav
          className="hidden lg:block bg-white border-t border-gray-100 relative z-20 shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
          onMouseLeave={handleNavCategoryLeave}
        >
          <div className="w-full px-6 md:px-8 flex items-center justify-center gap-6 lg:gap-8 overflow-x-auto scrollbar-none py-0.5">
            {displayNavCategories.map((cat) => {
              const isActive = activeNavCategory?.slug === cat.slug;
              return (
                <div
                  key={cat.slug}
                  className="relative py-2.5 flex items-center shrink-0"
                  onMouseEnter={() => handleNavCategoryEnter(cat)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (activeNavCategory?.slug === cat.slug) {
                        setActiveNavCategory(null);
                      } else {
                        setActiveNavCategory(cat);
                      }
                    }}
                    className={`text-[13px] tracking-tight transition-colors py-1 flex items-center gap-1 focus:outline-none select-none ${
                      isActive
                        ? "text-[#5624d0] font-semibold"
                        : "text-[#2d2f31] hover:text-[#5624d0] font-light"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* --- Dark Subcategory Dropdown Bar (Udemy Style) --- */}
          {activeNavCategory && activeNavCategory.subcategories?.length > 0 && (
            <div
              className="absolute top-full left-0 w-full bg-[#2d2f31] text-white shadow-2xl z-50 border-t border-gray-700 py-3 px-6 md:px-8 transition-all animate-in fade-in duration-150"
              onMouseEnter={() => {
                if (navCategoryTimer.current) clearTimeout(navCategoryTimer.current);
              }}
              onMouseLeave={handleNavCategoryLeave}
            >
              <div className="w-full flex items-center justify-center gap-7 flex-wrap text-[13px]">
                {activeNavCategory.subcategories.map((subCat, idx) => (
                  <Link
                    key={subCat._id || subCat.slug || `nav-sub-${idx}`}
                    to={`/topic/${subCat.slug}`}
                    onClick={() => setActiveNavCategory(null)}
                    className="text-gray-200 hover:text-white font-light hover:underline whitespace-nowrap transition-colors"
                  >
                    {subCat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      )}

      {/* --- Mobile Menu (No Changes) --- */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader />
          <nav className="grid gap-4 mt-8">
            <button
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100"
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
                <Link to="/course/search" className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  <BookOpen size={16} /> {t("navbar.courses_heading")}
                </Link>
                {user?.role === "student" && (
                  <>
                    <Link to="/home/my-courses/learning" className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                      <BookOpen size={16} /> {t("navbar.my_learning")}
                    </Link>
                  </>
                )}
                <Link to="/about" className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.about")}
                </Link>
                <Link to="/business/plans" className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  <Building2 size={16} /> Samriddhi Business
                </Link>
                <Link to="/how-it-works" className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.how_it_works")}
                </Link>
                <Link to="/contact" className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.contact")}
                </Link>
                <Link to="/blog" className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.blog")}
                </Link>
              </>
            )}
            {user && (
              <Link to={publicProfilePath} className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} /> {t("navbar.profile")}
              </Link>
            )}
            {/* Dashboard button in mobile - shown always for admin/instructor */}
            {isInstructorOrAdmin && (
              <button
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-2xl font-extralight hover:bg-gray-100 text-left w-full"
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

      {isNavLangModalOpen && (
        <LanguageModal
          isOpen={isNavLangModalOpen}
          onClose={() => setIsNavLangModalOpen(false)}
        />
      )}

      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
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