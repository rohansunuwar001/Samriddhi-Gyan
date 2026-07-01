import { useSelector } from "react-redux";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

// --- CORE LAYOUT & UTILITY IMPORTS ---
import AnimatedErrorPage from "./AnimatedErrorPage";
import ScrollToTop from "./components/ScrollToTop";
import MainLayout from "./layout/MainLayout";

// --- AUTHENTICATION & ROUTE PROTECTION ---
import {
  AdminRoute,
  AuthenticatedUser,
  InstructorRoute,
  ProtectedRoute,
  StudentRoute,
} from "./components/ProtectedRoutes";
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
import CourseProgress from "./pages/student/CourseProgress";
import Courses from "./pages/student/Courses";
// import MyLearning from "./pages/student/MyLearning";
import Archived from "./pages/student/my-courses/Archived";
import Certifications from "./pages/student/my-courses/Certifications";
import Learning from "./pages/student/my-courses/Learning";
import LearningTools from "./pages/student/my-courses/LearningTools";
import Lists from "./pages/student/my-courses/Lists";
import MyCoursesLayout from "./pages/student/my-courses/MyCoursesLayout";
import Wishlist from "./pages/student/my-courses/Wishlist";
import SearchPage from "./pages/student/SearchPage";

// --- UPDATED ADMIN/INSTRUCTOR PAGE IMPORTS ---
import Dashboard from "./pages/admin/Dashboard";
import Sidebar from "./pages/admin/Sidebar";

// Course Management Imports (Reflects new workflow)
import AddCourse from "./pages/admin/course/AddCourse";
import CourseTable from "./pages/admin/course/CourseTable";
import EditCourse from "./pages/admin/course/EditCourse"; // This is the new tabbed Course Manager

// Lecture Management Imports (Refined)
import AIAssistant from "./components/AIAssistant";
import BlogPage from "./components/Blog/BlogPage";
import SingleBlogPage from "./components/Blog/SingleBlogPage";
import ForumPage from "./components/ForumPage";
import CourseAnalytics from "./pages/admin/course/CourseAnalytics";
import CoursePayout from "./pages/admin/course/CoursePayout";
import CourseReviews from "./pages/admin/course/CourseReviews";
import CourseStudent from "./pages/admin/course/CourseStudent";
import EditLecture from "./pages/admin/lecture/EditLecture"; // Only EditLecture is needed
import Cart from "./pages/cart/Cart";
import Checkout from "./pages/cart/Checkout";
import Contact from "./pages/Contact/Contact";
import CourseDetailPage from "./pages/Courses/CourseDetailPage";
import HomeCms from "./pages/pageCms/HomeCms";
import PaymentSuccess from "./pages/PaymentSuccess";
import InstructorProfilePage from "./pages/Profile/InstructorProfilePage";
import SupAdmAllRevenueDetails from "./pages/superAdmin/SupAdmAllRevenueDetails";
import SupAdmAllUser from "./pages/superAdmin/SupAdmAllUser";
import SupAdmCourseAnalytics from "./pages/superAdmin/SupAdmCourseAnalytics";
import SupAdmDashboard from "./pages/superAdmin/SupAdmDashboard";
import CategoryManager from "./pages/admin/CategoryManager";
import TopicSearchResultsPage from "./pages/Courses/TopicSearchResultsPage";
import PaymentFailed from "./pages/PaymentFailed";
import BlogImporter from "./pages/admin/blog/BlogImporter";
import TopicPage from "./pages/student/TopicPage";
import TopicManager from "./pages/admin/TopicManager";
import SubscribePage from "./pages/student/SubscribePage";
import Terms from "./pages/Terms";

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
      // --- Public Routes (now student-only) ---
      {
        path: "/",
        element: (
          <StudentRoute>
            <Home />
          </StudentRoute>
        ),
      },
      {
        path: "/about",
        element: (
          <StudentRoute>
            <About />
          </StudentRoute>
        ),
      },
      {
        path: "/contact",
        element: (
          <StudentRoute>
            <Contact />
          </StudentRoute>
        ),
      },
      {
        path: "/terms",
        element: (
          <StudentRoute>
            <Terms />
          </StudentRoute>
        ),
      },
      {
        path: "/blog",
        element: (
          <StudentRoute>
            <BlogPage />
          </StudentRoute>
        ),
      },
      {
        path: "/wishlist",
        element: <Navigate to="/home/my-courses/wishlist" replace />,
      },
      {
        path: "/blog/:slug",
        element: (
          <StudentRoute>
            <SingleBlogPage />
          </StudentRoute>
        ),
      },
      {
        path: "/community",
        element: (
          <StudentRoute>
            <ForumPage />
          </StudentRoute>
        ),
      },
      {
        path: "/topics/:topic",
        element: (
          <StudentRoute>
            <TopicSearchResultsPage />
          </StudentRoute>
        ),
      },
      {
        path: "/how-it-works",
        element: (
          <StudentRoute>
            <HowItWorks />
          </StudentRoute>
        ),
      },
      {
        path: "/topic/:topicSlug",
        element: (
          <StudentRoute>
            <TopicPage />
          </StudentRoute>
        ),
      },
      {
        path: "/subscribe",
        element: (
          <StudentRoute>
            <SubscribePage />
          </StudentRoute>
        ),
      },

      {
        path: "/ai-assistant",
        element: <AIAssistant />,
      },
      {
        path: "/instructor-profile/:instructorId", // The path must match the Link
        element: <InstructorProfilePage />,
      },
      {
        path: "/cart",
        element: (
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        ),
      },

      {
        path: "login",
        element: (
          <AuthenticatedUser>
            <Login />
          </AuthenticatedUser>
        ),
      },
      {
        path: "register",
        element: (
          <AuthenticatedUser>
            <Signup />
          </AuthenticatedUser>
        ),
      },
      { path: "/auth/google/success", element: <GoogleSuccess /> },

      // --- Protected Student Routes ---
      {
        path: "courses",
        element: (
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-learning",
        element: <Navigate to="/home/my-courses/learning" replace />,
      },
      {
        path: "/home/my-courses",
        element: (
          <ProtectedRoute>
            <MyCoursesLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "",
            element: <Navigate to="learning" replace />,
          },
          {
            path: "learning",
            element: <Learning />,
          },
          {
            path: "lists",
            element: <Lists />,
          },
          {
            path: "wishlist",
            element: <Wishlist />,
          },
          {
            path: "certifications",
            element: <Certifications />,
          },
          {
            path: "archived",
            element: <Archived />,
          },
          {
            path: "learning-tools",
            element: <LearningTools />,
          },
        ],
      },
      {
        path: "/payment-success",
        element: (
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: "/payment-failed",

        element: (
          <ProtectedRoute>
            <PaymentFailed />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/edit",
        element: (
          <ProtectedRoute>
            <ProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/photo",
        element: (
          <ProtectedRoute>
            <PhotoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/security",
        element: (
          <ProtectedRoute>
            <AccountSecurityPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "course/search",
        element: (
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        ),
      },

      // NOTE: The main course detail page for students
      {
        path: "course-detail/:courseId",
        element: (
          <StudentRoute>
            <CourseDetailPage />
          </StudentRoute>
        ),
      },

      {
        path: "courses",
        element: (
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        ),
      },
      // ===================================
      // --- REVISED ADMIN/INSTRUCTOR ROUTES ---
      // ===================================
      {
        path: "instructor",
        element: (
          <InstructorRoute>
            <Sidebar />
          </InstructorRoute>
        ),
        children: [
          // A. Default admin route and explicit dashboard route
          { path: "", element: <Dashboard /> },
          { path: "dashboard", element: <Dashboard /> },

          // B. Course management routes
          { path: "course", element: <CourseTable /> }, // View all created courses
          { path: "course/create", element: <AddCourse /> }, // Page to create a new course
          { path: "course/:courseId", element: <EditCourse /> }, // The new central hub for editing

          // C. Lecture management route (simplified and corrected)
          // The old "/course/:courseId/lecture" route for creating is REMOVED.

          // D. This is the single, correct route for editing a specific lecture.
          // The courseId is included so the component knows how to build the "Back to Curriculum" link.
          {
            path: "course/:courseId/lecture/:lectureId",
            element: <EditLecture />,
          },
          {
            path: `course/students`,
            element: <CourseStudent />,
          },
          {
            path: `course/reviews`,
            element: <CourseReviews />,
          },
          {
            path: `course/payouts`,
            element: <CoursePayout />,
          },
          {
            path: "course/analytics",
            element: <CourseAnalytics />,
          },
        ],
      },
      {
        path: "admin",
        element: (
          <AdminRoute>
            <Sidebar />
          </AdminRoute>
        ),
        children: [
          // A. Default admin route and explicit dashboard route
          { path: "", element: <SupAdmDashboard /> },
          { path: "dashboard", element: <SupAdmDashboard /> },
          // B. Course management routes
          { path: "analytics", element: <SupAdmCourseAnalytics /> },
          { path: "users", element: <SupAdmAllUser /> },
          { path: "revenue", element: <SupAdmAllRevenueDetails /> },
          { path: "categories", element: <CategoryManager /> },
          { path: "topics", element: <TopicManager /> },
          { path: "blog-import", element: <BlogImporter /> },
          { path: "cms", element: <HomeCms /> },
        ],
      },
    ],
  },
  {
    path: "/checkout",
    element: (
      <ProtectedRoute>
        <ScrollToTop />
        <Checkout />
      </ProtectedRoute>
    ),
  },
  {
    path: "/course-detail/:courseId/content",
    element: (
      <ProtectedRoute>
        <PurchaseCourseProtectedRoute>
          <ScrollToTop />
          <CourseProgress />
        </PurchaseCourseProtectedRoute>
      </ProtectedRoute>
    ),
  },
]);

function App() {
  const { user } = useSelector((store) => store.auth);
  // eslint-disable-next-line no-unused-vars
  const isInstructor = user?.role === "instructor";

  return (
    <main>
      {/* <ScrollToTop /> */}
      <RouterProvider router={appRouter} />
      {/* <ChatBot /> */}
    </main>
  );
}

export default App;
