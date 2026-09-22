import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  useGetAllTopicsQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
} from "@/features/api/topicApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle, Edit, Loader2, PlusCircle, Trash2, Upload, Image as ImageIcon } from "lucide-react";

const TopicManager = () => {
  // Create Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("topic");
  const [parentCategory, setParentCategory] = useState("");
  const [description, setDescription] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [relatedTopics, setRelatedTopics] = useState("");

  // Logo upload state (Create)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  // Edit Form State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingType, setEditingType] = useState("topic");
  const [editingParentCategory, setEditingParentCategory] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingBannerTitle, setEditingBannerTitle] = useState("");
  const [editingLogoUrl, setEditingLogoUrl] = useState("");
  const [editingRelatedTopics, setEditingRelatedTopics] = useState("");

  // Logo upload state (Edit)
  const [isUploadingEditLogo, setIsUploadingEditLogo] = useState(false);
  const [editLogoPreview, setEditLogoPreview] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: topicsData, isLoading, isError, error } = useGetAllTopicsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const [createTopic, { isLoading: isCreating }] = useCreateTopicMutation();
  const [updateTopic, { isLoading: isUpdating }] = useUpdateTopicMutation();
  const [deleteTopic, { isLoading: isDeleting }] = useDeleteTopicMutation();

  const topics = topicsData?.topics || [];
  const categories = categoriesData?.categories || [];

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c._id] = c;
    });
    return map;
  }, [categories]);

  const getCategoryLevel = (category) => {
    const pId = category.parent?._id || category.parent || null;
    if (!pId) return 0;
    const parentCat = categoryMap[pId];
    if (!parentCat) return 1;
    const gpId = parentCat.parent?._id || parentCat.parent || null;
    if (!gpId) return 1;
    return 2;
  };

  const parents = useMemo(
    () => categories.filter((c) => getCategoryLevel(c) === 0),
    [categories, categoryMap]
  );

  const selectedHierarchy = useMemo(() => {
    const selected = categories.find((c) => c.name === parentCategory);
    if (!selected) {
      return { parentId: "", childId: "", subChildId: "" };
    }

    const pId = selected.parent?._id || selected.parent || null;
    if (!pId) {
      return { parentId: selected._id, childId: "", subChildId: "" };
    }

    const parentCat = categories.find((c) => c._id === pId);
    if (!parentCat) {
      return { parentId: "", childId: selected._id, subChildId: "" };
    }

    const gpId = parentCat.parent?._id || parentCat.parent || null;
    if (!gpId) {
      return { parentId: parentCat._id, childId: selected._id, subChildId: "" };
    }

    return { parentId: gpId, childId: parentCat._id, subChildId: selected._id };
  }, [parentCategory, categories]);

  const editingSelectedHierarchy = useMemo(() => {
    const selected = categories.find((c) => c.name === editingParentCategory);
    if (!selected) {
      return { parentId: "", childId: "", subChildId: "" };
    }

    const pId = selected.parent?._id || selected.parent || null;
    if (!pId) {
      return { parentId: selected._id, childId: "", subChildId: "" };
    }

    const parentCat = categories.find((c) => c._id === pId);
    if (!parentCat) {
      return { parentId: "", childId: selected._id, subChildId: "" };
    }

    const gpId = parentCat.parent?._id || parentCat.parent || null;
    if (!gpId) {
      return { parentId: parentCat._id, childId: selected._id, subChildId: "" };
    }

    return { parentId: gpId, childId: parentCat._id, subChildId: selected._id };
  }, [editingParentCategory, categories]);

  // Direct Cloudinary Upload handler using Server Media proxy
  const handleUploadLogo = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:10000";
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${baseUrl}/api/v1/media/upload-video`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image.");
    }

    const result = await response.json();
    return result.data?.secure_url || result.data?.url;
  };

  const onLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoPreview(URL.createObjectURL(file));
    setIsUploadingLogo(true);

    try {
      const secureUrl = await handleUploadLogo(file);
      setLogoUrl(secureUrl);
      toast.success("Logo uploaded to Cloudinary!");
    } catch (err) {
      toast.error("Failed to upload logo to Cloudinary.");
      console.error(err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onEditLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditLogoPreview(URL.createObjectURL(file));
    setIsUploadingEditLogo(true);

    try {
      const secureUrl = await handleUploadLogo(file);
      setEditingLogoUrl(secureUrl);
      toast.success("Edit logo uploaded to Cloudinary!");
    } catch (err) {
      toast.error("Failed to upload logo to Cloudinary.");
      console.error(err);
    } finally {
      setIsUploadingEditLogo(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required.");
      return;
    }

    try {
      await createTopic({
        name: trimmed,
        type,
        parentCategory,
        description,
        bannerTitle,
        logoUrl,
        relatedTopics: relatedTopics.split(",").map((t) => t.trim()).filter(Boolean),
      }).unwrap();

      toast.success("Topic/Certification created successfully!");
      // Reset form
      setName("");
      setType("topic");
      setParentCategory("");
      setDescription("");
      setBannerTitle("");
      setLogoUrl("");
      setRelatedTopics("");
      setLogoPreview("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create topic.");
    }
  };

  const startEditing = (topic) => {
    setEditingId(topic._id);
    setEditingName(topic.name);
    setEditingType(topic.type);
    setEditingParentCategory(topic.parentCategory || "");
    setEditingDescription(topic.description || "");
    setEditingBannerTitle(topic.bannerTitle || "");
    setEditingLogoUrl(topic.logoUrl || "");
    setEditingRelatedTopics((topic.relatedTopics || []).join(", "));
    setEditLogoPreview(topic.logoUrl || "");
    setIsEditDialogOpen(true);
  };

  const saveEditing = async (e) => {
    e.preventDefault();
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty.");
      return;
    }

    try {
      await updateTopic({
        id: editingId,
        name: trimmed,
        type: editingType,
        parentCategory: editingParentCategory,
        description: editingDescription,
        bannerTitle: editingBannerTitle,
        logoUrl: editingLogoUrl,
        relatedTopics: editingRelatedTopics.split(",").map((t) => t.trim()).filter(Boolean),
      }).unwrap();

      toast.success("Topic updated successfully!");
      setIsEditDialogOpen(false);
      setEditingId(null);
      setEditLogoPreview("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update topic.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTopic(deleteTarget._id).unwrap();
      toast.success("Topic deleted.");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete topic.");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Clean pointer events on dialog close
  useEffect(() => {
    if (!isEditDialogOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditDialogOpen]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen text-left select-none">
      <header>
        <h2 className="text-5xl font-light tracking-tight text-slate-900">Topics & Certifications</h2>
        <p className="text-muted-foreground">
          Manage dynamic learning topics and professional certifications. Metrics are calculated dynamically based on matching course data.
        </p>
      </header>

      {/* CREATE TOPIC FORM */}
      <Card>
        <CardHeader>
          <CardTitle>Create Topic / Certification</CardTitle>
          <CardDescription>
            Specify the metadata, badge logo, and category alignment for the dynamic landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-lg font-extralight">Name</label>
                <Input
                  placeholder="e.g., ChatGPT"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-lg font-extralight">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topic">Regular Topic</SelectItem>
                    <SelectItem value="certification">Professional Certification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3-Level Category Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <div>
                <label className="text-base font-light text-slate-700">Category (Parent)</label>
                <Select
                  value={selectedHierarchy.parentId}
                  onValueChange={(val) => {
                    const cat = categories.find((c) => c._id === val);
                    setParentCategory(cat ? cat.name : "");
                  }}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="Select Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.length === 0 ? (
                      <SelectItem value="none" disabled>No categories available</SelectItem>
                    ) : (
                      parents.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-base font-light text-slate-700">Subcategory (Child)</label>
                <Select
                  value={selectedHierarchy.childId}
                  onValueChange={(val) => {
                    const cat = categories.find((c) => c._id === val);
                    setParentCategory(cat ? cat.name : "");
                  }}
                  disabled={!selectedHierarchy.parentId}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => (c.parent?._id || c.parent) === selectedHierarchy.parentId)
                      .map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-base font-light text-slate-700">Topic (Sub-child)</label>
                <Select
                  value={selectedHierarchy.subChildId}
                  onValueChange={(val) => {
                    const cat = categories.find((c) => c._id === val);
                    setParentCategory(cat ? cat.name : "");
                  }}
                  disabled={!selectedHierarchy.childId}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="Select Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => (c.parent?._id || c.parent) === selectedHierarchy.childId)
                      .map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-lg font-extralight">Banner Title</label>
                <Input
                  placeholder="e.g., ChatGPT Courses"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-lg font-extralight">Related Topics (Comma separated)</label>
                <Input
                  placeholder="IT & Software, Business"
                  value={relatedTopics}
                  onChange={(e) => setRelatedTopics(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-lg font-extralight flex items-center gap-1">
                  Logo / Badge
                  {isUploadingLogo && <Loader2 className="h-3 w-3 animate-spin text-purple-600" />}
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={onLogoChange}
                    className="cursor-pointer file:bg-slate-100 file:border-0 file:rounded-md file:text-base file:font-light"
                  />
                  {logoPreview && (
                    <Avatar className="h-9 w-9 border border-slate-200">
                      <AvatarImage src={logoPreview} />
                      <AvatarFallback><ImageIcon className="h-4 w-4 text-slate-400" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-lg font-extralight">Description</label>
              <Textarea
                placeholder="Topic description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={isCreating || isUploadingLogo} className="w-full">
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Add Topic / Certification
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* EXISTING TOPICS LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Topics & Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error?.data?.message || "Failed to load topics."}
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
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  {topics.length} topic{topics.length !== 1 ? "s" : ""} total.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Badge</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Avg Rating</TableHead>
                    <TableHead className="text-right">Enrolled Students</TableHead>
                    <TableHead className="text-right">Practice Exercises</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.length > 0 ? (
                    topics.map((topic) => (
                      <TableRow key={topic._id}>
                        <TableCell>
                          <Avatar className="h-8 w-8 border border-slate-200 bg-white">
                            <AvatarImage src={topic.logoUrl} alt={topic.name} />
                            <AvatarFallback><ImageIcon className="h-4 w-4 text-slate-300" /></AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-light text-slate-900">
                          {topic.name}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{topic.type}</span>
                        </TableCell>
                        <TableCell>
                          <span>{topic.parentCategory || "-"}</span>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-slate-500">
                          {topic.description || "—"}
                        </TableCell>
                        <TableCell className="text-right font-extralight text-amber-700">
                          {topic.rating ? `${topic.rating} ★` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-extralight">
                          {topic.numLearners?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right font-extralight text-slate-600">
                          {topic.handsOnPracticeCount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => startEditing(topic)}>
                              <Edit className="h-4 w-4 text-slate-700" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(topic)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                        No topics or certifications created yet. Create one above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT DIALOG MODAL */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-3xl font-light text-slate-900">
              Edit Topic / Certification
            </DialogTitle>
            <DialogDescription>
              Make changes to the metadata, badge badge, and descriptions of this topic.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveEditing} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-name" className="text-base font-light text-slate-700">Name</Label>
                <Input
                  id="edit-name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-type" className="text-base font-light text-slate-700">Type</Label>
                <Select value={editingType} onValueChange={setEditingType}>
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topic">Regular Topic</SelectItem>
                    <SelectItem value="certification">Professional Certification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-banner" className="text-base font-light text-slate-700">Banner Title</Label>
              <Input
                id="edit-banner"
                value={editingBannerTitle}
                onChange={(e) => setEditingBannerTitle(e.target.value)}
              />
            </div>

            {/* Edit Category hierarchy selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
              <div className="space-y-1">
                <Label className="text-base font-light text-slate-700">Category (Parent)</Label>
                <Select
                  value={editingSelectedHierarchy.parentId}
                  onValueChange={(val) => {
                    const cat = categories.find((c) => c._id === val);
                    setEditingParentCategory(cat ? cat.name : "");
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.length === 0 ? (
                      <SelectItem value="none" disabled>No categories available</SelectItem>
                    ) : (
                      parents.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-base font-light text-slate-700">Subcategory (Child)</Label>
                <Select
                  value={editingSelectedHierarchy.childId}
                  onValueChange={(val) => {
                    const cat = categories.find((c) => c._id === val);
                    setEditingParentCategory(cat ? cat.name : "");
                  }}
                  disabled={!editingSelectedHierarchy.parentId}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => (c.parent?._id || c.parent) === editingSelectedHierarchy.parentId)
                      .map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-base font-light text-slate-700">Topic (Sub-child)</Label>
                <Select
                  value={editingSelectedHierarchy.subChildId}
                  onValueChange={(val) => {
                    const cat = categories.find((c) => c._id === val);
                    setEditingParentCategory(cat ? cat.name : "");
                  }}
                  disabled={!editingSelectedHierarchy.childId}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => (c.parent?._id || c.parent) === editingSelectedHierarchy.childId)
                      .map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-related" className="text-base font-light text-slate-700">Related Topics (Comma separated)</Label>
                <Input
                  id="edit-related"
                  value={editingRelatedTopics}
                  onChange={(e) => setEditingRelatedTopics(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-base font-light text-slate-700 flex items-center gap-1">
                  Logo / Badge
                  {isUploadingEditLogo && <Loader2 className="h-3 w-3 animate-spin text-purple-600" />}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={onEditLogoChange}
                    className="cursor-pointer file:bg-slate-100 file:border-0 file:rounded-md file:text-base file:font-light"
                  />
                  {editLogoPreview && (
                    <Avatar className="h-9 w-9 border border-slate-200">
                      <AvatarImage src={editLogoPreview} />
                      <AvatarFallback><ImageIcon className="h-4 w-4 text-slate-400" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-description" className="text-base font-light text-slate-700">Description</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
              />
            </div>

            {/* Note stating dynamic stats */}
            <div className="p-3 bg-purple-50 border border-purple-100 rounded text-[11px] text-purple-700">
              Note: Learners count, practice counts, and ratings are calculated dynamically based on database course enrollments and coding exercises.
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdating || isUploadingEditLogo}
                className="bg-slate-900 hover:bg-black text-white font-light flex items-center gap-1.5"
              >
                {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG MODAL */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the topic metadata. Matching courses will NOT be deleted, but they will no longer display on this topic's dynamic page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TopicManager;
