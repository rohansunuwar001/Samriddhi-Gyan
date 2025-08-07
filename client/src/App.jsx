import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import AIAssistant from "./components/AIAssistant";
import BlogPage from "./components/Blog/BlogPage";
import SingleBlogPage from "./components/Blog/SingleBlogPage";
import ForumPage from "./components/ForumPage";
import HowItWorks from "./components/HowItWorks";
import LmsShowcase from "./components/LmsShowcase";
import {
  AdminRoute,
  AuthenticatedUser,
  ProtectedRoute,
} from "./components/ProtectedRoutes";
import PurchaseCourseProtectedRoute from "./components/PurchaseCourseProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./components/ThemeProvider";
import TrustedBySection from "./components/home/TrustedBySction";
import MainLayout from "./layout/MainLayout";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import GoogleSuccess from "./pages/GoogleSuccess";
import Login from "./pages/Login";
import AccountSecurityPage from "./pages/Profile/AccountSecurityPage";
import PhotoPage from "./pages/Profile/PhotoPage";
import Profile from "./pages/Profile/Profile";
import ProfileEdit from "./pages/Profile/ProfileEdit";
import Signup from "./pages/Signup";
import Dashboard from "./pages/admin/Dashboard";
import Sidebar from "./pages/admin/Sidebar";
import AddCourse from "./pages/admin/course/AddCourse";
import CourseTable from "./pages/admin/course/CourseTable";
import EditCourse from "./pages/admin/course/EditCourse";
import CreateLecture from "./pages/admin/lecture/CreateLecture";
import EditLecture from "./pages/admin/lecture/EditLecture";
import CourseDetail from "./pages/student/CourseDetail";
import CourseProgress from "./pages/student/CourseProgress";
import Courses from "./pages/student/Courses";
import HeroSection from "./pages/student/HeroSection";
import MyLearning from "./pages/student/MyLearning";
import RecommendedCourse from "./pages/student/RecommendedCourse";
import SearchPage from "./pages/student/SearchPage";
import AnimatedErrorPage from "./AnimatedErrorPage";
import HomeCourse from "./pages/Home/HomeCourse";
// --- 1. Ensure this import is present and points to your new file ---


const MainLayoutWithScroll = () => {
  return (
    <>
      <ScrollToTop />
      <MainLayout />
    </>
  );
};


const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayoutWithScroll />,
    // --- 2. This is the crucial line that sets the error page for all child routes ---
    errorElement: <AnimatedErrorPage />,
    children: [
      {
        path: "/",
        element: (
          <>
            <HeroSection />
            <TrustedBySection />
            <HomeCourse />
            <RecommendedCourse />
            <LmsShowcase />
          </>
        ),
      },
      {
        path: "/ai-assistant",
        element: <AIAssistant />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },
      {
        path: "/blog",
        element: <BlogPage />,
      },
      {
        path: "/blog/:slug",
        element: <SingleBlogPage />,
      },
      {
        path: "/community",
        element: <ForumPage />,
      },
      {
        path: "/how-it-works",
        element: <HowItWorks />,
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
      {
        path: "my-learning",
        element: (
          <ProtectedRoute>
            <MyLearning />
          </ProtectedRoute>
        ),
      },
      {
        path: "auth/google/success",
        element: <GoogleSuccess />,
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
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
      {
        path: "course-detail/:courseId",
        element: (
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "course-progress/:courseId",
        element: (
          <ProtectedRoute>
            <PurchaseCourseProtectedRoute>
              <CourseProgress />
            </PurchaseCourseProtectedRoute>
          </ProtectedRoute>
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

      // admin routes start from here
      {
        path: "admin",
        element: (
          <AdminRoute>
            <Sidebar />
          </AdminRoute>
        ),
        children: [
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "course",
            element: <CourseTable />,
          },
          {
            path: "course/create",
            element: <AddCourse />,
          },
          {
            path: "course/:courseId",
            element: <EditCourse />,
          },
          {
            path: "course/:courseId/lecture",
            element: <CreateLecture />,
          },
          {
            path: "course/:courseId/lecture/:lectureId",
            element: <EditLecture />,
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <main>
      <ThemeProvider>
        <RouterProvider router={appRouter} />
      </ThemeProvider>
    </main>
  );
}

export default App;