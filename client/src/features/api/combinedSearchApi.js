// file: src/features/api/combinedSearchApi.js

import { apiSlice } from "./apiSlice";

export const combinedSearchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCombinedSearchByTopic: builder.query({
      query: (topic) => `/search-by-topic?topic=${encodeURIComponent(topic)}`,
      providesTags: (result, error, topic) => [{ type: "CombinedSearch", id: topic }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetCombinedSearchByTopicQuery } = combinedSearchApi;