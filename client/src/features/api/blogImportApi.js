// file: src/features/api/blogImportApi.js

import { apiSlice } from "./apiSlice";

export const blogImportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    importBlogData: builder.mutation({
      query: (payload) => ({
        url: "/admin/blog-import",
        method: "POST",
        body: payload,
      }),
      // Invalidate articles and categories so the blog reloads with new data
      invalidatesTags: [
        { type: "Article", id: "LIST" },
        { type: "Category", id: "LIST" },
        { type: "Author", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useImportBlogDataMutation } = blogImportApi;