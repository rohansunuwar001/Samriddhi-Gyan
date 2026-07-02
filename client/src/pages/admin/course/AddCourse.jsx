import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCreateCourseMutation } from "@/features/api/courseApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";

const AddCourse = () => {
    const [courseDetails, setCourseDetails] = useState({
        title: "",
        category: "",
        price: { current: "", original: "" },
    });
    const navigate = useNavigate();
    const [createCourse, { data, isLoading, error, isSuccess, isError }] = useCreateCourseMutation();
    const { data: categoryData, isLoading: isLoadingCategories } = useGetAllCategoriesQuery();

    const availableCategories = categoryData?.categories || [];

    // Helper map for fast lookup
    const categoryMap = useMemo(() => {
        const map = {};
        availableCategories.forEach((c) => {
            map[c._id] = c;
        });
        return map;
    }, [availableCategories]);

    const getCategoryLevel = (category) => {
        const pId = category.parent?._id || category.parent || null;
        if (!pId) return 0;
        const parentCat = categoryMap[pId];
        if (!parentCat) return 1;
        const gpId = parentCat.parent?._id || parentCat.parent || null;
        if (!gpId) return 1;
        return 2;
    };

    const parents = useMemo(
        () => availableCategories.filter((c) => getCategoryLevel(c) === 0),
        [availableCategories, categoryMap]
    );

    const selectedHierarchy = useMemo(() => {
        const selected = availableCategories.find((c) => c.name === courseDetails.category);
        if (!selected) {
            return { parentId: "", childId: "", subChildId: "" };
        }

        const pId = selected.parent?._id || selected.parent || null;
        if (!pId) {
            return { parentId: selected._id, childId: "", subChildId: "" };
        }

        const parentCat = availableCategories.find((c) => c._id === pId);
        if (!parentCat) {
            return { parentId: "", childId: selected._id, subChildId: "" };
        }

        const gpId = parentCat.parent?._id || parentCat.parent || null;
        if (!gpId) {
            return { parentId: parentCat._id, childId: selected._id, subChildId: "" };
        }

        return { parentId: gpId, childId: parentCat._id, subChildId: selected._id };
    }, [courseDetails.category, availableCategories]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourseDetails(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setCourseDetails(prev => ({ ...prev, price: { ...prev.price, [name]: value } }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { title, category, price } = courseDetails;
        if (!title.trim() || !category || !price.current) {
            toast.error("Please provide a Title, Category (Parent/Child/Sub-child), and a Current Price.");
            return;
        }
        await createCourse(courseDetails);
    };

    useEffect(() => {
        if (isSuccess && data?.course?._id) {
            toast.success(data.message || "Course created! Let's add more details.");
            navigate(`/instructor/course/${data.course._id}`);
        }
        if (isError) {
            toast.error(error.data?.message || "Something went wrong.");
        }
    }, [isSuccess, isError, data, error, navigate]);

    return (
        <div className="flex-1 mx-auto max-w-2xl p-4 text-left">
            <Card>
                <CardHeader>
                    <CardTitle>Create Your New Course</CardTitle>
                    <CardDescription>
                        Start with the basics. You can add the curriculum and landing page content in the next step.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Course Title</Label>
                            <Input id="title" name="title" value={courseDetails.title} onChange={handleChange} placeholder="e.g., The Complete 2025 Web Development Bootcamp" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="currentPrice">Current Price (NPR)</Label>
                                <Input id="currentPrice" name="current" type="number" value={courseDetails.price.current} onChange={handlePriceChange} placeholder="e.g., 1999" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="originalPrice">Original Price (optional)</Label>
                                <Input id="originalPrice" name="original" type="number" value={courseDetails.price.original} onChange={handlePriceChange} placeholder="e.g., 9999" />
                            </div>
                        </div>

                        {/* 3-Level Category Selector Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">Category (Parent)</Label>
                                <Select
                                    value={selectedHierarchy.parentId}
                                    onValueChange={(val) => {
                                        const cat = availableCategories.find((c) => c._id === val);
                                        setCourseDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
                                    }}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select Parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {parents.length === 0 ? (
                                            <SelectItem value="none" disabled>No categories available</SelectItem>
                                        ) : (
                                            parents.map((c) => (
                                                <SelectItem key={c._id} value={c._id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">Subcategory (Child)</Label>
                                <Select
                                    value={selectedHierarchy.childId}
                                    onValueChange={(val) => {
                                        const cat = availableCategories.find((c) => c._id === val);
                                        setCourseDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
                                    }}
                                    disabled={!selectedHierarchy.parentId}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select Subcategory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCategories
                                            .filter((c) => (c.parent?._id || c.parent) === selectedHierarchy.parentId)
                                            .map((c) => (
                                                <SelectItem key={c._id} value={c._id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">Topic (Sub-child)</Label>
                                <Select
                                    value={selectedHierarchy.subChildId}
                                    onValueChange={(val) => {
                                        const cat = availableCategories.find((c) => c._id === val);
                                        setCourseDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
                                    }}
                                    disabled={!selectedHierarchy.childId}
                                >
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select Topic" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCategories
                                            .filter((c) => (c.parent?._id || c.parent) === selectedHierarchy.childId)
                                            .map((c) => (
                                                <SelectItem key={c._id} value={c._id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={() => navigate("/instructor/course")}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || isLoadingCategories}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create & Continue
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default AddCourse;