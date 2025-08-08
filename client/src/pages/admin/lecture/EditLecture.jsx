import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import EditLectureForm from "./EditLectureForm";

const EditLecture = () => {
    const { courseId } = useParams();

    return (
        <div className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <Link to={`/admin/course/${courseId}`}>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Curriculum
                    </Button>
                </Link>
            </div>
            <EditLectureForm />
        </div>
    );
};

export default EditLecture;