import { apiSlice } from './apiSlice';

export const recommendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecommendedCourse: builder.query({
      query: () => 'recommendations',
      transformResponse: (response) => {
        console.log('🎯 [Frontend API] Recommended Courses JSON Data (GET /api/v1/recommendations):', response);
        return response;
      },
    }),
    getTrendingCourse: builder.query({
      query: () => 'recommendations/trending',
      transformResponse: (response) => {
        console.log('🔥 [Frontend API] Trending Courses JSON Data (GET /api/v1/recommendations/trending):', response);
        return response;
      },
    }),
    getFeaturedCourses: builder.query({
      query: (tab = 'popular') => `recommendations/featured?tab=${tab}`,
      transformResponse: (response) => {
        console.log('⭐ [Frontend API] Featured Courses JSON Data (GET /api/v1/recommendations/featured):', response);
        return response;
      },
    }),
  }),
});

// Export the auto-generated hook for the endpoint
export const { useGetRecommendedCourseQuery, useGetTrendingCourseQuery, useGetFeaturedCoursesQuery } = recommendedApi;