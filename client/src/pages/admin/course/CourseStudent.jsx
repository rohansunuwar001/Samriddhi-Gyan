import { useGetCoursesWithEnrolledStudentsQuery } from "@/features/api/instructorApi";


 // src/pages/instructor/CourseStudentPage.jsx

import React, { useState, useMemo } from 'react';


// --- UI COMPONENTS ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- ICONS ---
import { Search, AlertCircle, Users } from 'lucide-react';

/**
 * Skeleton loading state for the student table.
 */
const TableSkeleton = ({ rows = 8 }) => (
    Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
    ))
);


const CourseStudent = () => {
    // --- State Management ---
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState("all");
    const ITEMS_PER_PAGE = 10;

    // --- RTK Query Hook ---
    const { data, isLoading, isError, error } = useGetCoursesWithEnrolledStudentsQuery();

    // --- Client-Side Data Transformation and Filtering ---
    // Memoize this complex operation to ensure it only runs when data changes.
    const filteredAndPaginatedEnrollments = useMemo(() => {
        // Step 1: Flatten the nested data into a single array of enrollments
        const allEnrollments = data?.courses?.flatMap(course => 
            course.students.map(student => ({
                ...student, // a student object
                courseId: course.courseId,
                courseTitle: course.courseTitle,
                enrollmentId: `${course.courseId}-${student._id}` // Create a unique key
            }))
        ) || [];

        // Step 2: Apply filters based on UI state
        const filtered = allEnrollments.filter(enrollment => {
            const courseMatch = selectedCourseId === 'all' || enrollment.courseId === selectedCourseId;
            const searchMatch = !searchQuery || 
                                enrollment.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                enrollment.email.toLowerCase().includes(searchQuery.toLowerCase());
            return courseMatch && searchMatch;
        });
        
        // Step 3: Apply pagination to the filtered results
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return {
            paginated,
            totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE),
            totalFilteredCount: filtered.length,
        };

    }, [data, searchQuery, selectedCourseId, currentPage]);
    
    const { paginated: enrollments, totalPages, totalFilteredCount } = filteredAndPaginatedEnrollments;
    
    // --- Render Logic ---
    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Enrolled Students</h2>
                <p className="text-muted-foreground">View and manage students enrolled in your courses.</p>
            </header>

            <Card>
                <CardHeader>
                    {/* --- Filter & Search Controls --- */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:w-auto flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by student name or email..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1); // Reset page on new search
                                }}
                            />
                        </div>
                        <Select onValueChange={(value) => {
                                    setSelectedCourseId(value);
                                    setCurrentPage(1); // Reset page on new filter
                                }}
                                value={selectedCourseId}
                        >
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Filter by course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {data?.courses?.map(course => (
                                    <SelectItem key={course.courseId} value={course.courseId}>
                                        {course.courseTitle}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isError && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error.data?.message || "Failed to load data."}</AlertDescription></Alert>)}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Enrolled In</TableHead>
                                <TableHead className="hidden md:table-cell">Contact</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? <TableSkeleton /> : 
                            enrollments.length > 0 ? (
                                enrollments.map((enrollment) => (
                                    <TableRow key={enrollment.enrollmentId}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar><AvatarImage src={enrollment.photoUrl} alt={enrollment.name} /><AvatarFallback>{enrollment.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                                <p className="font-medium">{enrollment.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell><span className="font-medium text-muted-foreground">{enrollment.courseTitle}</span></TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">{enrollment.email}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} className="h-32 text-center text-muted-foreground">No students found matching your criteria.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* --- Pagination Controls --- */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <span className="text-sm text-muted-foreground">
                                Showing <strong>{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalFilteredCount)} - {Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredCount)}</strong> of <strong>{totalFilteredCount}</strong> students
                            </span>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</Button>
                                <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};


export default CourseStudent;
