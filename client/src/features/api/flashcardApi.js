import { apiSlice } from "./apiSlice";

export const flashcardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDueFlashcards: builder.query({
      query: (courseId) => `flashcard/due/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: "Flashcard", id: "LIST" },
        ...(result?.cards ? result.cards.map((c) => ({ type: "Flashcard", id: c._id })) : []),
      ],
    }),
    createFlashcard: builder.mutation({
      query: ({ courseId, question, answer }) => ({
        url: "flashcard",
        method: "POST",
        body: { courseId, question, answer },
      }),
      invalidatesTags: [{ type: "Flashcard", id: "LIST" }],
    }),
    reviewFlashcard: builder.mutation({
      query: ({ cardId, quality }) => ({
        url: "flashcard/review",
        method: "POST",
        body: { cardId, quality },
      }),
      invalidatesTags: [{ type: "Flashcard", id: "LIST" }],
    }),
    generateAIFlashcards: builder.mutation({
      query: ({ courseId, lectureId }) => ({
        url: "flashcard/generate-ai",
        method: "POST",
        body: { courseId, lectureId },
      }),
      invalidatesTags: [{ type: "Flashcard", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDueFlashcardsQuery,
  useCreateFlashcardMutation,
  useReviewFlashcardMutation,
  useGenerateAIFlashcardsMutation,
} = flashcardApi;
