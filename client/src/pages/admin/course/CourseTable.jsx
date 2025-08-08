import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetCreatorCourseQuery } from "@/features/api/courseApi";
import { Edit, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CourseTable = () => {
    const { data, isLoading, isError } = useGetCreatorCourseQuery();
    console.log("Course Data:", data); // Debugging line to check fetched data
    const navigate = useNavigate();

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
                                {/* --- THE FIX IS HERE --- */}
                                {/* 1. Use 'courseTitle' instead of 'title' */}
                                <TableCell className="font-semibold">{course.title}</TableCell>
                                
                                {/* 2. Use 'coursePrice' instead of 'price.current' */}
                                <TableCell>Rs{course.coursePrice ?? 'N/A'}</TableCell>
                                
                                {/* 3. The 'totalLectures' field is correct in your JSON */}
                                <TableCell>{course.totalLectures || 0}</TableCell>
                                
                                <TableCell>
                                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                                        {course.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </TableCell>
                                
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => navigate(`${course._id}`)}>
                                        <Edit className="h-4 w-4" />
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