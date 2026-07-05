import { apiSlice } from "./apiSlice";

export const topicApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllTopics: builder.query({
      query: () => "/topic",
      providesTags: [{ type: "Topic", id: "LIST" }],
    }),
    searchTopics: builder.query({
      query: (q) => `/topic?q=${encodeURIComponent(q)}`,
    }),
    getTopicBySlug: builder.query({
      query: (slug) => `/topic/detail/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Topic", id: slug }],
    }),
    createTopic: builder.mutation({
      query: (body) => ({
        url: "/topic",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Topic", id: "LIST" }],
    }),
    updateTopic: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/topic/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Topic", id: "LIST" },
        { type: "Topic", id: result?.topic?.slug }
      ],
    }),
    deleteTopic: builder.mutation({
      query: (id) => ({
        url: `/topic/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Topic", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTopicsQuery,
  useSearchTopicsQuery,
  useGetTopicBySlugQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
} = topicApi;
