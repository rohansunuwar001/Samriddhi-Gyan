import React from 'react';
import { useGetCourseAnalyticsQuery } from '@/features/api/courseApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

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
    </div>
  );
};

export default CourseAnalytics;
