import { apiSlice } from './apiSlice';

export const recommendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecommendedCourse: builder.query({
      // The query will be appended to the base URL, resulting in a call to: GET /api/v1/recommendations
      query: () => 'recommendations',
    }),
    getTrendingCourse: builder.query({
      query: () => 'recommendations/trending',
    }),
    getFeaturedCourses: builder.query({
      query: (tab = 'popular') => `recommendations/featured?tab=${tab}`,
    }),
  }),
});

// Export the auto-generated hook for the endpoint
export const { useGetRecommendedCourseQuery, useGetTrendingCourseQuery, useGetFeaturedCoursesQuery } = recommendedApi;