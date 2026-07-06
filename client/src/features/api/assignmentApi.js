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
    getCourseAssignments: builder.query({
      query: (courseId) => `/assignment/course/${courseId}`,
      providesTags: (result, error, courseId) => [{ type: "CourseDetail", id: courseId }],
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
  useGetCourseAssignmentsQuery,
  useSubmitAssignmentMutation,
  useGetAssignmentSubmissionsQuery,
  useGradeSubmissionMutation,
} = assignmentApi;
