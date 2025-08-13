import { useGetCourseAnalyticsQuery } from '@/features/api/adminDataApi';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EFF', '#FF6F91'];

const CourseAnalytics = () => {
  const { data, isLoading, isError } = useGetCourseAnalyticsQuery();

  if (isLoading) return <div>Loading analytics...</div>;
  if (isError) return <div className="text-red-500">Failed to load analytics.</div>;

  const analytics = data?.analytics || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Course Analytics</h2>
      
      <div className="flex flex-wrap gap-8 mb-8">
        {/* Bar Chart for Total Revenue */}
        <div style={{ width: 400, height: 300 }}>
          <h3 className="font-semibold mb-2">Total Revenue by Course</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics}>
              <XAxis dataKey="courseTitle" />
              <YAxis />
              <Tooltip formatter={(value) => `Rs${value}`} />
              <Legend />
              <Bar dataKey="totalRevenue" fill="#0088FE" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart for Purchases */}
        <div style={{ width: 400, height: 300 }}>
          <h3 className="font-semibold mb-2">Purchases Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics}
                dataKey="purchaseCount"
                nameKey="courseTitle"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {analytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Summary Table */}
      <table className="min-w-full border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Course Title</th>
            <th className="border px-4 py-2">Enrolled Students</th>
            <th className="border px-4 py-2">Purchases</th>
            <th className="border px-4 py-2">Total Revenue</th>
            <th className="border px-4 py-2">Avg. Rating</th>
          </tr>
        </thead>
        <tbody>
          {analytics.map(course => (
            <tr key={course.courseId}>
              <td className="border px-4 py-2">{course.courseTitle}</td>
              <td className="border px-4 py-2">{course.enrolledCount}</td>
              <td className="border px-4 py-2">{course.purchaseCount}</td>
              {/* ✅ FIXED LINE: Use the pre-calculated totalRevenue field from the API */}
              <td className="border px-4 py-2">Rs{course.totalRevenue}</td>
              <td className="border px-4 py-2">{course.avgRating ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Course Purchases Details Section (This section was already correct) */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Course Purchases Details</h3>
        {analytics.map(course => (
            <div key={course.courseId} className="mb-8 p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-2">{course.courseTitle}</h4>
              <table className="min-w-full border mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2">User Name</th>
                    <th className="border px-4 py-2">Email</th>
                    <th className="border px-4 py-2">Status</th>
                    <th className="border px-4 py-2">Purchased At</th>
                    <th className="border px-4 py-2">Courses Purchased in this Order</th>
                  </tr>
                </thead>
                <tbody>
                  {course.coursePurchases && course.coursePurchases.length > 0 ? (
                    course.coursePurchases.map((purchase, idx) => (
                      <tr key={purchase.purchaseId || idx}>
                        <td className="border px-4 py-2">{purchase.user?.name || "N/A"}</td>
                        <td className="border px-4 py-2">{purchase.user?.email || "N/A"}</td>
                        <td className="border px-4 py-2">{purchase.status || "N/A"}</td>
                        <td className="border px-4 py-2">{purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : "N/A"}</td>
                        <td className="border px-4 py-2">
                          {purchase.courses && purchase.courses.length > 0
                            ? purchase.courses.map((c, i) => (
                                <span key={i} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                                  {c.courseId?.title || c.courseId || "N/A"} (Rs{c.priceAtPurchase || 0})
                                </span>
                              ))
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border px-4 py-2 text-center" colSpan={5}>No purchases found for this course.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CourseAnalytics;