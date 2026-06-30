// file: src/features/api/articleApi.js

import { apiSlice } from "./apiSlice";

export const articleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllArticles: builder.query({
      query: () => "/articles",
      providesTags: [{ type: "Article", id: "LIST" }],
    }),

    getArticleBySlug: builder.query({
      query: (slug) => `/articles/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Article", id: slug }],
    }),

    createArticle: builder.mutation({
      query: (articleData) => ({
        url: "/articles",
        method: "POST",
        body: articleData,
      }),
      invalidatesTags: [{ type: "Article", id: "LIST" }],
    }),

    updateArticle: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/articles/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Article", id: "LIST" },
        { type: "Article", id },
      ],
    }),

    deleteArticle: builder.mutation({
      query: (id) => ({
        url: `/articles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Article", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllArticlesQuery,
  useGetArticleBySlugQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
} = articleApi;