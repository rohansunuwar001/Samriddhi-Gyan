import { apiSlice } from './apiSlice';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),

    markAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read',
        method: 'POST',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // --- ADD THIS NEW MUTATION ---
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: 'DELETE',
      }),
      // When successful, refetch the notification list automatically
      invalidatesTags: ['Notifications'],
    }),

    // --- ADD THIS SECOND NEW MUTATION ---
    clearAllNotifications: builder.mutation({
        query: () => ({
            url: '/notifications',
            method: 'DELETE',
        }),
        invalidatesTags: ['Notifications'],
    }),
  }),
});

// --- EXPORT THE NEW HOOKS ---
export const {
    useGetNotificationsQuery,
    useMarkAsReadMutation,
    useDeleteNotificationMutation, // <-- New
    useClearAllNotificationsMutation, // <-- New
} = notificationApi;