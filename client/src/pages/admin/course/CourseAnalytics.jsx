// src/pages/instructor/CourseAnalytics.jsx

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetCourseAnalyticsQuery } from "@/features/api/instructorApi";

// --- UI & CHARTING LIBRARIES ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CountUp from "react-countup";

// --- ICONS ---
import { DollarSign, Users, BookOpen, AlertCircle } from "lucide-react";

// --- Reusable Components & Constants ---

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28EFF",
  "#FF6F91",
];

const StatCard = ({ title, value, icon: Icon, prefix = "" }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        <CountUp
          start={0}
          end={value}
          duration={2}
          separator=","
          prefix={prefix}
        />
      </div>
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-96" />
      <Skeleton className="h-96" />
    </div>
    <Skeleton className="h-64" />
  </div>
);

// --- Main Analytics Component ---

const CourseAnalytics = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { data, isLoading, isError, error } = useGetCourseAnalyticsQuery(
    undefined,
    { skip: !isAuthenticated }
  );

  // --- ⭐ THE FIX IS HERE ⭐ ---
  // The useMemo hook is made "crash-proof". It now always returns a valid object,
  // even on the initial render when `data` is undefined.
  const { barChartData, pieChartData } = useMemo(() => {
    const analytics = data?.analytics || []; // Use optional chaining and a default empty array

    // This check now correctly handles both the initial loading state and the "no data" case.
    if (analytics.length === 0) {
      return { barChartData: [], pieChartData: [] };
    }

    // The original, efficient logic only runs when analytics data is present.
    const revenueSorted = [...analytics].sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
    const topRevenueCourses = revenueSorted.slice(0, 10);
    const otherRevenue = revenueSorted
      .slice(10)
      .reduce((acc, course) => acc + course.totalRevenue, 0);
    const processedBarData = [...topRevenueCourses];
    if (otherRevenue > 0) {
      processedBarData.push({
        courseTitle: "Other",
        totalRevenue: otherRevenue,
      });
    }

    const purchaseSorted = [...analytics].sort(
      (a, b) => b.purchaseCount - a.purchaseCount
    );
    const topPurchaseCourses = purchaseSorted.slice(0, 5);
    const otherPurchases = purchaseSorted
      .slice(5)
      .reduce((acc, course) => acc + course.purchaseCount, 0);
    const processedPieData = [...topPurchaseCourses];
    if (otherPurchases > 0) {
      processedPieData.push({
        courseTitle: "Other",
        purchaseCount: otherPurchases,
      });
    }

    return { barChartData: processedBarData, pieChartData: processedPieData };
  }, [data?.analytics]); // Dependency on the nested data property

  // --- Render Logic (State Handling) ---
  if (!isAuthenticated)
    return (
      <div className="p-6 text-center text-muted-foreground">
        Authenticating session...
      </div>
    );
  if (isLoading) return <DashboardSkeleton />;
  if (isError)
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.data?.message || "Failed to load analytics."}
          </AlertDescription>
        </Alert>
      </div>
    );
  if (!data?.analytics || data.analytics.length === 0)
    return (
      <div className="p-8 text-center text-muted-foreground">
        {data?.message || "Create a course to see analytics."}
      </div>
    );

  // Summary calculations are safe here because the checks above have already passed.
  const summary = data.analytics.reduce(
    (acc, course) => {
      acc.totalRevenue += course.totalRevenue;
      acc.totalStudents += course.enrolledCount;
      return acc;
    },
    { totalRevenue: 0, totalStudents: 0 }
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Your Analytics</h2>
        <p className="text-muted-foreground">
          An overview of your performance as an instructor.
        </p>
      </header>

      {/* --- Summary Stat Cards --- */}
      {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={summary.totalRevenue}
          icon={DollarSign}
          prefix="$"
        />
        <StatCard
          title="Total Students"
          value={summary.totalStudents}
          icon={Users}
        />
        <StatCard
          title="Total Courses"
          value={data.analytics.length}
          icon={BookOpen}
        />
      </div> */}

      {/* --- Charts Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Courses by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ left: 10, right: 30 }}
              >
                <XAxis type="number" tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis
                  type="category"
                  dataKey="courseTitle"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]}
                />
                <Bar
                  dataKey="totalRevenue"
                  fill="#8884d8"
                  name="Revenue"
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Courses by Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="purchaseCount"
                  nameKey="courseTitle"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {pieChartData.map((e, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} Sales`, "Purchases"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* --- Tabbed Table View for Detailed Data --- */}
      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">All Courses Summary</TabsTrigger>
          <TabsTrigger value="purchases">Detailed Purchases</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.analytics.map((course) => (
                    <TableRow key={course.courseId}>
                      <TableCell>
                        <div className="font-medium">{course.courseTitle}</div>
                      </TableCell>
                      <TableCell>{course.enrolledCount}</TableCell>
                      <TableCell>{course.purchaseCount}</TableCell>
                      <TableCell>
                        ${course.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {course.avgRating ? `${course.avgRating} ★` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="purchases">
          <div className="space-y-6">
            {data.analytics.map((course) => (
              <Card key={course.courseId}>
                <CardHeader>
                  <CardTitle>{course.courseTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Price Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {course.coursePurchases &&
                      course.coursePurchases.length > 0 ? (
                        course.coursePurchases.map((p, i) => (
                          <TableRow key={p.purchaseId || i}>
                            <TableCell>{p.user?.name || "N/A"}</TableCell>
                            <TableCell>{p.user?.email || "N/A"}</TableCell>
                            <TableCell>
                              {new Date(p.purchasedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              $
                              {p.courses
                                .find(
                                  (c) =>
                                    c.courseId?._id.toString() ===
                                    course.courseId.toString()
                                )
                                ?.priceAtPurchase.toLocaleString() || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            No purchases for this course yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseAnalytics;
