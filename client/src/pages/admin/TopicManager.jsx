import { useState } from "react";
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
import { AlertCircle, Edit, Loader2, PlusCircle, Trash2 } from "lucide-react";

const TopicManager = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("topic");
  const [parentCategory, setParentCategory] = useState("");
  const [description, setDescription] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [numLearners, setNumLearners] = useState(0);
  const [handsOnPracticeCount, setHandsOnPracticeCount] = useState(0);
  const [rating, setRating] = useState(4.5);
  const [relatedTopics, setRelatedTopics] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingType, setEditingType] = useState("topic");
  const [editingParentCategory, setEditingParentCategory] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingBannerTitle, setEditingBannerTitle] = useState("");
  const [editingLogoUrl, setEditingLogoUrl] = useState("");
  const [editingNumLearners, setEditingNumLearners] = useState(0);
  const [editingHandsOnPracticeCount, setEditingHandsOnPracticeCount] = useState(0);
  const [editingRating, setEditingRating] = useState(4.5);
  const [editingRelatedTopics, setEditingRelatedTopics] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: topicsData, isLoading, isError, error } = useGetAllTopicsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const [createTopic, { isLoading: isCreating }] = useCreateTopicMutation();
  const [updateTopic, { isLoading: isUpdating }] = useUpdateTopicMutation();
  const [deleteTopic, { isLoading: isDeleting }] = useDeleteTopicMutation();

  const topics = topicsData?.topics || [];
  const categories = categoriesData?.categories || [];

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
        numLearners,
        handsOnPracticeCount,
        rating,
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
      setNumLearners(0);
      setHandsOnPracticeCount(0);
      setRating(4.5);
      setRelatedTopics("");
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
    setEditingNumLearners(topic.numLearners || 0);
    setEditingHandsOnPracticeCount(topic.handsOnPracticeCount || 0);
    setEditingRating(topic.rating || 4.5);
    setEditingRelatedTopics((topic.relatedTopics || []).join(", "));
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty.");
      return;
    }

    try {
      await updateTopic({
        id,
        name: trimmed,
        type: editingType,
        parentCategory: editingParentCategory,
        description: editingDescription,
        bannerTitle: editingBannerTitle,
        logoUrl: editingLogoUrl,
        numLearners: Number(editingNumLearners),
        handsOnPracticeCount: Number(editingHandsOnPracticeCount),
        rating: Number(editingRating),
        relatedTopics: editingRelatedTopics.split(",").map((t) => t.trim()).filter(Boolean),
      }).unwrap();

      toast.success("Topic updated!");
      setEditingId(null);
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

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen text-left">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Topics & Certifications</h2>
        <p className="text-muted-foreground">
          Manage dynamic learning topics (e.g., ChatGPT) and professional certifications (e.g., AWS Certified Cloud Practitioner).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create Topic / Certification</CardTitle>
          <CardDescription>
            Specify the metadata, statistics, and category alignment for the dynamic landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., ChatGPT"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
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

              <div>
                <label className="text-sm font-medium">Parent Category / Subcategory</label>
                <Select value={parentCategory} onValueChange={setParentCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category/sub" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Banner Title</label>
                <Input
                  placeholder="e.g., ChatGPT Courses"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Logo / Badge URL</label>
                <Input
                  placeholder="e.g., https://example.com/badge.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Related Topics (Comma separated)</label>
                <Input
                  placeholder="IT & Software, Business"
                  value={relatedTopics}
                  onChange={(e) => setRelatedTopics(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Number of Learners</label>
                <Input
                  type="number"
                  value={numLearners}
                  onChange={(e) => setNumLearners(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Hands-on Practice Count</label>
                <Input
                  type="number"
                  value={handsOnPracticeCount}
                  onChange={(e) => setHandsOnPracticeCount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Average Rating</label>
                <Input
                  type="number"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Topic description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={isCreating} className="w-full">
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
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Learners</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.length > 0 ? (
                    topics.map((topic) => (
                      <TableRow key={topic._id}>
                        <TableCell className="font-medium">
                          {editingId === topic._id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                            />
                          ) : (
                            <span className="font-semibold">{topic.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === topic._id ? (
                            <Select value={editingType} onValueChange={setEditingType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="topic">Topic</SelectItem>
                                <SelectItem value="certification">Certification</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="capitalize">{topic.type}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === topic._id ? (
                            <Select value={editingParentCategory} onValueChange={setEditingParentCategory}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c._id} value={c.name}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span>{topic.parentCategory || "-"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === topic._id ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editingRating}
                              onChange={(e) => setEditingRating(Number(e.target.value))}
                            />
                          ) : (
                            <span>{topic.rating} ★</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === topic._id ? (
                            <Input
                              type="number"
                              value={editingNumLearners}
                              onChange={(e) => setEditingNumLearners(Number(e.target.value))}
                            />
                          ) : (
                            <span>{topic.numLearners?.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === topic._id ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => saveEditing(topic._id)} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" onClick={() => startEditing(topic)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(topic)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
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
