import { apiSlice } from "./apiSlice";

export const exploreSectionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPublicExploreSections: builder.query({
      query: () => "/explore-sections",
      providesTags: [{ type: "ExploreSection", id: "LIST" }],
    }),
    getAdminExploreSections: builder.query({
      query: () => "/explore-sections/admin",
      providesTags: [{ type: "ExploreSection", id: "LIST" }],
    }),
    createExploreSectionItem: builder.mutation({
      query: (body) => ({
        url: "/explore-sections",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ExploreSection", id: "LIST" }],
    }),
    updateExploreSectionItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/explore-sections/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "ExploreSection", id: "LIST" }],
    }),
    deleteExploreSectionItem: builder.mutation({
      query: (id) => ({
        url: `/explore-sections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ExploreSection", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicExploreSectionsQuery,
  useGetAdminExploreSectionsQuery,
  useCreateExploreSectionItemMutation,
  useUpdateExploreSectionItemMutation,
  useDeleteExploreSectionItemMutation,
} = exploreSectionApi;
