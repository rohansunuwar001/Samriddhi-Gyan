import { userLoggedIn, userLoggedOut } from '../authSlice';
import { apiSlice } from './apiSlice'; // Import the central apiSlice


export const authApi = apiSlice.injectEndpoints({
    // Injects endpoints into the central 'api' slice, no new reducer path needed.
    endpoints: (builder) => ({
        /**
         * @desc Registers a new user.
         */
        registerUser: builder.mutation({
            query: (inputData) => ({
                url: '/user/register', // URLs are now relative to the base /api/v1
                method: 'POST',
                body: inputData,
            }),
        }),

        /**
         * @desc Logs in an existing user.
         */
        loginUser: builder.mutation({
            query: (inputData) => ({
                url: '/user/login',
                method: 'POST',
                body: inputData,
            }),
            async onQueryStarted(_, { queryFulfilled, dispatch }) {
                try {
                    const result = await queryFulfilled;
                    dispatch(userLoggedIn({ user: result.data.user }));
                } catch (error) { console.error("Login failed:", error); }
            },
        }),

        /**
         * @desc Logs out the current user.
         */
        logoutUser: builder.mutation({
            query: () => ({
                url: '/user/logout',
                method: 'GET',
            }),
            async onQueryStarted(_, { queryFulfilled, dispatch }) {
                try {
                    await queryFulfilled;
                    dispatch(userLoggedOut());
                } catch (error) { console.error("Logout failed:", error); }
            },
        }),

        /**
         * @desc Fetches the current logged-in user's profile data.
         */
        loadUser: builder.query({
            query: () => '/user/profile',
            providesTags: ['User'], // This data is tagged as 'User'
            async onQueryStarted(_, { queryFulfilled, dispatch }) {
                try {
                    const result = await queryFulfilled;
                    dispatch(userLoggedIn({ user: result.data.user }));
                } catch (error) { console.log("No user session found or session expired."); }
            },
        }),

        /**
         * @desc Updates user's text-based information.
         */
        updateUserInfo: builder.mutation({
            query: (userInfo) => ({
                url: '/user/profile/update-info',
                method: 'PATCH',
                body: userInfo,
            }),
            invalidatesTags: ['User'], // On success, refetch all data tagged as 'User'
        }),

        /**
         * @desc Updates user's profile picture.
         */
        updateUserAvatar: builder.mutation({
            query: (formData) => ({
                url: '/user/profile/update-avatar',
                method: 'PATCH',
                body: formData,
            }),
            invalidatesTags: ['User'],
        }),

        /**
         * @desc Updates user's password.
         */
        updateUserPassword: builder.mutation({
            query: (passwordData) => ({
                url: '/user/profile/update-password',
                method: 'PATCH',
                body: passwordData,
            }),
        }),
    }),
});

// Export the hooks. They are automatically generated and attached to this object.
export const {
    useRegisterUserMutation,
    useLoginUserMutation,
    useLogoutUserMutation,
    useLoadUserQuery,
    useUpdateUserInfoMutation,
    useUpdateUserAvatarMutation,
    useUpdateUserPasswordMutation,
} = authApi;