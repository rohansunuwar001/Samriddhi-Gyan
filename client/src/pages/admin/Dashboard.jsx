


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPurchasedCoursesQuery } from "@/features/api/purchaseApi";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const Dashboard = () => {

  const { data, isError, isLoading } = useGetPurchasedCoursesQuery();

  // Handle loading and error states first
  if (isLoading) return <h1>Loading...</h1>
  if (isError) return <h1 className="text-red-500">Failed to get purchased course data.</h1>


  const purchasedCourse = data?.purchasedCourse || [];


  const validCourses = purchasedCourse.filter(course => course && course.courseId);

  const courseData = validCourses.map((course) => ({
    name: course.courseId.courseTitle,
    price: course.courseId.coursePrice
  }));

  const totalRevenue = validCourses.reduce((acc, element) => acc + (element.amount || 0), 0);
  
  const totalSales = validCourses.length;

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Sales Card */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{totalSales}</p>
        </CardContent>
      </Card>

      {/* Total Revenue Card */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Course Prices Chart Card */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-1 sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">
            Course Sales Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={courseData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={100} // Give more space for angled labels
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={value => [`Rs${value}`, "Price"]}
                labelStyle={{ color: '#333' }}
                itemStyle={{ color: '#4a90e2' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line
                type="monotone"
                dataKey="price"
                stroke="#4a90e2"
                strokeWidth={3}
                dot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;