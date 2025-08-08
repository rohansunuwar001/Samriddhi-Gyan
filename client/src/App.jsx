import { createBrowserRouter, RouterProvider } from "react-router-dom";

// --- CORE LAYOUT & UTILITY IMPORTS ---
import AnimatedErrorPage from "./AnimatedErrorPage";
import ScrollToTop from "./components/ScrollToTop";
import MainLayout from "./layout/MainLayout";

// --- AUTHENTICATION & ROUTE PROTECTION ---
import { AdminRoute, AuthenticatedUser, ProtectedRoute } from "./components/ProtectedRoutes";
import PurchaseCourseProtectedRoute from "./components/PurchaseCourseProtectedRoute";

// --- ALL PAGE COMPONENT IMPORTS ---

// Public & Static Pages
import HowItWorks from "./components/HowItWorks"; // Example of other static pages
import About from "./pages/About/About";
import Home from "./pages/Home";
//... (add all your other page components like Blog, Forum, etc.)

// Authentication Pages
import GoogleSuccess from "./pages/GoogleSuccess";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// User Profile Pages
import AccountSecurityPage from "./pages/Profile/AccountSecurityPage";
import PhotoPage from "./pages/Profile/PhotoPage";
import Profile from "./pages/Profile/Profile";
import ProfileEdit from "./pages/Profile/ProfileEdit";

// Student-Facing Course Pages
import CourseDetail from "./pages/student/CourseDetail";
import CourseProgress from "./pages/student/CourseProgress";
import Courses from "./pages/student/Courses";
import MyLearning from "./pages/student/MyLearning";
import SearchPage from "./pages/student/SearchPage";

// --- UPDATED ADMIN/INSTRUCTOR PAGE IMPORTS ---
import Dashboard from "./pages/admin/Dashboard";
import Sidebar from "./pages/admin/Sidebar";

// Course Management Imports (Reflects new workflow)
import AddCourse from "./pages/admin/course/AddCourse";
import CourseTable from "./pages/admin/course/CourseTable";
import EditCourse from "./pages/admin/course/EditCourse"; // This is the new tabbed Course Manager

// Lecture Management Imports (Refined)
import EditLecture from "./pages/admin/lecture/EditLecture"; // Only EditLecture is needed
import Contact from "./pages/Contact/Contact";
import BlogPage from "./components/Blog/BlogPage";
import WishList from "./pages/WishList/WishList";
import SingleBlogPage from "./components/Blog/SingleBlogPage";
import AIAssistant from "./components/AIAssistant";
import ForumPage from "./components/ForumPage";


// --- LAYOUT WRAPPER COMPONENT ---
const MainLayoutWithScroll = () => (
  <>
    <ScrollToTop />
    <MainLayout />
  </>
);

// --- MAIN ROUTER CONFIGURATION ---
const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayoutWithScroll />,
    errorElement: <AnimatedErrorPage />, // Sets the error page for all child routes
    children: [
      // --- Public Routes ---
      { path: "/", element: <Home /> },
  
      {
        path: "/ai-assistant",
        element: <AIAssistant />,
      },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <Contact /> },
      { path: "/blog", element: <BlogPage /> },
      {path: "/wishlist", element: <WishList />}, // Placeholder for Wishlist
      {path: "/blog/:slug", element: <SingleBlogPage />}, // Dynamic blog post page

      {
        path: "/community",
        element: <ForumPage />,
      },

      { path: "/how-it-works", element: <HowItWorks /> },
      { path: "login", element: <AuthenticatedUser><Login /></AuthenticatedUser> },
      { path: "register", element: <AuthenticatedUser><Signup /></AuthenticatedUser> },
      { path: "auth/google/success", element: <GoogleSuccess /> },

      // --- Protected Student Routes ---
      { path: "courses", element: <ProtectedRoute><Courses /></ProtectedRoute> },
      { path: "my-learning", element: <ProtectedRoute><MyLearning /></ProtectedRoute> },
      { path: "profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: "profile/edit", element: <ProtectedRoute><ProfileEdit /></ProtectedRoute> },
      { path: "profile/photo", element: <ProtectedRoute><PhotoPage /></ProtectedRoute> },
      { path: "profile/security", element: <ProtectedRoute><AccountSecurityPage /></ProtectedRoute> },
      { path: "course/search", element: <ProtectedRoute><SearchPage /></ProtectedRoute> },

      // NOTE: The main course detail page for students
      { path: "course-detail/:courseId", element: <ProtectedRoute><CourseDetail /></ProtectedRoute> },

      // NOTE: The course player/progress page for enrolled students
      {
        path: "course-progress/:courseId",
        element: <ProtectedRoute><PurchaseCourseProtectedRoute><CourseProgress /></PurchaseCourseProtectedRoute></ProtectedRoute>
      },

       {
        path: "courses",
        element: (
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        ),
      }
,

      // ===================================
      // --- REVISED ADMIN/INSTRUCTOR ROUTES ---
      // ===================================
      {
        path: "admin",
        element: <AdminRoute><Sidebar /></AdminRoute>,
        children: [
          // A. Default admin route and explicit dashboard route
          { path: "", element: <Dashboard /> },
          { path: "dashboard", element: <Dashboard /> },

          // B. Course management routes
          { path: "course", element: <CourseTable /> },      // View all created courses
          { path: "course/create", element: <AddCourse /> },    // Page to create a new course
          { path: "course/:courseId", element: <EditCourse /> }, // The new central hub for editing

          // C. Lecture management route (simplified and corrected)
          // The old "/course/:courseId/lecture" route for creating is REMOVED.

          // D. This is the single, correct route for editing a specific lecture.
          // The courseId is included so the component knows how to build the "Back to Curriculum" link.
          {
            path: "course/:courseId/lecture/:lectureId",
            element: <EditLecture />
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <main>
      <RouterProvider router={appRouter} />
    </main>
  );
}

export default App;