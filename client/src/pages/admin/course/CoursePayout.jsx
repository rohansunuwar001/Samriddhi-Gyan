// src/pages/instructor/CoursePayout.jsx

import React, { useState, useMemo } from "react";
import { useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery } from "@/features/api/instructorApi";

// --- UI COMPONENTS ---
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// --- ICONS ---
import { Search, AlertCircle, DollarSign } from "lucide-react";

const TableSkeleton = ({ rows = 8 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <TableRow key={`skeleton-${i}`}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24 rounded-full" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-16" />
      </TableCell>
    </TableRow>
  ));

const CoursePayout = () => {
  // --- State Management ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const ITEMS_PER_PAGE = 10;

  // --- RTK Query Hook ---
  const { data, isLoading, isError, error } =
    useGetPaidCoursesWithEnrolledStudentsAndPaymentsQuery();

  // --- Client-Side Data Transformation and Filtering ---
  const filteredPayments = useMemo(() => {
    // Step 1: Flatten the nested data into a single array of payment records
    const allPayments =
      data?.courses?.flatMap((course) =>
        course.coursePurchases.flatMap((purchase) =>
          // A single purchase can contain multiple courses; we need to find the one that matches
          purchase.courses
            .filter((pc) => pc.courseId?._id === course.courseId)
            .map((pc) => ({
              // Create a unique ID for each record
              paymentId: `${purchase._id}-${pc.courseId._id}`,
              user: purchase.user,
              status: purchase.status,
              purchasedAt: purchase.purchasedAt,
              priceAtPurchase: pc.priceAtPurchase,
              courseTitle: course.courseTitle,
              courseId: course.courseId,
            }))
        )
      ) || [];

    // Step 2: Apply filters based on UI state
    return allPayments.filter((payment) => {
      const courseMatch =
        selectedCourseId === "all" || payment.courseId === selectedCourseId;
      const searchMatch =
        !searchQuery ||
        payment.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
      return courseMatch && searchMatch;
    });
  }, [data, searchQuery, selectedCourseId]);

  // --- Client-Side Pagination ---
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const totalRevenue = useMemo(
    () => filteredPayments.reduce((acc, p) => acc + p.priceAtPurchase, 0),
    [filteredPayments]
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Payouts & Revenue
          </h2>
          <p className="text-muted-foreground">
            View all successful payments for your courses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 p-4 bg-green-100 text-green-800 rounded-lg text-center">
          <div className="text-sm font-semibold">Total Filtered Revenue</div>
          <div className="text-2xl font-bold">Rs{totalRevenue.toFixed(2)}</div>
        </div>
      </header>

      <Card>
        <CardHeader>
          {/* --- Filter & Search Controls --- */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              placeholder="Search by student name or email..."
              className="flex-grow"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              onValueChange={(value) => {
                setSelectedCourseId(value);
                setCurrentPage(1);
              }}
              value={selectedCourseId}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {data?.courses?.map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId}>
                    {course.courseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error.data?.message || "Failed to load payment data."}
              </AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Purchase Date
                </TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment.paymentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={payment.user?.photoUrl} />
                          <AvatarFallback>
                            {payment.user?.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{payment.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-muted-foreground">
                        {payment.courseTitle}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "completed"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(payment.purchasedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rs{payment.priceAtPurchase.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No payments found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                Showing{" "}
                <strong>
                  {Math.min(
                    (currentPage - 1) * ITEMS_PER_PAGE + 1,
                    filteredPayments.length
                  )}{" "}
                  -{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredPayments.length
                  )}
                </strong>{" "}
                of <strong>{filteredPayments.length}</strong> payments
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
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

export default CoursePayout;
