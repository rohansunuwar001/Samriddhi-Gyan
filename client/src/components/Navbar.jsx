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
  TrendingUp
} from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import NotificationBell from './NotificationBell';
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import { useGetAllTopicsQuery } from "@/features/api/topicApi";
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
        <div className="p-6 text-center text-sm text-gray-500">
          <p className="font-medium">No enrolled courses yet.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-bold hover:underline"
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
                    {/* Thumbnail — large square tile matching Udemy style */}
                    <div className="w-[72px] h-[72px] rounded overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-lg font-bold">
                          {(course.title || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
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
                          <p className="text-[11px] text-gray-400 mt-1 font-medium">
                            {Math.round(progress)}% complete
                          </p>
                        </div>
                      ) : (
                        <p className="text-[13px] font-bold text-[#6d28d2] hover:text-[#892de1] mt-1.5">
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
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-sm font-bold py-3 px-4 rounded transition-colors"
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
        <div className="p-8 text-center text-sm text-gray-500">
          <Heart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-700">Your wishlist is empty.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-bold hover:underline text-sm"
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
                        <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-xl font-bold">
                          {(course.title || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Title + instructor + price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#a435f0] transition-colors">
                        {course.title}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                        {instructor}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[14px] font-extrabold text-[#1c1d1f]">
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
                    className="w-full border border-[#6d28d2] text-[#6d28d2] hover:text-[#892de1] hover:bg-[#f5eeff] hover:border-[#892de1] text-[13px] font-bold py-2.5 rounded transition-colors"
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
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-[13.5px] font-bold py-3 rounded transition-colors"
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
        <div className="p-8 text-center text-sm text-gray-500">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-700">Your cart is empty.</p>
          <button
            onClick={() => navigate("/course/search")}
            className="mt-3 text-[#6d28d2] hover:text-[#892de1] font-bold hover:underline text-sm"
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
                      <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-600 text-xl font-bold">
                        {(course.title || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-[#1c1d1f] leading-snug line-clamp-2 group-hover:text-[#6d28d2] transition-colors">
                      {course.title}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-0.5 truncate">
                      {instructor}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[14px] font-extrabold text-[#1c1d1f]">
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
              <span className="text-[15px] font-bold text-slate-500 block">Total:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[18px] font-extrabold text-[#1c1d1f]">
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
              className="w-full bg-[#6d28d2] hover:bg-[#892de1] text-white text-[14px] font-bold py-3 rounded transition-colors"
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
const UserAvatar = ({ user, onLogout, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef(null);
  const navigate = useNavigate();

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

  return (
    <div 
      className="relative py-5 -my-5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="w-10 h-10 flex items-center justify-center rounded-full relative focus:outline-none"
        onClick={() => navigate("/profile")}
      >
        <Avatar className="h-10 w-10 border border-slate-200">
          <AvatarImage src={user.photoUrl} alt={user.name} className="object-cover" />
          <AvatarFallback className="font-bold text-slate-700 bg-slate-100">{initials}</AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full w-64 bg-white border border-gray-200 shadow-2xl z-[200] rounded-sm divide-y divide-slate-100 animate-in fade-in duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header Info */}
          <div className="p-4 flex gap-3 items-center">
            <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
              <AvatarImage src={user.photoUrl} alt={user.name} className="object-cover" />
              <AvatarFallback className="font-bold text-slate-700 bg-slate-100">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#1c1d1f] truncate leading-snug">{user.name}</p>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Student Specific Links */}
          {user.role === "student" && (
            <div className="py-2 flex flex-col">
              <Link 
                to="/home/my-courses/learning" 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#6d28d2] hover:bg-slate-50 transition-colors"
              >
                {t("navbar.my_learning") || "My learning"}
              </Link>
              <Link 
                to="/cart" 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#6d28d2] hover:bg-slate-50 transition-colors"
              >
                {t("navbar.cart") || "Cart"}
              </Link>
              <Link 
                to="/home/my-courses/wishlist" 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#6d28d2] hover:bg-slate-50 transition-colors"
              >
                {t("navbar.wishlist") || "Wishlist"}
              </Link>
            </div>
          )}

          {/* Core Action Links */}
          <div className="py-2 flex flex-col">
            <Link 
              to="/profile" 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#6d28d2] hover:bg-slate-50 transition-colors"
            >
              {t("navbar.profile") || "Profile"}
            </Link>
            {user.role === "instructor" && (
              <Link 
                to="/instructor/dashboard" 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#6d28d2] hover:bg-slate-50 transition-colors"
              >
                {t("navbar.instructor_dashboard") || "Instructor Dashboard"}
              </Link>
            )}
            {user.role === "admin" && (
              <Link 
                to="/admin/dashboard" 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#6d28d2] hover:bg-slate-50 transition-colors"
              >
                {t("navbar.admin_dashboard") || "Admin Dashboard"}
              </Link>
            )}
          </div>

          {/* Logout Action */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 transition-colors focus:outline-none"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("navbar.logout") || "Log out"}</span>
            </button>
          </div>
        </div>
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
};
// --- End of UserAvatar component ---


const Navbar = () => {
  // --- All your existing hooks and state definitions remain unchanged ---
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
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
  const { data: cartData } = useGetCartQuery(undefined, { skip: !user || user?.role !== "student" });
  const cartCourses = cartData?.cart || [];
  const cartCount = cartCourses.length;

  const categoryTree = catData?.categoryTree || [];
  const topics = topicsData?.topics || [];

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
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/search/trending`);
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
            )}`
          );
          if (!response.ok) throw new Error("Search failed");
          const data = await response.json();
          setResults(data);
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
  }, [searchQuery]);

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
    if (user?.role === "instructor") {
      navigate("/instructor/dashboard");
    } else if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };
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
      <span className="font-light text-3xl text-purple-700">
        {t("navbar.instructor_dashboard")}
      </span>
    ) : user?.role === "admin" ? (
      <span className="font-light text-3xl text-purple-700">
        {t("navbar.admin_dashboard") || "Admin Dashboard"}
      </span>
    ) : null;

  const welcomeText =
    user && (user.role === "instructor" || user.role === "admin") ? (
      <span className="ml-6 font-light text-lg text-gray-700">
        Welcome, {user.name}
      </span>
    ) : null;

  const renderAuthSection = () => {
    if (user) {
      return (
        <div className="flex items-center gap-4">
          <UserAvatar user={user} onLogout={logoutHandler} t={t} />
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

  return (
    <header className="bg-white border-b border-gray-200 z-50 sticky top-0">
      <div className="w-full px-6 md:px-8 h-18 flex justify-between items-center gap-6">
        {/* --- Left side of Navbar (No Changes) --- */}
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={handleLogoClick} className="focus:outline-none">
            <img
              src="/samriddhi_logo1.png"
              alt="Samriddhi Logo"
              width="82"
              height="34"
            />
          </button>
          {isInstructorOrAdmin && (
            <>
              <div className="ml-4 hidden lg:block">{dashboardLabel}</div>
              {welcomeText}
            </>
          )}
          {!isInstructorOrAdmin && (
            <div className="hidden lg:flex items-center gap-5 relative z-50">
              {/* Find Courses Hover Menu */}
              <div
                className="relative py-4"
                onMouseEnter={handleFindCoursesEnter}
                onMouseLeave={handleFindCoursesLeave}
              >
                <button className="text-base font-light text-gray-700 hover:text-purple-600 transition-colors">
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
                          className={`px-4 py-2 text-base font-light cursor-pointer flex items-center justify-between transition-colors ${
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
                          className={`px-4 py-2 text-base font-light cursor-pointer flex items-center justify-between transition-colors ${
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
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                          Hover over a category to explore subcategories.
                        </div>
                      )}
                    </div>

                    {/* Column 3: Topics */}
                    <div className="w-60 py-3 flex flex-col overflow-y-auto bg-white">
                      <h4 className="px-4 py-1 text-sm font-light text-gray-400 uppercase tracking-wider mb-2">
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
                            className="px-4 py-2 text-base font-light text-gray-700 hover:bg-purple-50 hover:text-[#a435f0] transition-colors"
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
                              className="px-4 py-2 text-base font-light text-gray-700 hover:bg-purple-50 hover:text-[#a435f0] transition-colors"
                            >
                              {topic.name}
                            </Link>
                          ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
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
                <button className="text-base font-light text-gray-700 hover:text-purple-600 transition-colors">
                  Get Certified
                </button>
                {showGetCertifiedDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-lg flex z-50 text-slate-800 min-h-[350px] w-[550px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Column 1: Issuers */}
                    <div className="w-60 border-r border-gray-100 py-3 bg-gray-50/50 flex flex-col overflow-y-auto">
                      <h4 className="px-4 py-1 text-sm font-light text-gray-400 uppercase tracking-wider mb-2">
                        Popular Issuers
                      </h4>
                      {Array.from(
                        new Set(
                          topics
                            .filter((t) => t.type === "certification")
                            .map((t) => t.parentCategory)
                            .filter(Boolean)
                        )
                      ).map((issuer) => (
                        <Link
                          key={issuer}
                          to={`/course/search?query=${encodeURIComponent(issuer)}`}
                          onClick={() => {
                            setShowGetCertifiedDropdown(false);
                            setActiveIssuer(null);
                          }}
                          onMouseEnter={() => setActiveIssuer(issuer)}
                          className={`px-4 py-2 text-base font-light cursor-pointer flex items-center justify-between transition-colors ${
                            activeIssuer === issuer
                              ? "bg-purple-50 text-[#a435f0]"
                              : "hover:bg-gray-100 hover:text-purple-600"
                          }`}
                        >
                          <span>{issuer}</span>
                          <ChevronRight className="w-4 h-4 opacity-75" />
                        </Link>
                      ))}
                    </div>

                    {/* Column 2: Certifications */}
                    <div className="w-80 py-3 flex flex-col overflow-y-auto bg-white">
                      <h4 className="px-4 py-1 text-sm font-light text-gray-400 uppercase tracking-wider mb-2">
                        Certifications
                      </h4>
                      {activeIssuer ? (
                        topics
                          .filter((t) => t.type === "certification" && t.parentCategory === activeIssuer)
                          .map((topic) => (
                            <Link
                              key={topic._id}
                              to={`/topic/${topic.slug}`}
                              onClick={() => setShowGetCertifiedDropdown(false)}
                              className="px-4 py-2 text-base font-light text-gray-700 hover:bg-purple-50 hover:text-[#a435f0] transition-colors leading-snug"
                            >
                              {topic.name}
                            </Link>
                          ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
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
                className="text-base font-light text-gray-700 hover:text-purple-600 transition-colors"
              >
                Subscribe
              </Link>
            </div>
          )}
        </div>

        {/* --- Search Bar (No Changes) --- */}
        {!isInstructorOrAdmin && (
          <div
            ref={searchContainerRef}
            className="flex-1 hidden md:block mx-6 relative"
          >
            <form onSubmit={handleSearchSubmit} className="w-full">
              <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-400 z-10 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder={t("navbar.search_placeholder") || "Search for anything"}
                className="w-full h-11 border border-slate-300 rounded-full pl-12 pr-4 text-sm bg-[#f7f9fa] text-[#1c1d1f] hover:bg-[#e2e8f0] focus:bg-white focus:border-[#1c1d1f] focus:outline-none transition-all placeholder:text-slate-500"
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
                    <h3 className="px-3 py-2 text-sm font-light text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50">
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
                              className="w-full flex items-center gap-4 px-3 py-3 text-lg font-light text-gray-800 hover:bg-gray-100 rounded-md text-left"
                            >
                              <TrendingUp size={20} className="text-gray-400" />
                              <span>{suggestion}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-3 py-4 text-base text-gray-500">
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
                        <div className="p-4 text-base text-center text-gray-500">
                          {t("navbar.no_results", { query: searchQuery })}
                        </div>
                      )}
                    {results.suggestions.length > 0 && (
                      <ul className="py-1">
                        {results.suggestions.map((suggestion) => (
                          <li key={suggestion}>
                            <button
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-4 px-3 py-3 text-lg font-light text-gray-800 hover:bg-gray-100 rounded-md"
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
                        <h3 className="px-3 py-1 text-sm font-light text-gray-500 uppercase">
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
                                  <span className="font-light text-base leading-tight">
                                    {course.title}
                                  </span>
                                  <span className="text-sm text-gray-500">
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
          {!isInstructorOrAdmin && (
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/about" className="text-base font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.about")}
              </Link>
              <Link to="/how-it-works" className="text-base font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.how_it_works")}
              </Link>
              <Link to="/contact" className="text-base font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.contact")}
              </Link>
              <Link to="/blog" className="text-base font-light text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.blog")}
              </Link>
            </div>
          )}
          <div className="h-10 min-w-[220px] flex items-center justify-end">
            {isInstructorOrAdmin && user ? (
              <UserAvatar user={user} onLogout={logoutHandler} t={t} />
            ) : !isInstructorOrAdmin && user ? (
              <div className="flex items-center gap-6">
                {user?.role === "student" && (
                  <div
                    className="relative py-5"
                    onMouseEnter={handleMyLearningEnter}
                    onMouseLeave={handleMyLearningLeave}
                  >
                    <Link
                      to="/home/my-courses/learning"
                      className="text-sm font-light text-gray-700 hover:text-[#a435f0] transition-colors"
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
                        <span className="absolute -top-1.5 -right-2 bg-[#6d28d2] text-white text-[10px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center border border-white">
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


                <NotificationBell />

                <UserAvatar user={user} onLogout={logoutHandler} t={t} />
              </div>
            ) : (
              renderAuthSection()
            )}
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden focus:outline-none text-2xl"
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogoClick();
              }}
            >
              <Home size={16} /> {t("navbar.home")}
            </button>
            {!isInstructorOrAdmin && (
              <>
                <Link to="/course/search" className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  <BookOpen size={16} /> {t("navbar.courses_heading")}
                </Link>
                {user?.role === "student" && (
                  <Link to="/home/my-courses/learning" className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                    <BookOpen size={16} /> {t("navbar.my_learning")}
                  </Link>
                )}
                <Link to="/about" className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.about")}
                </Link>
                <Link to="/how-it-works" className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.how_it_works")}
                </Link>
                <Link to="/contact" className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.contact")}
                </Link>
                <Link to="/blog" className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.blog")}
                </Link>
              </>
            )}
            {user && (
              <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-light hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} /> {t("navbar.profile")}
              </Link>
            )}
            {isInstructorOrAdmin && (
              <span className="flex flex-col gap-1 px-3 py-2">
                <span className="font-light text-xl text-purple-700">
                  {user?.role === "instructor" ? t("navbar.instructor_dashboard") : t("navbar.admin_dashboard") || "Admin Dashboard"}
                </span>
                <span className="font-light text-lg text-gray-700">
                  Welcome, {user.name}
                </span>
              </span>
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