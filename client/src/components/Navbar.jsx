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
  User
} from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import NotificationBell from './NotificationBell';
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

// --- No changes needed in UserAvatar component ---
const UserAvatar = ({ user, onLogout, t }) => {
  if (!user) return null;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-10 h-10 flex items-center justify-center rounded-full relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoUrl} alt={user?.name} />
              <AvatarFallback>
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-purple-600 border-2 border-white"></span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              to="/profile"
              className="w-full flex items-center gap-2 cursor-pointer"
            >
              {t("navbar.profile")}
            </Link>
          </DropdownMenuItem>
          {user?.role === "student" && (
            <DropdownMenuItem asChild>
              <Link
                to="/my-learning"
                className="w-full flex items-center gap-2 cursor-pointer"
              >
                {t("navbar.my_learning")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="w-full text-left flex items-center gap-2 text-red-600 cursor-pointer"
          >
            <LogOut size={14} />
            {t("navbar.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

UserAvatar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    photoUrl: PropTypes.string,
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

  // --- All your useEffects and handlers remain unchanged ---
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setResults({ suggestions: [], courses: [] });
      setIsDropdownVisible(false);
      return;
    }
    const timerId = setTimeout(() => {
      const fetchSearchResults = async () => {
        setIsLoading(true);
        setIsDropdownVisible(true);
        try {
          const response = await fetch(
            `http://localhost:7777/api/v1/search?q=${encodeURIComponent(
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
      <span className="font-bold text-2xl text-purple-700">
        {t("navbar.instructor_dashboard")}
      </span>
    ) : user?.role === "admin" ? (
      <span className="font-bold text-2xl text-purple-700">
        {t("navbar.admin_dashboard") || "Admin Dashboard"}
      </span>
    ) : null;

  const welcomeText =
    user && (user.role === "instructor" || user.role === "admin") ? (
      <span className="ml-6 font-semibold text-lg text-gray-700">
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
        <Button variant="outline" onClick={() => navigate("/login")}>
          {t("navbar.login")}
        </Button>
        <Button onClick={() => navigate("/register")}>
          {t("navbar.signup")}
        </Button>
      </div>
    );
  };

  const isInstructorOrAdmin =
    user?.role === "instructor" || user?.role === "admin";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center gap-4">
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
            <div className="hidden lg:block">
              <Link
                to="/course/search"
                className="text-sm text-gray-700 hover:text-purple-600 transition-colors"
              >
                {t("navbar.explore")}
              </Link>
            </div>
          )}
        </div>

        {/* --- Search Bar (No Changes) --- */}
        {!isInstructorOrAdmin && (
          <div
            ref={searchContainerRef}
            className="flex-grow hidden sm:block mx-4 relative"
          >
            <form onSubmit={handleSearchSubmit}>
              <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-500 z-10" />
              <input
                type="text"
                placeholder={t("navbar.search_placeholder")}
                className="relative w-full h-12 border border-black rounded-full pl-12 pr-4 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => setIsDropdownVisible(searchQuery.trim() !== "")}
                autoComplete="off"
              />
            </form>
            {isDropdownVisible && (
              <div className="absolute top-full w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-[70vh] overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <>
                    {!isLoading &&
                      results.suggestions.length === 0 &&
                      results.courses.length === 0 && (
                        <div className="p-4 text-sm text-center text-gray-500">
                          {t("navbar.no_results", { query: searchQuery })}
                        </div>
                      )}
                    {results.suggestions.length > 0 && (
                      <ul className="py-1">
                        {results.suggestions.map((suggestion) => (
                          <li key={suggestion}>
                            <button
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full flex items-center gap-4 px-3 py-3 text-base font-bold text-gray-800 hover:bg-gray-100 rounded-md"
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
                        <h3 className="px-3 py-1 text-xs font-bold text-gray-500 uppercase">
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
                                  <span className="font-bold text-sm leading-tight">
                                    {course.title}
                                  </span>
                                  <span className="text-xs text-gray-500">
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
              <Link to="/about" className="text-sm text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.about")}
              </Link>
              <Link to="/how-it-works" className="text-sm text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.how_it_works")}
              </Link>
              <Link to="/contact" className="text-sm text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.contact")}
              </Link>
              <Link to="/blog" className="text-sm text-gray-700 hover:text-purple-600 transition-colors">
                {t("navbar.blog")}
              </Link>
            </div>
          )}
          <div className="h-10 min-w-[220px] flex items-center justify-end">
            {isInstructorOrAdmin && user ? (
              <UserAvatar user={user} onLogout={logoutHandler} t={t} />
            ) : !isInstructorOrAdmin && user ? (
              <div className="flex items-center gap-4">
                <Link to="/wishlist" className="text-2xl text-gray-700 hover:text-purple-600" aria-label={t("navbar.wishlist")}>
                  <Heart />
                </Link>
                <Link to="/cart" className="text-2xl text-gray-700 hover:text-purple-600" aria-label={t("navbar.cart")}>
                  <ShoppingCart />
                </Link>

           
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogoClick();
              }}
            >
              <Home size={16} /> {t("navbar.home")}
            </button>
            {!isInstructorOrAdmin && (
              <>
                <Link to="/course/search" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  <BookOpen size={16} /> {t("navbar.courses_heading")}
                </Link>
                {user?.role === "student" && (
                  <Link to="/my-learning" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                    <BookOpen size={16} /> {t("navbar.my_learning")}
                  </Link>
                )}
                <Link to="/about" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.about")}
                </Link>
                <Link to="/how-it-works" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.how_it_works")}
                </Link>
                <Link to="/contact" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.contact")}
                </Link>
                <Link to="/blog" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                  {t("navbar.blog")}
                </Link>
              </>
            )}
            {user && (
              <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} /> {t("navbar.profile")}
              </Link>
            )}
            {isInstructorOrAdmin && (
              <span className="flex flex-col gap-1 px-3 py-2">
                <span className="font-bold text-lg text-purple-700">
                  {user?.role === "instructor" ? t("navbar.instructor_dashboard") : t("navbar.admin_dashboard") || "Admin Dashboard"}
                </span>
                <span className="font-semibold text-base text-gray-700">
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