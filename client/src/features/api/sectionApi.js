import { apiSlice } from "./apiSlice";

export const sectionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ===== Section CRUD Endpoints (NEW) =====

    createSection: builder.mutation({
      query: ({ courseId, title }) => ({
        url: `/courses/${courseId}/sections`,
        method: "POST",
        body: { title },
      }),
      // Any change to a section requires the whole course detail page to refetch
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    updateSection: builder.mutation({
      query: ({ sectionId, title, courseId }) => ({
        url: `/sections/${sectionId}`,
        method: "PUT",
        body: { title },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    deleteSection: builder.mutation({
      query: ({ sectionId, courseId }) => ({
        url: `/sections/${sectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    // ... you can inject other course-related endpoints here
  }),
});

// Export the auto-generated hook for the endpoint
export const {
  // Add new section hooks
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} = sectionApi;
