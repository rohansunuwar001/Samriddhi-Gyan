import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import { useParams, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import LoadingSpinner from "@/components/LoadingSpinner";

const PurchaseCourseProtectedRoute = ({ children }) => {
    const { courseId } = useParams();
    const { data, isLoading, isError } = useGetCourseDetailWithStatusQuery(courseId);

    // Show a loading state while fetching the purchase status
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // If there was an error fetching, redirect back as a fallback
    if (isError) {
        return <Navigate to={`/course/${courseId}`} />;
    }

    // --- FIX: Access the 'purchaseStatus' from the nested 'course' object ---
    // The API returns { success: true, course: { purchaseStatus: 'completed' } }
    const isCompleted = data?.course?.purchaseStatus === "completed";

    return isCompleted ? children : <Navigate to={`/course/${data?.course?.slug || courseId}`} />;
};

PurchaseCourseProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default PurchaseCourseProtectedRoute;