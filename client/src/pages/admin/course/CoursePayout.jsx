import { useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery } from '@/features/api/courseApi';

const CoursePayout = () => {
  const { data, isLoading, isError } = useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery();

  if (isLoading) return <div>Loading paid course payouts...</div>;
  if (isError) return <div className="text-red-500">Failed to load paid course payouts.</div>;

  const courses = data?.courses || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Paid Courses & Purchases</h2>
      {courses.length === 0 ? (
        <div>No paid courses found .</div>
      ) : (
        courses.map(course => (
          <div key={course.courseId} className="mb-10">
            <h3 className="text-lg font-semibold mb-2">{course.courseTitle}</h3>
            <div className="mb-4">Price: <span className="font-medium">{course.price}</span></div>
            <table className="min-w-full border mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">User Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Amount</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {course.payments && course.payments.length > 0 ? (
                  course.payments.map((payment, idx) => (
                    <tr key={idx}>
                      <td className="border px-4 py-2">{payment.user?.name}</td>
                      <td className="border px-4 py-2">{payment.user?.email}</td>
                      <td className="border px-4 py-2">{payment.amount}</td>
                      <td className="border px-4 py-2">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="border px-4 py-2">
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          onClick={() => alert(`Update payment for ${payment.user?.name}`)}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border px-4 py-2 text-center" colSpan={5}>No purchases yet.</td>
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
