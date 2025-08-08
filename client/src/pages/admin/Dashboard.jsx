import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    LineChart,
    Line
} from "recharts";
import { useGetCreatorDashboardAnalyticsQuery } from "@/features/api/instructorApi"; // A NEW API slice is needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, Star, BookOpen } from "lucide-react";

// --- Skeleton Component for a better loading state ---
const DashboardSkeleton = () => (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
             <Card key={i}><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-3/4" /></CardContent></Card>
        ))}
        <Card className="col-span-1 sm:col-span-2 lg:col-span-4"><CardContent className="pt-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
    </div>
);


const Dashboard = () => {
    // IMPORTANT: This requires a new endpoint in a new 'instructorApi' slice
    // that fetches aggregated data from the backend.
    const { data: analyticsData, isLoading, isError } = useGetCreatorDashboardAnalyticsQuery();
    console.log("Analytics Data:", analyticsData);

    if (isLoading) return <DashboardSkeleton />;
    if (isError) return <div className="text-red-500 text-center py-10">Failed to load dashboard analytics.</div>;

    const stats = analyticsData?.stats || {};
    const monthlySales = analyticsData?.monthlySales || [];

    // --- Key Metrics ---
    const totalRevenue = stats.totalRevenue || 0;
    const totalStudents = stats.totalStudents || 0;
    const totalCourses = stats.totalCourses || 0;
    const averageRating = stats.averageRating || 0;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Your Instructor Dashboard</h1>
            
            {/* --- Key Metric Cards --- */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">Rs{totalRevenue.toLocaleString()}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Students</CardTitle><Users className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Published Courses</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{totalCourses}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Average Rating</CardTitle><Star className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{averageRating.toFixed(1)}</div></CardContent></Card>
            </div>
            
            {/* --- Sales Chart Card --- */}
            <Card className="col-span-1 sm:col-span-2 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Sales Over Last 6 Months</CardTitle>
                    <CardDescription>
                        An overview of your revenue from course sales.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs${value / 1000}k`}/>
                            <Tooltip formatter={(value) => [`Rs${value.toLocaleString()}`]}/>
                            <Legend />
                            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;