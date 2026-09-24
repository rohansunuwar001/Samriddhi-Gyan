// file: src/features/api/assignmentApi.js

import { apiSlice } from "./apiSlice";

export const assignmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAssignment: builder.mutation({
      query: (body) => ({
        url: "/assignment",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CourseDetail"],
    }),
    deleteAssignment: builder.mutation({
      query: (assignmentId) => ({
        url: `/assignment/${assignmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CourseDetail"],
    }),
    getCourseAssignments: builder.query({
      query: (courseId) => `/assignment/course/${courseId}`,
      providesTags: (result, error, courseId) => [{ type: "CourseDetail", id: courseId }],
    }),
    getCourseSubmissions: builder.query({
      query: (courseId) => `/assignment/submissions/course/${courseId}`,
      providesTags: (result, error, courseId) => [{ type: "CourseDetail", id: `subs-${courseId}` }],
    }),
    submitAssignment: builder.mutation({
      query: ({ assignmentId, formData }) => ({
        url: `/assignment/submit/${assignmentId}`,
        method: "POST",
        body: formData,
        // Let fetchBaseQuery auto-detect Content-Type since it's FormData
      }),
      invalidatesTags: ["CourseDetail"],
    }),
    getAssignmentSubmissions: builder.query({
      query: (assignmentId) => `/assignment/submissions/${assignmentId}`,
      providesTags: (result, error, assignmentId) => [{ type: "CourseDetail", id: assignmentId }],
    }),
    getSubmissionById: builder.query({
      query: (submissionId) => `/assignment/submission/${submissionId}`,
      providesTags: (result, error, submissionId) => [{ type: "CourseDetail", id: `sub-${submissionId}` }],
    }),
    gradeSubmission: builder.mutation({
      query: ({ submissionId, grade, feedback, threshold }) => ({
        url: `/assignment/grade/${submissionId}`,
        method: "POST",
        body: { grade, feedback, threshold },
      }),
      invalidatesTags: ["CourseDetail"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetCourseAssignmentsQuery,
  useGetCourseSubmissionsQuery,
  useSubmitAssignmentMutation,
  useGetAssignmentSubmissionsQuery,
  useGetSubmissionByIdQuery,
  useGradeSubmissionMutation,
} = assignmentApi;

