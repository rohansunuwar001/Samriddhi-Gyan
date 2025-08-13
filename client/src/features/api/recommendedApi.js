import { apiSlice } from './apiSlice';

export const recommendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecommendedCourse: builder.query({
      // The query will be appended to the base URL, resulting in a call to: GET /api/v1/recommendations
      query: () => 'recommendations',
    }),
  }),
});

// Export the auto-generated hook for the endpoint
export const { useGetRecommendedCourseQuery } = recommendedApi;