import { useGetCoursesWithEnrolledStudentsAndReviewsQuery } from "@/features/api/adminDataApi";


const CourseReviews = () => {
  const { data, isLoading, isError } = useGetCoursesWithEnrolledStudentsAndReviewsQuery();

  if (isLoading) return <div className="p-6">Loading reviews...</div>;
  if (isError) return <div className="p-6 text-red-500">Failed to load course reviews.</div>;

  const courses = data?.courses || [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Courses & Reviews</h2>
      {courses.length === 0 ? (
        <div className="text-gray-500">No courses found.</div>
      ) : (
        courses.map((course) => (
          <div key={course.courseId} className="mb-10"> 
            <h3 className="text-lg font-semibold mb-2">{course.courseTitle}</h3>
            <table className="min-w-full border mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">User Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Rating</th>
                  <th className="border px-4 py-2">Comment</th>
                  <th className="border px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {course.reviews && course.reviews.length > 0 ? (
                  course.reviews.map((review) => (
                    <tr key={review.reviewId}>
                      <td className="border px-4 py-2">{review.user?.name}</td>
                      <td className="border px-4 py-2">{review.user?.email}</td>
                      <td className="border px-4 py-2">{review.rating}</td>
                      <td className="border px-4 py-2">{review.comment}</td>
                      <td className="border px-4 py-2">
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          onClick={() => alert(`Update review for ${review.user?.name}`)}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border px-4 py-2 text-center" colSpan={5}>No reviews yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default CourseReviews;
