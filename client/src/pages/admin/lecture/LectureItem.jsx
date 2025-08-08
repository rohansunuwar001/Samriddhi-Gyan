import { Button } from "@/components/ui/button";
import { Edit, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";


const LectureItem = ({ lecture, courseId, index }) => {
    const navigate = useNavigate();

    const goToUpdateLecture = () => {
        // Correct, more explicit path for editing
        navigate(`/admin/course/${courseId}/lecture/${lecture._id}`);
    };

    return (
        <div className="flex items-center justify-between bg-background px-3 py-2 rounded border hover:bg-muted/50">
            <div className="flex items-center gap-3">
                <Video size={16} className="text-muted-foreground" />
                <p className="font-medium text-sm">
                    Lecture {index}: {lecture.title}
                </p>
            </div>
            <Button variant="ghost" size="icon" onClick={goToUpdateLecture}>
                <Edit size={16} />
            </Button>
        </div>
    );
};


LectureItem.propTypes = {
    lecture: PropTypes.object.isRequired,
    courseId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    };

export default LectureItem;