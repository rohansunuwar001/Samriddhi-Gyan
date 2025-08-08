import { BASE_URL } from "@/app/constant";
import { apiSlice } from './apiSlice'; // Import the central apiSlice

// The base URL should be the root of the API for maximum flexibility
const API_V1_URL = `${BASE_URL}/api/v1`;

export const courseApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // ===== Course CRUD & Query Endpoints (Updated) =====

        createCourse: builder.mutation({
            // URL now points to a RESTful '/courses' endpoint
            query: (courseData) => ({ // Expects { title, category, price: { original, current } }
                url: '/course/create',
                method: 'POST',
                body: courseData,
            }),
            // Invalidates the list of courses, forcing the creator's course list to refetch
            invalidatesTags: [{ type: 'Course', id: 'LIST' }],
        }),

        editCourse: builder.mutation({
            query: ({ courseId, formData }) => ({
                url: `/course/${courseId}`,
                method: 'PUT',
                body: formData, // FormData for thumbnail support
            }),
            // Refreshes both the general course list and the specific detail page
            invalidatesTags: (result, error, { courseId }) => [
                { type: 'Course', id: 'LIST' },
                { type: 'CourseDetail', id: courseId }
            ],
        }),
        
        getCreatorCourse: builder.query({
            query: () => '/course/creator', // Use a more descriptive, updated route
            providesTags: [{ type: 'Course', id: 'LIST' }], // This "provides" the list
        }),
        
        getCourseById: builder.query({
            query: (courseId) => `/course/${courseId}`,
            // Provides a specific tag for this course, allows targeted invalidation
            providesTags: (result, error, courseId) => [{ type: 'CourseDetail', id: courseId }],
        }),
        
        getPublishedCourse: builder.query({
            query: () => "/course/published", // A clearer endpoint name is better practice
            providesTags: [{ type: 'Course', id: 'PUBLISHED_LIST'}]
        }),

        getRecommendedCourse: builder.query({
            query: () => "/course/recommendations",
            providesTags: [{ type: 'Course', id: 'RECOMMENDED_LIST'}]
        }),

        getSearchCourse: builder.query({
            query: ({ searchQuery, categories, sortByPrice }) => {
                const params = new URLSearchParams();
                if(searchQuery) params.append('query', searchQuery);
                if(sortByPrice) params.append('sortByPrice', sortByPrice);
                if(categories && categories.length > 0) {
                    categories.forEach(cat => params.append('categories', cat));
                }
                return `/search/course?${params.toString()}`;
            }
        }),
        
        publishCourse: builder.mutation({
            query: ({ courseId, isPublished }) => ({
                url: `/course/${courseId}/publish`, // <-- plural 'courses'
                method: 'PATCH',
                body: { isPublished },
            }),
            invalidatesTags: (result, error, { courseId }) => [
                { type: 'Course', id: 'LIST' },
                { type: 'CourseDetail', id: courseId }
            ],
        }),


        // ===== Section CRUD Endpoints (NEW) =====
        
        createSection: builder.mutation({
            query: ({ courseId, title }) => ({
                url: `/courses/${courseId}/sections`,
                method: 'POST',
                body: { title },
            }),
            // Any change to a section requires the whole course detail page to refetch
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
        }),

        updateSection: builder.mutation({
            query: ({ sectionId, title, courseId }) => ({
                url: `/sections/${sectionId}`,
                method: 'PUT',
                body: { title },
            }),
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
        }),
        
        deleteSection: builder.mutation({
            query: ({ sectionId, courseId }) => ({
                url: `/sections/${sectionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
        }),


        // ===== Lecture CRUD Endpoints (UPDATED for new architecture) =====

        createLecture: builder.mutation({
            query: ({ sectionId, title, courseId }) => ({
                url: `/sections/${sectionId}/lectures`,
                method: 'POST',
                body: { title },
            }),
            // Any lecture change refreshes the whole course page
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
        }),
        
        // This endpoint is no longer needed, lectures are fetched with the course
        // getCourseLecture: builder.query(...) // REMOVED
        
        updateLecture: builder.mutation({
            query: ({ lectureId, formData, courseId }) => ({
                url: `/lectures/${lectureId}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
        }),

        deleteLecture: builder.mutation({
            query: ({ lectureId, courseId }) => ({
                url: `/lectures/${lectureId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseDetail', id: courseId }],
        }),
        
        getLectureById: builder.query({
            query: (lectureId) => `/lectures/${lectureId}`,
            // Lectures don't really need tags as they are almost always fetched as part of a course.
        }),
        
    }),
    overrideExisting: false,
});

// Export all hooks, keeping your original names and adding the new ones
export const {
    useCreateCourseMutation,
    useEditCourseMutation,
    useGetCreatorCourseQuery,
    useGetCourseByIdQuery,
    useGetPublishedCourseQuery,
    useGetRecommendedCourseQuery,
    useGetSearchCourseQuery,
    usePublishCourseMutation,

    // Add new section hooks
    useCreateSectionMutation,
    useUpdateSectionMutation,
    useDeleteSectionMutation,
    
    // Updated lecture hooks
    useCreateLectureMutation,
    useUpdateLectureMutation,
    useDeleteLectureMutation,
    useGetLectureByIdQuery,
    
    // removeLecture is now deleteLecture for consistency
    // useRemoveLectureMutation,
} = courseApi;