import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCreateCourseMutation } from "@/features/api/courseApi";

const categories = ["Web Development", "Data Science", "Mobile Development", "DevOps", "UI/UX Design"];

const AddCourse = () => {
    const [courseDetails, setCourseDetails] = useState({
        title: "",
        category: "",
        price: { current: "", original: "" },
    });
    const navigate = useNavigate();
    const [createCourse, { data, isLoading, error, isSuccess, isError }] = useCreateCourseMutation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourseDetails(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setCourseDetails(prev => ({ ...prev, price: { ...prev.price, [name]: value } }));
    };

    const handleCategoryChange = (value) => {
        setCourseDetails(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { title, category, price } = courseDetails;
        if (!title.trim() || !category || !price.current) {
            toast.error("Please provide a Title, Category, and a Current Price.");
            return;
        }
        await createCourse(courseDetails);
    };

    useEffect(() => {
        if (isSuccess && data?.course?._id) {
            toast.success(data.message || "Course created! Let's add more details.");
            navigate(`/admin/course/${data.course._id}`);
        }
        if (isError) {
            toast.error(error.data?.message || "Something went wrong.");
        }
    }, [isSuccess, isError, data, error, navigate]);

    return (
        <div className="flex-1 mx-auto max-w-2xl p-4">
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
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select onValueChange={handleCategoryChange} value={courseDetails.category}>
                                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Categories</SelectLabel>
                                        {categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={() => navigate("/admin/course")}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
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