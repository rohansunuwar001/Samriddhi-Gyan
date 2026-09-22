// src/pages/admin/SupAdmAllRevenueDetails.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useGetRevenueDetailsQuery,
  useGetInstructorPayoutSummaryQuery,
  useCreateInstructorPayoutMutation,
} from "@/features/api/adminApi";
import { format } from "date-fns";
import { toast } from "sonner";

// --- UI COMPONENTS ---
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
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- CHARTING LIBRARIES ---
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  XAxis as ChartXAxis,
  YAxis as ChartYAxis,
  CartesianGrid,
} from "recharts";

// --- ICONS ---
import {
  AlertCircle,
  Calendar as CalendarIcon,
  FilterX,
  Download,
  DollarSign,
  TrendingUp,
  Percent,
  Activity,
  Award,
  Clock,
  BookOpen,
  PieChart as PieIcon,
  CreditCard,
  History,
  CheckCircle,
  Loader2,
  Wallet,
} from "lucide-react";

/**
 * FilterControls: A component to manage all the filtering UI.
 */
const FilterControls = ({ params, onParamsChange }) => {
  const [date, setDate] = useState({
    from: params.startDate ? new Date(params.startDate) : undefined,
    to: params.endDate ? new Date(params.endDate) : undefined,
  });

  const handleDateChange = (newDate) => {
    setDate(newDate);
    onParamsChange({
      startDate: newDate?.from ? format(newDate.from, "yyyy-MM-dd") : "",
      endDate: newDate?.to ? format(newDate.to, "yyyy-MM-dd") : "",
      page: 1,
    });
  };

  const hasActiveFilters =
    params.status || params.paymentMethod || params.startDate;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-start text-left font-light"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "LLL dd")} - ${format(
                    date.to,
                    "LLL dd, y"
                  )}`
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span className="text-slate-500">Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={params.status || "all"}
          onValueChange={(value) =>
            onParamsChange({ status: value === "all" ? "" : value, page: 1 })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.paymentMethod || "all"}
          onValueChange={(value) =>
            onParamsChange({
              paymentMethod: value === "all" ? "" : value,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="Stripe">Stripe</SelectItem>
            <SelectItem value="eSewa">eSewa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            setDate({ from: undefined, to: undefined });
            onParamsChange({
              status: "",
              paymentMethod: "",
              startDate: "",
              endDate: "",
              page: 1,
            });
          }}
        >
          <FilterX className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};

/**
 * TableSkeleton: A component for the table's loading state.
 */
const TableSkeleton = ({ rows = 5 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <TableRow key={`skeleton-${i}`}>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-20" />
      </TableCell>
    </TableRow>
  ));

const SupAdmAllRevenueDetails = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL for bookmarking/sharing
  const params = {
    page: parseInt(searchParams.get("page") || "1"),
    limit: 15,
    status: searchParams.get("status") || "",
    paymentMethod: searchParams.get("paymentMethod") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  };

  // Fetch standard revenue details
  const { data, isLoading, isError, error, isFetching } =
    useGetRevenueDetailsQuery(params);

  // Fetch payout summary and logs
  const {
    data: payoutData,
    isLoading: isPayoutLoading,
    refetch: refetchPayoutSummary,
  } = useGetInstructorPayoutSummaryQuery();

  const [createPayout, { isLoading: isPaying }] =
    useCreateInstructorPayoutMutation();

  // Dialog State
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    paymentMethod: "eSewa",
    transactionId: "",
    remarks: "",
  });

  const updateSearchParams = (newParams) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...currentParams, ...newParams });
  };

  const purchases = data?.data || [];
  const pagination = data?.pagination || {};
  const summary = data?.summary || {};

  // Formatter for watch time duration
  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (!purchases || purchases.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Courses Purchased",
      "Payment Method",
      "Status",
      "Total Amount (Rs)",
      "Purchase Date",
    ];
    const rows = purchases.map((purchase) => {
      const coursesStr = purchase.courses
        .map(
          (c) =>
            `${c.courseId?.title || "Deleted Course"} (Rs ${c.priceAtPurchase})`
        )
        .join("; ");
      return [
        purchase.orderId,
        purchase.userId?.name || "Guest",
        purchase.userId?.email || "N/A",
        coursesStr,
        purchase.paymentMethod,
        purchase.status,
        purchase.totalAmount,
        new Date(purchase.createdAt).toLocaleString(),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e) =>
          e
            .map((val) => `"${String(val).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `platform_revenue_report_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully!");
  };

  // Pre-calculate visual chart splits
  const courseSplitData = [
    { name: "Instructor Share (37%)", value: summary.totalInstructorShare || 0, color: "#10b981" },
    { name: "Admin Share (63%)", value: summary.totalAdminShare || 0, color: "#3b82f6" },
  ];

  const subSplitData = [
    { name: "Instructor Watch Pool (15%)", value: summary.subInstructorPool || 0, color: "#f59e0b" },
    { name: "Admin Sub Share (85%)", value: summary.subAdminShare || 0, color: "#8b5cf6" },
  ];

  const platformTotalRevenue = (summary.totalCourseSales || 0) + (summary.totalSubSales || 0);

  // Setup payment checkout dialog
  const handleOpenPayoutDialog = (instructor) => {
    setSelectedInstructor(instructor);
    setPayoutForm({
      amount: instructor.pendingBalance.toString(),
      paymentMethod: "eSewa",
      transactionId: "",
      remarks: `Payout of earnings for ${instructor.name}`,
    });
    setIsPayoutDialogOpen(true);
  };

  // Submit Payout disbursement
  const handleConfirmPayout = async (e) => {
    e.preventDefault();
    if (!selectedInstructor) return;

    const amountNum = parseFloat(payoutForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid payout amount.");
      return;
    }

    if (amountNum > selectedInstructor.pendingBalance) {
      toast.error("Payout amount cannot exceed the pending balance.");
      return;
    }

    try {
      await createPayout({
        instructorId: selectedInstructor.instructorId,
        amount: amountNum,
        paymentMethod: payoutForm.paymentMethod,
        transactionId: payoutForm.transactionId,
        remarks: payoutForm.remarks,
      }).unwrap();

      toast.success(`Disbursed Rs ${amountNum} to ${selectedInstructor.name}`);
      setIsPayoutDialogOpen(false);
      refetchPayoutSummary();
    } catch (err) {
      toast.error(err.data?.message || "Failed to disburse payout.");
    }
  };

  // Clean pointer events on dialog close
  useEffect(() => {
    if (!isPayoutDialogOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPayoutDialogOpen]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900">
            Revenue & Fund Analysis
          </h2>
          <p className="text-muted-foreground mt-1">
            Analyze course revenue distribution, watch-time subscription payouts, and transaction reports.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={purchases.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white font-normal flex items-center gap-2 shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV Report
        </Button>
      </header>

      {/* METRIC SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border border-slate-100 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Total Course Sales
            </CardTitle>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-slate-900">
              Rs {(summary.totalCourseSales || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Sales from individual courses
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-100 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-emerald-600 uppercase tracking-wider">
              Instructor Course Share (37%)
            </CardTitle>
            <Percent className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-700">
              Rs {(summary.totalInstructorShare || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Distributed to creators for course sales
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-100 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">
              Admin Course Share (63%)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-blue-700">
              Rs {(summary.totalAdminShare || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Admin commission from course sales
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-slate-100 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-amber-600 uppercase tracking-wider">
              Subscription Sales
            </CardTitle>
            <Activity className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-amber-700">
              Rs {(summary.totalSubSales || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              15% Watch Pool / 85% Admin split
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-purple-200 relative overflow-hidden bg-purple-50/15">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider">
              Net Admin Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              Rs {(summary.netAdminRevenue || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-purple-600 mt-1">
              63% Course share + 85% Sub share
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DETAILED TABS INTERFACE */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="bg-slate-200/60 p-1 rounded-lg border border-slate-200">
          <TabsTrigger value="transactions" className="px-4 py-2 font-normal">
            Transactions Log
          </TabsTrigger>
          <TabsTrigger value="instructor-payouts" className="px-4 py-2 font-normal">
            Instructor Payout Manager
          </TabsTrigger>
          <TabsTrigger value="subscription-pool" className="px-4 py-2 font-normal">
            Subscription Payout Pool
          </TabsTrigger>
          <TabsTrigger value="financial-charts" className="px-4 py-2 font-normal">
            Revenue Analytics Charts
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TRANSACTIONS LOG */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="shadow-sm border border-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl font-semibold text-slate-800">Transaction History</CardTitle>
              <CardDescription>
                Search, filter, and inspect splits for all student orders on the platform.
              </CardDescription>
            </CardHeader>
            <FilterControls params={params} onParamsChange={updateSearchParams} />
            <CardContent className="p-0">
              {isError && (
                <div className="p-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {error.data?.message || "Failed to fetch revenue details."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-medium text-slate-700">Order ID</TableHead>
                    <TableHead className="font-medium text-slate-700">Customer</TableHead>
                    <TableHead className="font-medium text-slate-700">Courses Purchased & Payout Splits</TableHead>
                    <TableHead className="font-medium text-slate-700">Status</TableHead>
                    <TableHead className="font-medium text-slate-700">Gateway</TableHead>
                    <TableHead className="text-right font-medium text-slate-700">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || isFetching ? (
                    <TableSkeleton />
                  ) : purchases.length > 0 ? (
                    purchases.map((purchase) => (
                      <TableRow key={purchase._id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-sm font-medium text-slate-600">
                          {purchase.orderId}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">{purchase.userId?.name || "Guest"}</div>
                          <div className="text-sm text-slate-500">
                            {purchase.userId?.email || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[500px]">
                          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/50 shadow-sm">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200">
                                  <th className="p-2 font-medium text-slate-700">Course & Creator</th>
                                  <th className="p-2 font-medium text-slate-700 text-right">Price</th>
                                  <th className="p-2 font-medium text-emerald-800 text-right">Instructor (37%)</th>
                                  <th className="p-2 font-medium text-blue-800 text-right">Admin (63%)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {purchase.courses.map((item) => (
                                  <tr key={item._id} className="border-b border-slate-150 last:border-0 hover:bg-slate-100/30">
                                    <td className="p-2">
                                      <span className="font-medium text-slate-900 block text-sm">
                                        {item.courseId?.title || "Deleted Course"}
                                      </span>
                                      {item.courseId?.creator && (
                                        <span className="text-[10px] text-purple-600 font-normal block">
                                          {item.courseId.creator.name} ({item.courseId.creator.email})
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2 text-right font-normal text-slate-700">
                                      Rs {item.priceAtPurchase.toLocaleString()}
                                    </td>
                                    <td className="p-2 text-right font-medium text-emerald-600">
                                      Rs {(item.instructorShare || 0).toLocaleString()}
                                    </td>
                                    <td className="p-2 text-right font-medium text-blue-600">
                                      Rs {(item.adminShare || 0).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="capitalize font-medium text-sm py-1"
                            variant={
                              purchase.status === "completed"
                                ? "default"
                                : purchase.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-normal text-slate-700">{purchase.paymentMethod}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          Rs {purchase.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                        No transactions found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* --- Pagination Controls --- */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                  <span className="text-sm text-slate-500">
                    Showing page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSearchParams({ page: params.page - 1 })}
                      disabled={params.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSearchParams({ page: params.page + 1 })}
                      disabled={params.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INSTRUCTOR PAYOUT MANAGER */}
        <TabsContent value="instructor-payouts" className="space-y-6">
          <div className="grid gap-6">
            {/* Instructor Balances Table */}
            <Card className="shadow-sm border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    Instructor Payout balances
                  </CardTitle>
                  <CardDescription>
                    Calculate total earnings, subtract disbursements, and pay pending amounts with a single click.
                  </CardDescription>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 font-medium">
                  <Wallet className="h-3 w-3" />
                  Payout Control
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-medium text-slate-700">Instructor</TableHead>
                      <TableHead className="font-medium text-slate-700">Course Sales Share (37%)</TableHead>
                      <TableHead className="font-medium text-slate-700">Subscription Share (15%)</TableHead>
                      <TableHead className="font-medium text-slate-700">Total Accumulated</TableHead>
                      <TableHead className="font-medium text-slate-700">Total Paid Out</TableHead>
                      <TableHead className="font-medium text-slate-700">Unpaid Balance</TableHead>
                      <TableHead className="text-right font-medium text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPayoutLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                          <span className="text-sm text-slate-500 mt-2 block">Loading instructor accounts...</span>
                        </TableCell>
                      </TableRow>
                    ) : payoutData?.summary && payoutData.summary.length > 0 ? (
                      payoutData.summary.map((inst) => (
                        <TableRow key={inst.instructorId} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={inst.photoUrl} alt={inst.name} />
                                <AvatarFallback>{inst.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-slate-800">{inst.name}</div>
                                <div className="text-sm text-slate-500">{inst.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-normal text-slate-700">
                            Rs {inst.courseEarnings.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-normal text-slate-700">
                            Rs {inst.subscriptionEarnings.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">
                            Rs {inst.totalEarnings.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-normal text-emerald-700">
                            Rs {inst.totalPaid.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-bold text-amber-700 bg-amber-50/40">
                            Rs {inst.pendingBalance.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {inst.pendingBalance > 0 ? (
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-3 shadow-sm"
                                onClick={() => handleOpenPayoutDialog(inst)}
                              >
                                Pay Instructor
                              </Button>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                <CheckCircle className="mr-1 h-3 w-3 inline" />
                                Fully Paid
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-sm">
                          No instructors found in the database.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payout History Logs */}
            <Card className="shadow-sm border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-500" />
                  Disbursement Logs & History
                </CardTitle>
                <CardDescription>
                  Full audit log of all financial transfers made to platform instructors.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-medium text-slate-700">Disbursement Date</TableHead>
                      <TableHead className="font-medium text-slate-700">Recipient</TableHead>
                      <TableHead className="font-medium text-slate-700">Paid Amount</TableHead>
                      <TableHead className="font-medium text-slate-700">Method</TableHead>
                      <TableHead className="font-medium text-slate-700">Reference ID</TableHead>
                      <TableHead className="font-medium text-slate-700">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPayoutLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ) : payoutData?.payoutHistory && payoutData.payoutHistory.length > 0 ? (
                      payoutData.payoutHistory.map((payout) => (
                        <TableRow key={payout._id} className="hover:bg-slate-50/50">
                          <TableCell className="font-normal text-slate-600">
                            {format(new Date(payout.paidAt || payout.createdAt), "PPP p")}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-800">
                              {payout.instructorId?.name || "Deleted Instructor"}
                            </div>
                            <div className="text-sm text-slate-500">
                              {payout.instructorId?.email || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-700">
                            Rs {payout.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium text-sm">
                              {payout.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-600">
                            {payout.transactionId || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">
                            {payout.remarks || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-sm">
                          No payout transactions have been recorded.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: SUBSCRIPTION POOL & WATCH-TIME DETAILS */}
        <TabsContent value="subscription-pool" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1 shadow-sm border border-slate-200 bg-white">
              <CardHeader className="bg-purple-50/40 border-b border-purple-100">
                <CardTitle className="text-lg font-semibold text-purple-950 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Samriddhi Gyan Model Split logic
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm text-slate-600">
                <p>
                  Samriddhi Gyan watch-time payouts are distributed using engagement metrics:
                </p>
                <div className="space-y-2.5 border-t border-slate-100 pt-3">
                  <div className="flex justify-between font-medium">
                    <span>Total Sub Revenue:</span>
                    <span className="text-slate-900">Rs {(summary.totalSubSales || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>Instructor Pool (15%):</span>
                    <span>Rs {(summary.subInstructorPool || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-700 font-medium">
                    <span>Platform Admin Share (85%):</span>
                    <span>Rs {(summary.subAdminShare || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 text-[11px] space-y-1">
                  <span className="font-medium block text-slate-800">Engagement-based Pool:</span>
                  <p>
                    Instructors receive payouts from the 15% revenue pool proportionally based on their courses' total watched minutes by subscribers relative to total watch-time across the whole catalog.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800">Instructor Engagement & Share</CardTitle>
                  <CardDescription>
                    Track subscriber lecture consumption and corresponding payouts.
                  </CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 font-medium">
                  <Clock className="h-3 w-3" />
                  Watch-time model
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-medium text-slate-700">Instructor</TableHead>
                      <TableHead className="font-medium text-slate-700">Total Watch-time</TableHead>
                      <TableHead className="font-medium text-slate-700">Catalog Share %</TableHead>
                      <TableHead className="text-right font-medium text-slate-700">Pool Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.instructorShares && summary.instructorShares.length > 0 ? (
                      summary.instructorShares.map((inst) => (
                        <TableRow key={inst.instructorId} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="font-medium text-slate-800">{inst.name}</div>
                            <div className="text-sm text-slate-500">{inst.email}</div>
                          </TableCell>
                          <TableCell className="font-normal text-slate-700">
                            {formatDuration(inst.secondsWatched)}
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">
                            {(inst.shareRatio * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-semibold text-amber-700">
                            Rs {inst.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-slate-400 text-sm">
                          No subscriber watch-time data recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: FINANCIAL CHARTS */}
        <TabsContent value="financial-charts" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-emerald-500" />
                  Course Revenue Distribution
                </CardTitle>
                <CardDescription>
                  Organic Course Sales: 37% Instructor share / 63% Admin share
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] flex items-center justify-center pt-4">
                {summary.totalCourseSales > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={courseSplitData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {courseSplitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(value) => [`Rs ${value.toLocaleString()}`, "Amount"]}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-base text-slate-400">No course revenue data to plot.</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <PieIcon className="h-5 w-5 text-purple-500" />
                  Subscription Revenue Distribution
                </CardTitle>
                <CardDescription>
                  Samriddhi Gyan Model: 15% watch-time instructor pool / 85% Admin platform share
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] flex items-center justify-center pt-4">
                {summary.totalSubSales > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subSplitData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {subSplitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(value) => [`Rs ${value.toLocaleString()}`, "Amount"]}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-base text-slate-400">No subscription revenue data to plot.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border border-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Platform Earnings Stream Comparison
              </CardTitle>
              <CardDescription>
                Comparing course-sales revenue with subscription revenue streams.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-6">
              {platformTotalRevenue > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={[
                      {
                        name: "Total Course Sales",
                        "Sales Amount": summary.totalCourseSales,
                        "Admin Net Share": summary.totalAdminShare,
                        "Instructor Net Share": summary.totalInstructorShare,
                      },
                      {
                        name: "Total Subscriptions",
                        "Sales Amount": summary.totalSubSales,
                        "Admin Net Share": summary.subAdminShare,
                        "Instructor Net Share": summary.subInstructorPool,
                      },
                    ]}
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <ChartXAxis dataKey="name" />
                    <ChartYAxis tickFormatter={(val) => `Rs ${val / 1000}k`} />
                    <ChartTooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Sales Amount" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Admin Net Share" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Instructor Net Share" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-base text-slate-400">
                  No chart data available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PAYOUT CHECKOUT MODAL */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Instructor Payout Checkout
            </DialogTitle>
            <DialogDescription>
              Confirm and disburse earnings for instructor.
            </DialogDescription>
          </DialogHeader>

          {selectedInstructor && (
            <form onSubmit={handleConfirmPayout} className="space-y-4 pt-2">
              {/* Receipt Summary Details */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedInstructor.photoUrl} alt={selectedInstructor.name} />
                    <AvatarFallback>{selectedInstructor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-slate-800">{selectedInstructor.name}</div>
                    <div className="text-sm text-slate-500">{selectedInstructor.email}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Course Earnings:</span>
                    <span className="font-normal text-slate-800">Rs {selectedInstructor.courseEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Watch-time Pool Share:</span>
                    <span className="font-normal text-slate-800">Rs {selectedInstructor.subscriptionEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 font-normal">
                    <span>Total Accumulated:</span>
                    <span className="text-slate-800">Rs {selectedInstructor.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Already Disbursed:</span>
                    <span>- Rs {selectedInstructor.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-base text-slate-900 bg-amber-50/50 p-1.5 rounded">
                    <span className="text-amber-800">Remaining Balance:</span>
                    <span className="text-amber-900">Rs {selectedInstructor.pendingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="amount" className="text-sm font-semibold text-slate-700">
                    Disbursement Amount (Rs)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    required
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    placeholder="Enter payout amount"
                    className="h-9"
                  />
                  <p className="text-[10px] text-slate-400">
                    Defaults to the entire pending balance. You can enter a lower value for partial payments.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="paymentMethod" className="text-sm font-semibold text-slate-700">
                      Payment Method
                    </Label>
                    <Select
                      value={payoutForm.paymentMethod}
                      onValueChange={(value) =>
                        setPayoutForm({ ...payoutForm, paymentMethod: value })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eSewa">eSewa</SelectItem>
                        <SelectItem value="Stripe">Stripe</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="transactionId" className="text-sm font-semibold text-slate-700">
                      Reference / Trans ID
                    </Label>
                    <Input
                      id="transactionId"
                      value={payoutForm.transactionId}
                      onChange={(e) =>
                        setPayoutForm({ ...payoutForm, transactionId: e.target.value })
                      }
                      placeholder="e.g. eSewa ref ID"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="remarks" className="text-sm font-semibold text-slate-700">
                    Remarks / Notes
                  </Label>
                  <Input
                    id="remarks"
                    value={payoutForm.remarks}
                    onChange={(e) => setPayoutForm({ ...payoutForm, remarks: e.target.value })}
                    placeholder="e.g. July watch-time payout"
                    className="h-9"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-slate-100 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPayoutDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPaying}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-1.5"
                >
                  {isPaying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm & Disburse Funds
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupAdmAllRevenueDetails;
