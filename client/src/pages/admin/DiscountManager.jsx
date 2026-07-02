import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Percent,
  Gift,
  Navigation,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  CreditCard
} from "lucide-react";
import {
  useGetDiscountBannersQuery,
  useCreateDiscountBannerMutation,
  useUpdateDiscountBannerMutation,
  useDeleteDiscountBannerMutation,
  useGetGetOfferPromosQuery,
  useCreateGetOfferPromoMutation,
  useUpdateGetOfferPromoMutation,
  useDeleteGetOfferPromoMutation,
  useGetSubscriptionNavbarsQuery,
  useCreateSubscriptionNavbarMutation,
  useUpdateSubscriptionNavbarMutation,
  useDeleteSubscriptionNavbarMutation
} from "@/features/api/cmsApi";
import {
  useGetSubscriptionPlansQuery,
  useUpdateSubscriptionPlansMutation
} from "@/features/api/subscriptionPlansApi";

const DiscountManager = () => {
  const [activeTab, setActiveTab] = useState("banner");

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Queries
  const { data: bannerData, isLoading: loadingBanners } = useGetDiscountBannersQuery();
  const { data: promoData, isLoading: loadingPromos } = useGetGetOfferPromosQuery();
  const { data: navbarData, isLoading: loadingNavbars } = useGetSubscriptionNavbarsQuery();
  const { data: plansData, isLoading: loadingPlans } = useGetSubscriptionPlansQuery();

  // Mutations
  const [createBanner, { isLoading: creatingBanner }] = useCreateDiscountBannerMutation();
  const [updateBanner, { isLoading: updatingBanner }] = useUpdateDiscountBannerMutation();
  const [deleteBanner] = useDeleteDiscountBannerMutation();

  const [createPromo, { isLoading: creatingPromo }] = useCreateGetOfferPromoMutation();
  const [updatePromo, { isLoading: updatingPromo }] = useUpdateGetOfferPromoMutation();
  const [deletePromo] = useDeleteGetOfferPromoMutation();

  const [createNavbar, { isLoading: creatingNavbar }] = useCreateSubscriptionNavbarMutation();
  const [updateNavbarMutation, { isLoading: updatingNavbar }] = useUpdateSubscriptionNavbarMutation();
  const [deleteNavbar] = useDeleteSubscriptionNavbarMutation();
  const [updatePlansMutation, { isLoading: isUpdatingPlans }] = useUpdateSubscriptionPlansMutation();

  const [plansForm, setPlansForm] = useState([]);

  useEffect(() => {
    if (plansData?.plans) {
      setPlansForm(plansData.plans.map(p => ({
        key: p.key,
        planName: p.planName,
        durationMonths: p.durationMonths,
        priceNpr: p.priceNpr,
        discountNpr: p.discountNpr
      })));
    }
  }, [plansData]);

  // Form states
  const [bannerForm, setBannerForm] = useState({
    text: "",
    linkText: "",
    linkUrl: "",
    bgColor: "#dbf5f6",
    textColor: "#1c1d1f",
    isActive: false
  });

  const [promoForm, setPromoForm] = useState({
    badgeText: "Personal Plan",
    title: "",
    description: "",
    buttonText: "Get the offer",
    buttonUrl: "/subscribe",
    finePrint: "",
    isActive: false
  });

  const [navbarForm, setNavbarForm] = useState({
    planName: "Personal Plan",
    pricingText: "",
    buttonText: "Start subscription",
    buttonUrl: "/subscribe",
    isActive: false
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    if (activeTab === "banner") {
      setBannerForm({
        text: "",
        linkText: "",
        linkUrl: "",
        bgColor: "#dbf5f6",
        textColor: "#1c1d1f",
        isActive: false
      });
    } else if (activeTab === "promo") {
      setPromoForm({
        badgeText: "Personal Plan",
        title: "",
        description: "",
        buttonText: "Get the offer",
        buttonUrl: "/subscribe",
        finePrint: "",
        isActive: false
      });
    } else {
      setNavbarForm({
        planName: "Personal Plan",
        pricingText: "",
        buttonText: "Start subscription",
        buttonUrl: "/subscribe",
        isActive: false
      });
    }
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    if (activeTab === "banner") {
      setBannerForm({
        text: item.text || "",
        linkText: item.linkText || "",
        linkUrl: item.linkUrl || "",
        bgColor: item.bgColor || "#dbf5f6",
        textColor: item.textColor || "#1c1d1f",
        isActive: item.isActive || false
      });
    } else if (activeTab === "promo") {
      setPromoForm({
        badgeText: item.badgeText || "Personal Plan",
        title: item.title || "",
        description: item.description || "",
        buttonText: item.buttonText || "Get the offer",
        buttonUrl: item.buttonUrl || "/subscribe",
        finePrint: item.finePrint || "",
        isActive: item.isActive || false
      });
    } else {
      setNavbarForm({
        planName: item.planName || "Personal Plan",
        pricingText: item.pricingText || "",
        buttonText: item.buttonText || "Start subscription",
        buttonUrl: item.buttonUrl || "/subscribe",
        isActive: item.isActive || false
      });
    }
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === "banner") {
        if (editingItem) {
          await updateBanner({ id: editingItem._id, ...bannerForm }).unwrap();
          toast.success("Discount banner updated successfully!");
        } else {
          await createBanner(bannerForm).unwrap();
          toast.success("Discount banner created successfully!");
        }
      } else if (activeTab === "promo") {
        if (editingItem) {
          await updatePromo({ id: editingItem._id, ...promoForm }).unwrap();
          toast.success("Promo offer updated successfully!");
        } else {
          await createPromo(promoForm).unwrap();
          toast.success("Promo offer created successfully!");
        }
      } else {
        if (editingItem) {
          await updateNavbarMutation({ id: editingItem._id, ...navbarForm }).unwrap();
          toast.success("Navbar configuration updated successfully!");
        } else {
          await createNavbar(navbarForm).unwrap();
          toast.success("Navbar configuration created successfully!");
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || "Operation failed.");
    }
  };

  // Toggle active directly from list
  const handleToggleActive = async (item) => {
    try {
      const updatedStatus = !item.isActive;
      if (activeTab === "banner") {
        await updateBanner({
          id: item._id,
          text: item.text,
          linkText: item.linkText,
          linkUrl: item.linkUrl,
          bgColor: item.bgColor,
          textColor: item.textColor,
          isActive: updatedStatus
        }).unwrap();
        toast.success(updatedStatus ? "Banner activated!" : "Banner deactivated!");
      } else if (activeTab === "promo") {
        await updatePromo({
          id: item._id,
          badgeText: item.badgeText,
          title: item.title,
          description: item.description,
          buttonText: item.buttonText,
          buttonUrl: item.buttonUrl,
          finePrint: item.finePrint,
          isActive: updatedStatus
        }).unwrap();
        toast.success(updatedStatus ? "Offer activated!" : "Offer deactivated!");
      } else {
        await updateNavbarMutation({
          id: item._id,
          planName: item.planName,
          pricingText: item.pricingText,
          buttonText: item.buttonText,
          buttonUrl: item.buttonUrl,
          isActive: updatedStatus
        }).unwrap();
        toast.success(updatedStatus ? "Navbar activated!" : "Navbar deactivated!");
      }
    } catch (err) {
      toast.error("Failed to toggle status.");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this configuration?")) return;
    try {
      if (activeTab === "banner") {
        await deleteBanner(id).unwrap();
        toast.success("Banner deleted successfully!");
      } else if (activeTab === "promo") {
        await deletePromo(id).unwrap();
        toast.success("Promo offer deleted successfully!");
      } else {
        await deleteNavbar(id).unwrap();
        toast.success("Navbar configuration deleted successfully!");
      }
    } catch (err) {
      toast.error("Deletion failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1c1d1f] dark:text-white">
            Discount & Promos CMS
          </h1>
          <p className="text-gray-500 mt-1">
            Manage top announcement bars, special promotion cards, and scroll-triggered subscription navbars.
          </p>
        </div>
        {activeTab !== "plans" && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-[#a435f0] hover:bg-[#8720cf] text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-md shrink-0 w-full md:w-auto"
          >
            <Plus size={18} /> Add New Configuration
          </button>
        )}
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("banner")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === "banner"
              ? "border-[#a435f0] text-[#a435f0]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Percent size={16} /> Top Announcement Bar
        </button>
        <button
          onClick={() => setActiveTab("promo")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === "promo"
              ? "border-[#a435f0] text-[#a435f0]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Gift size={16} /> Get Offer Promo Card
        </button>
        <button
          onClick={() => setActiveTab("navbar")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === "navbar"
              ? "border-[#a435f0] text-[#a435f0]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Navigation size={16} /> Sticky Sub Navbar
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === "plans"
              ? "border-[#a435f0] text-[#a435f0]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <CreditCard size={16} /> Subscription Plans
        </button>
      </div>

      {/* Contents based on active tab */}
      <div className="bg-white dark:bg-[#1c1d1f] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* BANNER TAB */}
        {activeTab === "banner" && (
          <div>
            {loadingBanners ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#a435f0]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                      <th className="px-6 py-4">Preview</th>
                      <th className="px-6 py-4">Banner Text / Link</th>
                      <th className="px-6 py-4">Colors</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {bannerData?.banners?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                          No announcement banners configured. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      bannerData?.banners?.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                          <td className="px-6 py-4">
                            <div
                              className="px-4 py-1.5 rounded text-xs font-semibold text-center truncate max-w-[200px]"
                              style={{ backgroundColor: item.bgColor, color: item.textColor }}
                            >
                              {item.text}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white max-w-sm truncate">
                              {item.text}
                            </div>
                            {item.linkText && (
                              <div className="text-xs text-[#a435f0] mt-1 font-semibold">
                                Link: "{item.linkText}" → {item.linkUrl}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono space-y-1">
                            <div>BG: {item.bgColor}</div>
                            <div>Text: {item.textColor}</div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                item.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                  : "bg-gray-150 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${item.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                              {item.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="inline-flex p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-850 text-blue-500 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="inline-flex p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-850 text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROMO TAB */}
        {activeTab === "promo" && (
          <div>
            {loadingPromos ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#a435f0]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                      <th className="px-6 py-4">Title / Description</th>
                      <th className="px-6 py-4">Badge</th>
                      <th className="px-6 py-4">CTA Button</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {promoData?.promos?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                          No promo configurations. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      promoData?.promos?.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                          <td className="px-6 py-4 max-w-sm">
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                              {item.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 px-2.5 py-0.5 rounded text-xs font-semibold">
                              {item.badgeText}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">
                            <div>Text: "{item.buttonText}"</div>
                            <div className="text-gray-400 mt-0.5">Link: {item.buttonUrl}</div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                item.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                  : "bg-gray-150 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${item.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                              {item.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="inline-flex p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-850 text-blue-500 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="inline-flex p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-850 text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* NAVBAR TAB */}
        {activeTab === "navbar" && (
          <div>
            {loadingNavbars ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#a435f0]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                      <th className="px-6 py-4">Plan Name</th>
                      <th className="px-6 py-4">Pricing text</th>
                      <th className="px-6 py-4">CTA Button</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {navbarData?.navbars?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                          No sticky navbar configurations. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      navbarData?.navbars?.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                            {item.planName}
                          </td>
                          <td className="px-6 py-4 max-w-sm text-gray-500 truncate">
                            {item.pricingText}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">
                            <div>Text: "{item.buttonText}"</div>
                            <div className="text-gray-400 mt-0.5">Link: {item.buttonUrl}</div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                item.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                  : "bg-gray-150 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${item.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                              {item.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="inline-flex p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-850 text-blue-500 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="inline-flex p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-850 text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PLANS TAB */}
        {activeTab === "plans" && (
          <div>
            {loadingPlans ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#a435f0]" />
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await updatePlansMutation({ plans: plansForm }).unwrap();
                  toast.success("Subscription pricing plans updated successfully!");
                } catch (err) {
                  toast.error(err.data?.message || "Failed to save plan pricing.");
                }
              }} className="p-6 space-y-6">
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                        <th className="px-6 py-4">Plan Name</th>
                        <th className="px-6 py-4">Duration (Months)</th>
                        <th className="px-6 py-4">Base Price (NPR)</th>
                        <th className="px-6 py-4">Discount (NPR)</th>
                        <th className="px-6 py-4">Final Price (NPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {plansForm.map((plan, index) => (
                        <tr key={plan.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                            {plan.planName}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                            {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              required
                              min="0"
                              value={plan.priceNpr}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPlansForm(prev => prev.map((p, idx) => idx === index ? { ...p, priceNpr: val } : p));
                              }}
                              className="w-32 border dark:border-gray-700 bg-transparent rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              required
                              min="0"
                              value={plan.discountNpr}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPlansForm(prev => prev.map((p, idx) => idx === index ? { ...p, discountNpr: val } : p));
                              }}
                              className="w-32 border dark:border-gray-700 bg-transparent rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                            />
                          </td>
                          <td className="px-6 py-4 font-extrabold text-[#1c1d1f] dark:text-white">
                            Rs {(plan.priceNpr - plan.discountNpr).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isUpdatingPlans}
                    className="flex items-center justify-center gap-2 bg-[#a435f0] hover:bg-[#8720cf] text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md"
                  >
                    {isUpdatingPlans && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Subscription Prices
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* DIALOG MODAL FOR FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1d1f] w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {editingItem ? "Edit Configuration" : "Add New Configuration"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded hover:bg-gray-250 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* FORM FIELDS FOR DISCOUNT BANNER */}
              {activeTab === "banner" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                      Banner Text
                    </label>
                    <input
                      type="text"
                      required
                      value={bannerForm.text}
                      onChange={(e) => setBannerForm({ ...bannerForm, text: e.target.value })}
                      placeholder="e.g. 1 day left! Transform your wishlist goals into career skills | Get those skills and more with this"
                      className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Link Text (within Banner)
                      </label>
                      <input
                        type="text"
                        value={bannerForm.linkText}
                        onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                        placeholder="e.g. special offer."
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Link Redirect URL
                      </label>
                      <input
                        type="text"
                        value={bannerForm.linkUrl}
                        onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                        placeholder="e.g. /subscribe"
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Background Color (Hex)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bannerForm.bgColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, bgColor: e.target.value })}
                          className="w-10 h-9 rounded cursor-pointer border border-gray-300 dark:border-gray-700"
                        />
                        <input
                          type="text"
                          value={bannerForm.bgColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, bgColor: e.target.value })}
                          className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0] font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Text Color (Hex)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bannerForm.textColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                          className="w-10 h-9 rounded cursor-pointer border border-gray-300 dark:border-gray-700"
                        />
                        <input
                          type="text"
                          value={bannerForm.textColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                          className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="bannerActive"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#a435f0] border-gray-300 rounded focus:ring-[#a435f0] cursor-pointer"
                    />
                    <label htmlFor="bannerActive" className="text-sm font-semibold select-none cursor-pointer">
                      Activate this announcement bar (others will be deactivated)
                    </label>
                  </div>
                </div>
              )}

              {/* FORM FIELDS FOR GET OFFER CARD */}
              {activeTab === "promo" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Badge Text
                      </label>
                      <input
                        type="text"
                        required
                        value={promoForm.badgeText}
                        onChange={(e) => setPromoForm({ ...promoForm, badgeText: e.target.value })}
                        placeholder="e.g. 10% off for the first 1 year(s)"
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Promo Title
                      </label>
                      <input
                        type="text"
                        required
                        value={promoForm.title}
                        onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                        placeholder="e.g. Special offer: 10% off..."
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      required
                      rows="3"
                      value={promoForm.description}
                      onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                      placeholder="e.g. Unlock AI upskilling, practice tests, certifications, and more to make your wishlist dreams come true."
                      className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0] resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={promoForm.buttonText}
                        onChange={(e) => setPromoForm({ ...promoForm, buttonText: e.target.value })}
                        placeholder="e.g. Get the offer"
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        CTA Button URL
                      </label>
                      <input
                        type="text"
                        value={promoForm.buttonUrl}
                        onChange={(e) => setPromoForm({ ...promoForm, buttonUrl: e.target.value })}
                        placeholder="e.g. /subscribe"
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                      Fine Print / Terms (Optional)
                    </label>
                    <textarea
                      rows="2"
                      value={promoForm.finePrint}
                      onChange={(e) => setPromoForm({ ...promoForm, finePrint: e.target.value })}
                      placeholder="e.g. Country restrictions apply. Auto-renews unless canceled."
                      className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0] resize-none text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="promoActive"
                      checked={promoForm.isActive}
                      onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#a435f0] border-gray-300 rounded focus:ring-[#a435f0] cursor-pointer"
                    />
                    <label htmlFor="promoActive" className="text-sm font-semibold select-none cursor-pointer">
                      Activate this promo card on subscription page
                    </label>
                  </div>
                </div>
              )}

              {/* FORM FIELDS FOR STICKY SUBSCRIPTION NAVBAR */}
              {activeTab === "navbar" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      required
                      value={navbarForm.planName}
                      onChange={(e) => setNavbarForm({ ...navbarForm, planName: e.target.value })}
                      placeholder="e.g. Personal Plan"
                      className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                      Pricing Detail Text
                    </label>
                    <input
                      type="text"
                      required
                      value={navbarForm.pricingText}
                      onChange={(e) => setNavbarForm({ ...navbarForm, pricingText: e.target.value })}
                      placeholder="e.g. Starting at $10.00 $9.00 per month. Cancel anytime."
                      className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Button CTA Text
                      </label>
                      <input
                        type="text"
                        value={navbarForm.buttonText}
                        onChange={(e) => setNavbarForm({ ...navbarForm, buttonText: e.target.value })}
                        placeholder="e.g. Start subscription"
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                        Button Redirect URL
                      </label>
                      <input
                        type="text"
                        value={navbarForm.buttonUrl}
                        onChange={(e) => setNavbarForm({ ...navbarForm, buttonUrl: e.target.value })}
                        placeholder="e.g. /subscribe"
                        className="w-full border dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="navbarActive"
                      checked={navbarForm.isActive}
                      onChange={(e) => setNavbarForm({ ...navbarForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#a435f0] border-gray-300 rounded focus:ring-[#a435f0] cursor-pointer"
                    />
                    <label htmlFor="navbarActive" className="text-sm font-semibold select-none cursor-pointer">
                      Activate this sticky navbar configuration
                    </label>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border dark:border-gray-700 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBanner || updatingBanner || creatingPromo || updatingPromo || creatingNavbar || updatingNavbar}
                  className="flex items-center justify-center gap-1.5 bg-[#a435f0] hover:bg-[#8720cf] text-white px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-md"
                >
                  {(creatingBanner || updatingBanner || creatingPromo || updatingPromo || creatingNavbar || updatingNavbar) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManager;
