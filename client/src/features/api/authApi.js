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
            query: () => '/user/my-learning', 
            providesTags: (result) =>
                result?.courses
                    ? [
                          ...result.courses.map(({ _id }) => ({ type: 'Course', id: _id })),
                          { type: 'Course', id: 'MY_LEARNING_LIST' },
                      ]
                    : [{ type: 'Course', id: 'MY_LEARNING_LIST' }],
        }),
        getArchivedCourses: builder.query({
            query: () => '/user/archived',
            providesTags: (result) =>
                result?.courses
                    ? [
                          ...result.courses.map(({ _id }) => ({ type: 'Course', id: _id })),
                          { type: 'Course', id: 'ARCHIVED_LIST' },
                      ]
                    : [{ type: 'Course', id: 'ARCHIVED_LIST' }],
        }),
        archiveCourse: builder.mutation({
            query: (courseId) => ({ url: `/user/archive/${courseId}`, method: 'POST' }),
            invalidatesTags: [{ type: 'Course', id: 'MY_LEARNING_LIST' }, { type: 'Course', id: 'ARCHIVED_LIST' }],
        }),
        unarchiveCourse: builder.mutation({
            query: (courseId) => ({ url: `/user/unarchive/${courseId}`, method: 'POST' }),
            invalidatesTags: [{ type: 'Course', id: 'MY_LEARNING_LIST' }, { type: 'Course', id: 'ARCHIVED_LIST' }],
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
        trackCourseView: builder.mutation({
            query: (courseId) => ({ url: `/user/view-history/${courseId}`, method: 'POST' }),
        }),

    }),
});

// Export all hooks, including the new one for the learning page.
export const {
    useRegisterUserMutation,
    useLoginUserMutation,
    useLogoutUserMutation,
    useLoadUserQuery,
    useTrackCourseViewMutation,
    useGetMyLearningCoursesQuery,
    useGetArchivedCoursesQuery,
    useArchiveCourseMutation,
    useUnarchiveCourseMutation,
    useUpdateUserInfoMutation,
    useUpdateUserAvatarMutation,
    useUpdateUserPasswordMutation,
    useGetUserInfoQuery
} = authApi;