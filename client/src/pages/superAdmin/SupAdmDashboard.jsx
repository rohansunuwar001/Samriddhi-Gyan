// src/pages/superAdmin/SupAdmDashboard.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { useGetDashboardStatsQuery } from "@/features/api/adminApi";
import CountUp from 'react-countup';

// --- UI & CHARTING LIBRARIES ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

// --- ICONS (from lucide-react) ---
import { Users, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';

// ====================================================================
// 1. STYLISH, REUSABLE SUB-COMPONENTS
// ====================================================================

/**
 * MainRevenueChart: The large, central line chart for revenue.
 */
const MainRevenueChart = ({ chartData = [], currentTotal = 0, previousTotal = 0, onRefresh, isRefreshing }) => (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue</CardTitle>
            <RefreshCw 
                onClick={onRefresh} 
                className={`h-4 w-4 text-muted-foreground cursor-pointer transition-transform duration-500 ${isRefreshing ? 'animate-spin text-primary' : 'hover:text-foreground'}`} 
                title="Refresh revenue data"
            />
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div>
                    <p className="text-base text-muted-foreground">Current week</p>
                    <p className="text-3xl font-semibold text-red-500">
                        <CountUp prefix="Rs " end={currentTotal} duration={1.5} separator="," />
                    </p>
                </div>
                <div>
                    <p className="text-base text-muted-foreground">Previous week</p>
                    <p className="text-3xl font-semibold text-gray-400">
                        <CountUp prefix="Rs " end={previousTotal} duration={1.5} separator="," />
                    </p>
                </div>
            </div>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `Rs ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: '#fff' }} 
                            formatter={(value, name) => [`Rs ${new Intl.NumberFormat('en-US').format(value)}`, name]} 
                        />
                        <Line type="monotone" dataKey="previous" stroke="#a0aec0" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} activeDot={{ r: 5 }} name="Previous Week" />
                        <Line type="monotone" dataKey="dailyRevenue" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} fill="url(#colorRevenue)" name="Current Week" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
);
MainRevenueChart.propTypes = { 
    chartData: PropTypes.array, 
    currentTotal: PropTypes.number, 
    previousTotal: PropTypes.number, 
    onRefresh: PropTypes.func, 
    isRefreshing: PropTypes.bool 
};

/**
 * RadialProgressCard: A card with a circular progress bar.
 */
const RadialProgressCard = ({ title, percentage = 0, color, value, icon: Icon, onRefresh, isRefreshing }) => {
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
    const data = [{ name: 'percentage', value: clampedPercentage, fill: color }];
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-normal">{title}</CardTitle>
                <RefreshCw 
                    onClick={onRefresh} 
                    className={`h-4 w-4 text-muted-foreground cursor-pointer transition-transform duration-500 ${isRefreshing ? 'animate-spin text-primary' : 'hover:text-foreground'}`} 
                    title="Refresh data"
                />
            </CardHeader>
            <CardContent className="flex items-center justify-around">
                <div className="relative h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="70%" outerRadius="90%" data={data} startAngle={90} endAngle={-270} barSize={10}>
                            <RadialBar background clockWise dataKey="value" cornerRadius={5} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-semibold" style={{ color }}>{clampedPercentage}%</span>
                    </div>
                </div>
                <div className="text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-secondary rounded-full">
                           <Icon className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold">{value}</p>
                    <p className="text-base text-muted-foreground">Total</p>
                </div>
            </CardContent>
        </Card>
    );
};
RadialProgressCard.propTypes = { 
    title: PropTypes.string, 
    percentage: PropTypes.number, 
    color: PropTypes.string, 
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), 
    icon: PropTypes.elementType, 
    onRefresh: PropTypes.func, 
    isRefreshing: PropTypes.bool 
};

/**
 * RecentSalesTable: The clean, modern table showing latest purchases.
 */
const RecentSalesTable = ({ transactions = [] }) => (
    <Card className="col-span-1 lg:col-span-3 shadow-sm">
        <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
        <CardContent>
            {(!transactions || transactions.length === 0) ? (
                <div className="py-8 text-center text-muted-foreground">No recent sales recorded yet.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map(tx => (
                            <TableRow key={tx._id}>
                                <TableCell>
                                    <div className="font-normal">{tx.userId?.name || 'Guest User'}</div>
                                    {tx.userId?.email && <div className="text-xs text-muted-foreground">{tx.userId.email}</div>}
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                                        {tx.paymentMethod || 'Online'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">Rs {(tx.totalAmount || 0).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
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
const ErrorState = ({ error }) => (
    <div className="p-8">
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{error?.data?.message || error?.message || "An unexpected error occurred."}</AlertDescription>
        </Alert>
    </div>
);
ErrorState.propTypes = { error: PropTypes.object };

// ====================================================================
// 3. MAIN DASHBOARD COMPONENT
// ====================================================================

const SupAdmDashboard = () => {
    const { data, isLoading, isError, error, isFetching, refetch } = useGetDashboardStatsQuery();

    if (isLoading) return <DashboardSkeleton />;
    if (isError) return <ErrorState error={error} />;
    if (!data?.analytics) return <div className="p-8">No data to display.</div>;

    const { stats = {}, activity = {}, charts = {} } = data.analytics;
    const chartData = charts.weeklyRevenue || [];

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-4xl font-semibold tracking-tight">Dashboard</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MainRevenueChart 
                    chartData={chartData} 
                    currentTotal={stats.currentWeekRevenue ?? 0}
                    previousTotal={stats.previousWeekRevenue ?? 0}
                    onRefresh={refetch}
                    isRefreshing={isFetching}
                />
                <div className="space-y-6">
                    <RadialProgressCard 
                        title="New Users This Week" 
                        percentage={stats.newUsersPercentage ?? 0} 
                        color="#ef4444" 
                        value={(stats.newUsersThisWeek ?? 0).toString()}
                        icon={Users}
                        onRefresh={refetch}
                        isRefreshing={isFetching}
                    />
                    <RadialProgressCard 
                        title="Instructor Conversion" 
                        percentage={stats.instructorConversionRate ?? 0}
                        color="#22c55e" 
                        value={`${stats.totalInstructors ?? 0}`}
                        icon={UserCheck}
                        onRefresh={refetch}
                        isRefreshing={isFetching}
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