import React from 'react';
import { useGetCourseAnalyticsQuery } from '@/features/api/courseApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EFF', '#FF6F91'];

const CourseAnalytics = () => {
  const { data, isLoading, isError } = useGetCourseAnalyticsQuery();

  console.log("Course Analytics Data:", data);



  if (isLoading) return <div>Loading analytics...</div>;
  if (isError) return <div className="text-red-500">Failed to load analytics.</div>;

  const analytics = data?.analytics || [];

  // Calculate overall totals
  const totalRevenueAll = analytics.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const totalPurchasesAll = analytics.reduce((sum, c) => sum + (c.purchaseCount || 0), 0);
  const totalEnrolledAll = analytics.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Course Analytics</h2>
      {/* <div className="flex gap-8 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
          <div className="text-lg font-semibold text-blue-700">Total Revenue</div>
          <div className="text-2xl font-bold">Rs{totalRevenueAll}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex-1">
          <div className="text-lg font-semibold text-green-700">Total Purchases</div>
          <div className="text-2xl font-bold">{totalPurchasesAll}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1">
          <div className="text-lg font-semibold text-yellow-700">Total Enrolled Students</div>
          <div className="text-2xl font-bold">{totalEnrolledAll}</div>
        </div>
      </div> */}
      <div className="flex flex-wrap gap-8 mb-8">
        {/* Bar Chart for Total Revenue */}
        <div style={{ width: 400, height: 300 }}>
          <h3 className="font-semibold mb-2">Total Revenue by Course</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics}>
              <XAxis dataKey="courseTitle" />
              <YAxis />
              <Tooltip />
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
      {/* Table */}
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
              <td className="border px-4 py-2">{course.totalRevenue}</td>
              <td className="border px-4 py-2">{course.avgRating ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Course Purchases Section */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Course Purchases Details</h3>
        {analytics.map(course => {
          // Calculate total priceAtPurchase for this course
          const totalPriceAtPurchase = (course.coursePurchases || []).reduce(
            (sum, purchase) =>
              sum +
              (Array.isArray(purchase.courses)
                ? purchase.courses.reduce(
                    (s, c) => s + (c.priceAtPurchase || 0),
                    0
                  )
                : 0),
            0
          );
          return (
            <div key={course.courseId} className="mb-8">
              <h4 className="font-semibold mb-2">{course.courseTitle}</h4>
              <div className="mb-2 text-blue-700 font-medium">
                Total Purchase Amount: Rs{totalPriceAtPurchase}
              </div>
              <table className="min-w-full border mb-4">
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
                      <tr key={purchase.purchaseId || idx}>
                        <td className="border px-4 py-2">{purchase.user?.name || "N/A"}</td>
                        <td className="border px-4 py-2">{purchase.user?.email || "N/A"}</td>
                        <td className="border px-4 py-2">{purchase.status || "N/A"}</td>
                        <td className="border px-4 py-2">{purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : "N/A"}</td>
                        <td className="border px-4 py-2">
                          {purchase.courses && purchase.courses.length > 0
                            ? purchase.courses.map((c, i) => (
                                <span key={i} className="inline-block mr-2">
                                  {c.courseId?.title || c.courseId || "N/A"} (Rs{c.priceAtPurchase || 0})
                                </span>
                              ))
                            : "N/A"}
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
          );
        })}
      </div>
    </div>
  );
};

export default CourseAnalytics;
