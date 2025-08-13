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
    }),
});

// --- EXPORT THE NEW HOOK ---
export const { useGetInstructorProfileQuery, ...otherHooks } = userApi;