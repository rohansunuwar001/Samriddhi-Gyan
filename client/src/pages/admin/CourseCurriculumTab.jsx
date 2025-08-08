import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateSectionMutation, useGetCourseByIdQuery } from '@/features/api/courseApi';
import { Loader2, PlusCircle } from 'lucide-react';
import SectionManager from './SectionManager';


const CourseCurriculumTab = () => {
    const { courseId } = useParams();
    const [newSectionTitle, setNewSectionTitle] = useState("");

    const { data: courseData, isLoading: isLoadingCourse, isError } = useGetCourseByIdQuery(courseId);
    const [createSection, { isLoading: isCreatingSection }] = useCreateSectionMutation();

    const handleAddSection = async (e) => {
        e.preventDefault();
        if (!newSectionTitle.trim()) {
            toast.error("Please provide a title for the section.");
            return;
        }
        try {
            await createSection({ courseId, title: newSectionTitle }).unwrap();
            toast.success("Section created!");
            setNewSectionTitle("");
        } catch (err) {
            toast.error(err.data?.message || "Failed to create section.");
        }
    };

    if (isLoadingCourse) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader>
                <CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-32 w-full" /></CardContent>
            </Card>
        )
    }
    if (isError) return <div className="p-8 text-center text-red-500">Error loading curriculum. Please try again.</div>;

    const sections = courseData?.course?.sections || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>Organize your course into sections and lectures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleAddSection} className="p-4 border rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                        <Input placeholder="e.g., Introduction to Your Course" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} className="flex-grow bg-background" />
                        <Button type="submit" disabled={isCreatingSection}>
                            {isCreatingSection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Add Section
                        </Button>
                    </div>
                </form>

                <div className="space-y-4">
                    {sections.length > 0 ? (
                        sections.map((section) => (
                            <SectionManager key={section._id} section={section} courseId={courseId} />
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                            <p>This course has no sections yet. Add your first one above!</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CourseCurriculumTab;