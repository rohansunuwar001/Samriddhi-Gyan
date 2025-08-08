import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useEditCourseMutation,
  useGetCourseByIdQuery,
  usePublishCourseMutation,
} from "@/features/api/courseApi";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";

const categories = [
  "Web Development",
  "Data Science",
  "Mobile Development",
  "DevOps",
  "UI/UX Design",
];
const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];

const CourseLandingPageTab = () => {
  const { courseId } = useParams();
  const [details, setDetails] = useState({
    title: "",
    subtitle: "",
    description: "",
    language: "English",
    level: "All Levels",
    category: "",
    price: { current: "", original: "" },
    thumbnailFile: null,
    learnings: [""],
    requirements: [""],
  });
  const [previewThumbnail, setPreviewThumbnail] = useState("");

  const {
    data: courseData,
    isLoading: isLoadingCourse,
    refetch,
  } = useGetCourseByIdQuery(courseId);
  const [editCourse, { isLoading: isUpdating }] = useEditCourseMutation();
  const [publishCourse, { isLoading: isPublishing }] =
    usePublishCourseMutation();

  useEffect(() => {
    if (courseData?.course) {
      const { course } = courseData;
      setDetails({
        title: course.title || "",
        subtitle: course.subtitle || "",
        description: course.description || "",
        language: course.language || "English",
        level: course.level || "All Levels",
        category: course.category || "",
        price: {
          current: course.price?.current || "",
          original: course.price?.original || "",
        },
        learnings: course.learnings?.length > 0 ? course.learnings : [""],
        requirements:
          course.requirements?.length > 0 ? course.requirements : [""],
        thumbnailFile: null,
      });
      setPreviewThumbnail(course.thumbnail || "");
    }
  }, [courseData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({
      ...prev,
      price: { ...prev.price, [name]: value },
    }));
  };

  const handleArrayChange = (e, index, field) => {
    const updatedList = [...details[field]];
    updatedList[index] = e.target.value;
    setDetails((prev) => ({ ...prev, [field]: updatedList }));
  };

  const addArrayItem = (field) =>
    setDetails((prev) => ({ ...prev, [field]: [...prev[field], ""] }));

  const removeArrayItem = (index, field) => {
    if (details[field].length > 1) {
      const updatedList = details[field].filter((_, i) => i !== index);
      setDetails((prev) => ({ ...prev, [field]: updatedList }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDetails((prev) => ({ ...prev, thumbnailFile: file }));
      setPreviewThumbnail(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    Object.entries(details).forEach(([key, value]) => {
      if (
        key !== "price" &&
        key !== "learnings" &&
        key !== "requirements" &&
        key !== "thumbnailFile"
      ) {
        formData.append(key, value);
      }
    });
    formData.append("price[current]", details.price.current);
    formData.append("price[original]", details.price.original);
    details.learnings
      .filter((item) => item.trim() !== "")
      .forEach((item) => formData.append("learnings[]", item));
    details.requirements
      .filter((item) => item.trim() !== "")
      .forEach((item) => formData.append("requirements[]", item));
    if (details.thumbnailFile)
      formData.append("courseThumbnail", details.thumbnailFile); // <-- use 'courseThumbnail'

    try {
      const res = await editCourse({ courseId, formData }).unwrap();
      toast.success(res.message || "Course details saved!");
    } catch (err) {
      toast.error(err.data?.message || "Failed to save changes.");
    }
  };

  const handlePublishToggle = async () => {
    const currentStatus = courseData?.course?.isPublished;
    try {
      const res = await publishCourse({
        courseId,
        isPublished: !currentStatus,
      }).unwrap();
      toast.success(res.message);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || "Failed to update status.");
    }
  };

  if (isLoadingCourse) return <div>Loading course editor...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Course Landing Page</CardTitle>
          <CardDescription>
            This is what students see before they enroll.
          </CardDescription>
        </div>
        <Button
          onClick={handlePublishToggle}
          variant="outline"
          disabled={isPublishing}
        >
          {courseData?.course?.isPublished ? "Unpublish" : "Publish"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input name="title" value={details.title} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              name="subtitle"
              value={details.subtitle}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={details.category}
              onValueChange={(val) =>
                setDetails((prev) => ({ ...prev, category: val }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={details.level}
              onValueChange={(val) =>
                setDetails((prev) => ({ ...prev, level: val }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Price (NPR)</Label>
            <Input
              name="current"
              type="number"
              value={details.price.current}
              onChange={handlePriceChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Original Price</Label>
            <Input
              name="original"
              type="number"
              value={details.price.original}
              onChange={handlePriceChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <RichTextEditor
            value={details.description}
            onChange={(val) =>
              setDetails((prev) => ({ ...prev, description: val }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>What students will learn</Label>
          {details.learnings.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => handleArrayChange(e, i, "learnings")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem(i, "learnings")}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addArrayItem("learnings")}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add learning objective
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Course requirements</Label>
          {details.requirements.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => handleArrayChange(e, i, "requirements")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem(i, "requirements")}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addArrayItem("requirements")}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add requirement
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Thumbnail</Label>
          <Input type="file" onChange={handleFileChange} accept="image/*" />
          <p className="text-xs text-muted-foreground">
            Recommended: 720x405 pixels.
          </p>
          {previewThumbnail && (
            <img
              src={previewThumbnail}
              alt="preview"
              className="mt-2 rounded-md w-72 h-auto border"
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
        <Button onClick={handleSubmit} disabled={isUpdating}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
          All Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseLandingPageTab;
