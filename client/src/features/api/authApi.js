// file: src/features/api/authApi.js

import { apiSlice } from './apiSlice';

/**
 * Defines all authentication-related and user-specific API endpoints.
 */
export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        // --- Core Auth Mutations (Unchanged) ---
        registerUser: builder.mutation({
            query: (inputData) => ({ url: '/user/register', method: 'POST', body: inputData }),
        }),
        loginUser: builder.mutation({
            query: (inputData) => ({ url: '/user/login', method: 'POST', body: inputData }),
        }),
        logoutUser: builder.mutation({
            query: () => ({ url: '/user/logout', method: 'GET' }),
        }),

        // --- Core User Queries (Unchanged) ---
        loadUser: builder.query({
            query: () => '/user/me',
            providesTags: ['User'],
        }),
        getUserInfo: builder.query({
            query: () => '/user/profile', // For the user's public-facing profile page
            providesTags: ['User'],
        }),
        
        // --- ADD THIS NEW DEDICATED ENDPOINT ---
        getMyLearningCourses: builder.query({
            query: () => '/user/my-learning', // This calls your new dedicated backend route
            // The API for this route should return `{ success: true, courses: [...] }`
            // This tag helps RTK Query auto-refetch data when a course is purchased or changed.
            providesTags: (result) =>
                result?.courses
                    ? [
                          ...result.courses.map(({ _id }) => ({ type: 'Course', id: _id })),
                          { type: 'Course', id: 'MY_LEARNING_LIST' },
                      ]
                    : [{ type: 'Course', id: 'MY_LEARNING_LIST' }],
        }),
        // ------------------------------------

        // --- User Profile Mutations (Unchanged) ---
        updateUserInfo: builder.mutation({
            query: (userInfo) => ({ url: '/user/profile', method: 'PATCH', body: userInfo }),
            invalidatesTags: ['User'],
        }),
        updateUserAvatar: builder.mutation({
            query: (formData) => ({ url: '/user/profile/update-avatar', method: 'PATCH', body: formData }),
            invalidatesTags: ['User'],
        }),
        updateUserPassword: builder.mutation({
            query: (passwordData) => ({ url: '/user/profile/update-password', method: 'PATCH', body: passwordData }),
        }),

    }),
});

// Export all hooks, including the new one for the learning page.
export const {
    useRegisterUserMutation,
    useLoginUserMutation,
    useLogoutUserMutation,
    useLoadUserQuery,
    useGetMyLearningCoursesQuery, // <-- EXPORT THE NEW HOOK
    useUpdateUserInfoMutation,
    useUpdateUserAvatarMutation,
    useUpdateUserPasswordMutation,
    useGetUserInfoQuery
} = authApi;