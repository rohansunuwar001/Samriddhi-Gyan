// file: src/features/api/categoryApi.js

import { apiSlice } from "./apiSlice";

const normalizeCategoryPayload = (payload) =>
  typeof payload === "string" ? { name: payload } : payload;

export const categoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query({
      query: () => "/categories",
      providesTags: [{ type: "Category", id: "LIST" }],
    }),

    createCategory: builder.mutation({
      query: (payload) => ({
        url: "/categories",
        method: "POST",
        body: normalizeCategoryPayload(payload),
      }),
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "Topic", id: "LIST" },
      ],
    }),

    updateCategory: builder.mutation({
      query: ({ id, name, parent }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body: { name, parent },
      }),
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "Topic", id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "Topic", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
