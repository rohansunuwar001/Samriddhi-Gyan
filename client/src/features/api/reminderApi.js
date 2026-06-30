import { apiSlice } from "./apiSlice";

export const reminderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserReminders: builder.query({
      query: (courseId) => `reminder/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: "Reminder", id: "LIST" },
        ...(result?.reminders ? result.reminders.map((r) => ({ type: "Reminder", id: r._id })) : []),
      ],
    }),
    createReminder: builder.mutation({
      query: ({ courseId, time, days, frequency }) => ({
        url: `reminder/${courseId}`,
        method: "POST",
        body: { time, days, frequency },
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
  useDeleteReminderMutation,
} = reminderApi;
