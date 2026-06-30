// src/pages/admin/Categories/CategoryManager.jsx

import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/features/api/categoryApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import { AlertCircle, Edit, Loader2, PlusCircle, Trash2 } from "lucide-react";

const ROOT_PARENT_VALUE = "__root__";

const getParentId = (category) => category.parent?._id || category.parent || null;

const CategoryManager = () => {
  const [newParentName, setNewParentName] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingParent, setEditingParent] = useState(ROOT_PARENT_VALUE);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError, error } = useGetAllCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const categories = data?.categories || [];
  const parentCategories = useMemo(
    () => categories.filter((category) => !getParentId(category)),
    [categories]
  );
  const childCategories = useMemo(
    () => categories.filter((category) => getParentId(category)),
    [categories]
  );

  const childrenByParent = useMemo(() => {
    return childCategories.reduce((map, category) => {
      const parentId = getParentId(category);
      if (!map[parentId]) map[parentId] = [];
      map[parentId].push(category);
      return map;
    }, {});
  }, [childCategories]);

  const handleCreateParent = async (e) => {
    e.preventDefault();
    const trimmed = newParentName.trim();
    if (!trimmed) {
      toast.error("Parent category name is required.");
      return;
    }

    try {
      await createCategory({ name: trimmed, parent: null }).unwrap();
      toast.success("Parent category created!");
      setNewParentName("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create parent category.");
    }
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    const trimmed = newChildName.trim();
    if (!trimmed) {
      toast.error("Child category name is required.");
      return;
    }
    if (!selectedParentId) {
      toast.error("Select a parent category first.");
      return;
    }

    try {
      await createCategory({ name: trimmed, parent: selectedParentId }).unwrap();
      toast.success("Child category created!");
      setNewChildName("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create child category.");
    }
  };

  const startEditing = (category) => {
    setEditingId(category._id);
    setEditingName(category.name);
    setEditingParent(getParentId(category) || ROOT_PARENT_VALUE);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
    setEditingParent(ROOT_PARENT_VALUE);
  };

  const saveEditing = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty.");
      return;
    }

    try {
      await updateCategory({
        id,
        name: trimmed,
        parent: editingParent === ROOT_PARENT_VALUE ? null : editingParent,
      }).unwrap();
      toast.success("Category updated!");
      cancelEditing();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update category.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget._id).unwrap();
      toast.success("Category deleted.");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete category.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
        <p className="text-muted-foreground">
          Create parent categories and child branches for course breadcrumbs and topic organization.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create parent category</CardTitle>
            <CardDescription>
              Example: Development, Business, Design, Marketing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateParent} className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="e.g., Development"
                value={newParentName}
                onChange={(e) => setNewParentName(e.target.value)}
              />
              <Button type="submit" disabled={isCreating} className="shrink-0">
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Add Parent
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create child category</CardTitle>
            <CardDescription>
              Example: Web Development inside Development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateChild} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Create a parent first.</div>
                  ) : (
                    parentCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input
                placeholder="e.g., Web Development"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
              />
              <Button type="submit" disabled={isCreating} className="shrink-0">
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Add Child
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category hierarchy</CardTitle>
          <CardDescription>
            Student course pages use this hierarchy for breadcrumbs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error?.data?.message || "Failed to load categories."}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableCaption>
                {categories.length} categor{categories.length !== 1 ? "ies" : "y"} total.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  parentCategories.map((parent) => {
                    const children = childrenByParent[parent._id] || [];
                    return [parent, ...children].map((category) => {
                      const isChild = !!getParentId(category);
                      return (
                        <TableRow key={category._id}>
                          <TableCell className="font-medium">
                            {editingId === category._id ? (
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveEditing(category._id)}
                                autoFocus
                              />
                            ) : (
                              <span className={isChild ? "pl-6" : "font-semibold"}>
                                {isChild ? "- " : ""}{category.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingId === category._id ? (
                              <Select value={editingParent} onValueChange={setEditingParent}>
                                <SelectTrigger className="max-w-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={ROOT_PARENT_VALUE}>No parent</SelectItem>
                                  {parentCategories
                                    .filter((parentOption) => parentOption._id !== category._id)
                                    .map((parentOption) => (
                                      <SelectItem key={parentOption._id} value={parentOption._id}>
                                        {parentOption.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-muted-foreground">
                                {category.parent?.name || "Parent category"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                          <TableCell className="text-right">
                            {editingId === category._id ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEditing(category._id)}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => startEditing(category)}
                                  aria-label="Edit category"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteTarget(category)}
                                  aria-label="Delete category"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  }).flat()
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No categories yet. Add a parent category above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Parent categories with child categories cannot be deleted until their children are removed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoryManager;
