// In features/api/userApi.js (or your equivalent)
// ...

import { apiSlice } from "./apiSlice";

export const userApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // ... your other mutations and queries like useLoadUserQuery ...
        
        // --- ADD THIS NEW QUERY ---
        getInstructorProfile: builder.query({
            query: (instructorId) => `/user/instructor-profile/${instructorId}`,
            providesTags: (result, error, id) => [{ type: 'InstructorProfile', id }],
        }),
        getNearbyTutors: builder.query({
            query: ({ lat, lon }) => `/user/nearby-tutors?lat=${lat}&lon=${lon}`,
        }),
        getNearbyPeers: builder.query({
            query: ({ lat, lon }) => `/user/nearby-peers?lat=${lat}&lon=${lon}`,
        }),
    }),
});

// --- EXPORT THE HOOKS ---
export const { 
    useGetInstructorProfileQuery,
    useGetNearbyTutorsQuery,
    useGetNearbyPeersQuery,
} = userApi;