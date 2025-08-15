// file: src/features/api/apiSlice.js

import { BASE_URL } from '@/app/constant';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


export const apiSlice = createApi({
    reducerPath: 'api',
    // --- CHANGE: Added a tag type for the new analytics endpoint ---
    tagTypes: [
        'User', 'Course', 'Section', 'Lecture', 'Wishlist',
        'Cart', 'Order', 'Purchase', 'AdminData', 'Instructor',
        'Notification', 'CourseAnalytics','AdminStats' // <-- NEW TAG
    ],

    // --- CHANGE: Simplified baseQuery ---
    // This is a much more standard and reliable way to handle authentication.
    // It relies on the browser to automatically send the secure httpOnly cookie.
    baseQuery: fetchBaseQuery({
        baseUrl: `${BASE_URL}/api/v1`,
        // This is the key that tells the browser to send cookies with requests.
        credentials: 'include', 
    }),

    // Endpoints are injected by other files.
    endpoints: builder => ({}),
});