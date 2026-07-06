// file: src/features/api/evaluationApi.js

import { apiSlice } from "./apiSlice";

export const evaluationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    validateCodeAST: builder.mutation({
      query: (body) => ({
        url: "/evaluation/validate-code",
        method: "POST",
        body,
      }),
    }),
    checkPlagiarismLSH: builder.mutation({
      query: (body) => ({
        url: "/evaluation/check-plagiarism",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useValidateCodeASTMutation,
  useCheckPlagiarismLSHMutation,
} = evaluationApi;
