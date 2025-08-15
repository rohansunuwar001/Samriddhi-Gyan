// src/pages/instructor/Dashboard.jsx

import React, { useMemo } from "react";
import { useGetCourseAnalyticsQuery } from "@/features/api/instructorApi";
import CountUp from "react-countup";

// --- UI & CHARTING LIBRARIES ---
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// --- ICONS ---
import {
  Users,
  DollarSign,
  BookOpen,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

// ====================================================================
// SUB-COMPONENTS for a Clean and Reusable Structure
// ====================================================================

const StatCard = ({ title, value, icon: Icon, prefix = "" }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

const TopCoursesTable = ({ courses }) => {
  // Memoize the sorted list to prevent re-sorting on every render
  const topCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [courses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Courses</CardTitle>
        <CardDescription>
          Your top 5 courses by revenue generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCourses.map((course) => (
              <TableRow key={course.courseId}>
                <TableCell className="font-medium">
                  {course.courseTitle}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  Rs{course.totalRevenue.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// --- Polished Loading and Error States ---
const DashboardSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-96 lg:col-span-2" />
      <Skeleton className="h-96" />
    </div>
  </div>
);
const ErrorState = ({ error }) => (
  <div className="p-8">
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Dashboard</AlertTitle>
      <AlertDescription>
        {error?.data?.message || "An unexpected error occurred."}
      </AlertDescription>
    </Alert>
  </div>
);

// ====================================================================
// MAIN DASHBOARD COMPONENT
// ====================================================================

const Dashboard = () => {
  const { data, isLoading, isError, error } = useGetCourseAnalyticsQuery();

  // Memoize summary calculations for performance
  const summaryStats = useMemo(() => {
    const analytics = data?.analytics || [];
    return {
      totalRevenue: analytics.reduce(
        (sum, c) => sum + (c.totalRevenue || 0),
        0
      ),
      totalStudents: analytics.reduce(
        (sum, c) => sum + (c.enrolledCount || 0),
        0
      ),
      totalCourses: analytics.length,
      totalPurchases: analytics.reduce(
        (sum, c) => sum + (c.purchaseCount || 0),
        0
      ),
    };
  }, [data]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState error={error} />;

  const analytics = data?.analytics || [];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">
          Instructor Dashboard
        </h2>
        <p className="text-muted-foreground">
          Welcome back! Here's a summary of your performance.
        </p>
      </header>

      {/* --- Key Metric Cards --- */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={summaryStats.totalRevenue}
          icon={DollarSign}
          prefix="Rs"
        />
        <StatCard
          title="Total Students"
          value={summaryStats.totalStudents}
          icon={Users}
        />
        <StatCard
          title="Total Sales"
          value={summaryStats.totalPurchases}
          icon={ShoppingCart}
        />
        <StatCard
          title="Published Courses"
          value={summaryStats.totalCourses}
          icon={BookOpen}
        />
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Course</CardTitle>
            <CardDescription>
              Overview of revenue generated by each of your courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={analytics}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="courseTitle"
                  stroke="#888888"
                  fontSize={10}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickFormatter={(value) => `Rs${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => [
                    `Rs${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                  contentStyle={{ borderRadius: "0.5rem" }}
                />
                <Legend />
                <Bar
                  dataKey="totalRevenue"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <TopCoursesTable courses={analytics} />
      </div>
    </div>
  );
};

export default Dashboard;
