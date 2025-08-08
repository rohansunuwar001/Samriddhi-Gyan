import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '@/app/constant';

// The root URL of your backend API
const API_V1_URL = `${BASE_URL}/api/v1`;

/**
 * The single, central API slice for the entire application.
 * All other API definitions will inject their endpoints into this slice.
 * This is the only slice that needs to be added to the Redux store's reducer and middleware.
 */
export const apiSlice = createApi({
    // A single reducer path for managing all API state.
    reducerPath: 'api',
    
    // A comprehensive list of tag types for caching and automatic data re-fetching.
    // These tags act as names for different pieces of data.
    tagTypes: [
        'User',         // For the logged-in user's data
        'Course',       // For general lists of courses (e.g., creator's course list)
        'CourseDetail', // For the detailed data of a single course
        'Review',       // For review data
        'CourseProgress',// For a user's progress in a course
        'DashboardAnalytics' // For instructor dashboard stats
    ],
    
    // The base query function that will be used for all API calls.
    baseQuery: fetchBaseQuery({
        baseUrl: API_V1_URL,
        credentials: 'include', // Ensures cookies and auth tokens are sent with requests
    }),

    // The endpoints object starts empty. It will be populated by other files.
    endpoints: builder => ({}),
});