// file: src/features/api/authorApi.js

import { apiSlice } from "./apiSlice";

export const authorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllAuthors: builder.query({
      query: () => "/authors",
      providesTags: [{ type: "Author", id: "LIST" }],
    }),

    getAuthorById: builder.query({
      query: (id) => `/authors/${id}`,
      providesTags: (result, error, id) => [{ type: "Author", id }],
    }),

    createAuthor: builder.mutation({
      query: (authorData) => ({
        url: "/authors",
        method: "POST",
        body: authorData,
      }),
      invalidatesTags: [{ type: "Author", id: "LIST" }],
    }),

    updateAuthor: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/authors/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Author", id: "LIST" },
        { type: "Author", id },
      ],
    }),

    deleteAuthor: builder.mutation({
      query: (id) => ({
        url: `/authors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Author", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllAuthorsQuery,
  useGetAuthorByIdQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation,
  useDeleteAuthorMutation,
} = authorApi;