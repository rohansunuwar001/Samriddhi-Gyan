// src/features/api/adminApi.js

import { apiSlice } from "./apiSlice";

export const adminApi = apiSlice.injectEndpoints({
    // Define all caching tags used in this admin-focused API slice.
    // This helps RTK Query manage data fetching and re-fetching automatically.
    reducerPath: 'adminApi',
    tagTypes: ['AdminStats', 'User', 'PlatformAnalytics', 'AdminCourses'],
   
    endpoints: (builder) => ({
        
        /**
         * @desc Fetches the aggregated statistics for the Super Admin dashboard.
         * @route GET /api/admin/dashboard-stats
         */
        getDashboardStats: builder.query({
            query: () => '/admin/dashboard-stats',
            providesTags: ['AdminStats'],
        }),

        /**
         * @desc Fetches a paginated, searchable, and filterable list of all users.
         * @route GET /api/admin/users
         */
        getUsers: builder.query({
            query: ({ page = 1, limit = 10, search = '', role = '' }) => {
                const params = new URLSearchParams({ page, limit, search, role });
                return `/admin/users?${params.toString()}`;
            },
            providesTags: [{ type: 'User', id: 'LIST' }],
        }),

        /**
         * @desc Updates a specific user's details, including their role.
         * @route PUT /api/admin/users/:id
         */
        updateUser: builder.mutation({
            query: ({ userId, ...updateData }) => ({
                url: `/admin/users/${userId}`,
                method: 'PUT',
                body: updateData,
            }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        }),
        
        /**
         * @desc Deletes a user from the database.
         * @route DELETE /api/admin/users/:id
         */
        deleteUser: builder.mutation({
            query: (userId) => ({
                url: `/admin/users/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        }),
        
        // --- NEW ENDPOINTS FOR PLATFORM & COURSE MANAGEMENT ---

        /**
         * @desc Fetches platform-wide analytics: instructor performance and all course data.
         * @route GET /api/admin/platform-analytics
         */
        getPlatformAnalytics: builder.query({
            query: () => '/admin/platform-analytics',
            // This data is tagged so we can invalidate it when a course changes.
            providesTags: ['PlatformAnalytics', { type: 'AdminCourses', id: 'LIST' }],
        }),
        
        /**
         * @desc Updates any course on the platform by its ID. (Admin only)
         * @route PUT /api/admin/courses/:id
         */
        updateCourse: builder.mutation({
            query: ({ courseId, ...updateData }) => ({
                url: `/admin/courses/${courseId}`,
                method: 'PUT',
                body: updateData,
            }),
            // When a course is updated, the platform analytics and course lists are no longer fresh.
            // Invalidating these tags tells RTK Query to refetch them automatically.
            invalidatesTags: ['PlatformAnalytics', { type: 'AdminCourses', id: 'LIST' }],
        }),

        /**
         * @desc Deletes any course on the platform by its ID. (Admin only)
         * @route DELETE /api/admin/courses/:id
         */
        deleteCourse: builder.mutation({
            query: (courseId) => ({
                url: `/admin/courses/${courseId}`,
                method: 'DELETE',
            }),
            // Deleting a course also makes the analytics and course lists stale.
            invalidatesTags: ['PlatformAnalytics', { type: 'AdminCourses', id: 'LIST' }],
        }),
        getRevenueDetails: builder.query({
            query: ({ page = 1, limit = 15, status, paymentMethod, startDate, endDate }) => {
                const params = new URLSearchParams({ page, limit });
                if (status) params.append('status', status);
                if (paymentMethod) params.append('paymentMethod', paymentMethod);
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                
                return {
                    url: `/admin/revenue?${params.toString()}`,
                };
            },
            // Provides a tag to the list of revenue items.
            // If you ever add a 'refund' mutation, it would invalidate this tag.
            providesTags: [{ type: 'Revenue', id: 'LIST' }],
        }),

    }),
});

// Export the auto-generated hooks for use in your components.
export const {
    // Existing Hooks
    useGetDashboardStatsQuery,
    useGetUsersQuery,
    useUpdateUserMutation,
    useDeleteUserMutation,
    
    // --- NEWLY ADDED HOOKS ---
    useGetPlatformAnalyticsQuery, // Hook to get platform-wide analytics
    useUpdateCourseMutation,      // Hook for the "Update Course" action
    useDeleteCourseMutation,      // Hook for the "Delete Course" action

    // Revenu Api
    useGetRevenueDetailsQuery,
} = adminApi;