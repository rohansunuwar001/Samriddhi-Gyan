import { apiSlice } from "./apiSlice";

export const questionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCourseQuestions: builder.query({
      query: (courseId) => `question/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: "Question", id: "LIST" },
        ...(result?.questions ? result.questions.map((q) => ({ type: "Question", id: q._id })) : []),
      ],
    }),
    createQuestion: builder.mutation({
      query: ({ courseId, lectureId, title, content }) => ({
        url: `question/${courseId}`,
        method: "POST",
        body: { lectureId, title, content },
      }),
      invalidatesTags: [{ type: "Question", id: "LIST" }],
    }),
    toggleUpvote: builder.mutation({
      query: (questionId) => ({
        url: `question/${questionId}/upvote`,
        method: "POST",
      }),
      invalidatesTags: (result, error, questionId) => [
        { type: "Question", id: questionId },
        { type: "Question", id: "LIST" },
      ],
    }),
    addAnswer: builder.mutation({
      query: ({ questionId, content }) => ({
        url: `question/${questionId}/answer`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { questionId }) => [
        { type: "Question", id: questionId },
        { type: "Question", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCourseQuestionsQuery,
  useCreateQuestionMutation,
  useToggleUpvoteMutation,
  useAddAnswerMutation,
} = questionApi;
