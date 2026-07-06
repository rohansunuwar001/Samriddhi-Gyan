import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { ShieldCheck, Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { useUpdateUserInfoMutation } from "@/features/api/authApi";

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [updateUserInfo] = useUpdateUserInfoMutation();
  const { isAuthenticated } = useSelector((store) => store.auth);

  useEffect(() => {
    // Check if user has already given/declined consent
    const consent = Cookies.get("cookie_consent");
    if (!consent) {
      // Show banner after 1.5 seconds delay for a smooth user entrance
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else if (consent === "accepted") {
      initializeGeospatialTracking();
    }
  }, []);

  const handleAccept = () => {
    // Set cookie consent with 365 days expiration
    Cookies.set("cookie_consent", "accepted", { expires: 365 });
    setShowBanner(false);

    // Initialize cookies/geospatial tracking
    initializeGeospatialTracking();
  };

  const handleDecline = () => {
    Cookies.set("cookie_consent", "declined", { expires: 365 });
    setShowBanner(false);
  };

  const initializeGeospatialTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Store user coordinates in guest cookies for 30 days
          Cookies.set("user_coordinates", JSON.stringify({ latitude, longitude }), { expires: 30 });
          console.log("Geospatial coordinates successfully stored in cookies:", latitude, longitude);

          try {
            // Reverse geocode via OpenStreetMap Nominatim API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  "Accept-Language": "en"
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              const address = data.address || {};
              const locationDetails = {
                country: address.country || "",
                city: address.city || address.town || address.village || address.suburb || "",
                formattedAddress: data.display_name || "",
                latitude,
                longitude
              };

              // Store detailed location in cookies
              Cookies.set("user_location", JSON.stringify(locationDetails), { expires: 30 });
              console.log("Geospatial location resolved and stored in cookies:", locationDetails);

              // If user is authenticated, update their profile on the backend
              if (isAuthenticated) {
                await updateUserInfo({ locationDetails }).unwrap();
                console.log("User profile updated with geospatial details on backend.");
              }
            } else {
              console.warn("Failed to reverse geocode coordinates using Nominatim API.");
            }
          } catch (geocodeErr) {
            console.error("Error resolving geospatial coordinates address details:", geocodeErr);
          }
        },
        (err) => {
          console.warn("Geospatial tracking permission was declined by user:", err.message);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[9999] animate-slide-up">
      <div className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/60 shadow-2xl p-6 rounded-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-400">
            <Cookie className="h-6 w-6 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cookie & Privacy Consent
            </h3>
          </div>
          <button
            onClick={handleDecline}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
          We use cookies to optimize your learning experience, analyze platform traffic, and customize content recommendations. By clicking "Accept All", you agree to our privacy policy and geospatial localized content terms.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="h-10 text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-4"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className="h-10 text-sm font-semibold bg-purple-700 hover:bg-purple-800 text-white rounded-lg px-5 flex items-center gap-1.5"
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
