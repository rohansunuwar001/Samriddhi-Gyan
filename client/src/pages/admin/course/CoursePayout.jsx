import { useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery } from "@/features/api/adminDataApi";


const CoursePayout = () => {
  const { data, isLoading, isError } =
    useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery();

  if (isLoading) return <div>Loading paid course payouts...</div>;
  if (isError)
    return (
      <div className="text-red-500">Failed to load paid course payouts.</div>
    );

  const courses = data?.courses || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Paid Courses & Purchases</h2>
      {courses.length === 0 ? (
        <div>No paid courses found.</div>
      ) : (
        courses.map((course) => (
          <div
            key={course.courseId}
            className="mb-10 border rounded-lg p-5 shadow bg-white"
          >
            <div className="flex items-center gap-4 mb-2">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.courseTitle}
                  className="w-24 h-16 object-cover rounded"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{course.courseTitle}</h3>
                <div className="text-sm text-gray-600">
                  <span className="mr-4">
                    Category:{" "}
                    <span className="font-medium">{course.category}</span>
                  </span>
                  <span>
                    Level: <span className="font-medium">{course.level}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Enrolled Students:{" "}
                  <span className="font-bold">{course.enrolledCount}</span>
                </div>
              </div>
            </div>

            {/* Course Purchases Table */}
            <h4 className="font-semibold mt-4 mb-2">Payments</h4>
            <table className="min-w-full border mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">User Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Purchased At</th>
                  <th className="border px-4 py-2">Courses</th>
                </tr>
              </thead>
              <tbody>
                {course.coursePurchases && course.coursePurchases.length > 0 ? (
                  course.coursePurchases.map((purchase, idx) => (
                    <tr key={idx}>
                      <td className="border px-4 py-2">
                        {purchase.user?.name || "N/A"}
                      </td>
                      <td className="border px-4 py-2">
                        {purchase.user?.email || "N/A"}
                      </td>
                      <td className="border px-4 py-2">
                        {purchase.status || "N/A"}
                      </td>
                      <td className="border px-4 py-2">
                        {purchase.purchasedAt
                          ? new Date(purchase.purchasedAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="border px-4 py-2">
                        {purchase.courses && purchase.courses.length > 0
                          ? purchase.courses.map((c, i) => (
                              <span key={i} className="inline-block mr-2">
                                {c.courseId?.title || c.courseId || "N/A"}
                              </span>
                            ))
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border px-4 py-2 text-center" colSpan={5}>
                      No course purchases yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default CoursePayout;
