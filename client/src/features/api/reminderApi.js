import { apiSlice } from "./apiSlice";

export const reminderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserReminders: builder.query({
      query: () => `reminder`,
      providesTags: (result) => [
        { type: "Reminder", id: "LIST" },
        ...(result?.reminders ? result.reminders.map((r) => ({ type: "Reminder", id: r._id })) : []),
      ],
    }),
    createReminder: builder.mutation({
      query: (body) => ({
        url: `reminder`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Reminder", id: "LIST" }],
    }),
    updateReminder: builder.mutation({
      query: ({ reminderId, ...body }) => ({
        url: `reminder/${reminderId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Reminder", id: "LIST" }],
    }),
    deleteReminder: builder.mutation({
      query: (reminderId) => ({
        url: `reminder/${reminderId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Reminder", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUserRemindersQuery,
  useCreateReminderMutation,
  useUpdateReminderMutation,
  useDeleteReminderMutation,
} = reminderApi;
