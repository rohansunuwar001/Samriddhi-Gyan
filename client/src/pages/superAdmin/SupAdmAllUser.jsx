// src/pages/superAdmin/SupAdmAllUser.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetDashboardStatsQuery,
} from "@/features/api/adminApi";
import { toast } from "sonner";

// --- UI COMPONENTS ---
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- ICONS ---
import {
  Search,
  MoreHorizontal,
  AlertCircle,
  Trash2,
  UserPlus,
  Users,
  Edit,
  MapPin,
  Calendar,
  Shield,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Sparkles,
} from "lucide-react";

/**
 * A custom hook to debounce a value, preventing excessive API calls.
 */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

/**
 * Displays the filter and search controls for the user table.
 */
const FilterControls = ({ search, role, limit, onParamsChange, onRefresh, isFetching }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-grow">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-10 h-10 w-full"
          value={search}
          onChange={(e) => onParamsChange({ search: e.target.value, page: 1 })}
        />
      </div>
      
      <Select
        value={role || "all"}
        onValueChange={(value) =>
          onParamsChange({ role: value === "all" ? "" : value, page: 1 })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px] h-10">
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="instructor">Instructor</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={String(limit)}
        onValueChange={(value) =>
          onParamsChange({ limit: parseInt(value, 10), page: 1 })
        }
      >
        <SelectTrigger className="w-full sm:w-[140px] h-10">
          <span className="text-muted-foreground mr-1 text-xs font-normal">Show:</span>
          <SelectValue placeholder="10 rows" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 Rows</SelectItem>
          <SelectItem value="20">20 Rows</SelectItem>
          <SelectItem value="50">50 Rows</SelectItem>
          <SelectItem value="100">100 Rows</SelectItem>
        </SelectContent>
      </Select>

      {(search || role || limit !== 10) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-10 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => onParamsChange({ search: "", role: "", limit: 10, page: 1 })}
        >
          Clear Filters
        </Button>
      )}
    </div>

    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={onRefresh}
        disabled={isFetching}
        title="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 text-muted-foreground ${isFetching ? 'animate-spin text-primary' : ''}`} />
      </Button>
    </div>
  </div>
);

/**
 * Displays a skeleton loading state for the user table rows.
 */
const UserTableSkeleton = ({ rows = 5 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <TableRow key={`skeleton-row-${i}`}>
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
        <Skeleton className="h-6 w-20 rounded-full" />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Skeleton className="h-6 w-20 rounded-full" />
      </TableCell>
      <TableCell className="text-center hidden md:table-cell">
        <Skeleton className="h-6 w-10 mx-auto rounded" />
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
      </TableCell>
    </TableRow>
  ));

const SupAdmAllUser = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State is now read directly from URL search params for bookmarking/sharing ---
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const limit = parseInt(searchParams.get("limit") || "10");

  const debouncedSearch = useDebounce(search, 500);

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const stats = statsData?.analytics?.stats;

  const { data, isLoading, isError, error, isFetching, refetch } = useGetUsersQuery({
    page,
    limit,
    search: debouncedSearch,
    role,
  });

  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- A single, unified function to update URL params ---
  const updateSearchParams = (newParams) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...currentParams, ...newParams });
  };

  const handleRoleChange = async (userId, newRole) => {
    toast.promise(updateUser({ userId, role: newRole }).unwrap(), {
      loading: "Updating user role...",
      success: "User role updated successfully!",
      error: (err) => err.data?.message || "Failed to update role.",
    });
  };

  // --- Reset pointer events on the body when dialog closes to prevent Radix UI freeze bugs ---
  useEffect(() => {
    if (!isAlertOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAlertOpen]);

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    // Defer opening the dialog to allow the DropdownMenu to fully close and restore pointer events first
    setTimeout(() => {
      setIsAlertOpen(true);
    }, 50);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const userName = userToDelete.name;
    setIsAlertOpen(false);
    setUserToDelete(null);
    toast.promise(deleteUser(userToDelete._id).unwrap(), {
      loading: `Deleting user ${userName}...`,
      success: `User "${userName}" has been deleted.`,
      error: (err) => err.data?.message || "Failed to delete user.",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-muted-foreground mt-1">
            Browse, filter, and manage all platform users.
          </p>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
            {statsLoading ? (
              <div className="space-y-2 mt-1">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Instructors</p>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            {statsLoading ? (
              <div className="space-y-2 mt-1">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.totalInstructors || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Educators on platform</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Students</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            {statsLoading ? (
              <div className="space-y-2 mt-1">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold">
                  {Math.max(0, (stats?.totalUsers || 0) - (stats?.totalInstructors || 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Enrolled learners</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            {statsLoading ? (
              <div className="space-y-2 mt-1">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Courses created</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <FilterControls
            search={search}
            role={role}
            limit={limit}
            onParamsChange={updateSearchParams}
            onRefresh={refetch}
            isFetching={isFetching}
          />
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error.data?.message || "Failed to fetch users."}
              </AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto rounded-md border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">User</TableHead>
                  <TableHead className="font-semibold text-slate-700">Role</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden lg:table-cell">Subscription</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center hidden md:table-cell">Courses</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">Location</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden xl:table-cell">Joined On</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  <UserTableSkeleton />
                ) : data?.users.length > 0 ? (
                  data.users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={`ring-2 ring-offset-1 shrink-0 ${
                            user.role === "admin"
                              ? "ring-red-500"
                              : user.role === "instructor"
                              ? "ring-blue-500"
                              : "ring-emerald-500"
                          }`}>
                            <AvatarImage src={user.photoUrl} alt={user.name} />
                            <AvatarFallback className="bg-slate-100 font-semibold text-slate-700">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900 leading-none">{user.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border border-red-200 bg-red-50 text-red-700 shadow-sm">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        ) : user.role === "instructor" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm">
                            <BookOpen className="h-3 w-3" />
                            Instructor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
                            <GraduationCap className="h-3 w-3" />
                            Student
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {user.subscription?.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm hover:brightness-105 transition-all">
                            <Sparkles className="h-3 w-3 text-amber-200 animate-pulse" />
                            {user.subscription.planName || "Premium"}
                          </span>
                        ) : user.subscription?.status === "expired" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                            Free
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center hidden md:table-cell">
                        <span className={`inline-flex items-center justify-center font-semibold text-xs px-2.5 py-1 rounded-md ${
                          user.enrolledCourses?.length > 0 
                            ? "bg-slate-100 text-slate-800 border border-slate-200" 
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                        }`}>
                          {user.enrolledCourses?.length || 0}
                        </span>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {user.locationDetails?.city || user.locationDetails?.country ? (
                          <div className="flex items-start gap-1.5 max-w-[200px]">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-slate-700 leading-tight">
                                {user.locationDetails.city 
                                  ? `${user.locationDetails.city}, ${user.locationDetails.country}` 
                                  : user.locationDetails.country}
                              </p>
                              {user.locationDetails.formattedAddress && (
                                <p 
                                  className="text-xs text-muted-foreground truncate mt-0.5 max-w-[180px]" 
                                  title={user.locationDetails.formattedAddress}
                                >
                                  {user.locationDetails.formattedAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            <span className="text-xs italic text-slate-400">Not shared</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="hidden xl:table-cell text-slate-600 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(user.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Users className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleRoleChange(user._id, "student")
                                  }
                                >
                                  Student
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleRoleChange(user._id, "instructor")
                                  }
                                >
                                  Instructor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    handleRoleChange(user._id, "admin")
                                  }
                                >
                                  Admin
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => openDeleteDialog(user)}
                              className="text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {data && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
              <span className="text-sm text-muted-foreground text-center sm:text-left">
                Showing{" "}
                <strong className="font-semibold text-slate-800">
                  {data.totalUsers > 0 ? (page - 1) * limit + 1 : 0}
                </strong>
                -
                <strong className="font-semibold text-slate-800">
                  {Math.min(page * limit, data.totalUsers)}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-slate-800">
                  {data.totalUsers}
                </strong>{" "}
                users
              </span>
              
              {data.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => updateSearchParams({ page: page - 1 })}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="hidden sm:flex items-center gap-1.5 text-sm">
                    {Array.from({ length: data.totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === data.totalPages ||
                        Math.abs(pageNum - page) <= 1
                      ) {
                        return (
                          <Button
                            key={`page-btn-${pageNum}`}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            className={`h-9 w-9 p-0 ${
                              page === pageNum ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : ''
                            }`}
                            onClick={() => updateSearchParams({ page: pageNum })}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      if (
                        (pageNum === 2 && page > 3) ||
                        (pageNum === data.totalPages - 1 && page < data.totalPages - 2)
                      ) {
                        return <span key={`dots-${pageNum}`} className="text-slate-400 px-1">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => updateSearchParams({ page: page + 1 })}
                    disabled={page >= data.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account for <strong>{userToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupAdmAllUser;
