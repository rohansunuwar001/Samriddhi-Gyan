import React from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Presentation } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseLandingPageTab from "./CourseLandingPageTab";
import CourseCurriculumTab from "../CourseCurriculumTab";


const EditCourse = () => {
    const { courseId } = useParams();

    return (
        <div className="flex-1 mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-6">
            <header className="flex items-center justify-between">
                <Link to="/admin/course" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                    <ArrowLeft size={16} />
                    Back to My Courses
                </Link>
                <Button variant="outline" asChild>
                    <Link to={`/course/${courseId}`} target="_blank" rel="noopener noreferrer">
                        Preview Course Page
                    </Link>
                </Button>
            </header>

            <Tabs defaultValue="curriculum" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="landing-page">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Landing Page
                    </TabsTrigger>
                    <TabsTrigger value="curriculum">
                        <Presentation className="mr-2 h-4 w-4" />
                        Curriculum
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="landing-page" className="mt-6">
                    <CourseLandingPageTab /> 
                </TabsContent>
                <TabsContent value="curriculum" className="mt-6">
                    <CourseCurriculumTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default EditCourse;