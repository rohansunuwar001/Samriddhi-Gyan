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

import { AlertCircle, Edit, Loader2, PlusCircle, Trash2, Compass, Tag } from "lucide-react";
import ExploreMenuManager from "./ExploreMenuManager";

const ROOT_PARENT_VALUE = "__root__";

const getParentId = (category) => category.parent?._id || category.parent || null;

const CategoryManager = () => {
  const [activeTab, setActiveTab] = useState("categories"); // 'categories' or 'explore-menu'

  // Create state
  const [newParentName, setNewParentName] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // Sub-child Create state
  const [newSubChildName, setNewSubChildName] = useState("");
  const [subSelectedParentId, setSubSelectedParentId] = useState("");
  const [subSelectedChildId, setSubSelectedChildId] = useState("");

  // Edit/Delete state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingParent, setEditingParent] = useState(ROOT_PARENT_VALUE);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError, error } = useGetAllCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const categories = data?.categories || [];

  // Helper map for fast lookup
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c._id] = c;
    });
    return map;
  }, [categories]);

  // Determine hierarchical depth (0 = parent, 1 = child, 2 = sub-child)
  const getCategoryLevel = (category) => {
    const pId = getParentId(category);
    if (!pId) return 0;
    
    const parentCat = categoryMap[pId];
    if (!parentCat) return 1;

    const gpId = getParentId(parentCat);
    if (!gpId) return 1;

    return 2;
  };

  // Memoized filtered category lists
  const parentCategories = useMemo(
    () => categories.filter((c) => getCategoryLevel(c) === 0),
    [categories, categoryMap]
  );

  const childCategories = useMemo(
    () => categories.filter((c) => getCategoryLevel(c) === 1),
    [categories, categoryMap]
  );

  const subChildCategories = useMemo(
    () => categories.filter((c) => getCategoryLevel(c) === 2),
    [categories, categoryMap]
  );

  // Subcategories filtered by selected parent in the sub-child panel
  const childrenFilteredByParent = useMemo(() => {
    if (!subSelectedParentId) return [];
    return childCategories.filter((c) => getParentId(c) === subSelectedParentId);
  }, [childCategories, subSelectedParentId]);

  // Build a flat list in hierarchical order: Parent > Child > Sub-child
  const renderedRows = useMemo(() => {
    const list = [];
    
    parentCategories.forEach((parent) => {
      list.push({ ...parent, level: 0 });
      
      const children = childCategories.filter((c) => getParentId(c) === parent._id);
      children.forEach((child) => {
        list.push({ ...child, level: 1 });
        
        const subChildren = subChildCategories.filter((c) => getParentId(c) === child._id);
        subChildren.forEach((subChild) => {
          list.push({ ...subChild, level: 2 });
        });
      });
    });

    // Fallback/Safety: push any categories that didn't match the clean structure
    categories.forEach((c) => {
      if (!list.some((l) => l._id === c._id)) {
        list.push({ ...c, level: getCategoryLevel(c) });
      }
    });

    return list;
  }, [categories, parentCategories, childCategories, subChildCategories, categoryMap]);

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

  const handleCreateSubChild = async (e) => {
    e.preventDefault();
    const trimmed = newSubChildName.trim();
    if (!trimmed) {
      toast.error("Sub-child category name is required.");
      return;
    }
    if (!subSelectedChildId) {
      toast.error("Select a child category first.");
      return;
    }

    try {
      await createCategory({ name: trimmed, parent: subSelectedChildId }).unwrap();
      toast.success("Sub-child category created!");
      setNewSubChildName("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create sub-child category.");
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
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen text-left">
      <header>
        <h2 className="text-5xl font-light tracking-tight text-slate-900 font-sans">
          {activeTab === "categories" ? "Categories" : "Explore Menu Customizer"}
        </h2>
        <p className="text-muted-foreground font-sans">
          {activeTab === "categories"
            ? "Create parent categories, child categories, and sub-child categories for course breadcrumbs and topic organization."
            : "Customize Section 1 (New & Featured) and Section 2 (Explore by goal) of the user-facing Explore dropdown."}
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "categories"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Tag className="w-4 h-4" />
          Course Categories
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("explore-menu")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "explore-menu"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Compass className="w-4 h-4" />
          Explore Menu (New & Featured / Goals)
        </button>
      </div>

      {activeTab === "explore-menu" ? (
        <ExploreMenuManager />
      ) : (
        <>
          {/* CREATE FORMS ROW */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CREATE PARENT (LEVEL 0) */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-light text-slate-800">Create parent category</CardTitle>
            <CardDescription>
              Example: Development, Business, Design, Marketing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateParent} className="flex flex-col gap-3">
              <Input
                placeholder="e.g., Development"
                value={newParentName}
                onChange={(e) => setNewParentName(e.target.value)}
              />
              <Button type="submit" disabled={isCreating} className="w-full">
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

        {/* CREATE CHILD (LEVEL 1) */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-light text-slate-800">Create child category</CardTitle>
            <CardDescription>
              Example: Web Development inside Development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateChild} className="flex flex-col gap-3">
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.length === 0 ? (
                    <div className="px-2 py-1.5 text-lg text-muted-foreground">Create a parent first.</div>
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
              <Button type="submit" disabled={isCreating} className="w-full">
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

        {/* CREATE SUB-CHILD (LEVEL 2) */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-light text-slate-800">Create sub-child category</CardTitle>
            <CardDescription>
              Example: Javascript inside Web Development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubChild} className="flex flex-col gap-3">
              <Select value={subSelectedParentId} onValueChange={(val) => {
                setSubSelectedParentId(val);
                setSubSelectedChildId(""); // reset child selection
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={subSelectedChildId} onValueChange={setSubSelectedChildId} disabled={!subSelectedParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  {childrenFilteredByParent.length === 0 ? (
                    <div className="px-2 py-1.5 text-lg text-muted-foreground">No child categories found.</div>
                  ) : (
                    childrenFilteredByParent.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Input
                placeholder="e.g., JavaScript"
                value={newSubChildName}
                onChange={(e) => setNewSubChildName(e.target.value)}
                disabled={!subSelectedChildId}
              />
              <Button type="submit" disabled={isCreating || !subSelectedChildId} className="w-full">
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Add Sub-child
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* HIERARCHY TABLE */}
      <Card className="shadow-sm border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-light text-slate-800">Category hierarchy</CardTitle>
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
                {renderedRows.length > 0 ? (
                  renderedRows.map((category) => {
                    const level = category.level;
                    
                    // Generate full breadcrumb description for Parent column
                    let parentText = "Parent category";
                    if (level === 1) {
                      const p = categoryMap[getParentId(category)];
                      parentText = p?.name || "Parent category";
                    } else if (level === 2) {
                      const child = categoryMap[getParentId(category)];
                      const parent = child ? categoryMap[getParentId(child)] : null;
                      parentText = `${parent?.name || "?"} > ${child?.name || "?"}`;
                    }

                    return (
                      <TableRow key={category._id}>
                        <TableCell className="font-extralight">
                          {editingId === category._id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveEditing(category._id)}
                              autoFocus
                            />
                          ) : (
                            <span 
                              className={`
                                block
                                ${level === 0 ? "font-light text-slate-900" : ""}
                                ${level === 1 ? "pl-6 text-slate-800" : ""}
                                ${level === 2 ? "pl-12 text-slate-500 italic" : ""}
                              `}
                            >
                              {level === 1 && "- "}
                              {level === 2 && "-- "}
                              {category.name}
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
                                {categories
                                  .filter((parentOption) => parentOption._id !== category._id)
                                  .map((parentOption) => (
                                    <SelectItem key={parentOption._id} value={parentOption._id}>
                                      {parentOption.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground font-extralight text-base">
                              {parentText}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-base">{category.slug}</TableCell>
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
                  })
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
        </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Categories with subcategories cannot be deleted until their children are removed.
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
