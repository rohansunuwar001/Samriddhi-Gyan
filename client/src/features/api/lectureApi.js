import { apiSlice } from "./apiSlice";

export const lectureApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLecture: builder.mutation({
      query: ({ sectionId, title, courseId }) => ({
        url: `/sections/${sectionId}/lectures`,
        method: "POST",
        body: { title },
      }),
      // Any lecture change refreshes the whole course page
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    // This endpoint is no longer needed, lectures are fetched with the course
    // getCourseLecture: builder.query(...) // REMOVED

    updateLecture: builder.mutation({
      query: ({ lectureId, formData }) => ({
        url: `/lectures/${lectureId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    deleteLecture: builder.mutation({
      query: ({ lectureId, courseId }) => ({
        url: `/lectures/${lectureId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    getLectureById: builder.query({
      query: (lectureId) => `/lectures/${lectureId}`,
    }),
    // ... you can inject other course-related endpoints here
  }),
});

// Export the auto-generated hook for the endpoint
export const {
  // Updated lecture hooks
   useCreateLectureMutation,
    useUpdateLectureMutation,
    useDeleteLectureMutation,
    useGetLectureByIdQuery,
} = lectureApi;

// ===== Lecture CRUD Endpoints (UPDATED for new architecture) =====

// createLecture: builder.mutation({
//     query: ({ sectionId, title, courseId }) => ({
//         url: `/sections/${sectionId}/lectures`,
//         method: 'POST',
//         body: { title },
//     }),
//     // Any lecture change refreshes the whole course page
//     invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
// }),

// updateLecture: builder.mutation({
//     query: ({ lectureId, formData }) => ({
//         url: `/lectures/${lectureId}`,
//         method: 'PUT',
//         body: formData,
//     }),
//     invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
// }),

// deleteLecture: builder.mutation({
//     query: ({ lectureId, courseId }) => ({
//         url: `/lectures/${lectureId}`,
//         method: 'DELETE',
//     }),
//     invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
// }),

// getLectureById: builder.query({
//     query: (lectureId) => `/lectures/${lectureId}`,
//     // Lectures don't really need tags as they are almost always fetched as part of a course.
// }),
