import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Core Layout & Utility Components
import MainLayout from "./layout/MainLayout";
import ScrollToTop from "./components/ScrollToTop";
import AnimatedErrorPage from "./AnimatedErrorPage";
import {
  AdminRoute,
  AuthenticatedUser,
  ProtectedRoute,
} from "./components/ProtectedRoutes";
import PurchaseCourseProtectedRoute from "./components/PurchaseCourseProtectedRoute";

// --- All Page Imports ---

// Public & Static Pages
import Home from "./pages/Home";
import About from "./pages/About/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import GoogleSuccess from "./pages/GoogleSuccess";

// User Profile Pages
import Profile from "./pages/Profile/Profile";
import ProfileEdit from "./pages/Profile/ProfileEdit";
import PhotoPage from "./pages/Profile/PhotoPage";
import AccountSecurityPage from "./pages/Profile/AccountSecurityPage";

// Student-Facing Course Pages
import Courses from "./pages/student/Courses";
import MyLearning from "./pages/student/MyLearning";
import CourseDetail from "./pages/student/CourseDetail";
import CourseProgress from "./pages/student/CourseProgress";
import SearchPage from "./pages/student/SearchPage";

// --- UPDATED ADMIN/INSTRUCTOR PAGE IMPORTS ---
import Sidebar from "./pages/admin/Sidebar";
import Dashboard from "./pages/admin/Dashboard";
import CourseTable from "./pages/admin/course/CourseTable";
import AddCourse from "./pages/admin/course/AddCourse";
import EditCourse from "./pages/admin/course/EditCourse";
import EditLecture from "./pages/admin/lecture/EditLecture";

// Layout Wrapper
const MainLayoutWithScroll = () => (
  <>
    <ScrollToTop />
    <MainLayout />
  </>
);

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayoutWithScroll />,
    errorElement: <AnimatedErrorPage />,
    children: [
      // Public and student routes...
      { path: "/", element: <Home /> },
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
        path: "course/:courseId",
        element: (
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
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
        path: "course-progress/:courseId",
        element: (
          <ProtectedRoute>
            <PurchaseCourseProtectedRoute>
              <CourseProgress />
            </PurchaseCourseProtectedRoute>
          </ProtectedRoute>
        ),
      },
      // ... (Add all your other non-admin routes here)

      // --- REVISED ADMIN ROUTES ---
      {
        path: "admin",
        element: (
          <AdminRoute>
            <Sidebar />
          </AdminRoute>
        ),
        children: [
          { path: "", element: <Dashboard /> },
          { path: "dashboard", element: <Dashboard /> },

          // Course management
          { path: "course", element: <CourseTable /> },
          { path: "course/create", element: <AddCourse /> },
          { path: "course/:courseId", element: <EditCourse /> },

          // Lecture management
          // This is the only route needed for editing a specific lecture.
          // The `courseId` is passed for a seamless "back" navigation.
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
      <RouterProvider router={appRouter} />
    </main>
  );
}

export default App;
