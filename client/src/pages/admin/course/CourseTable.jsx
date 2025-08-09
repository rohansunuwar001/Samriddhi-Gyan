import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetCreatorCourseQuery, useRemoveCourseMutation } from "@/features/api/courseApi";
import { Edit, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; // or your preferred toast library
import Swal from 'sweetalert2';
import { useState } from "react";

let CourseTable = () => {
    let { data, isLoading, isError, refetch } = useGetCreatorCourseQuery();
    let [removeCourse, { isLoading: isRemoving }] = useRemoveCourseMutation();
    let navigate = useNavigate();
    const [deletingId, setDeletingId] = useState(null); // Track which course is being deleted

    if (isLoading) {
        return (
            <div className="space-y-4 p-4 sm:p-6">
                 <div className="flex justify-end"><Skeleton className="h-10 w-48" /></div>
                 <Skeleton className="h-64 w-full" />
            </div>
        )
    }
    if (isError) return <div className="text-center text-red-500 py-10">Failed to load courses. Please try again.</div>

    const courses = data?.courses || [];

    // Remove handler with SweetAlert2
    const handleRemove = async (courseId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will permanently delete the course.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (result.isConfirmed) {
            try {
                setDeletingId(courseId); // Set the deleting course id
                await removeCourse(courseId).unwrap();
                toast.success("Course removed!");
                refetch();
            } catch {
                toast.error("Failed to remove course.");
            } finally {
                setDeletingId(null); // Reset after deletion
            }
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-end mb-4">
                <Button onClick={() => navigate(`create`)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Course
                </Button>
            </div>
            
            <Table>
                <TableCaption>A list of all courses you have created.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Price (NPR)</TableHead>
                        <TableHead>Lectures</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Manage</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <TableRow key={course._id}>
                                <TableCell className="font-semibold">{course.title}</TableCell>
                                <TableCell>
                                  Rs{course.price?.current ?? course.coursePrice ?? 'N/A'}
                                </TableCell>
                                <TableCell>{course.totalLectures || 0}</TableCell>
                                <TableCell>
                                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                                        {course.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                    <Button size="icon" variant="ghost" onClick={() => navigate(`${course._id}`)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => handleRemove(course._id)}
                                        disabled={isRemoving && deletingId === course._id}
                                        title="Remove Course"
                                    >
                                        {isRemoving && deletingId === course._id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan="5" className="text-center h-24">
                                You haven`t created any courses yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default CourseTable;