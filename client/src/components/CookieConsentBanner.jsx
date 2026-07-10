import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { useUpdateUserInfoMutation, useTrackVisitMutation } from "@/features/api/authApi";
import { ShieldCheck, X } from "lucide-react";

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [updateUserInfo] = useUpdateUserInfoMutation();
  const [trackVisit] = useTrackVisitMutation();
  const { isAuthenticated } = useSelector((store) => store.auth);

  useEffect(() => {
    const consent = Cookies.get("cookie_consent");
    if (!consent) {
      // Delay showing the banner slightly for a premium, non-intrusive entry
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else if (consent === "accepted") {
      // If already accepted, trigger silent visit tracking
      triggerTracking();
    }
  }, [isAuthenticated]);

  const triggerTracking = () => {
    const sessionTracked = sessionStorage.getItem("visit_tracked");
    if (sessionTracked) return;

    const existingCoords = Cookies.get("user_coordinates");
    if (!existingCoords) {
      runSilentGeolocation();
    } else {
      const locationCookie = Cookies.get("user_location");
      if (locationCookie) {
        try {
          const locationDetails = JSON.parse(locationCookie);
          // Log visit silently
          trackVisit(locationDetails).unwrap().catch(() => {});
          sessionStorage.setItem("visit_tracked", "true");

          if (isAuthenticated) {
            updateUserInfo({ locationDetails }).unwrap().catch(() => {});
          }
        } catch (err) {
          console.error("Error parsing user_location cookie:", err);
          runSilentGeolocation();
        }
      } else {
        runSilentGeolocation();
      }
    }
  };

  const runSilentGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Store coordinates in guest cookies for 30 days
          Cookies.set("user_coordinates", JSON.stringify({ latitude, longitude }), { expires: 30 });

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
              
              // Resolve Continent from Nominatim or leave to backend lookup resolver
              const locationDetails = {
                country: address.country || "",
                city: address.city || address.town || address.village || address.suburb || "",
                formattedAddress: data.display_name || "",
                latitude,
                longitude
              };

              // Store resolved details in cookies
              Cookies.set("user_location", JSON.stringify(locationDetails), { expires: 30 });

              // Track visit silently on the database
              await trackVisit(locationDetails).unwrap().catch(() => {});
              sessionStorage.setItem("visit_tracked", "true");

              // Update user profile on the backend if authenticated
              if (isAuthenticated) {
                await updateUserInfo({ locationDetails }).unwrap();
              }
            } else {
              // Fallback to IP-based tracking if reverse geocode fails
              await trackVisit(null).unwrap().catch(() => {});
              sessionStorage.setItem("visit_tracked", "true");
            }
          } catch (geocodeErr) {
            console.error("Error reverse geocoding user coordinates:", geocodeErr);
            // Fallback to IP-based tracking
            await trackVisit(null).unwrap().catch(() => {});
            sessionStorage.setItem("visit_tracked", "true");
          }
        },
        (err) => {
          console.warn("Geospatial tracking permission declined by browser:", err.message);
          // IP-based fallback tracking
          trackVisit(null).unwrap().catch(() => {});
          sessionStorage.setItem("visit_tracked", "true");
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      // Browser doesn't support geolocation, execute IP fallback
      trackVisit(null).unwrap().catch(() => {});
      sessionStorage.setItem("visit_tracked", "true");
    }
  };

  const handleAccept = () => {
    Cookies.set("cookie_consent", "accepted", { expires: 365 });
    setShowBanner(false);
    triggerTracking();
  };

  const handleDecline = () => {
    Cookies.set("cookie_consent", "declined", { expires: 30 });
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
              Cookie & Location Consent
            </h4>
          </div>
          <button 
            onClick={handleDecline} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
          We use cookies and coarse geolocation data to optimize your learning workspace, analyze demographic metrics, and coordinate security measures. By accepting, you consent to our privacy policies.
        </p>
        <div className="flex items-center gap-3 justify-end pt-1">
          <button
            onClick={handleDecline}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
