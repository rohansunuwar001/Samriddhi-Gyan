import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useGetCourseByIdQuery, useEditCourseMutation } from "@/features/api/courseApi";

const CURRENCY_TIERS = {
  NPR: [
    { label: "Free", value: "0", current: 0, original: 0 },
    { label: "Rs 999 (Tier 1)", value: "999", current: 999, original: 999 },
    { label: "Rs 1,999 (Tier 2)", value: "1999", current: 1999, original: 1999 },
    { label: "Rs 2,999 (Tier 3)", value: "2999", current: 2999, original: 2999 },
    { label: "Rs 4,999 (Tier 4)", value: "4999", current: 4999, original: 4999 },
    { label: "Rs 9,999 (Tier 5)", value: "9999", current: 9999, original: 9999 },
    { label: "Rs 19,999 (Tier 6)", value: "19999", current: 19999, original: 19999 },
  ],
  USD: [
    { label: "Free", value: "0", current: 0, original: 0 },
    { label: "$19.99 (Tier 1)", value: "19.99", current: 19.99, original: 19.99 },
    { label: "$29.99 (Tier 2)", value: "29.99", current: 29.99, original: 29.99 },
    { label: "$39.99 (Tier 3)", value: "39.99", current: 39.99, original: 39.99 },
    { label: "$49.99 (Tier 4)", value: "49.99", current: 49.99, original: 49.99 },
    { label: "$99.99 (Tier 5)", value: "99.99", current: 99.99, original: 99.99 },
    { label: "$199.99 (Tier 6)", value: "199.99", current: 199.99, original: 199.99 },
  ],
  INR: [
    { label: "Free", value: "0", current: 0, original: 0 },
    { label: "₹699 (Tier 1)", value: "699", current: 699, original: 699 },
    { label: "₹1,299 (Tier 2)", value: "1299", current: 1299, original: 1299 },
    { label: "₹1,999 (Tier 3)", value: "1999", current: 1999, original: 1999 },
    { label: "₹2,999 (Tier 4)", value: "2999", current: 2999, original: 2999 },
    { label: "₹5,999 (Tier 5)", value: "5999", current: 5999, original: 5999 },
    { label: "₹12,999 (Tier 6)", value: "12999", current: 12999, original: 12999 },
  ]
};

const PricingTab = () => {
  const { courseId } = useParams();
  const [currency, setCurrency] = useState("NPR");
  const [priceTier, setPriceTier] = useState("0");

  const { data: courseData, isLoading, refetch } = useGetCourseByIdQuery(courseId);
  const [editCourse, { isLoading: isSaving }] = useEditCourseMutation();

  const activeTiers = CURRENCY_TIERS[currency] || CURRENCY_TIERS.NPR;

  useEffect(() => {
    if (courseData?.course?.price) {
      const currentPrice = courseData.course.price.current;
      const matched = activeTiers.find((t) => t.current === currentPrice);
      if (matched) {
        setPriceTier(matched.value);
      } else {
        setPriceTier(String(currentPrice || 0));
      }
    }
  }, [courseData, currency, activeTiers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
      </div>
    );
  }

  const handleSave = async () => {
    const selected = activeTiers.find((t) => t.value === priceTier);
    if (!selected) return;

    const formData = new FormData();
    formData.append("price[current]", selected.current);
    formData.append("price[original]", selected.original);

    try {
      await editCourse({ courseId, formData }).unwrap();
      toast.success("Pricing updated successfully.");
      refetch();
    } catch {
      toast.error("Failed to update pricing.");
    }
  };

  return (
    <div className="bg-white border border-[#d1d7dc] p-10 shadow-sm relative font-sans text-lg font-normal text-[#1c1d1f]">
      
      {/* HEADER SECTION */}
      <div className="border-b border-[#d1d7dc] pb-5 mb-8">
        <h2 className="text-3xl font-normal">Pricing</h2>
      </div>

      {/* PREMIUM APPLICATION WARNING BANNER */}
      <div className="bg-amber-50/40 border border-amber-500/50 p-6 mb-8 flex gap-4 items-start rounded-sm">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-normal text-xl text-[#1c1d1f] mb-1.5">Please finish your premium application</h4>
          <p className="text-lg text-[#6a6f73] font-light">
            You'll be able to set your price once your payout method is approved.
          </p>
          <button
            onClick={() => toast.info("Premium instructor application workflow is currently mock.")}
            className="border border-[#b4690e] text-[#b4690e] hover:bg-amber-50 text-lg font-normal px-5 py-2.5 mt-3 transition-colors bg-white rounded-sm"
          >
            Complete the premium application
          </button>
        </div>
      </div>

      {/* SET PRICE FORM */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-normal text-[#1c1d1f] mb-2">Set a price for your course</h3>
          <p className="text-lg text-[#6a6f73] font-light max-w-2xl leading-relaxed">
            Please select the currency and the price tier for your course. If you'd like to offer your course for free, it must have a total video length of less than 2 hours. Also, courses with practice tests can not be free.
          </p>
        </div>

        <div className="flex gap-6 max-w-lg">
          {/* Currency dropdown */}
          <div className="flex-1">
            <label className="block text-base font-normal text-[#1c1d1f] mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-[#6a6f73] px-3.5 py-3 text-lg font-normal outline-none bg-white focus:border-[#1c1d1f]"
            >
              <option value="NPR">NPR</option>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
          </div>

          {/* Price Tier dropdown */}
          <div className="flex-1">
            <label className="block text-base font-normal text-[#1c1d1f] mb-2">Price Tier</label>
            <select
              value={priceTier}
              onChange={(e) => setPriceTier(e.target.value)}
              className="w-full border border-[#6a6f73] px-3.5 py-3 text-lg font-normal outline-none bg-white focus:border-[#1c1d1f]"
            >
              {activeTiers.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#a435f0] hover:bg-[#8710d8] disabled:bg-slate-300 text-white font-normal text-lg px-6 py-2.5 transition-colors rounded-sm"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default PricingTab;
