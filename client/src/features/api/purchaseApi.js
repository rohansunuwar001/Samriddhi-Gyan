import { apiSlice } from './apiSlice'; // Import the central apiSlice

export const purchaseApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * @desc Initiates an eSewa checkout session for a course.
         */
        createCheckoutSession: builder.mutation({
            query: (courseId) => ({
                url: '/purchase/esewa',
                method: 'POST',
                body: { courseId },
            }),
        }),
        
        /**
         * @desc Fetches detailed course info along with the user's purchase status.
         */
        getCourseDetailWithStatus: builder.query({
            query: (courseId) => `/purchase/course/${courseId}/detail-with-status`,
            // This query provides the 'CourseDetail' tag. Any mutation that
            // invalidates this tag will cause this query to automatically refetch.
            providesTags: (result, error, courseId) => [{ type: 'CourseDetail', id: courseId }],
        }),
        
        /**
         * @desc Fetches a list of all courses the current user has purchased.
         */
        getPurchasedCourses: builder.query({
            query: () => '/purchase',
             // Provides a general tag for the user's list of purchased courses
            providesTags: [{ type: 'Course', id: 'PURCHASED_LIST' }],
        }),

        /**
         * @desc Submits a new review for a course.
         */
        addReview: builder.mutation({
            query: ({ courseId, reviewData }) => ({
                url: `/reviews/${courseId}`,
                method: 'POST',
                body: reviewData,
            }),
            // On success, this invalidates the specific 'CourseDetail' tag.
            // This forces `getCourseDetailWithStatus` to refetch, updating the UI with the new review.
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
        }),
    }),
});

// Export the auto-generated hooks.
export const {
    useCreateCheckoutSessionMutation,
    useGetCourseDetailWithStatusQuery,
    useGetPurchasedCoursesQuery,
    useAddReviewMutation,
} = purchaseApi;