import { useEffect, useState, useMemo } from "react";
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

import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useEditCourseMutation, useGetCourseByIdQuery, usePublishCourseMutation } from "@/features/api/courseApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
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
    whoIsThisFor: [""],
    topics: [],
    courseIncludes: {
      codingExercises: 0,
      articles: 0,
      downloadableResources: 0,
      hasMobileAccess: true,
      hasCertificate: true,
    },
    includedInSubscription: false,
  });
  const [previewThumbnail, setPreviewThumbnail] = useState("");

  const {
    data: courseData,
    isLoading: isLoadingCourse,
    refetch,
  } = useGetCourseByIdQuery(courseId);
  const { data: categoryData, isLoading: isLoadingCategories } = useGetAllCategoriesQuery();
  const [editCourse, { isLoading: isUpdating }] = useEditCourseMutation();
  const [publishCourse, { isLoading: isPublishing }] =
    usePublishCourseMutation();

  const availableCategories = categoryData?.categories || [];

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
    const selected = availableCategories.find((c) => c.name === details.category);
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
  }, [details.category, availableCategories]);

  const topicCategories = useMemo(() => {
    return availableCategories.map((cat) => {
      const pId = cat.parent?._id || cat.parent || null;
      let label = cat.name;
      if (pId) {
        const parent = availableCategories.find((c) => c._id === pId);
        if (parent) {
          label = `${parent.name} > ${cat.name}`;
          const gpId = parent.parent?._id || parent.parent || null;
          if (gpId) {
            const grandparent = availableCategories.find((c) => c._id === gpId);
            if (grandparent) {
              label = `${grandparent.name} > ${parent.name} > ${cat.name}`;
            }
          }
        }
      }
      return {
        category: cat,
        label,
      };
    });
  }, [availableCategories]);

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
        whoIsThisFor:
          course.whoIsThisFor?.length > 0 ? course.whoIsThisFor : [""],
        topics: course.topics?.length > 0 ? course.topics : [],
        courseIncludes: {
          codingExercises:       course.courseIncludes?.codingExercises       ?? 0,
          articles:              course.courseIncludes?.articles              ?? 0,
          downloadableResources: course.courseIncludes?.downloadableResources ?? 0,
          hasMobileAccess:       course.courseIncludes?.hasMobileAccess       ?? true,
          hasCertificate:        course.courseIncludes?.hasCertificate        ?? true,
        },
        includedInSubscription: course.includedInSubscription ?? false,
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

  const toggleTopic = (categoryName) => {
    setDetails((prev) => {
      const alreadySelected = prev.topics.includes(categoryName);
      return {
        ...prev,
        topics: alreadySelected
          ? prev.topics.filter((t) => t !== categoryName)
          : [...prev.topics, categoryName],
      };
    });
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
        key !== "whoIsThisFor" &&
        key !== "topics" &&
        key !== "courseIncludes" &&
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
    details.whoIsThisFor
      .filter((item) => item.trim() !== "")
      .forEach((item) => formData.append("whoIsThisFor[]", item));
    details.topics.forEach((topic) => formData.append("topics[]", topic));
    // Send courseIncludes as a nested object
    formData.append("courseIncludes[codingExercises]",       details.courseIncludes.codingExercises);
    formData.append("courseIncludes[articles]",              details.courseIncludes.articles);
    formData.append("courseIncludes[downloadableResources]", details.courseIncludes.downloadableResources);
    formData.append("courseIncludes[hasMobileAccess]",       details.courseIncludes.hasMobileAccess);
    formData.append("courseIncludes[hasCertificate]",        details.courseIncludes.hasCertificate);
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
    const publish = !currentStatus ? "true" : "false"; // must be string
    try {
      const res = await publishCourse({
        courseId,
        publish,
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
          {/* 3-Level Category Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2 border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Category (Parent)</Label>
              <Select
                value={selectedHierarchy.parentId}
                onValueChange={(val) => {
                  const cat = availableCategories.find((c) => c._id === val);
                  setDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
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
                  setDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
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
                  setDetails((prev) => ({ ...prev, category: cat ? cat.name : "" }));
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
          <div className="flex items-center gap-3 pt-8">
            <input
              type="checkbox"
              id="includedInSubscription"
              className="h-4 w-4 rounded border-gray-300 accent-[#a435f0] cursor-pointer"
              checked={details.includedInSubscription}
              onChange={(e) =>
                setDetails((prev) => ({ ...prev, includedInSubscription: e.target.checked }))
              }
            />
            <Label htmlFor="includedInSubscription" className="cursor-pointer font-semibold select-none">
              Included in Subscription (Free for active subscribers)
            </Label>
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
          <Label>Who this course is for</Label>
          {details.whoIsThisFor.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => handleArrayChange(e, i, "whoIsThisFor")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem(i, "whoIsThisFor")}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addArrayItem("whoIsThisFor")}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add audience point
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Related topics</Label>
          <p className="text-sm text-muted-foreground">
            Select the topics that power &quot;Explore related topics&quot; on your course page and
            link this course to relevant blog articles.
          </p>
          {isLoadingCategories ? (
            <p className="text-sm text-muted-foreground">Loading topics...</p>
          ) : availableCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories exist yet. Ask an admin to create some under Categories.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {topicCategories.map(({ category, label }) => {
                const isSelected = details.topics.includes(category.name);
                return (
                  <button
                    type="button"
                    key={category._id}
                    onClick={() => toggleTopic(category.name)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-purple-700 border-purple-700 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Course includes</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Video hours are calculated automatically. Set the counts below — they will display with icons on your course page.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Coding exercises</Label>
              <Input
                type="number"
                min="0"
                value={details.courseIncludes.codingExercises}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    courseIncludes: { ...prev.courseIncludes, codingExercises: Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Articles</Label>
              <Input
                type="number"
                min="0"
                value={details.courseIncludes.articles}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    courseIncludes: { ...prev.courseIncludes, articles: Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Downloadable resources</Label>
              <Input
                type="number"
                min="0"
                value={details.courseIncludes.downloadableResources}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    courseIncludes: { ...prev.courseIncludes, downloadableResources: Number(e.target.value) },
                  }))
                }
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={details.courseIncludes.hasMobileAccess}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    courseIncludes: { ...prev.courseIncludes, hasMobileAccess: e.target.checked },
                  }))
                }
              />
              <span className="text-sm font-medium">Access on mobile and TV</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={details.courseIncludes.hasCertificate}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    courseIncludes: { ...prev.courseIncludes, hasCertificate: e.target.checked },
                  }))
                }
              />
              <span className="text-sm font-medium">Certificate of completion</span>
            </label>
          </div>
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
