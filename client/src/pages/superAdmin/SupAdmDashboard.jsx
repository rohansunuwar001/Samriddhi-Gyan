// src/pages/admin/AdminDashboard.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { useGetDashboardStatsQuery } from "@/features/api/adminApi";
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';

// --- UI & CHARTING LIBRARIES ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

// --- ICONS (from lucide-react) ---
import { Users, BookOpen, AlertCircle, DollarSign, RefreshCw, UserCheck } from 'lucide-react';

// ====================================================================
// 1. STYLISH, REUSABLE SUB-COMPONENTS (Inspired by the image)
// ====================================================================

/**
 * MainRevenueChart: The large, central line chart for revenue.
 */
const MainRevenueChart = ({ currentWeekData, previousWeekData }) => (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div>
                    <p className="text-sm text-muted-foreground">Current week</p>
                    <p className="text-2xl font-bold text-red-500">
                        <CountUp prefix="Rs" end={currentWeekData.reduce((acc, item) => acc + item.dailyRevenue, 0)} duration={2} separator="," />
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Previous week</p>
                    <p className="text-2xl font-bold text-gray-400">
                        {/* Placeholder value */}
                        <CountUp prefix="Rs" end={41352} duration={2} separator="," />
                    </p>
                </div>
            </div>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentWeekData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `RsRs{value/1000}k`} />
                        <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} formatter={(value) => [new Intl.NumberFormat('en-US').format(value), 'Revenue']} />
                        <Line type="monotone" dataKey="previous" stroke="#a0aec0" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Previous Week" />
                        <Line type="monotone" dataKey="dailyRevenue" stroke="#ef4444" strokeWidth={3} dot={false} fill="url(#colorRevenue)" name="Current Week" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
);
MainRevenueChart.propTypes = { currentWeekData: PropTypes.array, previousWeekData: PropTypes.array };

/**
 * RadialProgressCard: A card with a circular progress bar.
 */
const RadialProgressCard = ({ title, percentage, color, value, icon: Icon }) => {
    const data = [{ name: 'percentage', value: percentage, fill: color }];
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><RefreshCw className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent className="flex items-center justify-around">
                <div className="relative h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="70%" outerRadius="90%" data={data} startAngle={90} endAngle={-270} barSize={10}>
                            <RadialBar background clockWise dataKey="value" cornerRadius={5} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold" style={{ color }}>{percentage}%</span>
                    </div>
                </div>
                <div className="text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-secondary rounded-full">
                           <Icon className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                </div>
            </CardContent>
        </Card>
    )
};
RadialProgressCard.propTypes = { title: PropTypes.string, percentage: PropTypes.number, color: PropTypes.string, value: PropTypes.string, icon: PropTypes.elementType };

/**
 * RecentSalesTable: The clean, modern table from the reference.
 */
const RecentSalesTable = ({ transactions }) => (
    <Card className="col-span-1 lg:col-span-3 shadow-sm">
        <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow><TableHead>Customer</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map(tx => (
                        <TableRow key={tx._id}>
                            <TableCell><div className="font-medium">{tx.userId?.name || 'Guest User'}</div></TableCell>
                            <TableCell><span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">{tx.paymentMethod}</span></TableCell>
                            <TableCell className="text-right font-semibold">Rs{tx.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);
RecentSalesTable.propTypes = { transactions: PropTypes.array };

// ====================================================================
// 2. LOADING & ERROR STATES
// ====================================================================

const DashboardSkeleton = () => (
    <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] lg:col-span-2" />
            <div className="space-y-6"><Skeleton className="h-[190px]" /><Skeleton className="h-[190px]" /></div>
        </div>
        <Skeleton className="h-64" />
    </div>
);
const ErrorState = ({ error }) => (<div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Dashboard</AlertTitle><AlertDescription>{error?.data?.message || "An unexpected error occurred."}</AlertDescription></Alert></div>);
ErrorState.propTypes = { error: PropTypes.object };

// ====================================================================
// 3. MAIN DASHBOARD COMPONENT
// ====================================================================

const SupAdmDashboard = () => {
    const { data, isLoading, isError, error } = useGetDashboardStatsQuery();

    if (isLoading) return <DashboardSkeleton />;
    if (isError) return <ErrorState error={error} />;
    if (!data?.analytics) return <div className="p-8">No data to display.</div>;

    const { stats, activity, charts } = data.analytics;

    // --- Prepare Chart Data (including mock previous week data) ---
    const chartData = charts.weeklyRevenue.map(item => ({
        ...item,
        date: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
        previous: Math.floor(item.dailyRevenue * (0.6 + Math.random() * 0.3)), // Mock previous week data
    }));

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Main Revenue Chart --- */}
                <MainRevenueChart currentWeekData={chartData} />

                {/* --- Side Cards --- */}
                <div className="space-y-6">
                    <RadialProgressCard 
                        title="New Users This Week" 
                        percentage={76} // Placeholder - requires backend logic
                        color="#ef4444" 
                        value={activity.recentUsers.length.toString()}
                        icon={Users}
                    />
                     <RadialProgressCard 
                        title="Instructor Conversion" 
                        percentage={Math.round((stats.totalInstructors / stats.totalUsers) * 100)}
                        color="#22c55e" 
                        value={`${stats.totalInstructors}`}
                        icon={UserCheck}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* --- Recent Sales Table --- */}
                <RecentSalesTable transactions={activity.recentTransactions} />
            </div>
        </div>
    );
};

export default SupAdmDashboard;