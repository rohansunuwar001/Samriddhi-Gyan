// file: src/features/api/apiSlice.js

import { BASE_URL } from '@/app/constant';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/v1`,
    
    // prepareHeaders is the function that modifies the request headers
    // before any API call is sent.
    prepareHeaders: (headers) => {
        // Get the token from localStorage
        const token = localStorage.getItem('authToken');

        // If the token exists, add it to the 'Authorization' header.
        // The backend's `isAuthenticated` middleware expects this.
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        
        return headers;
    },
});

export const apiSlice = createApi({
    reducerPath: 'api',
    tagTypes: [
        'User', 'Course', 'Section', 'Lecture', 'Wishlist',
        'Cart', 'Order', 'Purchase', 'AdminData', 'Instructor',
        'Notification', 'CourseAnalytics','AdminStats'
    ],
    baseQuery,
    endpoints: builder => ({}),
});