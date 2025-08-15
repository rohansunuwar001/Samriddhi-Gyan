// src/pages/admin/SupAdmCourseAnalytics.jsx
import React, { useState } from "react";
import { useGetPlatformAnalyticsQuery, useUpdateCourseMutation, useDeleteCourseMutation } from "@/features/api/adminApi";
import { toast } from "sonner";

// --- UI COMPONENTS ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// --- ICONS ---
import { DollarSign, BookOpen, Users, BarChart, MoreHorizontal, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import CountUp from 'react-countup';

// ====================================================================
// SUB-COMPONENTS
// ====================================================================

const StatCard = ({ title, value, icon: Icon, prefix = "" }) => (
    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold"><CountUp start={0} end={value} duration={2} separator="," prefix={prefix} /></div></CardContent></Card>
);

const TopInstructors = ({ instructors }) => (
    <Card className="h-full"><CardHeader><CardTitle>Top Instructors by Revenue</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            {instructors.map((inst, index) => (
                <div key={inst.instructorId} className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10"><AvatarFallback>{index + 1}</AvatarFallback></Avatar>
                    <div className="flex-1"><p className="text-sm font-medium truncate">{inst.name}</p><p className="text-sm text-muted-foreground">{inst.coursesSold} sales</p></div>
                    <div className="font-semibold text-green-500">Rs{inst.totalRevenue.toLocaleString()}</div>
                </div>
            ))}
        </CardContent>
    </Card>
);

const EditCourseDialog = ({ course, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = React.useState({});
    
    React.useEffect(() => {
        if (course) {
            setFormData({
                title: course.title || '',
                isPublished: course.isPublished || false,
                currentPrice: course.price?.current || 0,
            });
        }
    }, [course]);

    if (!course) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const payload = {
            title: formData.title,
            isPublished: formData.isPublished,
            price: { ...course.price, current: Number(formData.currentPrice) }
        };
        onSave(course._id, payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Course: {course.title}</DialogTitle><DialogDescription>Make changes to the course details. Click save when you're done.</DialogDescription></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Title</Label><Input id="title" name="title" value={formData.title} onChange={handleChange} className="col-span-3" /></div>
                    <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="price" className="text-right">Price (Rs)</Label><Input id="price" name="currentPrice" type="number" value={formData.currentPrice} onChange={handleChange} className="col-span-3" /></div>
                </div>
                <DialogFooter><Button onClick={handleSave}>Save Changes</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// ====================================================================
// MAIN PAGE COMPONENT
// ====================================================================

const SupAdmCourseAnalytics = () => {
    const { data, isLoading, isError, error } = useGetPlatformAnalyticsQuery();
    const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
    const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [selectedCourse, setSelectedCourse] = React.useState(null);

    const openEditDialog = (course) => {
        setSelectedCourse(course);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (course) => {
        setSelectedCourse(course);
        setIsDeleteDialogOpen(true);
    };
    
    const handleUpdateCourse = async (courseId, updateData) => {
        toast.promise(updateCourse({ courseId, ...updateData }).unwrap(), {
            loading: 'Updating course...',
            success: 'Course updated successfully!',
            error: (err) => err.data?.message || 'Failed to update course.',
        });
        setIsEditDialogOpen(false);
    };

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        toast.promise(deleteCourse(selectedCourse._id).unwrap(), {
            loading: 'Deleting course...',
            success: `Course "Rs{selectedCourse.title}" deleted.`,
            error: (err) => err.data?.message || 'Failed to delete course.',
        });
        setIsDeleteDialogOpen(false);
    };
    
    // --- Render Logic ---
    if (isLoading) return <DashboardSkeleton />;
    if (isError) return <ErrorState error={error} />;
    
    const analytics = data?.analytics;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-screen">
            <header>
                <h2 className="text-3xl font-bold tracking-tight">Platform Analytics</h2>
                <p className="text-muted-foreground">An overview of all instructors and courses.</p>
            </header>

            {/* --- Summary Stat Cards --- */}
            {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Platform Revenue" value={analytics?.summary.totalPlatformRevenue || 0} icon={DollarSign} prefix="Rs" />
                <StatCard title="Total Courses" value={analytics?.summary.totalCourses || 0} icon={BookOpen} />
                <StatCard title="Total Instructors" value={analytics?.summary.totalInstructors || 0} icon={Users} />
                <StatCard title="Total Enrollments" value={analytics?.summary.totalEnrollments || 0} icon={BarChart} />
            </div> */}

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>All Courses</CardTitle></CardHeader>
                    <CardContent>
                        <CourseTable courses={analytics?.allCourses || []} onEdit={openEditDialog} onDelete={openDeleteDialog} />
                    </CardContent>
                </Card>
                <TopInstructors instructors={analytics?.instructorsByRevenue || []} />
            </div>

            {/* --- Modals / Dialogs --- */}
            <EditCourseDialog isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} course={selectedCourse} onSave={handleUpdateCourse} />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action is permanent and cannot be undone. This will delete the course <strong>"{selectedCourse?.title}"</strong>.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

// Sub-components used within the main page
const CourseTable = ({ courses, onEdit, onDelete }) => (
    <Table>
        <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Instructor</TableHead><TableHead>Enrollments</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
            {courses.map(course => (
                <TableRow key={course._id}>
                    <TableCell><span className="font-medium">{course.title}</span></TableCell>
                    <TableCell className="text-muted-foreground">{course.creator?.name || 'N/A'}</TableCell>
                    <TableCell>{course.enrolledStudents?.length || 0}</TableCell>
                    <TableCell>Rs{course.price?.current?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell><Badge variant={course.isPublished ? "default" : "secondary"}>{course.isPublished ? "Published" : "Draft"}</Badge></TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(course)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => onDelete(course)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const DashboardSkeleton = () => (
     <div className="p-8 space-y-6"><div className="grid gap-6 md:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div></div>
);

const ErrorState = ({ error }) => (<div className="p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Data</AlertTitle><AlertDescription>{error?.data?.message || "An unexpected error occurred."}</AlertDescription></Alert></div>);

export default SupAdmCourseAnalytics;