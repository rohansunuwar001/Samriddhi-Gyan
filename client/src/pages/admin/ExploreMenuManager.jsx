import React, { useState } from "react";
import { toast } from "sonner";
import {
  useGetAdminExploreSectionsQuery,
  useCreateExploreSectionItemMutation,
  useUpdateExploreSectionItemMutation,
  useDeleteExploreSectionItemMutation,
} from "@/features/api/exploreSectionApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Sparkles,
  Award,
  Rocket,
  BookOpen,
  Loader2,
  ArrowRight,
  Layers,
  HelpCircle
} from "lucide-react";

const ICON_PRESETS = [
  { id: "none", label: "None" },
  { id: "google", label: "Google Logo (Multi-color)" },
  { id: "sparkles", label: "AI Sparkles" },
  { id: "rocket", label: "Career Rocket" },
  { id: "award", label: "Certification Award" },
  { id: "book", label: "Book Open" },
];

export const GoogleLogoIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const renderExploreIcon = (badgeOrIcon, className = "w-4 h-4") => {
  if (!badgeOrIcon || badgeOrIcon === "none") return null;
  if (badgeOrIcon === "google") return <GoogleLogoIcon className={className} />;
  if (badgeOrIcon === "sparkles") return <Sparkles className={`${className} text-purple-600`} />;
  if (badgeOrIcon === "rocket") return <Rocket className={`${className} text-indigo-600`} />;
  if (badgeOrIcon === "award") return <Award className={`${className} text-amber-500`} />;
  if (badgeOrIcon === "book") return <BookOpen className={`${className} text-blue-600`} />;
  if (badgeOrIcon.startsWith("http://") || badgeOrIcon.startsWith("https://") || badgeOrIcon.startsWith("/")) {
    return <img src={badgeOrIcon} alt="icon" className={`${className} object-contain`} />;
  }
  return null;
};

const ExploreMenuManager = () => {
  const { data, isLoading, refetch } = useGetAdminExploreSectionsQuery();
  const [createItem, { isLoading: isCreating }] = useCreateExploreSectionItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateExploreSectionItemMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteExploreSectionItemMutation();

  const items = data?.items || [];

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [section, setSection] = useState("featured"); // 'featured' or 'goal'
  const [title, setTitle] = useState("");
  const [badgeOrIcon, setBadgeOrIcon] = useState("google");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [column2Header, setColumn2Header] = useState("");
  const [column2Items, setColumn2Items] = useState([
    { name: "", link: "", hasChevron: false, subItems: [] },
  ]);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const resetForm = () => {
    setEditingId(null);
    setSection("featured");
    setTitle("");
    setBadgeOrIcon("none");
    setCustomIconUrl("");
    setOrder(0);
    setIsActive(true);
    setColumn2Header("");
    setColumn2Items([{ name: "", link: "", hasChevron: false, subItems: [] }]);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setSection(item.section);
    setTitle(item.title);
    if (ICON_PRESETS.some((p) => p.id === item.badgeOrIcon)) {
      setBadgeOrIcon(item.badgeOrIcon);
      setCustomIconUrl("");
    } else if (item.badgeOrIcon) {
      setBadgeOrIcon("custom");
      setCustomIconUrl(item.badgeOrIcon);
    } else {
      setBadgeOrIcon("none");
      setCustomIconUrl("");
    }
    setOrder(item.order || 0);
    setIsActive(item.isActive !== undefined ? item.isActive : true);
    setColumn2Header(item.column2Header || "");
    setColumn2Items(
      item.column2Items && item.column2Items.length > 0
        ? JSON.parse(JSON.stringify(item.column2Items))
        : [{ name: "", link: "", hasChevron: false, subItems: [] }]
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Column 2 items management
  const handleAddCol2Item = () => {
    setColumn2Items((prev) => [
      ...prev,
      { name: "", link: "", hasChevron: false, subItems: [] },
    ]);
  };

  const handleRemoveCol2Item = (index) => {
    setColumn2Items((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCol2FieldChange = (index, field, value) => {
    setColumn2Items((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Sub-items (Column 3) management
  const handleAddSubItem = (col2Idx) => {
    setColumn2Items((prev) => {
      const next = [...prev];
      const subs = next[col2Idx].subItems || [];
      next[col2Idx] = {
        ...next[col2Idx],
        hasChevron: true,
        subItems: [...subs, { name: "", link: "" }],
      };
      return next;
    });
  };

  const handleRemoveSubItem = (col2Idx, subIdx) => {
    setColumn2Items((prev) => {
      const next = [...prev];
      const subs = (next[col2Idx].subItems || []).filter((_, i) => i !== subIdx);
      next[col2Idx] = {
        ...next[col2Idx],
        hasChevron: subs.length > 0,
        subItems: subs,
      };
      return next;
    });
  };

  const handleSubItemFieldChange = (col2Idx, subIdx, field, value) => {
    setColumn2Items((prev) => {
      const next = [...prev];
      const subs = [...(next[col2Idx].subItems || [])];
      subs[subIdx] = { ...subs[subIdx], [field]: value };
      next[col2Idx] = { ...next[col2Idx], subItems: subs };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for this section item.");
      return;
    }

    const finalIcon = badgeOrIcon === "custom" ? customIconUrl.trim() : badgeOrIcon;

    // Filter out empty col2 items
    const cleanedCol2Items = column2Items
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        link: c.link.trim(),
        hasChevron: Boolean(c.hasChevron || (c.subItems && c.subItems.length > 0)),
        subItems: (c.subItems || [])
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name.trim(),
            link: s.link.trim(),
          })),
      }));

    const payload = {
      section,
      title: title.trim(),
      badgeOrIcon: finalIcon,
      order: Number(order) || 0,
      isActive,
      column2Header: column2Header.trim(),
      column2Items: cleanedCol2Items,
    };

    try {
      if (editingId) {
        await updateItem({ id: editingId, ...payload }).unwrap();
        toast.success("Explore menu item updated successfully!");
      } else {
        await createItem(payload).unwrap();
        toast.success("Explore menu item added successfully!");
      }
      resetForm();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save explore menu item.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget._id).unwrap();
      toast.success("Explore menu item deleted successfully!");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete item.");
    }
  };

  const featuredItems = items.filter((i) => i.section === "featured");
  const goalItems = items.filter((i) => i.section === "goal");

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-slate-900">
          Explore Menu Customizer
        </h1>
        <p className="text-slate-500 mt-1 font-extralight text-base">
          Configure the <strong>New & Featured</strong> (Section 1) and <strong>Explore by goal</strong> (Section 2) items displayed in the user-side Explore dropdown.
        </p>
      </div>

      {/* Item Editor Card */}
      <Card className="border-slate-200 shadow-sm rounded-xl">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 rounded-t-xl">
          <CardTitle className="text-xl font-normal text-slate-800 flex items-center justify-between">
            <span>{editingId ? "Edit Explore Menu Item" : "Add New Explore Menu Item"}</span>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-500 hover:text-slate-700">
                Cancel Edit
              </Button>
            )}
          </CardTitle>
          <CardDescription className="text-slate-500 font-extralight">
            Configure the title, optional icon, and Column 2 / Column 3 flyout items.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Target Section Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Section <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSection("featured")}
                    className={`py-2 px-3 text-sm font-medium rounded-md transition-all ${
                      section === "featured"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    1. New & Featured
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection("goal")}
                    className={`py-2 px-3 text-sm font-medium rounded-md transition-all ${
                      section === "goal"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    2. Explore by goal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Item Title in Column 1 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={section === "featured" ? "e.g. Learn AI with Google" : "e.g. Launch a new career"}
                  required
                  className="rounded-lg h-10"
                />
              </div>
            </div>

            {/* 2. Icon / Badge & Display Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Icon / Logo
                </label>
                <select
                  value={badgeOrIcon}
                  onChange={(e) => setBadgeOrIcon(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {ICON_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                  <option value="custom">Custom Image URL</option>
                </select>
              </div>

              {badgeOrIcon === "custom" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Custom Image URL
                  </label>
                  <Input
                    value={customIconUrl}
                    onChange={(e) => setCustomIconUrl(e.target.value)}
                    placeholder="https://.../icon.png"
                    className="rounded-lg h-10"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Icon Preview
                  </label>
                  <div className="h-10 flex items-center gap-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                    {renderExploreIcon(badgeOrIcon, "w-5 h-5") || <span className="text-slate-400">No icon selected</span>}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-6">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="rounded-lg h-9"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
              </div>
            </div>

            {/* 3. Column 2 Setup (Flyout panel) */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Column 2 & Column 3 Setup (Flyout Details)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure what displays in the 2nd and 3rd columns when the user hovers over "{title || "this item"}".
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Column 2 Header Title
                  </label>
                  <Input
                    value={column2Header}
                    onChange={(e) => setColumn2Header(e.target.value)}
                    placeholder="e.g. Google Learning Paths, In-demand Careers"
                    className="h-8 text-xs rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Column 2 Items list */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Column 2 Items
                </label>

                {column2Items.map((col2, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-400 w-6 text-center">
                        #{cIdx + 1}
                      </span>
                      <Input
                        value={col2.name}
                        onChange={(e) => handleCol2FieldChange(cIdx, "name", e.target.value)}
                        placeholder="Item name (e.g. Full Stack Web Developer)"
                        className="h-9 text-sm rounded-md flex-1"
                      />
                      <Input
                        value={col2.link}
                        onChange={(e) => handleCol2FieldChange(cIdx, "link", e.target.value)}
                        placeholder="Link (e.g. /topic/full-stack or /course/search)"
                        className="h-9 text-sm rounded-md flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCol2Item(cIdx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Sub-items (Column 3) for this item */}
                    <div className="pl-9 pr-2 border-t border-slate-100 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-purple-600" />
                          Column 3 Sub-items (hovering this item will open Column 3)
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSubItem(cIdx)}
                          className="h-6 text-[11px] px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Sub-item
                        </Button>
                      </div>

                      {col2.subItems && col2.subItems.length > 0 ? (
                        <div className="space-y-1.5 bg-slate-50 p-2 rounded-md">
                          {col2.subItems.map((sub, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">└</span>
                              <Input
                                value={sub.name}
                                onChange={(e) =>
                                  handleSubItemFieldChange(cIdx, sIdx, "name", e.target.value)
                                }
                                placeholder="Sub-topic name (e.g. React JS, AI Agents)"
                                className="h-7 text-xs bg-white flex-1 rounded"
                              />
                              <Input
                                value={sub.link}
                                onChange={(e) =>
                                  handleSubItemFieldChange(cIdx, sIdx, "link", e.target.value)
                                }
                                placeholder="Sub-topic link (e.g. /topic/react-js)"
                                className="h-7 text-xs bg-white flex-1 rounded"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveSubItem(cIdx, sIdx)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          No Column 3 sub-items. This item will act as a direct link.
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCol2Item}
                  className="gap-1.5 text-xs text-purple-700 border-dashed border-purple-300 hover:bg-purple-50 w-full h-9 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column 2 Item
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-lg h-10">
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-10 px-6"
              >
                {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "Update Menu Item" : "Save Menu Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Configured Items List */}
      <div className="space-y-6">
        <h2 className="text-xl font-normal text-slate-800">
          Configured Explore Menu Sections
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading explore sections...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-slate-600 font-medium">No custom explore menu items added yet.</p>
            <p className="text-sm text-slate-400">
              When empty, only standard course categories are shown in the Explore menu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Section 1: New & Featured */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3">
                <CardTitle className="text-base font-medium text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-semibold">
                      Section 1
                    </span>
                    New & Featured ({featuredItems.length} items)
                  </span>
                  {featuredItems.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Not visible in navbar because 0 items</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {featuredItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    No items in "New & Featured". Use the form above to add an item.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Icon</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Column 2 Header</TableHead>
                        <TableHead>Col 2 Items</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {featuredItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{renderExploreIcon(item.badgeOrIcon, "w-5 h-5") || "-"}</TableCell>
                          <TableCell className="font-medium text-slate-800">{item.title}</TableCell>
                          <TableCell className="text-slate-600">{item.column2Header || "-"}</TableCell>
                          <TableCell className="text-slate-600">
                            {item.column2Items?.length || 0} items
                          </TableCell>
                          <TableCell>{item.order}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {item.isActive ? "Active" : "Hidden"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-purple-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(item)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Explore by goal */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3">
                <CardTitle className="text-base font-medium text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                      Section 2
                    </span>
                    Explore by goal ({goalItems.length} items)
                  </span>
                  {goalItems.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Not visible in navbar because 0 items</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {goalItems.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    No items in "Explore by goal". Use the form above to add an item.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Icon</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Column 2 Header</TableHead>
                        <TableHead>Col 2 Items</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goalItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{renderExploreIcon(item.badgeOrIcon, "w-5 h-5") || "-"}</TableCell>
                          <TableCell className="font-medium text-slate-800">{item.title}</TableCell>
                          <TableCell className="text-slate-600">{item.column2Header || "-"}</TableCell>
                          <TableCell className="text-slate-600">
                            {item.column2Items?.length || 0} items
                          </TableCell>
                          <TableCell>{item.order}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {item.isActive ? "Active" : "Hidden"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-purple-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(item)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Explore Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This item will no longer appear in the user Explore dropdown.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExploreMenuManager;
