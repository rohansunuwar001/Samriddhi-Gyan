import { apiSlice } from "./apiSlice";

export const noteApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCourseNotes: builder.query({
      query: ({ courseId, lectureId, sort }) => {
        const params = new URLSearchParams();
        if (lectureId) params.append("lectureId", lectureId);
        if (sort) params.append("sort", sort);
        return `note/${courseId}?${params.toString()}`;
      },
      providesTags: (result) => [
        { type: "Note", id: "LIST" },
        ...(result?.notes ? result.notes.map((n) => ({ type: "Note", id: n._id })) : []),
      ],
    }),
    createNote: builder.mutation({
      query: (body) => ({
        url: "note",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
    updateNote: builder.mutation({
      query: ({ noteId, content }) => ({
        url: `note/${noteId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
    deleteNote: builder.mutation({
      query: (noteId) => ({
        url: `note/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Note", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCourseNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = noteApi;
