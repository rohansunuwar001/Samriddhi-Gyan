import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useGetActiveDiscountBannerQuery } from "@/features/api/cmsApi";

const DiscountBannerBar = () => {
  const { data, isLoading } = useGetActiveDiscountBannerQuery();
  const [isDismissed, setIsDismissed] = useState(true); // Default hidden during load

  const banner = data?.banner;

  useEffect(() => {
    if (banner) {
      const dismissedId = sessionStorage.getItem("dismissedDiscountBannerId");
      if (dismissedId === banner._id) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [banner]);

  if (isLoading || !banner || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem("dismissedDiscountBannerId", banner._id);
    setIsDismissed(true);
  };

  // Render text with embedded link
  const renderContent = () => {
    const { text, linkText, linkUrl } = banner;

    if (!linkText || !linkUrl) {
      return <span>{text}</span>;
    }

    // Check if the main text already contains the linkText placeholder
    if (text.includes(linkText)) {
      const parts = text.split(linkText);
      return (
        <span>
          {parts[0]}
          <Link
            to={linkUrl}
            className="underline font-bold transition-all opacity-90 hover:opacity-100 mx-1"
          >
            {linkText}
          </Link>
          {parts[1]}
        </span>
      );
    }

    // Appended link fallback
    return (
      <span>
        {text}{" "}
        <Link
          to={linkUrl}
          className="underline font-bold transition-all opacity-90 hover:opacity-100 ml-1"
        >
          {linkText}
        </Link>
      </span>
    );
  };

  return (
    <div
      className="relative w-full flex items-center justify-center text-center py-2.5 px-10 text-xs sm:text-sm transition-all duration-300 shadow-sm z-45"
      style={{
        backgroundColor: banner.bgColor || "#dbf5f6",
        color: banner.textColor || "#1c1d1f"
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center font-medium">
        {renderContent()}
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default DiscountBannerBar;
