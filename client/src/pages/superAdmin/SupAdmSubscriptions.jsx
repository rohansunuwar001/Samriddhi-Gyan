import React, { useState } from "react";
import { useGetAllSubscriptionsQuery } from "@/features/api/subscriptionPlansApi";
import { format } from "date-fns";

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
import { Badge } from "@/components/ui/badge";

// --- ICONS ---
import { AlertCircle, CreditCard, Calendar } from "lucide-react";

const TableSkeleton = ({ rows = 10 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <TableRow key={`sub-skeleton-${i}`}>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell>
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-44" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
    </TableRow>
  ));

const SupAdmSubscriptions = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useGetAllSubscriptionsQuery({
    page,
    limit: 15
  });

  const subscriptions = data?.subscriptions || [];
  const pagination = data?.pagination || {};

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-[#1c1d1f]">Subscription Logs</h2>
          <p className="text-muted-foreground mt-1">
            View all students who purchased a tiered subscription plan.
          </p>
        </div>
      </header>

      <Card className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <CardContent className="pt-6">
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error?.data?.message || "Failed to load subscription logs."}
              </AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>User details</TableHead>
                <TableHead>Plan Details</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Starts At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <TableSkeleton />
              ) : subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                  <TableRow key={sub._id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-sm text-gray-500">
                      {sub.orderId}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{sub.userId?.name || "Guest"}</div>
                      <div className="text-sm text-muted-foreground">{sub.userId?.email || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-normal">
                        <CreditCard size={14} className="text-purple-600" />
                        {sub.planName}
                      </div>
                    </TableCell>
                    <TableCell className="text-base">
                      {sub.durationMonths} {sub.durationMonths === 1 ? "month" : "months"}
                    </TableCell>
                    <TableCell className="text-base text-gray-600">
                      {sub.status === "completed" && sub.createdAt
                        ? format(new Date(sub.createdAt), "yyyy-MM-dd")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-base text-gray-600">
                      {sub.status === "completed" && sub.userId?.subscription?.expiresAt
                        ? format(new Date(sub.userId.subscription.expiresAt), "yyyy-MM-dd")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="rounded-full font-semibold px-2.5 py-0.5"
                        variant={
                          sub.status === "completed"
                            ? "default"
                            : sub.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      Rs {sub.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-400">
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* --- Pagination --- */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4 border-gray-150">
              <span className="text-base text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={page >= pagination.totalPages}
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

export default SupAdmSubscriptions;
