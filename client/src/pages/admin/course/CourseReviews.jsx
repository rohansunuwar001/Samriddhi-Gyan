// src/pages/instructor/CourseReviewsPage.jsx
// (This is the full and final code for this file)
import React, { useState, useMemo } from "react";
import {
  useGetCoursesWithEnrolledStudentsAndReviewsQuery,
  useReplyToReviewMutation,
  useDeleteReviewMutation,
} from "@/features/api/instructorApi";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  AlertCircle,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  Star,
} from "lucide-react";

const StarRatingDisplay = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

const ReplyToReviewDialog = ({ review, isOpen, onClose, onSave }) => {
  const [replyText, setReplyText] = useState("");
  React.useEffect(() => {
    if (review) setReplyText(review.reply || "");
  }, [review]);
  if (!review) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to Review</DialogTitle>
          <DialogDescription>
            Your reply will be visible to the student.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="p-4 border rounded-md bg-secondary">
            <p className="font-semibold">{review.user.name}</p>
            <StarRatingDisplay rating={review.rating} />
            <p className="text-sm text-muted-foreground mt-2 italic">
              "{review.comment}"
            </p>
          </div>
          <Textarea
            placeholder="Write your reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            className="mt-4"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(review, replyText)}>
            Submit Reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CourseReviews = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const ITEMS_PER_PAGE = 10;

  const { data, isLoading, isError, error } =
    useGetCoursesWithEnrolledStudentsAndReviewsQuery();
  const [replyToReview] = useReplyToReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const filteredReviews = useMemo(() => {
    const allReviews =
      data?.courses?.flatMap((c) =>
        c.reviews.map((r) => ({
          ...r,
          courseId: c.courseId,
          courseTitle: c.courseTitle,
        }))
      ) || [];
    return allReviews.filter(
      (r) =>
        (selectedCourseId === "all" || r.courseId === selectedCourseId) &&
        (selectedRating === "all" || r.rating === parseInt(selectedRating)) &&
        (!searchQuery ||
          r.comment.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, searchQuery, selectedCourseId, selectedRating]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);

  const openReplyDialog = (review) => {
    setSelectedReview(review);
    setIsReplyOpen(true);
  };
  const openDeleteDialog = (review) => {
    setSelectedReview(review);
    setIsDeleteOpen(true);
  };

  const handleReplySave = (review, replyText) => {
    toast.promise(
      replyToReview({ reviewId: review.reviewId, reply: replyText }).unwrap(),
      {
        loading: "Submitting reply...",
        success: "Reply posted successfully!",
        error: (err) => err.data?.message || "Failed to post reply.",
      }
    );
    setIsReplyOpen(false);
  };

  const confirmDelete = () => {
    if (!selectedReview) return;
    toast.promise(deleteReview(selectedReview.reviewId).unwrap(), {
      loading: "Deleting review...",
      success: "Review deleted.",
      error: (err) => err.data?.message || "Failed to delete review.",
    });
    setIsDeleteOpen(false);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Course Reviews</h2>
        <p className="text-muted-foreground">
          Manage and respond to student feedback.
        </p>
      </header>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              placeholder="Search comments..."
              className="flex-grow"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              onValueChange={(v) => {
                setSelectedCourseId(v);
                setCurrentPage(1);
              }}
              value={selectedCourseId}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {data?.courses?.map((c) => (
                  <SelectItem key={c.courseId} value={c.courseId}>
                    {c.courseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(v) => {
                setSelectedRating(v);
                setCurrentPage(1);
              }}
              value={selectedRating}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} Stars
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
                {error.data?.message || "Failed to load reviews."}
              </AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="hidden md:table-cell">Comment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedReviews.length > 0 ? (
                paginatedReviews.map((review) => (
                  <TableRow key={review.reviewId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.user?.photoUrl} />
                          <AvatarFallback>
                            {review.user?.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {review.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {review.courseTitle}
                    </TableCell>
                    <TableCell>
                      <StarRatingDisplay rating={review.rating} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm max-w-xs truncate">
                        {review.comment}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => openReplyDialog(review)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => openDeleteDialog(review)}
                            className="text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No reviews found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
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
      <ReplyToReviewDialog
        isOpen={isReplyOpen}
        onClose={() => setIsReplyOpen(false)}
        review={selectedReview}
        onSave={handleReplySave}
      />
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the review. This action cannot be
              undone.
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
export default CourseReviews;
