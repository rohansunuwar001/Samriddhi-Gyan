import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGetPublishedCourseQuery } from "@/features/api/courseApi";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import CareerCard from "./CourseCard";

const CourseMain = () => {
    const { data, isLoading, isError, error, refetch } = useGetPublishedCourseQuery();

    return (
        <div className="bg-white font-sans">
            <div className="container max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

                <main>
                    {isLoading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : isError ? (
                        <Alert variant="destructive" className="max-w-2xl mx-auto">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <AlertTitle>Error loading courses</AlertTitle>
                            <AlertDescription>
                                {error?.data?.message || 'Failed to fetch courses. Please try again.'}
                                <div className="mt-4">
                                    <Button variant="outline" onClick={refetch}>
                                        Retry
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {data?.courses?.map((career) => (
                                <CareerCard key={career._id} career={career} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CourseMain;