// src/features/api/notificationApi.js
//
// FIX: Added keepUnusedDataFor: 0 to getNotifications so RTK Query never
// serves stale cached data. This fixes the 304 problem where the bell
// showed "You're all caught up!" even though a notification was saved in DB.

import { apiSlice } from './apiSlice';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notifications'],
      // CRITICAL FIX: Don't cache notification data at all.
      // Notifications must always be fresh — a 5-second stale window
      // means the user sees "You're all caught up!" right after purchase.
      keepUnusedDataFor: 0,
    }),

    markAsRead: builder.mutation({
      query: () => ({ url: '/notifications/read', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),

    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    clearAllNotifications: builder.mutation({
      query: () => ({ url: '/notifications', method: 'DELETE' }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} = notificationApi;