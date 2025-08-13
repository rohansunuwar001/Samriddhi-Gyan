import { apiSlice } from "./apiSlice"; // Import the central apiSlice

export const courseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ===== Course CRUD & Query Endpoints (Updated) =====

    createCourse: builder.mutation({
      // URL now points to a RESTful '/courses' endpoint
      query: (courseData) => ({
        // Expects { title, category, price: { original, current } }
        url: "/course/create",
        method: "POST",
        body: courseData,
      }),
      // Invalidates the list of courses, forcing the creator's course list to refetch
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    editCourse: builder.mutation({
      query: ({ courseId, formData }) => ({
        url: `/course/${courseId}`,
        method: "PUT",
        body: formData, // FormData for thumbnail support
      }),
      // Refreshes both the general course list and the specific detail page
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Course", id: "LIST" },
        { type: "CourseDetail", id: courseId },
      ],
    }),

    getCreatorCourse: builder.query({
      query: () => "/course/creator", // Use a more descriptive, updated route
      providesTags: [{ type: "Course", id: "LIST" }], // This "provides" the list
    }),

    getCourseById: builder.query({
      query: (courseId) => `/course/${courseId}`,
      // Provides a specific tag for this course, allows targeted invalidation
      providesTags: (result, error, courseId) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    getPublishedCourse: builder.query({
      query: () => "/course/published", // A clearer endpoint name is better practice
      providesTags: ["Courses"],
      
    }),
    getSearchCourse: builder.query({
      query: ({ searchQuery, categories, sortByPrice }) => {
        const params = new URLSearchParams();
        if (searchQuery) params.append("query", searchQuery);
        if (sortByPrice) params.append("sortByPrice", sortByPrice);
        if (categories && categories.length > 0) {
          categories.forEach((cat) => params.append("categories", cat));
        }
        return `/course/search?${params.toString()}`;
      },
    }),

    publishCourse: builder.mutation({
      query: ({ courseId, publish }) => ({
        url: `/course/${courseId}/publish?publish=${publish}`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    removeCourse: builder.mutation({
      query: (courseId) => ({
        url: `/course/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

// Export all hooks, keeping your original names and adding the new ones
export const {
  useCreateCourseMutation,
  useEditCourseMutation,
  useGetCreatorCourseQuery,
  useGetCourseByIdQuery,
  useGetPublishedCourseQuery,
  useGetSearchCourseQuery,
  usePublishCourseMutation,
  useRemoveCourseMutation,
} = courseApi;
