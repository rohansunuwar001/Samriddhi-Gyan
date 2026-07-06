import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  useGetNearbyTutorsQuery,
  useGetNearbyPeersQuery,
} from "@/features/api/userApi";
import {
  MapPin,
  Users,
  BookOpen,
  Navigation,
  Compass,
  Search,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Globe,
  Car,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to parse cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// 2D Live Street Map Tracker (Google Maps API-based supporting all three visual modes in Light Theme & Ridesharing Directions)
const LiveTrackingMap = ({ userCoords, tutors = [], peers = [], activeTab, onUserMove, visualMode, activeRouteTarget, setActiveRouteTarget }) => {
  const mapContainerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const userMarkerRef = React.useRef(null);
  const radarCircleRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const polylinesRef = React.useRef([]);
  
  // Directions routing references
  const directionsServiceRef = React.useRef(null);
  const directionsRendererRef = React.useRef(null);
  const [routeInfo, setRouteInfo] = React.useState(null);

  // 1. Initialize Google Map & Directions Instances
  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    const google = window.google;
    if (!google) {
      console.warn("Google Maps SDK not loaded yet. Make sure to paste a valid API key in index.html");
      return;
    }

    const initialLat = userCoords?.lat || 27.7172;
    const initialLon = userCoords?.lon || 85.3240;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: initialLat, lng: initialLon },
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // Keep our customized markers
      polylineOptions: {
        strokeColor: "#4f46e5", // Indigo routing path
        strokeWeight: 5,
        strokeOpacity: 0.85
      }
    });

    mapRef.current = map;
  }, []);

  // 2. Real-Time Geolocation Tracking (watchPosition)
  React.useEffect(() => {
    const google = window.google;
    if (!google || !mapRef.current) return;

    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (onUserMove) {
            onUserMove({ lat: latitude, lon: longitude });
          }

          const map = mapRef.current;
          const pos = { lat: latitude, lng: longitude };

          // Update or Create Pulsing User Marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(pos);
          } else {
            userMarkerRef.current = new google.maps.Marker({
              position: pos,
              map: map,
              title: "Your Location (Live)",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#4f46e5", // Indigo
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2.5,
                scale: 8
              }
            });
          }

          // Smoothly pan map center to track student movement (only if not navigating a route or zoomed out on globe)
          if (visualMode !== "globe" && !activeRouteTarget) {
            map.panTo(pos);
          }
        },
        (error) => {
          console.error("Google Geolocation Watch Error:", error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [onUserMove, visualMode, activeRouteTarget]);

  // 3. Dynamic Visual Modes Handler (Map, Globe, Radar)
  React.useEffect(() => {
    const google = window.google;
    const map = mapRef.current;
    if (!google || !map) return;

    // Clean up previous radar circles
    if (radarCircleRef.current) {
      radarCircleRef.current.setMap(null);
      radarCircleRef.current = null;
    }

    // Only set map styles and zooms if we are NOT actively navigating a route
    if (!activeRouteTarget) {
      if (visualMode === "globe") {
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
        map.setZoom(5);
      } else if (visualMode === "radar") {
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
        map.setZoom(15);

        if (userCoords) {
          const center = { lat: userCoords.lat, lng: userCoords.lon };
          map.panTo(center);

          radarCircleRef.current = new google.maps.Circle({
            strokeColor: "#4f46e5",
            strokeOpacity: 0.6,
            strokeWeight: 1.5,
            fillColor: "#818cf8",
            fillOpacity: 0.12,
            map: map,
            center: center,
            radius: 1200
          });
        }
      } else {
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setZoom(14);
        if (userCoords) {
          map.panTo({ lat: userCoords.lat, lng: userCoords.lon });
        }
      }
    }
  }, [visualMode, userCoords, activeRouteTarget]);

  // 4. Live Trip / Directions Route Engine
  React.useEffect(() => {
    const google = window.google;
    const map = mapRef.current;
    const directionsService = directionsServiceRef.current;
    const directionsRenderer = directionsRendererRef.current;

    if (!google || !map || !directionsService || !directionsRenderer) return;

    // Clear route if no target is active
    if (!activeRouteTarget || !userCoords) {
      directionsRenderer.setDirections({ routes: [] });
      setRouteInfo(null);
      return;
    }

    const targetLat = activeRouteTarget.locationDetails?.latitude;
    const targetLon = activeRouteTarget.locationDetails?.longitude;
    if (targetLat === undefined || targetLon === undefined) return;

    // Always force roadmap view for clean turn-by-turn navigation paths
    map.setMapTypeId(google.maps.MapTypeId.ROADMAP);

    directionsService.route(
      {
        origin: { lat: userCoords.lat, lng: userCoords.lon },
        destination: { lat: targetLat, lng: targetLon },
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          if (route && route.legs && route.legs[0]) {
            const leg = route.legs[0];
            setRouteInfo({
              duration: leg.duration.text,
              distance: leg.distance.text,
              instruction: leg.steps[0]?.instructions.replace(/<[^>]*>/g, '') || "Follow GPS routing path"
            });
          }
        } else {
          console.warn("Directions service failed: " + status + ". Falling back to geodesic line.");
          directionsRenderer.setDirections({ routes: [] });

          // Calculate direct Haversine distance as fallback
          const R_earth = 6371; // km
          const dLat = ((targetLat - userCoords.lat) * Math.PI) / 180;
          const dLon = ((targetLon - userCoords.lon) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userCoords.lat * Math.PI) / 180) *
              Math.cos((targetLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const directDistance = R_earth * c;

          setRouteInfo({
            duration: "Directions API disabled",
            distance: `${directDistance.toFixed(2)} km (direct)`,
            instruction: "Enable 'Directions API' in Google Cloud for turn-by-turn road routes."
          });

          // Draw the fallback dashed polyline
          const fallbackPath = new google.maps.Polyline({
            path: [
              { lat: userCoords.lat, lng: userCoords.lon },
              { lat: targetLat, lng: targetLon }
            ],
            geodesic: true,
            strokeColor: "#4f46e5",
            strokeOpacity: 0,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 0.7,
                  scale: 2,
                  strokeWeight: 2
                },
                offset: "0",
                repeat: "10px"
              }
            ]
          });
          fallbackPath.setMap(map);
          polylinesRef.current.push(fallbackPath);
        }
      }
    );
  }, [activeRouteTarget, userCoords]);

  // 5. Render Nearby Members Markers
  React.useEffect(() => {
    const google = window.google;
    const map = mapRef.current;
    if (!google || !map) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Clear previous straight-line paths (since we use DirectionsRenderer now!)
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const targets = activeTab === "tutors" ? tutors : peers;
    const bounds = new google.maps.LatLngBounds();

    if (userCoords) {
      bounds.extend({ lat: userCoords.lat, lng: userCoords.lon });
    }

    targets.forEach((target) => {
      const lat = target.locationDetails?.latitude;
      const lon = target.locationDetails?.longitude;
      if (lat === undefined || lon === undefined) return;

      const targetPos = { lat, lng: lon };
      bounds.extend(targetPos);

      const marker = new google.maps.Marker({
        position: targetPos,
        map: map,
        title: target.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: activeTab === "tutors" ? "#f59e0b" : "#10b981",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 6
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; padding: 4px; line-height: 1.4;">
            <b style="font-size: 13px; display: block; margin-bottom: 2px; color: #1e1b4b;">${target.name}</b>
            <span style="color: #64748b; display: block; margin-bottom: 4px;">${target.headline || ''}</span>
            <b style="color: #4f46e5; display: block; margin-top: 2px;">
              ${target.distance !== undefined ? target.distance + ' km away' : 'Nearby Peer'}
            </b>
            ${activeTab === "tutors" ? '<button id="info-route-btn" style="margin-top:6px; background:#4f46e5; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:bold; cursor:pointer;">Start Navigation</button>' : ''}
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        
        // Listen to navigation trigger inside popup window bubble
        google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
          const btn = document.getElementById("info-route-btn");
          if (btn) {
            btn.onclick = () => {
              setActiveRouteTarget(target);
              infoWindow.close();
            };
          }
        });
      });

      markersRef.current.push(marker);
    });

    // Auto-adjust map boundaries to show student and all nearby results at once (only when not actively navigating)
    if (targets.length > 0 && userCoords && visualMode !== "globe" && !activeRouteTarget) {
      map.fitBounds(bounds);
    }
  }, [userCoords, tutors, peers, activeTab, visualMode, activeRouteTarget]);

  const handleCancelTrip = () => {
    setActiveRouteTarget(null);
  };

  return (
    <div className="w-full h-full relative z-0">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
      
      {/* Turn-by-Turn Instruction Banner (Floating Top HUD) */}
      {routeInfo && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 w-[90%] max-w-md bg-slate-900 text-white rounded-xl p-3.5 shadow-lg flex items-center gap-3 animate-in slide-in-from-top duration-300 font-sans border border-slate-800">
          <div className="p-2 bg-indigo-600 rounded-lg shrink-0 text-white flex items-center justify-center">
            <Navigation className="h-5 w-5 transform rotate-45" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Next Step</p>
            <p className="text-xs font-semibold mt-0.5 leading-snug">{routeInfo.instruction}</p>
          </div>
        </div>
      )}

      {/* Trip Duration / Distance HUD Overlay (Floating Bottom HUD) */}
      {routeInfo && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-[90%] max-w-md bg-white border border-slate-200 rounded-xl p-4 shadow-lg flex items-center justify-between animate-in slide-in-from-bottom duration-300 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
              <Car className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-extrabold text-slate-800">{routeInfo.duration}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">{routeInfo.distance}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">Navigating to {activeRouteTarget.name}</p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleCancelTrip}
            className="text-xs font-semibold h-8 shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border-none shadow-none"
          >
            Cancel Route
          </Button>
        </div>
      )}
    </div>
  );
};

const NearbyHub = () => {
  const [activeTab, setActiveTab] = useState("tutors"); // "tutors" | "peers"
  const [visualMode, setVisualMode] = useState("map"); // "map" | "globe" | "radar"
  const [coords, setCoords] = useState(null);
  const [activeRouteTarget, setActiveRouteTarget] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState(null);

  // Initialize coordinates from cookie if present
  useEffect(() => {
    const coordsCookie = getCookie("user_coordinates");
    if (coordsCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(coordsCookie));
        if (parsed.latitude && parsed.longitude) {
          setCoords({
            lat: parsed.latitude,
            lon: parsed.longitude,
          });
        }
      } catch (e) {
        console.error("Failed to parse user_coordinates cookie:", e);
      }
    }
  }, []);

  // Fetch nearby data based on coordinates
  const {
    data: tutorsData,
    isLoading: tutorsLoading,
    isFetching: tutorsFetching,
    refetch: refetchTutors,
    isError: tutorsError,
  } = useGetNearbyTutorsQuery(coords || { lat: 0, lon: 0 }, { skip: !coords });

  console.log("Tutors Data:", tutorsData);

  const {
    data: peersData,
    isLoading: peersLoading,
    isFetching: peersFetching,
    refetch: refetchPeers,
    isError: peersError,
  } = useGetNearbyPeersQuery(coords || { lat: 0, lon: 0 }, { skip: !coords });

  console.log("Peers Data:", peersData);

  const handleUserMove = React.useCallback((newCoords) => {
    setCoords((prev) => {
      if (prev && prev.lat === newCoords.lat && prev.lon === newCoords.lon) {
        return prev;
      }
      // Save coordinates to cookie so they persist across page refreshes
      document.cookie = `user_coordinates=${encodeURIComponent(JSON.stringify(newCoords))}; max-age=2592000; path=/`;
      return newCoords;
    });
  }, []);

  const detectLocation = () => {
    setLocLoading(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setCoords(newCoords);
        // Save in cookie for 30 days
        document.cookie = `user_coordinates=${encodeURIComponent(
          JSON.stringify({ latitude: newCoords.lat, longitude: newCoords.lon })
        )}; max-age=2592000; path=/`;
        setLocLoading(false);
      },
      (error) => {
        console.error(error);
        setLocError("Location access denied. Please enable location permissions.");
        setLocLoading(false);
      }
    );
  };

  const handleRefresh = () => {
    if (activeTab === "tutors") {
      refetchTutors();
    } else {
      refetchPeers();
    }
  };

  const isDataLoading = coords && (activeTab === "tutors" ? tutorsLoading || tutorsFetching : peersLoading || peersFetching);
  const isDataError = activeTab === "tutors" ? tutorsError : peersError;

  return (
    <div className="flex-1 p-6 sm:p-8 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 mb-8 shadow-md border border-indigo-950/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Compass className="h-3.5 w-3.5" />
            Geospatial Proximity Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Nearby Learning Hub</h1>
          <p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
            Discover local educational opportunities. Find nearby instructors for offline tutoring sessions, or connect with regional study circles while protecting your personal privacy.
          </p>
          
          {coords && (
            <div className="pt-2 flex items-center gap-2 text-xs text-indigo-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Location active: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 1. Map Visualizer Spanning Full Page Width */}
      <div className="mb-8">
        <Card className="shadow-sm border-slate-200 overflow-hidden bg-white text-slate-800 h-[550px] relative flex flex-col justify-between">
          <CardHeader className="relative z-10 pb-0 flex flex-row items-center justify-between space-y-0 bg-white/90 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm">
            <CardTitle className="text-sm text-slate-600 font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              {visualMode === "map" ? "Live Location Map" : visualMode === "globe" ? "3D Proximity Earth" : "2D Proximity Radar"}
            </CardTitle>
            
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setVisualMode("map")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  visualMode === "map" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Live Map
              </button>
              <button
                onClick={() => setVisualMode("globe")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  visualMode === "globe" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                3D Globe
              </button>
              <button
                onClick={() => setVisualMode("radar")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  visualMode === "radar" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                2D Radar
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="relative flex-1 flex items-center justify-center p-0 overflow-hidden min-h-[480px]">
            <div className="w-full h-full relative z-0">
              <LiveTrackingMap 
                userCoords={coords} 
                tutors={tutorsData?.tutors || []} 
                peers={peersData?.peers || []} 
                activeTab={activeTab}
                onUserMove={handleUserMove}
                visualMode={visualMode}
                activeRouteTarget={activeRouteTarget}
                setActiveRouteTarget={setActiveRouteTarget}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Main Layout Grid for Controller and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Location Action Card */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">My Location Status</CardTitle>
              <CardDescription>Update your coordinates to query nearby members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {coords ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Coordinates Loaded</p>
                    <p className="text-xs text-muted-foreground">Stored safely in browser storage</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-200/60 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-500 rounded-lg">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No Location Stored</p>
                    <p className="text-xs text-muted-foreground">Please click detect to search nearby</p>
                  </div>
                </div>
              )}

              {locError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg flex items-start gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{locError}</span>
                </div>
              )}

              <Button
                onClick={detectLocation}
                disabled={locLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                {locLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Detecting coordinates...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Detect My Location
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Search Results List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs header card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab("tutors")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeTab === "tutors"
                    ? "bg-white text-indigo-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Tutors & Centers
              </button>
              <button
                onClick={() => setActiveTab("peers")}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeTab === "peers"
                    ? "bg-white text-indigo-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Users className="h-4 w-4" />
                Study Circles
              </button>
            </div>

            {coords && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3 self-end sm:self-auto shrink-0"
                onClick={handleRefresh}
                disabled={isDataLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isDataLoading ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
            )}
          </div>

          {/* Privacy Notice Banner for Peers */}
          {activeTab === "peers" && coords && (
            <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl flex gap-3 text-amber-900 text-xs sm:text-sm">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Student Privacy Shield Active</strong>
                To protect student coordinates, exact latitude/longitude coordinates and formatted street addresses are hidden. Peers are fuzzed into distance ranges and cities to keep your physical address completely private.
              </div>
            </div>
          )}

          {/* List display */}
          <div className="space-y-4">
            {!coords ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed space-y-4 shadow-sm">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-fit mx-auto">
                  <Compass className="h-8 w-8 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Proximity Finder Locked</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  To discover instructors or study circles near you, please grant location access by clicking the button on the left panel.
                </p>
                <Button onClick={detectLocation} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Grant Access
                </Button>
              </div>
            ) : isDataLoading ? (
              // Loading Skeleton Grid
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={`skeleton-card-${i}`} className="shadow-sm border-slate-200 p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="space-y-2 flex-grow">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </Card>
              ))
            ) : isDataError ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-muted-foreground">
                An error occurred while fetching nearby members. Please check your backend connection or refresh.
              </div>
            ) : activeTab === "tutors" ? (
              // Tutors / Instructors list
              tutorsData?.tutors && tutorsData.tutors.length > 0 ? (
                tutorsData.tutors.map((tutor) => (
                  <Card key={tutor._id} className="shadow-sm border-slate-200 hover:border-indigo-200 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <Avatar className="w-12 h-12 ring-2 ring-indigo-500/20 shrink-0">
                          <AvatarImage src={tutor.photoUrl} alt={tutor.name} />
                          <AvatarFallback className="bg-indigo-50 font-bold text-indigo-700">
                            {tutor.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-grow space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-lg text-slate-900 leading-tight">{tutor.name}</h3>
                              <p className="text-xs text-indigo-600 font-medium">{tutor.headline || "Instructor"}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {tutor.distance} km away
                            </span>
                          </div>

                          <p className="text-sm text-slate-600 line-clamp-2">{tutor.description}</p>
                          
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{tutor.locationDetails?.formattedAddress || tutor.locationDetails?.city}</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Link to={`/instructor-profile/${tutor._id}`}>
                              <Button variant="outline" size="sm" className="h-8">
                                View Profile
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setActiveRouteTarget(tutor);
                                window.scrollTo({ top: 200, behavior: "smooth" });
                              }}
                              className="h-8 border-indigo-200 hover:border-indigo-300 text-indigo-600 hover:bg-indigo-50 gap-1.5"
                            >
                              <Navigation className="h-3 w-3 transform rotate-45 shrink-0" />
                              Navigate
                            </Button>
                            <a href={`mailto:${tutor.email}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-slate-900">
                                Contact
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-muted-foreground">
                  No instructors found near your location.
                </div>
              )
            ) : (
              // Peers / Student list (Fuzzed proximity)
              peersData?.peers && peersData.peers.length > 0 ? (
                peersData.peers.map((peer, idx) => (
                  <Card key={`peer-${idx}`} className="shadow-sm border-slate-200 hover:border-emerald-200 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <Avatar className="w-12 h-12 ring-2 ring-emerald-500/20 shrink-0">
                          <AvatarImage src={peer.photoUrl} alt={peer.name} />
                          <AvatarFallback className="bg-emerald-50 font-bold text-emerald-700">
                            {peer.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-grow space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-lg text-slate-900 leading-tight">{peer.name}</h3>
                              <p className="text-xs text-emerald-600 font-medium">{peer.headline || "E-Learning Student"}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <Users className="h-3 w-3 shrink-0" />
                              {peer.range}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>City: {peer.city || "Not Shared"}</span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                              Study Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-muted-foreground">
                  No other classmates found near your location.
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NearbyHub;
