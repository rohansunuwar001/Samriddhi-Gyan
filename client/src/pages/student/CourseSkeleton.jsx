import { Skeleton } from "@/components/ui/skeleton";
const CourseSkeleton = () => {
return (
<div className="flex-shrink-0 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
<div className="group space-y-3">
<Skeleton className="w-full aspect-video rounded-lg bg-gray-200 dark:bg-gray-800" />
<div className="px-1 space-y-2">
<Skeleton className="h-5 w-5/6 bg-gray-200 dark:bg-gray-800" />
<Skeleton className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800" />
<div className="flex items-center gap-2">
<Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
</div>
<Skeleton className="h-5 w-1/4 bg-gray-200 dark:bg-gray-800" />
</div>
</div>
</div>
);
};
export default CourseSkeleton;