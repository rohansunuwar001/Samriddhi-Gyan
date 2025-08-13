import { apiSlice } from "./apiSlice";

export const adminDataApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCourseEnrolledStudents: builder.query({
      query: (courseId) => `/course/${courseId}/enrolled-students`,
    }),

    // NEW: Get all courses with enrolled students
    getCoursesWithEnrolledStudents: builder.query({
      query: () => "course/courses-with-students",
    }),

    // NEW: Get all courses with enrolled students AND reviews
    getCoursesWithEnrolledStudentsAndReviews: builder.query({
      query: () => "course/courses-with-students-reviews",
    }),

    // NEW: Get all paid courses with enrolled students AND payments
    getPaidCoursesWithEnrolledStudentsAndPayments: builder.query({
      query: () => "course/paid-courses-with-students-payments",
    }),

    // NEW: Get course analytics
    getCourseAnalytics: builder.query({
      query: () => "course/analytics",
    }),
    // ... you can inject other course-related endpoints here
  }),
});

// Export the auto-generated hook for the endpoint
export const {
  useGetCourseEnrolledStudentsQuery,
  useGetCoursesWithEnrolledStudentsQuery, // <-- Add this export
  useGetCoursesWithEnrolledStudentsAndReviewsQuery, // <-- Add this export
  useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery, // <-- Add this export
  // NEW: Course analytics hook
  useGetCourseAnalyticsQuery,
} = adminDataApi;
