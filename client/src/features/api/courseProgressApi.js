import { apiSlice } from './apiSlice'; // Import the central apiSlice

export const courseProgressApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        /**
         * @desc Fetches the current user's progress for a specific course.
         */
        getCourseProgress: builder.query({
            query: (courseId) => `/progress/${courseId}`,
            // Provides a tag specific to this course's progress
            providesTags: (result, error, courseId) => [{ type: 'CourseProgress', id: courseId }],
        }),
        
        /**
         * @desc Marks a specific lecture as viewed/completed.
         */
        updateLectureProgress: builder.mutation({
            query: ({ courseId, lectureId }) => ({
                url: `/progress/${courseId}/lecture/${lectureId}/view`,
                method: 'POST',
            }),
            // On success, invalidates the progress for this course, forcing a refetch
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseProgress', id: courseId }],
        }),

        /**
         * @desc Marks the entire course as completed by the user.
         */
        completeCourse: builder.mutation({
            query: (courseId) => ({
                url: `/progress/${courseId}/complete`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, courseId) => [{ type: 'CourseProgress', id: courseId }],
        }),

        /**
         * @desc Unmarks the course as completed (marks it as incomplete).
         */
        inCompleteCourse: builder.mutation({
            query: (courseId) => ({
                url: `/progress/${courseId}/incomplete`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, courseId) => [{ type: 'CourseProgress', id: courseId }],
        }),
    }),
});

// Export the auto-generated hooks.
export const {
    useGetCourseProgressQuery,
    useUpdateLectureProgressMutation,
    useCompleteCourseMutation,
    useInCompleteCourseMutation
} = courseProgressApi;