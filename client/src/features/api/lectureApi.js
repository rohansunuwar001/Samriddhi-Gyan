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
      query: ({
        lectureId,
        title,
        description,
        isPreview,
        videoUrl,
        status,
        durationInSeconds,
        downloadable,
      }) => ({
        url: `/lectures/${lectureId}`,
        method: "PATCH",
        body: {
          title,
          description,
          isPreview,
          videoUrl,
          status,
          durationInSeconds,
          downloadable,
        },
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

    uploadCaption: builder.mutation({
      query: ({ lectureId, formData }) => ({
        url: `/lectures/${lectureId}/captions`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    toggleCaptionsDisable: builder.mutation({
      query: ({ lectureId, disabled }) => ({
        url: `/lectures/${lectureId}/captions/toggle-disable`,
        method: "PUT",
        body: { disabled },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    deleteCaption: builder.mutation({
      query: ({ lectureId, captionId }) => ({
        url: `/lectures/${lectureId}/captions/${captionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    // ── Resources Endpoints ──────────────────────────────────────────────────
    addLectureResourceLink: builder.mutation({
      query: ({ lectureId, title, url }) => ({
        url: `/lectures/${lectureId}/resources/link`,
        method: "POST",
        body: { title, url },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    uploadLectureResourceFile: builder.mutation({
      query: ({ lectureId, formData }) => ({
        url: `/lectures/${lectureId}/resources/upload`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    deleteLectureResource: builder.mutation({
      query: ({ lectureId, resourceId }) => ({
        url: `/lectures/${lectureId}/resources/${resourceId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    // ── Lab Endpoints ────────────────────────────────────────────────────────
    updateLectureLab: builder.mutation({
      query: ({ lectureId, title, description, url, pdfUrl, isActive }) => ({
        url: `/lectures/${lectureId}/lab`,
        method: "PUT",
        body: { title, description, url, pdfUrl, isActive },
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    uploadLectureLabPdf: builder.mutation({
      query: ({ lectureId, formData }) => ({
        url: `/lectures/${lectureId}/lab/upload`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

    deleteLectureLab: builder.mutation({
      query: ({ lectureId }) => ({
        url: `/lectures/${lectureId}/lab`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "CourseDetail", id: courseId },
      ],
    }),

  }),
});

export const {
  useCreateLectureMutation,
  useUpdateLectureMutation,
  useDeleteLectureMutation,
  useGetLectureByIdQuery,
  useGetLectureStatusQuery,
  useUploadCaptionMutation,
  useToggleCaptionsDisableMutation,
  useDeleteCaptionMutation,
  useAddLectureResourceLinkMutation,
  useUploadLectureResourceFileMutation,
  useDeleteLectureResourceMutation,
  useUpdateLectureLabMutation,
  useUploadLectureLabPdfMutation,
  useDeleteLectureLabMutation,
} = lectureApi;