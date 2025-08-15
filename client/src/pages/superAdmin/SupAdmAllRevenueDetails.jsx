// src/pages/admin/SupAdmAllRevenueDetails.jsx

import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetRevenueDetailsQuery } from "@/features/api/adminApi";
import { format, subDays } from "date-fns";

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

// --- ICONS ---
import { AlertCircle, Calendar as CalendarIcon, FilterX } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
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
              <span>Pick a date range</span>
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
        <SelectTrigger className="w-full sm:w-[180px]">
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
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Payment Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          <SelectItem value="Stripe">Stripe</SelectItem>
          <SelectItem value="eSewa">eSewa</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={() =>
            onParamsChange({
              status: "",
              paymentMethod: "",
              startDate: "",
              endDate: "",
              page: 1,
            })
          }
        >
          <FilterX className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
};

/**
 * TableSkeleton: A component for the table's loading state.
 */
const TableSkeleton = ({ rows = 10 }) =>
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

  // Fetch data using the hook and current URL params
  const { data, isLoading, isError, error, isFetching } =
    useGetRevenueDetailsQuery(params);

  const updateSearchParams = (newParams) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...currentParams, ...newParams });
  };

  const purchases = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Revenue Details</h2>
        <p className="text-muted-foreground">
          Browse and filter all transactions on the platform.
        </p>
      </header>

      <Card>
        <FilterControls params={params} onParamsChange={updateSearchParams} />
        <CardContent>
          {isError && (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error.data?.message || "Failed to fetch revenue details."}
              </AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Courses Purchased</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <TableSkeleton />
              ) : purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <TableRow key={purchase._id}>
                    <TableCell className="font-mono text-xs">
                      {purchase.orderId}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{purchase.userId?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {purchase.userId?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside">
                        {purchase.courses.map((item) => (
                          <li key={item._id} className="text-sm">
                            {item.courseId?.title || "Deleted Course"}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>
                      <Badge
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
                    <TableCell>{purchase.paymentMethod}</TableCell>
                    <TableCell className="text-right font-semibold">
                      Rs{purchase.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    No transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* --- Pagination --- */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateSearchParams({ page: params.page - 1 })}
                  disabled={params.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
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
    </div>
  );
};

export default SupAdmAllRevenueDetails;
