import { apiSlice } from "./apiSlice";

export const lectureApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // ── Create a lecture entry (no video yet) ────────────────────────────────
    createLecture: builder.mutation({
      query: ({ sectionId, title }) => ({
        url: `/sections/${sectionId}/lectures`,
        method: "POST",
        body: { title },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    // ── Update title / isPreview ─────────────────────────────────────────────
    // NOTE: PATCH not PUT — body is JSON { title, isPreview }, not FormData.
    // Video upload is handled separately via XHR (see EditLectureForm) because
    // RTK Query has no upload progress support.
    updateLecture: builder.mutation({
      query: ({ lectureId, title, isPreview }) => ({
        url: `/lectures/${lectureId}`,
        method: "PATCH",
        body: { title, isPreview },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    // ── Delete lecture + HLS files ────────────────────────────────────────────
    deleteLecture: builder.mutation({
      query: ({ lectureId }) => ({
        url: `/lectures/${lectureId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    // ── Get single lecture (used by student player) ───────────────────────────
    getLectureById: builder.query({
      query: (lectureId) => `/lectures/${lectureId}`,
    }),

    // ── Poll transcoding status ───────────────────────────────────────────────
    // EditLectureForm polls this every 3s after uploading a video.
    // Returns: { status, progress, phase, videoUrl }
    // status values: 'transcoding' | 'ready' | 'failed' | 'pending'
    getLectureStatus: builder.query({
      query: (lectureId) => `/lectures/${lectureId}/status`,
    }),

  }),
});

export const {
  useCreateLectureMutation,
  useUpdateLectureMutation,
  useDeleteLectureMutation,
  useGetLectureByIdQuery,
  useGetLectureStatusQuery,
} = lectureApi;