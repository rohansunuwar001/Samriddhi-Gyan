 // Import the central apiSlice

import { apiSlice } from "./apiSlice";

// Create a new API slice that injects its endpoints into the main apiSlice
export const instructorApi = apiSlice.injectEndpoints({
    // The endpoints configuration for this specific slice
    endpoints: (builder) => ({
        
        /**
         * @desc    Query to get the aggregated analytics data for the instructor's dashboard.
         * @route   GET /api/v1/instructor/analytics/dashboard
         */
        getCreatorDashboardAnalytics: builder.query({
            query: () => '/instructor/analytics/dashboard',

            /**
             * Provides a specific tag for this data.
             * If another mutation (e.g., a new course purchase) invalidates this tag,
             * RTK Query will automatically re-fetch this data to update the dashboard.
             */
            providesTags: ['DashboardAnalytics'],
        }),

        // You could add other instructor-specific endpoints here in the future, for example:
        // getPayoutHistory: builder.query({ ... }),
        // requestPayout: builder.mutation({ ... }),

    }),
});

// Export the auto-generated hook for use in your components
export const {
    useGetCreatorDashboardAnalyticsQuery
} = instructorApi;