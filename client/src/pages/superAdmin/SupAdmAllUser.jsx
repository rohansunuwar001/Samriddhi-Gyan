// src/pages/superAdmin/SupAdmAllUser.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
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
const FilterControls = ({ search, role, onParamsChange }) => (
  <div className="flex flex-col sm:flex-row items-center gap-4">
    <div className="relative w-full sm:w-auto flex-grow">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by name or email..."
        className="pl-10"
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
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="Filter by role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Roles</SelectItem>
        <SelectItem value="student">Student</SelectItem>
        <SelectItem value="instructor">Instructor</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
    {(search || role) && (
      <Button
        variant="ghost"
        onClick={() => onParamsChange({ search: "", role: "", page: 1 })}
      >
        Clear Filters
      </Button>
    )}
  </div>
);

/**
 * Displays a skeleton loading state for the user table rows.
 */
const UserTableSkeleton = ({ rows = 5 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <TableRow key={`skeleton-Rs{i}`}>
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
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8" />
      </TableCell>
    </TableRow>
  ));

const SupAdmAllUser = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- State is now read directly from URL search params for bookmarking/sharing ---
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isError, error, isFetching } = useGetUsersQuery({
    page,
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

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    toast.promise(deleteUser(userToDelete._id).unwrap(), {
      loading: `Deleting user Rs{userToDelete.name}...`,
      success: `User "Rs{userToDelete.name}" has been deleted.`,
      error: (err) => err.data?.message || "Failed to delete user.",
    });
    setUserToDelete(null);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Browse, filter, and manage all platform users.
          </p>
        </div>
       
      </header>

      <Card>
        <CardHeader>
          <FilterControls
            search={search}
            role={role}
            onParamsChange={updateSearchParams}
          />
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error.data?.message || "Failed to fetch users."}
              </AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">
                  Joined On
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <UserTableSkeleton />
              ) : data?.users.length > 0 ? (
                data.users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.photoUrl} alt={user.name} />
                          <AvatarFallback>
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full Rs{
                          user.role === "admin"
                            ? "bg-red-100 text-red-700"
                            : user.role === "instructor"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                Showing{" "}
                <strong>
                  {(page - 1) * 10 + 1}-{Math.min(page * 10, data.totalUsers)}
                </strong>{" "}
                of <strong>{data.totalUsers}</strong> users
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateSearchParams({ page: page - 1 })}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateSearchParams({ page: page + 1 })}
                  disabled={page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
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
