// file: src/features/api/adminDataApi.js

import { apiSlice } from './apiSlice'; // Import the central, configured apiSlice

/**
 * This file INJECTS its endpoints into the central apiSlice.
 * It will automatically use the baseQuery from apiSlice, including the
 * `prepareHeaders` logic that attaches the authentication token. This
 * is the key fix for the '401 Unauthorized' errors.
 */
export const instructorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    getCourseEnrolledStudents: builder.query({
      query: (courseId) => `/course/${courseId}/enrolled-students`,
    }),
    
    getCoursesWithEnrolledStudents: builder.query({
      query: () => "course/courses-with-students",
    }),

    getCoursesWithEnrolledStudentsAndReviews: builder.query({
      query: () => "course/courses-with-students-reviews",
    }),
    
    getPaidCoursesWithEnrolledStudentsAndPayments: builder.query({
      query: () => "course/paid-courses-with-students-payments",
    }),
    
    getCourseAnalytics: builder.query({
      query: () => "course/analytics",
      providesTags: [{ type: "Analytics", id: "LIST" }], // Good practice for caching
    }),
     replyToReview: builder.mutation({
        query: ({ reviewId, reply }) => ({
            url: `/reviews/${reviewId}/reply`,
            method: 'PUT',
            body: { reply },
        }),
        invalidatesTags: ['InstructorReviews'], // <-- This automatically refetches the review list!
    }),

    deleteReview: builder.mutation({
        query: (reviewId) => ({
            url: `/reviews/${reviewId}`,
            method: 'DELETE',
        }),
        invalidatesTags: ['InstructorReviews'], // <-- This also refetches the list!
    }),
    
  }),
});

// Export the auto-generated hooks. Their names do not change.
export const {
  useGetCourseEnrolledStudentsQuery,
  useGetCoursesWithEnrolledStudentsQuery,
  useGetCoursesWithEnrolledStudentsAndReviewsQuery,
  useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery,
  useGetCourseAnalyticsQuery,
  useReplyToReviewMutation, // <-- NEW
  useDeleteReviewMutation, 
} = instructorApi;