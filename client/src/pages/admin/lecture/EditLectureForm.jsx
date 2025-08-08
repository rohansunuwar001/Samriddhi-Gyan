import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDeleteLectureMutation, useGetLectureByIdQuery, useUpdateLectureMutation } from "@/features/api/courseApi";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const EditLectureForm = () => {
    const { lectureId, courseId } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [isPreview, setIsPreview] = useState(false);
    
    const { data: lectureData, isLoading: isLoadingLecture } = useGetLectureByIdQuery(lectureId);
    const [updateLecture, { isLoading: isUpdating }] = useUpdateLectureMutation();
    const [deleteLecture, { isLoading: isDeleting }] = useDeleteLectureMutation();
    
    useEffect(() => {
        if (lectureData?.lecture) {
            setTitle(lectureData.lecture.title);
            setIsPreview(lectureData.lecture.isPreview || false);
        }
    }, [lectureData]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('isPreview', isPreview);
        if (videoFile) formData.append('video', videoFile);
        try {
            const res = await updateLecture({ lectureId, formData, courseId }).unwrap();
            toast.success(res.message || "Lecture updated!");
        } catch (err) { toast.error(err.data?.message || "Update failed."); }
    };

    const handleDelete = async () => {
        if (window.confirm("Delete lecture? This is permanent.")) {
            try {
                await deleteLecture({ lectureId, courseId }).unwrap();
                toast.success("Lecture deleted.");
                navigate(`/admin/course/${courseId}`);
            } catch (err) { toast.error(err.data?.message || "Deletion failed."); }
        }
    };

    if (isLoadingLecture) return <p className="text-center p-8">Loading lecture editor...</p>;
    
    const lecture = lectureData?.lecture;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Editing Lecture: "{lecture?.title}"</CardTitle>
                <CardDescription>Update the title or replace the video file. Changes are saved instantly.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdate}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Lecture Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="video">Replace Video File</Label>
                        <Input id="video" type="file" onChange={(e) => setVideoFile(e.target.files?.[0])} accept="video/*" />
                        {lecture?.videoUrl && !videoFile && (
                            <div className="text-xs text-muted-foreground mt-2 p-2 border rounded-md bg-secondary/50">
                                Current video present. Upload a new file to replace it.
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="is-preview" checked={isPreview} onCheckedChange={setIsPreview} />
                        <Label htmlFor="is-preview">Allow Free Preview</Label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Delete"}
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                       {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save Changes"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default EditLectureForm;
