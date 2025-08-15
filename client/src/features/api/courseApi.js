// file: src/features/api/courseApi.js

import { apiSlice } from "./apiSlice";

 // Import the central apiSlice

export const courseApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- NEW ENDPOINT ADDED ---
    getCourseAnalytics: builder.query({
      query: () => "/course/analytics", // The URL for your backend analytics route
      // This gives us a way to cache and auto-refetch this data
      providesTags: ["CourseAnalytics"],
    }),

    // ===== Existing Course CRUD & Query Endpoints (Unchanged) =====
    createCourse: builder.mutation({
      query: (courseData) => ({
        url: "/course/create",
        method: "POST",
        body: courseData,
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),

    editCourse: builder.mutation({
      query: ({ courseId, formData }) => ({
        url: `/course/${courseId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Course", id: "LIST" },
        { type: "CourseDetail", id: courseId },
      ],
    }),

    getCreatorCourse: builder.query({
      query: () => "/course/creator",
      providesTags: [{ type: "Course", id: "LIST" }],
    }),

    getCourseById: builder.query({
      query: (courseId) => `/course/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    getPublishedCourse: builder.query({
      query: () => "/course/published",
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

// ✅ Export all hooks, including the new getCourseAnalytics hook
export const {
  useGetCourseAnalyticsQuery, // <-- NEW EXPORT
  useCreateCourseMutation,
  useEditCourseMutation,
  useGetCreatorCourseQuery,
  useGetCourseByIdQuery,
  useGetPublishedCourseQuery,
  useGetSearchCourseQuery,
  usePublishCourseMutation,
  useRemoveCourseMutation,
} = courseApi;