import { lazy } from "react";
import { useSelector } from "react-redux";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

// --- CORE LAYOUT & UTILITY IMPORTS ---
import AnimatedErrorPage from "./pages/Error/AnimatedErrorPage";
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
const HowItWorks = lazy(() => import("./pages/HowItWorks/HowItWorks"));
const About = lazy(() => import("./pages/About/About"));
const Home = lazy(() => import("./pages/Home/Home"));

// Authentication Pages
const GoogleSuccess = lazy(() => import("./pages/Auth/GoogleSuccess"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Signup = lazy(() => import("./pages/Auth/Signup"));

// User Profile Pages
const Profile = lazy(() => import("./pages/Profile/Profile"));
const StudentProfileEdit = lazy(() => import("./pages/Profile/StudentProfileEdit"));

// Student-Facing Course Pages
const CourseProgress = lazy(() => import("./pages/student/CourseProgress"));
const Courses = lazy(() => import("./pages/student/Courses"));
const Archived = lazy(() => import("./pages/student/my-courses/Archived"));
const Certifications = lazy(() => import("./pages/student/my-courses/Certifications"));
const Learning = lazy(() => import("./pages/student/my-courses/Learning"));
const LearningTools = lazy(() => import("./pages/student/my-courses/LearningTools"));
const Lists = lazy(() => import("./pages/student/my-courses/Lists"));
const MyCoursesLayout = lazy(() => import("./pages/student/my-courses/MyCoursesLayout"));
const Wishlist = lazy(() => import("./pages/student/my-courses/Wishlist"));
const SearchPage = lazy(() => import("./pages/student/SearchPage"));

// --- UPDATED ADMIN/INSTRUCTOR PAGE IMPORTS ---
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
import Sidebar from "./pages/admin/Sidebar";

// Course Management Imports (Reflects new workflow)
const AddCourse = lazy(() => import("./pages/admin/course/AddCourse"));
const CourseTable = lazy(() => import("./pages/admin/course/CourseTable"));
const EditCourse = lazy(() => import("./pages/admin/course/EditCourse"));

const InstructorProfile = lazy(() => import("./pages/Profile/InstructorProfile"));
const InstructorAccount = lazy(() => import("./pages/Profile/InstructorAccount"));

// Lecture Management Imports (Refined)
const AIAssistant = lazy(() => import("./pages/AIAssistant/AIAssistant"));
const BlogPage = lazy(() => import("./pages/Blog/BlogPage"));
const SingleBlogPage = lazy(() => import("./pages/Blog/SingleBlogPage"));
const ForumPage = lazy(() => import("./pages/Community/ForumPage"));
const CourseAnalytics = lazy(() => import("./pages/admin/course/CourseAnalytics"));
const CoursePayout = lazy(() => import("./pages/admin/course/CoursePayout"));
const CourseReviews = lazy(() => import("./pages/admin/course/CourseReviews"));
const CourseStudent = lazy(() => import("./pages/admin/course/CourseStudent"));
const EditLecture = lazy(() => import("./pages/admin/lecture/EditLecture"));
const Cart = lazy(() => import("./pages/cart/Cart"));
const Checkout = lazy(() => import("./pages/cart/Checkout"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const CourseDetailPage = lazy(() => import("./pages/Courses/CourseDetailPage"));
const HomeCms = lazy(() => import("./pages/pageCms/HomeCms"));
const PaymentSuccess = lazy(() => import("./pages/Payment/PaymentSuccess"));
const InstructorProfilePage = lazy(() => import("./pages/Profile/InstructorProfilePage"));
const SupAdmAllRevenueDetails = lazy(() => import("./pages/superAdmin/SupAdmAllRevenueDetails"));
const SupAdmAllUser = lazy(() => import("./pages/superAdmin/SupAdmAllUser"));
const SupAdmCourseAnalytics = lazy(() => import("./pages/superAdmin/SupAdmCourseAnalytics"));
const SupAdmDashboard = lazy(() => import("./pages/superAdmin/SupAdmDashboard"));
const SupAdmSubscriptions = lazy(() => import("./pages/superAdmin/SupAdmSubscriptions"));
const CategoryManager = lazy(() => import("./pages/admin/CategoryManager"));
const TopicSearchResultsPage = lazy(() => import("./pages/Courses/TopicSearchResultsPage"));
const PaymentFailed = lazy(() => import("./pages/Payment/PaymentFailed"));
const BlogImporter = lazy(() => import("./pages/admin/blog/BlogImporter"));
const TopicPage = lazy(() => import("./pages/student/TopicPage"));
const TopicManager = lazy(() => import("./pages/admin/TopicManager"));
const DiscountManager = lazy(() => import("./pages/admin/DiscountManager"));
const SubscribePage = lazy(() => import("./pages/student/SubscribePage"));
const Terms = lazy(() => import("./pages/Terms/Terms"));
const PersonalizeWizard = lazy(() => import("./pages/student/PersonalizeWizard"));
const NotificationsPage = lazy(() => import("./pages/Notifications/NotificationsPage"));
const PurchaseHistoryPage = lazy(() => import("./pages/Payment/PurchaseHistoryPage"));
const PaymentMethodsPage = lazy(() => import("./pages/Payment/PaymentMethodsPage"));
const CertificateManager = lazy(() => import("./pages/admin/certificate/CertificateManager"));
const CertificateForm = lazy(() => import("./pages/admin/certificate/CertificateForm"));
const AdminCertifications = lazy(() => import("./pages/admin/certificate/AdminCertifications"));
const LocationAnalytics = lazy(() => import("./pages/admin/LocationAnalytics"));
const CertificationDetail = lazy(() => import("./pages/student/CertificationDetail"));
const ExamEnvironment = lazy(() => import("./pages/student/ExamEnvironment"));
const CareerRoadmap = lazy(() => import("./pages/student/CareerRoadmap"));
const AlgorithmPlayground = lazy(() => import("./pages/student/AlgorithmPlayground"));
const NearbyHub = lazy(() => import("./pages/student/NearbyHub"));
const StudentAssignments = lazy(() => import("./pages/student/StudentAssignments"));
const InstructorAssignments = lazy(() => import("./pages/admin/course/InstructorAssignments"));

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
        path: "/notifications",
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/purchase-history",
        element: (
          <ProtectedRoute>
            <PurchaseHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/payment-methods",
        element: (
          <ProtectedRoute>
            <PaymentMethodsPage />
          </ProtectedRoute>
        ),
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
        path: "/certification/:slug",
        element: (
          <StudentRoute>
            <CertificationDetail />
          </StudentRoute>
        ),
      },
      {
        path: "/certification/:slug/exam/:regId",
        element: (
          <StudentRoute>
            <ExamEnvironment />
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
        path: "/personalize",
        element: (
          <ProtectedRoute>
            <PersonalizeWizard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/career-roadmap",
        element: (
          <ProtectedRoute>
            <CareerRoadmap />
          </ProtectedRoute>
        ),
      },
      {
        path: "/playground",
        element: (
          <ProtectedRoute>
            <AlgorithmPlayground />
          </ProtectedRoute>
        ),
      },

      {
        path: "/ai-assistant",
        element: <AIAssistant />,
      },
      {
        path: "/nearby-hub",
        element: (
          <ProtectedRoute>
            <NearbyHub />
          </ProtectedRoute>
        ),
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
        path: "user/:username",
        element: <Profile />,
      },
      {
        path: "instructor/:username",
        element: <Profile />,
      },
      {
        path: "admin/:username",
        element: <Profile />,
      },

      {
        path: "user/edit-profile",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/edit-photo",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/edit-account",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/manage-subscriptions",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/edit-payment-methods",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/edit-privacy",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/edit-notification-preferences",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/close-account",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/edit-api-clients",
        element: (
          <ProtectedRoute>
            <StudentProfileEdit />
          </ProtectedRoute>
        ),
      },

      {
        path: "course/search",
        element: <SearchPage />,
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
          { path: "course/create", element: <Navigate to="/instructor/course/create/1" replace /> }, // redirect bare /create → step 1
          { path: "course/create/:step", element: <AddCourse /> }, // 4-step wizard
          { path: "course/:courseId", element: <EditCourse /> }, // The new central hub for editing
          { path: "course/:courseId/assignments", element: <InstructorAssignments /> },

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
          {
            path: "profile",
            element: <Navigate to="/instructor/profile/basic-information" replace />,
          },
          {
            path: "profile/basic-information",
            element: <InstructorProfile />,
          },
          {
            path: "profile/photo",
            element: <InstructorProfile />,
          },
          {
            path: "profile/privacy",
            element: <InstructorProfile />,
          },
          {
            path: "account",
            element: <Navigate to="/instructor/account/security" replace />,
          },
          {
            path: "account/security",
            element: <InstructorAccount />,
          },
          {
            path: "account/notifications",
            element: <InstructorAccount />,
          },
          {
            path: "account/messages",
            element: <InstructorAccount />,
          },
          {
            path: "account/api-clients",
            element: <InstructorAccount />,
          },
          // ── Certificate routes ─────────────────────────────────────────
          { path: "certificates", element: <CertificateManager /> },
          { path: "certificates/new", element: <CertificateForm mode="create" /> },
          { path: "certificates/:id/edit", element: <CertificateForm mode="edit" /> },
          { path: "location-analytics", element: <LocationAnalytics /> },
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
          { path: "discounts", element: <DiscountManager /> },
          { path: "subscriptions", element: <SupAdmSubscriptions /> },
          { path: "certifications", element: <AdminCertifications /> },
          { path: "location-analytics", element: <LocationAnalytics /> },

          // C. Profile and account settings routes for admin
          {
            path: "profile",
            element: <Navigate to="/admin/profile/basic-information" replace />,
          },
          {
            path: "profile/basic-information",
            element: <InstructorProfile />,
          },
          {
            path: "profile/photo",
            element: <InstructorProfile />,
          },
          {
            path: "profile/privacy",
            element: <InstructorProfile />,
          },
          {
            path: "account",
            element: <Navigate to="/admin/account/security" replace />,
          },
          {
            path: "account/security",
            element: <InstructorAccount />,
          },
          {
            path: "account/notifications",
            element: <InstructorAccount />,
          },
          {
            path: "account/messages",
            element: <InstructorAccount />,
          },
          {
            path: "account/api-clients",
            element: <InstructorAccount />,
          },
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
  {
    path: "/course-detail/:courseId/assignments",
    element: (
      <ProtectedRoute>
        <PurchaseCourseProtectedRoute>
          <ScrollToTop />
          <StudentAssignments />
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
