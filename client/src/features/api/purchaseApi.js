import { apiSlice } from "./apiSlice"; // Import the central apiSlice

export const purchaseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * @desc Initiates an eSewa checkout session for selected courses.
     * POST /purchase/esewa
     */
    createCheckoutSession: builder.mutation({
      query: (courseIds) => ({
        url: "/purchase/esewa",
        method: "POST",
        body: { courseIds },
      }),
    }),
    /**
     * @desc Initiates a Stripe checkout session for selected courses.
     * POST /purchase/checkout/create-checkout-session
     */
    createStripeCheckoutSession: builder.mutation({
      query: (courseIds) => ({
        url: "/purchase/checkout/create-checkout-session",
        method: "POST",
        body: { courseIds },
      }),
    }),
    /**
     * @desc Fetches detailed course info along with the user's purchase status.
     * GET /purchase/course/:courseId/detail-with-status
     */
    getCourseDetailWithStatus: builder.query({
      query: (courseId) => `/purchase/course/${courseId}/detail-with-status`,
      providesTags: (result, error, courseId) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),
    /**
     * @desc Fetches a list of all courses the current user has purchased.
     * GET /purchase
     */
    getPurchasedCourses: builder.query({
      query: () => "/purchase",
      providesTags: [{ type: "Course", id: "PURCHASED_LIST" }],
    }),

     addReview: builder.mutation({
      query: ({ courseId, reviewData }) => ({
        url: `/reviews/${courseId}`,
        method: "POST",
        body: reviewData,
      }),
      // On success, this invalidates the specific 'CourseDetail' tag.
      // This forces `getCourseDetailWithStatus` to refetch, updating the UI with the new review.
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),
    getPurchaseCoursenew: builder.query({
      query: () => "/course/course-purchases",
      providesTags: [{ type: "Course", id: "PURCHASED_LIST" }],
    })


    /**
     * @desc Stripe webhook (for server use, not client).
     * POST /purchase/webhook
     * Not exposed as a hook since it's not called from client.
     */
  }),
});

// Export the auto-generated hooks.
export const {
  useCreateCheckoutSessionMutation,
  useCreateStripeCheckoutSessionMutation,
  useGetCourseDetailWithStatusQuery,
  useGetPurchasedCoursesQuery,
  useAddReviewMutation,
  useGetPurchaseCoursenewQuery
} = purchaseApi;
