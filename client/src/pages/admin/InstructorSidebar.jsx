import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard,
  Play, 
  MessageSquare, 
  BarChart3, 
  Wrench, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  Award,
  Inbox,
  CheckSquare,
} from "lucide-react";

const InstructorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);

  const toggleSubMenu = (menu) => {
    if (openSubMenu === menu) {
      setOpenSubMenu(null);
    } else {
      setOpenSubMenu(menu);
    }
  };

  // Routes that start with /instructor/course but belong to other menu tabs
  const excludedFromCourses = [
    "/instructor/course/reviews",
    "/instructor/course/students",
    "/instructor/course/analytics"
  ];

  // Helper to check if a menu item or any of its children is active
  const isItemActive = (item) => {
    if (item.subItems) {
      return item.subItems.some((sub) =>
        location.pathname === sub.to || location.pathname.startsWith(sub.to + "/")
      );
    }

    if (item.id === "courses") {
      if (excludedFromCourses.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"))) {
        return false;
      }
      return location.pathname === "/instructor/course" || location.pathname.startsWith("/instructor/course/");
    }

    if (item.to) {
      if (location.pathname === item.to) return true;
      if (item.to !== "/instructor/dashboard" && location.pathname.startsWith(item.to + "/")) {
        return true;
      }
    }

    return false;
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      to: "/instructor/dashboard",
      paths: ["/instructor/dashboard"],
    },
    {
      id: "courses",
      label: "Courses",
      icon: <Play className="w-5 h-5" />,
      to: "/instructor/course",
      paths: ["/instructor/course"],
    },
    {
      id: "communication",
      label: "Communication",
      icon: <MessageSquare className="w-5 h-5" />,
      paths: ["/instructor/course/reviews", "/instructor/course/students"],
      subItems: [
        { to: "/instructor/course/reviews", label: "Reviews", icon: <MessageSquare className="w-4 h-4" /> },
        { to: "/instructor/course/students", label: "Students", icon: <Users className="w-4 h-4" /> }
      ]
    },
    {
      id: "performance",
      label: "Performance",
      icon: <BarChart3 className="w-5 h-5" />,
      to: "/instructor/course/analytics",
      paths: ["/instructor/course/analytics"],
    },
    {
      id: "certificates",
      label: "Certificates",
      icon: <Award className="w-5 h-5" />,
      to: "/instructor/certificates",
      paths: ["/instructor/certificates"],
    },
    {
      id: "tools",
      label: "Tools",
      icon: <Wrench className="w-5 h-5" />,
      paths: ["/instructor/assignments", "/instructor/playground"],
      subItems: [
        { to: "/instructor/assignments", label: "Assignment Manager", icon: <Award className="w-4 h-4" /> },
        { to: "/instructor/assignments/submissions", label: "Submissions Arrival", icon: <Inbox className="w-4 h-4" /> },
        { to: "/instructor/assignments/check", label: "Checking & Grading", icon: <CheckSquare className="w-4 h-4" /> },
        { to: "/instructor/playground", label: "Algorithms Playground", icon: <Wrench className="w-4 h-4" /> }
      ]
    },
    {
      id: "resources",
      label: "Resources",
      icon: <HelpCircle className="w-5 h-5" />,
      paths: ["/instructor/resources", "/contact"],
      subItems: [
        { to: "/contact", label: "Help & Support", icon: <HelpCircle className="w-4 h-4" /> }
      ]
    }
  ];


  return (
    <div 
      className="hidden md:block relative flex-shrink-0 select-none"
      style={{ width: "72px" }}
    >
      {/* Drawer */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setOpenSubMenu(null);
        }}
        className="hidden md:flex fixed top-0 left-0 bottom-0 bg-[#1c1d1f] text-[#d1d7dc] flex-col z-[60] transition-all duration-300 ease-in-out border-r border-[#3e4143] shadow-2xl h-screen"
        style={{ width: isHovered ? "280px" : "72px" }}
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[#3e4143] overflow-hidden shrink-0">
          {isHovered ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#a435f0] to-[#8720cf] flex items-center justify-center shadow-md shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-light text-white text-xl tracking-tight whitespace-nowrap">
                Samriddhi <span className="text-[#a435f0]">Gyan</span>
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#a435f0] to-[#8720cf] flex items-center justify-center shadow-md shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-grow py-6 overflow-y-auto space-y-1 scrollbar-none px-2">
          {menuItems.map((item) => {
            const isMenuOpen = openSubMenu === item.id;
            const isMenuBtnActive = isItemActive(item);

            // Direct link item (no sub-items)
            if (!item.subItems) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => navigate(item.to)}
                    className={`w-full flex items-center gap-4 py-3.5 px-3 transition-colors rounded-lg group ${
                      isMenuBtnActive
                        ? "bg-white/10 text-white font-light"
                        : "hover:bg-white/5 hover:text-white"
                    }`}
                    title={!isHovered ? item.label : undefined}
                  >
                    {isMenuBtnActive && (
                      <div className="absolute left-0 w-1.5 h-6 bg-[#a435f0] rounded-r-md" />
                    )}
                    <div className={`${isMenuBtnActive ? "text-[#a435f0]" : "text-[#d1d7dc] group-hover:text-white"}`}>
                      {item.icon}
                    </div>
                    {isHovered && (
                      <span className="text-lg tracking-wide transition-opacity duration-300 font-extralight">
                        {item.label}
                      </span>
                    )}
                  </button>
                </div>
              );
            }

            // Sub-menu item
            return (
              <div key={item.id} className="space-y-1">
                {/* Main Item trigger */}
                <button
                  onClick={() => isHovered && toggleSubMenu(item.id)}
                  className={`w-full flex items-center justify-between py-3.5 px-3 transition-colors rounded-lg group ${
                    isMenuBtnActive 
                      ? "bg-white/10 text-white font-light" 
                      : "hover:bg-white/5 hover:text-white"
                  }`}
                  title={!isHovered ? item.label : undefined}
                >
                  <div className="flex items-center gap-4">
                    {/* Left Border Active Indicator */}
                    {isMenuBtnActive && (
                      <div className="absolute left-0 w-1.5 h-6 bg-[#a435f0] rounded-r-md" />
                    )}
                    <div className={`${isMenuBtnActive ? "text-[#a435f0]" : "text-[#d1d7dc] group-hover:text-white"}`}>
                      {item.icon}
                    </div>
                    {isHovered && (
                      <span className="text-lg tracking-wide transition-opacity duration-300 font-extralight">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {isHovered && (
                    <div>
                      {isMenuOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub Menu Links list */}
                {isHovered && isMenuOpen && (
                  <div className="pl-6 pr-2 py-1 space-y-1 bg-black/20 rounded-lg border-l border-[#3e4143] ml-5 animate-slide-down">
                    {item.subItems.map((sub) => {
                      const isSubActive = location.pathname === sub.to || location.pathname.startsWith(sub.to + "/");
                      return (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          end
                          className={`flex items-center gap-3 py-2 px-3 text-base rounded transition-colors ${
                            isSubActive
                              ? "text-white font-light bg-[#a435f0]/20"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span className={isSubActive ? "text-[#a435f0]" : ""}>
                            {sub.icon}
                          </span>
                          <span>{sub.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Area / Role indicator */}
        {isHovered && (
          <div className="p-4 border-t border-[#3e4143] bg-black/10 text-[10px] text-gray-400 text-center shrink-0 tracking-wider">
            INSTRUCTOR WORKSPACE
          </div>
        )}
      </aside>
    </div>
  );
};

export default InstructorSidebar;
