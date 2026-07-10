import React, { useState } from "react";
import { toast } from "sonner";
import {
  useGetCarouselSlidesQuery,
  useCreateCarouselSlideMutation,
  useUpdateCarouselSlideMutation,
  useDeleteCarouselSlideMutation,
  useGetCompanyLogosQuery,
  useCreateCompanyLogoMutation,
  useUpdateCompanyLogoMutation,
  useDeleteCompanyLogoMutation,
  useGetPromoBannersQuery,
  useCreatePromoBannerMutation,
  useUpdatePromoBannerMutation,
  useDeletePromoBannerMutation
} from "@/features/api/cmsApi";
import { useGetAllCategoriesQuery } from "@/features/api/categoryApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Bookmark
} from "lucide-react";

// --- Background Presets for Carousel Slides ---
const BG_PRESETS = [
  {
    name: "Amber Glow (Default)",
    bgColor: "bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100",
    textColor: "text-amber-900"
  },
  {
    name: "Indigo Dream",
    bgColor: "bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100",
    textColor: "text-indigo-900"
  },
  {
    name: "Emerald Breeze",
    bgColor: "bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-100",
    textColor: "text-teal-900"
  },
  {
    name: "Sky High",
    bgColor: "bg-gradient-to-r from-sky-50 via-blue-50 to-sky-100",
    textColor: "text-blue-900"
  }
];

const HomeCms = () => {
  // Queries
  const { data: slidesData, isLoading: isSlidesLoading, refetch: refetchSlides } = useGetCarouselSlidesQuery();
  const { data: logosData, isLoading: isLogosLoading, refetch: refetchLogos } = useGetCompanyLogosQuery();
  const { data: promoData, isLoading: isPromoLoading, refetch: refetchPromos } = useGetPromoBannersQuery();
  const { data: categoryData } = useGetAllCategoriesQuery();

  const availableCategories = categoryData?.categories || [];

  const categoryMap = React.useMemo(() => {
    const map = {};
    availableCategories.forEach((c) => {
      map[c._id] = c;
    });
    return map;
  }, [availableCategories]);

  const subChildCategories = React.useMemo(() => {
    return availableCategories.filter((c) => {
      const pId = c.parent?._id || c.parent || null;
      if (!pId) return false;
      const parentCat = categoryMap[pId];
      if (!parentCat) return false;
      const gpId = parentCat.parent?._id || parentCat.parent || null;
      return !!gpId;
    });
  }, [availableCategories, categoryMap]);

  // Mutations
  const [createSlide, { isLoading: isCreatingSlide }] = useCreateCarouselSlideMutation();
  const [updateSlide, { isLoading: isUpdatingSlide }] = useUpdateCarouselSlideMutation();
  const [deleteSlide] = useDeleteCarouselSlideMutation();

  const [createLogo, { isLoading: isCreatingLogo }] = useCreateCompanyLogoMutation();
  const [updateLogo, { isLoading: isUpdatingLogo }] = useUpdateCompanyLogoMutation();
  const [deleteLogo] = useDeleteCompanyLogoMutation();

  const [createPromo, { isLoading: isCreatingPromo }] = useCreatePromoBannerMutation();
  const [updatePromo, { isLoading: isUpdatingPromo }] = useUpdatePromoBannerMutation();
  const [deletePromo] = useDeletePromoBannerMutation();

  // State for tabs
  const [activeTab, setActiveTab] = useState("carousel");

  // State for Carousel Slides CRUD
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideDescription, setSlideDescription] = useState("");
  const [slideLink, setSlideLink] = useState("/course/search");
  const [slideBgColor, setSlideBgColor] = useState(BG_PRESETS[0].bgColor);
  const [slideTextColor, setSlideTextColor] = useState(BG_PRESETS[0].textColor);
  const [slideOrder, setSlideOrder] = useState(0);
  const [slideImage, setSlideImage] = useState("");
  const [slideImagePreview, setSlideImagePreview] = useState("");
  const [isUploadingSlideImage, setIsUploadingSlideImage] = useState(false);

  // State for Company Logos CRUD
  const [showLogoForm, setShowLogoForm] = useState(false);
  const [editingLogoId, setEditingLogoId] = useState(null);
  const [logoName, setLogoName] = useState("");
  const [logoOrder, setLogoOrder] = useState(0);
  const [logoImage, setLogoImage] = useState("");
  const [logoImagePreview, setLogoImagePreview] = useState("");
  const [isUploadingLogoImage, setIsUploadingLogoImage] = useState(false);

  // State for Career Promo Banner CRUD
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoPrimaryBtnText, setPromoPrimaryBtnText] = useState("Learn AI and more");
  const [promoPrimaryBtnLink, setPromoPrimaryBtnLink] = useState("/course/search");
  const [promoSecondaryBtnText, setPromoSecondaryBtnText] = useState("Prep for a certification");
  const [promoSecondaryBtnLink, setPromoSecondaryBtnLink] = useState("/course/search");
  const [promoImage, setPromoImage] = useState("");
  const [promoImagePreview, setPromoImagePreview] = useState("");
  const [promoCategoryName, setPromoCategoryName] = useState("");
  const [isUploadingPromoImage, setIsUploadingPromoImage] = useState(false);

  // Upload handler to Cloudinary via server API
  const handleCloudinaryUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:10000";
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${baseUrl}/api/v1/media/upload-video`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Cloudinary upload failed");
    }

    const result = await response.json();
    return result.data?.secure_url || result.data?.url;
  };

  // --- Slide Actions ---
  const handleSlideImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSlideImagePreview(URL.createObjectURL(file));
    setIsUploadingSlideImage(true);

    try {
      const secureUrl = await handleCloudinaryUpload(file);
      setSlideImage(secureUrl);
      toast.success("Slide image uploaded to Cloudinary!");
    } catch (err) {
      toast.error("Failed to upload slide image.");
      console.error(err);
    } finally {
      setIsUploadingSlideImage(false);
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!slideTitle.trim() || !slideDescription.trim() || !slideImage) {
      toast.error("Title, description, and slide image are required.");
      return;
    }

    const payload = {
      title: slideTitle,
      description: slideDescription,
      image: slideImage,
      bgColor: slideBgColor,
      textColor: slideTextColor,
      link: slideLink,
      order: Number(slideOrder)
    };

    try {
      if (editingSlideId) {
        await updateSlide({ id: editingSlideId, ...payload }).unwrap();
        toast.success("Carousel slide updated successfully!");
      } else {
        await createSlide(payload).unwrap();
        toast.success("New carousel slide created successfully!");
      }
      resetSlideForm();
      refetchSlides();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save carousel slide.");
    }
  };

  const handleEditSlideClick = (slide) => {
    setEditingSlideId(slide._id);
    setSlideTitle(slide.title);
    setSlideDescription(slide.description);
    setSlideLink(slide.link || "/course/search");
    setSlideBgColor(slide.bgColor);
    setSlideTextColor(slide.textColor);
    setSlideOrder(slide.order);
    setSlideImage(slide.image);
    setSlideImagePreview(slide.image);
    setShowSlideForm(true);
  };

  const handleDeleteSlideClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      await deleteSlide(id).unwrap();
      toast.success("Slide deleted successfully.");
      refetchSlides();
    } catch (err) {
      toast.error("Failed to delete slide.");
    }
  };

  const handleToggleSlideActive = async (slide) => {
    try {
      await updateSlide({ id: slide._id, isActive: !slide.isActive }).unwrap();
      toast.success(`Slide status set to ${!slide.isActive ? "active" : "inactive"}`);
      refetchSlides();
    } catch (err) {
      toast.error("Failed to toggle status.");
    }
  };

  const resetSlideForm = () => {
    setEditingSlideId(null);
    setSlideTitle("");
    setSlideDescription("");
    setSlideLink("/course/search");
    setSlideBgColor(BG_PRESETS[0].bgColor);
    setSlideTextColor(BG_PRESETS[0].textColor);
    setSlideOrder(0);
    setSlideImage("");
    setSlideImagePreview("");
    setShowSlideForm(false);
  };

  // --- Logo Actions ---
  const handleLogoImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoImagePreview(URL.createObjectURL(file));
    setIsUploadingLogoImage(true);

    try {
      const secureUrl = await handleCloudinaryUpload(file);
      setLogoImage(secureUrl);
      toast.success("Logo image uploaded to Cloudinary!");
    } catch (err) {
      toast.error("Failed to upload logo.");
      console.error(err);
    } finally {
      setIsUploadingLogoImage(false);
    }
  };

  const handleSaveLogo = async (e) => {
    e.preventDefault();
    if (!logoName.trim() || !logoImage) {
      toast.error("Logo name and image are required.");
      return;
    }

    const payload = {
      name: logoName,
      image: logoImage,
      order: Number(logoOrder)
    };

    try {
      if (editingLogoId) {
        await updateLogo({ id: editingLogoId, ...payload }).unwrap();
        toast.success("Logo updated successfully!");
      } else {
        await createLogo(payload).unwrap();
        toast.success("New logo added successfully!");
      }
      resetLogoForm();
      refetchLogos();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save logo.");
    }
  };

  const handleEditLogoClick = (logo) => {
    setEditingLogoId(logo._id);
    setLogoName(logo.name);
    setLogoOrder(logo.order);
    setLogoImage(logo.image);
    setLogoImagePreview(logo.image);
    setShowLogoForm(true);
  };

  const handleDeleteLogoClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this logo?")) return;
    try {
      await deleteLogo(id).unwrap();
      toast.success("Logo deleted successfully.");
      refetchLogos();
    } catch (err) {
      toast.error("Failed to delete logo.");
    }
  };

  const handleToggleLogoActive = async (logo) => {
    try {
      await updateLogo({ id: logo._id, isActive: !logo.isActive }).unwrap();
      toast.success(`Logo status set to ${!logo.isActive ? "active" : "inactive"}`);
      refetchLogos();
    } catch (err) {
      toast.error("Failed to toggle status.");
    }
  };

  const resetLogoForm = () => {
    setEditingLogoId(null);
    setLogoName("");
    setLogoOrder(0);
    setLogoImage("");
    setLogoImagePreview("");
    setShowLogoForm(false);
  };

  // --- Promo Actions ---
  const handlePromoImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPromoImagePreview(URL.createObjectURL(file));
    setIsUploadingPromoImage(true);

    try {
      const secureUrl = await handleCloudinaryUpload(file);
      setPromoImage(secureUrl);
      toast.success("Promo banner image uploaded to Cloudinary!");
    } catch (err) {
      toast.error("Failed to upload promo image.");
      console.error(err);
    } finally {
      setIsUploadingPromoImage(false);
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoDescription.trim() || !promoImage) {
      toast.error("Title, description, and image are required.");
      return;
    }

    const payload = {
      title: promoTitle,
      description: promoDescription,
      image: promoImage,
      primaryBtnText: promoPrimaryBtnText,
      primaryBtnLink: promoPrimaryBtnLink,
      secondaryBtnText: promoSecondaryBtnText,
      secondaryBtnLink: promoSecondaryBtnLink,
      categoryName: promoCategoryName
    };

    try {
      if (editingPromoId) {
        await updatePromo({ id: editingPromoId, ...payload }).unwrap();
        toast.success("Promo banner updated successfully!");
      } else {
        await createPromo(payload).unwrap();
        toast.success("New promo banner created and set as active!");
      }
      resetPromoForm();
      refetchPromos();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save promo banner.");
    }
  };

  const handleEditPromoClick = (promoItem) => {
    setEditingPromoId(promoItem._id);
    setPromoTitle(promoItem.title);
    setPromoDescription(promoItem.description);
    setPromoPrimaryBtnText(promoItem.primaryBtnText || "Learn AI and more");
    setPromoPrimaryBtnLink(promoItem.primaryBtnLink || "/course/search");
    setPromoSecondaryBtnText(promoItem.secondaryBtnText || "Prep for a certification");
    setPromoSecondaryBtnLink(promoItem.secondaryBtnLink || "/course/search");
    setPromoCategoryName(promoItem.categoryName || "");
    setPromoImage(promoItem.image);
    setPromoImagePreview(promoItem.image);
    setShowPromoForm(true);
  };

  const handleDeletePromoClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo banner?")) return;
    try {
      await deletePromo(id).unwrap();
      toast.success("Promo banner deleted successfully.");
      refetchPromos();
    } catch (err) {
      toast.error("Failed to delete promo banner.");
    }
  };

  const handleTogglePromoActive = async (promoItem) => {
    try {
      await updatePromo({ id: promoItem._id, isActive: !promoItem.isActive }).unwrap();
      toast.success(`Promo banner status set to ${!promoItem.isActive ? "active" : "inactive"}`);
      refetchPromos();
    } catch (err) {
      toast.error("Failed to toggle status.");
    }
  };

  const resetPromoForm = () => {
    setEditingPromoId(null);
    setPromoTitle("");
    setPromoDescription("");
    setPromoPrimaryBtnText("Learn AI and more");
    setPromoPrimaryBtnLink("/course/search");
    setPromoSecondaryBtnText("Prep for a certification");
    setPromoSecondaryBtnLink("/course/search");
    setPromoCategoryName("");
    setPromoImage("");
    setPromoImagePreview("");
    setShowPromoForm(false);
  };

  return (
    <div className="flex-grow space-y-6 p-6 md:p-8 pt-6 min-h-screen bg-slate-50/30 dark:bg-slate-950/20">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/40 dark:border-slate-800/20 pb-4">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
            Landing Page Hero & Client Logos CMS Management
          </h2>
          <p className="text-sm text-slate-500 font-light mt-1">
            Dynamic landing page content manager. Customize your landing page hero carousel slides, client trust logos, and career promo sections.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("carousel")}
          className={`py-2.5 px-6 font-medium text-sm border-b-2 transition-all ${
            activeTab === "carousel"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Hero Carousel
        </button>
        <button
          onClick={() => setActiveTab("logos")}
          className={`py-2.5 px-6 font-medium text-sm border-b-2 transition-all ${
            activeTab === "logos"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Trust Logos
        </button>
        <button
          onClick={() => setActiveTab("promo")}
          className={`py-2.5 px-6 font-medium text-sm border-b-2 transition-all ${
            activeTab === "promo"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Career Promo Banner
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {activeTab === "carousel" ? (
          // ----------------------------------------------------
          // CAROUSEL SLIDES CRUD
          // ----------------------------------------------------
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  Home Page - Hero Carousel Section
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Location: Landing Homepage (Top Area)
                </p>
              </div>
              {!showSlideForm && (
                <Button onClick={() => setShowSlideForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Slide
                </Button>
              )}
            </div>

            {showSlideForm && (
              <Card className="border-indigo-500/20 dark:border-indigo-500/10 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
                  <div>
                    <CardTitle className="text-md">
                      Home Page - Hero Carousel Section &gt; {editingSlideId ? "Edit Slide" : "Create Slide"}
                    </CardTitle>
                    <CardDescription>Uploads slides to the dynamic landing hero.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetSlideForm}>
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSaveSlide} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Slide Title</label>
                        <Input
                          placeholder="e.g. Get AI-ready from Rs 999"
                          value={slideTitle}
                          onChange={(e) => setSlideTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Description</label>
                        <Textarea
                          placeholder="Slide subtitle / summary detail text..."
                          rows={3}
                          value={slideDescription}
                          onChange={(e) => setSlideDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Redirect Link</label>
                          <Input
                            placeholder="e.g. /course/search"
                            value={slideLink}
                            onChange={(e) => setSlideLink(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Order</label>
                          <Input
                            type="number"
                            placeholder="e.g. 0"
                            value={slideOrder}
                            onChange={(e) => setSlideOrder(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-semibold text-slate-500 block">Style Preset</label>
                        <div className="grid grid-cols-2 gap-2">
                          {BG_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSlideBgColor(preset.bgColor);
                                setSlideTextColor(preset.textColor);
                              }}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                slideBgColor === preset.bgColor
                                  ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                              }`}
                            >
                              <div className="font-semibold text-[10px] text-slate-500 mb-1">{preset.name}</div>
                              <div className={`h-4 rounded ${preset.bgColor} border border-slate-200/20`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Slide Image (Cloudinary)</label>
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSlideImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {isUploadingSlideImage ? (
                            <div className="flex flex-col items-center py-6 space-y-2">
                              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                              <span className="text-xs text-slate-500">Uploading to Cloudinary...</span>
                            </div>
                          ) : slideImagePreview ? (
                            <div className="relative group max-h-48 overflow-hidden rounded-xl mx-auto">
                              <img
                                src={slideImagePreview}
                                alt="Slide Preview"
                                className="object-cover max-h-48 rounded-xl mx-auto shadow-md"
                              />
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-10 h-10 mb-2 text-slate-300" />
                              <p className="text-xs">Upload image</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={resetSlideForm}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreatingSlide || isUpdatingSlide || isUploadingSlideImage}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {editingSlideId ? "Update Slide" : "Create Slide"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* List */}
            {isSlidesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : slidesData?.slides?.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                No custom slides configured. landing page will display fallbacks.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {slidesData?.slides?.map((slide) => (
                  <Card key={slide._id} className="relative overflow-hidden border-slate-200/60 dark:border-slate-800/40">
                    <CardHeader className={`p-6 border-b border-slate-100 dark:border-slate-800/40 ${slide.bgColor}`}>
                      <div className="flex items-start justify-between">
                        <div className="max-w-[70%] text-left">
                          <h4 className="font-extrabold text-lg leading-tight text-[#1c1d1f]">{slide.title}</h4>
                          <p className="text-xs text-gray-700 font-light mt-2">{slide.description}</p>
                        </div>
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-20 h-20 rounded-lg object-cover shadow-sm bg-white"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex flex-wrap gap-2">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                          Order: {slide.order}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleSlideActive(slide)}
                          className={slide.isActive ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-500"}
                        >
                          {slide.isActive ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditSlideClick(slide)} className="text-blue-600">
                          <Edit className="w-4.5 h-4.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSlideClick(slide._id)} className="text-red-600">
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "logos" ? (
          // ----------------------------------------------------
          // COMPANY LOGOS CRUD
          // ----------------------------------------------------
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  Home Page - Trusted Companies Banner Section
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Location: Landing Homepage (Middle Banner Area)
                </p>
              </div>
              {!showLogoForm && (
                <Button onClick={() => setShowLogoForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Logo
                </Button>
              )}
            </div>

            {showLogoForm && (
              <Card className="border-indigo-500/20 dark:border-indigo-500/10 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
                  <div>
                    <CardTitle className="text-md">
                      Home Page - Trusted Companies Banner Section &gt; {editingLogoId ? "Edit Logo" : "Add Logo"}
                    </CardTitle>
                    <CardDescription>Uploads trust logos to the landing cloud cloud banner.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetLogoForm}>
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSaveLogo} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Company Name</label>
                        <Input
                          placeholder="e.g. Volkswagen, Samsung, Vimeo"
                          value={logoName}
                          onChange={(e) => setLogoName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Sorting Order</label>
                        <Input
                          type="number"
                          placeholder="e.g. 0"
                          value={logoOrder}
                          onChange={(e) => setLogoOrder(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Logo Image File</label>
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {isUploadingLogoImage ? (
                            <div className="flex flex-col items-center py-4 space-y-2">
                              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                              <span className="text-xs text-slate-500">Uploading to Cloudinary...</span>
                            </div>
                          ) : logoImagePreview ? (
                            <div className="relative max-w-[200px] mx-auto p-4 bg-white border rounded-xl flex items-center justify-center">
                              <img
                                src={logoImagePreview}
                                alt="Logo Preview"
                                className="max-h-12 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="py-4 flex flex-col items-center justify-center text-slate-400">
                              <Upload className="w-8 h-8 mb-1 text-slate-300" />
                              <p className="text-xs">Upload logo file</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={resetLogoForm}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreatingLogo || isUpdatingLogo || isUploadingLogoImage}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {editingLogoId ? "Update Logo" : "Save Logo"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Logo List */}
            {isLogosLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : logosData?.logos?.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                No custom company logos configured. Displaying defaults.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {logosData?.logos?.map((logo) => (
                  <Card key={logo._id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col items-center space-y-4">
                      <div className="h-16 w-full flex items-center justify-center bg-white border border-slate-100 rounded-lg p-2">
                        <img
                          src={logo.image}
                          alt={logo.name}
                          className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                      </div>
                      <div className="w-full text-center space-y-1">
                        <div className="font-semibold text-xs text-slate-800 truncate">{logo.name}</div>
                        <div className="text-[10px] text-slate-400">Order: {logo.order}</div>
                      </div>
                      <div className="flex items-center gap-1 pt-1 justify-center w-full border-t border-slate-100/60 dark:border-slate-800/60 text-xs">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleLogoActive(logo)}
                          className={logo.isActive ? "text-emerald-600" : "text-slate-400"}
                        >
                          {logo.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditLogoClick(logo)} className="text-blue-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLogoClick(logo._id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ----------------------------------------------------
          // PROMO BANNERS CRUD
          // ----------------------------------------------------
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  Home Page - Career Promo Banner Section
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Location: Landing Homepage (Bottom Accent Banner)
                </p>
              </div>
              {!showPromoForm && (
                <Button onClick={() => setShowPromoForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Create Promo Banner
                </Button>
              )}
            </div>

            {showPromoForm && (
              <Card className="border-indigo-500/20 dark:border-indigo-500/10 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
                  <div>
                    <CardTitle className="text-md">
                      Home Page - Career Promo Banner Section &gt; {editingPromoId ? "Edit Banner" : "Create Banner"}
                    </CardTitle>
                    <CardDescription>Creates a dynamic call-to-action banner for home page visitors.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetPromoForm}>
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSavePromo} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Banner Title</label>
                        <Input
                          placeholder="e.g. Reimagine your career in the AI era"
                          value={promoTitle}
                          onChange={(e) => setPromoTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Description</label>
                        <Textarea
                          placeholder="e.g. Future-proof your skills with Personal Plan..."
                          rows={3}
                          value={promoDescription}
                          onChange={(e) => setPromoDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Primary Button Text</label>
                          <Input
                            placeholder="e.g. Learn AI and more"
                            value={promoPrimaryBtnText}
                            onChange={(e) => setPromoPrimaryBtnText(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Primary Button Link</label>
                          <Input
                            placeholder="e.g. /course/search"
                            value={promoPrimaryBtnLink}
                            onChange={(e) => setPromoPrimaryBtnLink(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Secondary Button Text</label>
                          <Input
                            placeholder="e.g. Prep for a certification"
                            value={promoSecondaryBtnText}
                            onChange={(e) => setPromoSecondaryBtnText(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-500">Secondary Button Link</label>
                          <Input
                            placeholder="e.g. /course/search"
                            value={promoSecondaryBtnLink}
                            onChange={(e) => setPromoSecondaryBtnLink(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Personalized Category/Topic Trigger (Optional)</label>
                        <select
                          value={promoCategoryName}
                          onChange={(e) => setPromoCategoryName(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- General Fallback Banner (No personalization) --</option>
                          {subChildCategories.map((c) => (
                            <option key={c._id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">
                          Choose a sub-child category. If a visitor views courses or searches topics under this category, this banner will automatically display on their homepage.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Illustration Image (Cloudinary)</label>
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePromoImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {isUploadingPromoImage ? (
                            <div className="flex flex-col items-center py-6 space-y-2">
                              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                              <span className="text-xs text-slate-500">Uploading to Cloudinary...</span>
                            </div>
                          ) : promoImagePreview ? (
                            <div className="relative group max-h-48 overflow-hidden rounded-xl mx-auto bg-slate-100 p-2">
                              <img
                                src={promoImagePreview}
                                alt="Promo Preview"
                                className="object-contain max-h-48 rounded-xl mx-auto filter drop-shadow-md"
                              />
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-10 h-10 mb-2 text-slate-300" />
                              <p className="text-xs">Drag & drop or click to upload</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={resetPromoForm}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreatingPromo || isUpdatingPromo || isUploadingPromoImage}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {editingPromoId ? "Update Banner" : "Create Banner"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* List */}
            {isPromoLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : promoData?.banners?.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                No custom promo banners configured. Landing page will display fallbacks.
              </div>
            ) : (
              <div className="space-y-4">
                {promoData?.banners?.map((promoItem) => (
                  <Card key={promoItem._id} className={`border-slate-200/60 dark:border-slate-800/40 overflow-hidden ${promoItem.isActive ? "ring-1 ring-emerald-500/50" : ""}`}>
                    <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4 text-left flex-1">
                        <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center p-1 flex-shrink-0">
                          <img
                            src={promoItem.image}
                            alt={promoItem.title}
                            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            {promoItem.title}
                            {promoItem.isActive && (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                ACTIVE
                              </span>
                            )}
                            {promoItem.categoryName && (
                              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                Personalization Target: {promoItem.categoryName}
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 font-light mt-1 max-w-xl truncate">
                            {promoItem.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePromoActive(promoItem)}
                          className={promoItem.isActive ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-500"}
                          title={promoItem.isActive ? "Deactivate" : "Activate"}
                        >
                          {promoItem.isActive ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditPromoClick(promoItem)} className="text-blue-600">
                          <Edit className="w-4.5 h-4.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePromoClick(promoItem._id)} className="text-red-600">
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeCms;
