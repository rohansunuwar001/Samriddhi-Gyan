import { useLogoutUserMutation } from "@/features/api/authApi";
import { Bell, BookOpen, GraduationCap, Heart, Home, Loader2, LogOut, Menu, Search, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader } from "./ui/sheet";
import { User } from "lucide-react";
import PropTypes from "prop-types";
// --- NEW: Import the translation hook ---
import { useTranslation } from 'react-i18next';

const UserAvatar = ({ user, onLogout, t }) => {
  // ... (UserAvatar component logic remains the same)
  // We pass 't' as a prop to translate the menu items.
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-10 h-10 flex items-center justify-center rounded-full relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoUrl} alt={user?.name} />
              <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-purple-600 border-2 border-white"></span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="w-full flex items-center gap-2 cursor-pointer">{t('navbar.profile')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/my-learning" className="w-full flex items-center gap-2 cursor-pointer">{t('navbar.my_learning')}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="w-full text-left flex items-center gap-2 text-red-600 cursor-pointer">
            <LogOut size={14} />{t('navbar.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

UserAvatar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
  }).isRequired,  
  onLogout: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired, // Translation function
};


const Navbar = () => {
  // --- Initialize the translation hook ---
  const { t } = useTranslation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();
  const navigate = useNavigate();

  // State for live search (no changes needed here)
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState({ suggestions: [], courses: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef(null);

  // useEffects for search and logout (no changes needed here)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults({ suggestions: [], courses: [] });
      setIsDropdownVisible(false);
      return;
    }
    const timerId = setTimeout(() => {
      const fetchSearchResults = async () => {
        setIsLoading(true);
        setIsDropdownVisible(true);
        try {
          const response = await fetch(`http://localhost:8080/api/v1/search?q=${encodeURIComponent(searchQuery)}`);
          if (!response.ok) throw new Error('Search failed');
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoutHandler = async () => await logoutUser();
  useEffect(() => { if (isSuccess) { toast.success(data?.message || "Logged out successfully"); navigate("/login"); } }, [isSuccess, data, navigate]);

  // --- Handlers (no changes needed) ---
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

  // --- Reusable translated components ---
  const NavLink = ({ to, children }) => (<Link to={to} className="text-sm text-gray-700 hover:text-purple-600 transition-colors">{children}</Link>);
  const IconButton = ({ to, icon, ariaLabel }) => (<Link to={to} className="text-2xl text-gray-700 hover:text-purple-600" aria-label={ariaLabel}>{icon}</Link>);


  NavLink.propTypes = {
    to: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  };
  IconButton.propTypes = {
    to: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    ariaLabel: PropTypes.string.isRequired,
  };

  const renderAuthSection = () => {
    if (user) {
      return (
        <div className="flex items-center gap-4">
          <IconButton to="/wishlist" icon={<Heart />} ariaLabel={t('navbar.wishlist')} />
          <IconButton to="/cart" icon={<ShoppingCart />} ariaLabel={t('navbar.cart')} />
          <IconButton to="/notifications" icon={<Bell />} ariaLabel={t('navbar.notifications')} />
          <UserAvatar user={user} onLogout={logoutHandler} t={t} />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/login')}>{t('navbar.login')}</Button>
        <Button onClick={() => navigate('/register')}>{t('navbar.signup')}</Button>
      </div>
    );
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/"><img src="/samriddhi_logo1.png" alt="Samriddhi Logo" width="82" height="34" /></Link>
          <div className="hidden lg:block"><NavLink to="/course/search">{t('navbar.explore')}</NavLink></div>
        </div>

        <div ref={searchContainerRef} className="flex-grow hidden sm:block mx-4 relative">
          <form onSubmit={handleSearchSubmit}>
            <Search className="absolute top-1/2 left-4 transform -translate-y-1/2 text-gray-500 z-10" />
            <input
              type="text"
              placeholder={t('navbar.search_placeholder')}
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
                <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
              ) : (
                <>
                  {!isLoading && results.suggestions.length === 0 && results.courses.length === 0 && (
                    <div className="p-4 text-sm text-center text-gray-500">{t('navbar.no_results', { query: searchQuery })}</div>
                  )}
                  {results.suggestions.length > 0 && (
                    <ul className="py-1">
                      {results.suggestions.map((suggestion) => (
                        <li key={suggestion}>
                          <button onClick={() => handleSuggestionClick(suggestion)} className="w-full flex items-center gap-4 px-3 py-3 text-base font-bold text-gray-800 hover:bg-gray-100 rounded-md">
                            <Search size={20} /><span>{suggestion}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {results.suggestions.length > 0 && results.courses.length > 0 && <hr className="my-2" />}
                  {results.courses.length > 0 && (
                    <div>
                      <h3 className="px-3 py-1 text-xs font-bold text-gray-500 uppercase">{t('navbar.courses_heading')}</h3>
                      <ul>
                        {results.courses.map((course) => (
                          <li key={course._id}>
                            <Link to={`/course-detail/${course._id}`} className="flex items-center gap-3 p-2 rounded-md text-gray-800 hover:bg-gray-100" onClick={() => setIsDropdownVisible(false)}>
                              <img src={course.thumbnail} alt={course.title} className="w-11 h-11 object-cover bg-gray-200" />
                              <div className="flex flex-col">
                                <span className="font-bold text-sm leading-tight">{course.title}</span>
                                <span className="text-xs text-gray-500">{course.creatorName}</span>
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

        <div className="hidden md:flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-6">
            <NavLink to="/about">{t('navbar.about')}</NavLink>
            <NavLink to="/how-it-works">{t('navbar.how_it_works')}</NavLink>
            <NavLink to="/contact">{t('navbar.contact')}</NavLink>
            <NavLink to="/blog">{t('navbar.blog')}</NavLink>
            {user?.role === 'instructor' && (<NavLink to="/admin/dashboard">{t('navbar.instructor')}</NavLink>)}
          </div>
          <div className="h-10 min-w-[220px] flex items-center justify-end">{renderAuthSection()}</div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden focus:outline-none text-2xl" aria-label="Toggle menu">{mobileMenuOpen ? '✕' : <Menu />}</button>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader>
            {/* Mobile menu content... */}
          </SheetHeader>
          <nav className="grid gap-4 mt-8">
            <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}><Home size={16} /> {t('navbar.home')}</Link>
            <Link to="/course/search" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}><BookOpen size={16} /> {t('navbar.courses_heading')}</Link>
            {user && (
              <>
                <Link to="/my-learning" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}><BookOpen size={16} /> {t('navbar.my_learning')}</Link>
                <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}><User size={16} /> {t('navbar.profile')}</Link>
              </>
            )}
            {user?.role === 'instructor' && (
              <Link to="/admin/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium hover:bg-gray-100" onClick={() => setMobileMenuOpen(false)}><GraduationCap size={16} /> {t('navbar.instructor_dashboard')}</Link>
            )}
          </nav>
          <div className="mt-auto">
            {user ? (
              <Button variant="destructive" onClick={() => { logoutHandler(); setMobileMenuOpen(false); }} className="w-full gap-2"><LogOut size={16} /> {t('navbar.logout')}</Button>
            ) : (
              <div className="grid gap-2 w-full">
                <Button onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="w-full">{t('navbar.login')}</Button>
                <Button variant="outline" onClick={() => { navigate("/register"); setMobileMenuOpen(false); }} className="w-full">{t('navbar.signup')}</Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Navbar;