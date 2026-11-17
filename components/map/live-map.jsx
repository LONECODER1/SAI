"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Car,
  Footprints,
  Bike,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  Crosshair,
  Store,
  Sparkles,
  Zap,
  Tag,
  ArrowRight,
  RotateCcw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  calculateRoute,
  calculateTravelEstimates,
  geocodeAddress,
  reverseGeocode,
  getGoogleMapsNavigationUrl,
  evaluateBestPriceAndFastestStores,
  TRANSPORT_MODES,
} from "@/lib/algorithms/geo-routing";

export default function LiveMap({
  initialUserLat = 28.6139,
  initialUserLng = 77.2090,
  userLocationName = "Your Current Location",
  stores = [],
  selectedStoreId = null,
  onSelectStore = () => {},
  showRoutePlanner = true,
  height = "520px",
  className = "",
}) {
  const [userLocation, setUserLocation] = useState({
    lat: Number(initialUserLat) || 28.6139,
    lng: Number(initialUserLng) || 77.2090,
    name: userLocationName,
  });

  const [activeStoreState, setActiveStore] = useState(null);
  const [transportMode, setTransportMode] = useState(TRANSPORT_MODES.DRIVING);
  const [activeRoute, setActiveRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);

  // Custom origin / destination mode
  const [originMode, setOriginMode] = useState("user"); // "user" or store.id
  const [destinationMode, setDestinationMode] = useState("store"); // "store" or custom

  // Evaluate best price and fastest stores
  const evaluation = evaluateBestPriceAndFastestStores(
    userLocation.lat,
    userLocation.lng,
    stores
  );

  // Automatically resolve active store without triggering cascading render effect
  const activeStore =
    activeStoreState ||
    (selectedStoreId ? stores.find((s) => s.id === selectedStoreId) : null) ||
    evaluation.fastestStore ||
    stores[0] ||
    null;

  // Recalculate route whenever activeStore, userLocation, or transportMode changes
  useEffect(() => {
    let isCancelled = false;

    async function computeActiveRoute() {
      if (!activeStore) {
        setActiveRoute(null);
        return;
      }

      setLoadingRoute(true);
      try {
        const startLat = originMode === "user" ? userLocation.lat : (stores.find(s => s.id === originMode)?.latitude || userLocation.lat);
        const startLng = originMode === "user" ? userLocation.lng : (stores.find(s => s.id === originMode)?.longitude || userLocation.lng);
        const startName = originMode === "user" ? userLocation.name : (stores.find(s => s.id === originMode)?.storeName || "Start Dukaan");

        const routeData = await calculateRoute({
          startLat,
          startLng,
          endLat: activeStore.latitude,
          endLng: activeStore.longitude,
          startName,
          endName: activeStore.storeName,
          mode: transportMode,
        });

        if (!isCancelled) {
          setActiveRoute(routeData);
          setLoadingRoute(false);
        }
      } catch (err) {
        console.error("Route calculation error:", err);
        if (!isCancelled) setLoadingRoute(false);
      }
    }

    computeActiveRoute();
    return () => {
      isCancelled = true;
    };
  }, [activeStore, userLocation, transportMode, originMode, stores]);

  // Detect GPS Location
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const address = await reverseGeocode(lat, lng);

        setUserLocation({ lat, lng, name: address });
        setDetectingGps(false);
        toast.success("GPS Location updated successfully!");
      },
      (err) => {
        setDetectingGps(false);
        toast.error("Could not obtain GPS location: " + err.message);
      },
      { timeout: 8000 }
    );
  };

  // Address search
  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const candidates = await geocodeAddress(searchQuery.trim());
      if (candidates.length > 0) {
        const first = candidates[0];
        setUserLocation({
          lat: first.lat,
          lng: first.lng,
          name: first.name || searchQuery,
        });
        toast.success(`Centered location to: ${first.city || first.name}`);
        setSearchQuery("");
      } else {
        toast.warning("No location found matching that query");
      }
    } catch {
      toast.error("Failed to search location");
    } finally {
      setSearching(false);
    }
  };

  // Google Maps Deep Link
  const googleMapsUrl = activeStore
    ? getGoogleMapsNavigationUrl(
        userLocation.lat,
        userLocation.lng,
        activeStore.latitude,
        activeStore.longitude,
        transportMode
      )
    : "#";

  // Calculate bounding box for SVG projection
  const allPoints = [
    [userLocation.lat, userLocation.lng],
    ...stores.map((s) => [s.latitude, s.longitude]),
    ...(activeRoute?.coordinates || []),
  ];

  const lats = allPoints.map((p) => p[0]);
  const lngs = allPoints.map((p) => p[1]);

  const minLat = Math.min(...lats) - 0.008;
  const maxLat = Math.max(...lats) + 0.008;
  const minLng = Math.min(...lngs) - 0.008;
  const maxLng = Math.max(...lngs) + 0.008;

  // Project lat/lng to SVG viewbox (0 to 1000, 0 to 600)
  const project = (lat, lng) => {
    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;
    const x = ((lng - minLng) / lngSpan) * 900 + 50;
    const y = ((maxLat - lat) / latSpan) * 500 + 50; // Inverted for SVG y
    return [x, y];
  };

  const [userX, userY] = project(userLocation.lat, userLocation.lng);

  return (
    <div
      className={`relative rounded-2xl bg-[#091017] border border-teal-900/40 shadow-2xl overflow-hidden flex flex-col ${className}`}
      style={{ minHeight: height }}
    >
      {/* 1. TOP CONTROL BAR: GPS Detection, Address Search & Modality Tabs */}
      <div className="p-3 bg-[#0d1620]/90 backdrop-blur-md border-b border-teal-900/30 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <form onSubmit={handleSearchAddress} className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-teal-400/70" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search neighborhood or city to fly map..."
              className="pl-8 pr-20 h-8 bg-[#070b10] border-teal-900/40 text-xs text-white placeholder:text-muted-foreground focus-visible:ring-teal-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={searching}
              className="absolute right-1 top-1 h-6 px-2 text-[10px] bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded"
            >
              {searching ? "Finding..." : "Go"}
            </Button>
          </form>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDetectGPS}
            disabled={detectingGps}
            className="h-8 border-teal-800/40 text-teal-300 hover:bg-teal-950/40 text-xs px-2.5 shrink-0"
            title="Auto-detect my GPS"
          >
            <Crosshair
              className={`h-3.5 w-3.5 mr-1 text-teal-400 ${detectingGps ? "animate-spin" : ""}`}
            />
            <span>{detectingGps ? "Locating..." : "Locate Me"}</span>
          </Button>
        </div>

        {/* Transport Modality Selector */}
        <div className="flex items-center gap-1 bg-[#070b10] border border-teal-900/40 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => setTransportMode(TRANSPORT_MODES.DRIVING)}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              transportMode === TRANSPORT_MODES.DRIVING
                ? "bg-teal-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
            title="Driving (Car/Cab)"
          >
            <Car className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Drive</span>
          </button>

          <button
            onClick={() => setTransportMode(TRANSPORT_MODES.BICYCLING)}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              transportMode === TRANSPORT_MODES.BICYCLING
                ? "bg-teal-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
            title="Delivery Rider / Two-Wheeler"
          >
            <Bike className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rider</span>
          </button>

          <button
            onClick={() => setTransportMode(TRANSPORT_MODES.WALKING)}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
              transportMode === TRANSPORT_MODES.WALKING
                ? "bg-teal-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
            title="Walking"
          >
            <Footprints className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Walk</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN MAP VIEWPORT (Interactive High-Precision Geodesic Radar Canvas) */}
      <div className="relative flex-1 w-full bg-[#070d14] overflow-hidden select-none">
        {/* Subtle Map Grid lines */}
        <svg
          className="w-full h-full absolute inset-0 pointer-events-auto"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
          onClick={(e) => {
            // Allow clicking on map to reposition user
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 1000;
            const clickY = ((e.clientY - rect.top) / rect.height) * 600;

            const latSpan = maxLat - minLat || 0.01;
            const lngSpan = maxLng - minLng || 0.01;

            const newLng = minLng + ((clickX - 50) / 900) * lngSpan;
            const newLat = maxLat - ((clickY - 50) / 500) * latSpan;

            setUserLocation({
              lat: parseFloat(newLat.toFixed(6)),
              lng: parseFloat(newLng.toFixed(6)),
              name: `Pinned Location (${newLat.toFixed(3)}, ${newLng.toFixed(3)})`,
            });
            toast.info("User location updated to clicked map point");
          }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(20, 184, 166, 0.04)"
                strokeWidth="1"
              />
            </pattern>

            {/* Glowing Polyline Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear Gradient for Route Path */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          <rect width="1000" height="600" fill="#070d14" />
          <rect width="1000" height="600" fill="url(#mapGrid)" />

          {/* Concentric distance rings around user */}
          <circle
            cx={userX}
            cy={userY}
            r="80"
            fill="none"
            stroke="rgba(20, 184, 166, 0.1)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle
            cx={userX}
            cy={userY}
            r="160"
            fill="none"
            stroke="rgba(20, 184, 166, 0.06)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* ACTIVE ROUTE POLYLINE PATH */}
          {activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 1 && (
            <g>
              {/* Outer glow aura */}
              <polyline
                points={activeRoute.coordinates
                  .map(([lat, lng]) => project(lat, lng).join(","))
                  .join(" ")}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="8"
                strokeOpacity="0.25"
                filter="url(#glow)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Main high-contrast route line */}
              <polyline
                points={activeRoute.coordinates
                  .map(([lat, lng]) => project(lat, lng).join(","))
                  .join(" ")}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />
            </g>
          )}

          {/* STORE PINS */}
          {stores.map((store) => {
            const [sx, sy] = project(store.latitude, store.longitude);
            const isSelected = activeStore?.id === store.id;
            const isFastest = evaluation.fastestStore?.id === store.id;
            const isBestPrice = evaluation.bestPriceStore?.id === store.id;

            return (
              <g
                key={store.id}
                transform={`translate(${sx}, ${sy})`}
                className="cursor-pointer transition-transform duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStore(store);
                  onSelectStore(store);
                  toast.success(`Selected ${store.storeName} for navigation`);
                }}
              >
                {/* Store Pin Anchor Ring */}
                <circle
                  r={isSelected ? "18" : "12"}
                  fill={isSelected ? "rgba(20, 184, 166, 0.3)" : "rgba(15, 23, 42, 0.7)"}
                  stroke={isSelected ? "#14b8a6" : isFastest ? "#38bdf8" : "#64748b"}
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                />

                {/* Pin Center icon */}
                <circle
                  r={isSelected ? "8" : "6"}
                  fill={isSelected ? "#14b8a6" : isFastest ? "#38bdf8" : "#334155"}
                />

                {/* Dukaan Label Pill */}
                <g transform="translate(0, -22)">
                  <rect
                    x="-65"
                    y="-14"
                    width="130"
                    height="20"
                    rx="5"
                    fill={isSelected ? "#0f766e" : "#0f172a"}
                    stroke={isSelected ? "#2dd4bf" : "#334155"}
                    strokeWidth="1"
                    className="shadow-lg"
                  />
                  <text
                    x="0"
                    y="0"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {store.storeName.length > 18
                      ? store.storeName.substring(0, 17) + "…"
                      : store.storeName}
                  </text>
                </g>

                {/* Best Price or Fastest Badge */}
                {(isFastest || isBestPrice) && (
                  <g transform="translate(0, 20)">
                    <rect
                      x="-45"
                      y="-8"
                      width="90"
                      height="15"
                      rx="4"
                      fill={isBestPrice ? "#065f46" : "#0369a1"}
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {isBestPrice ? "🏷️ Best Price" : "⚡ Fastest"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* USER LOCATION PIN (Pulse Radar Animation) */}
          <g transform={`translate(${userX}, ${userY})`} className="cursor-pointer">
            {/* Animated pulsating radar circle */}
            <circle r="22" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.4">
              <animate
                attributeName="r"
                values="10;32;10"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.8;0;0.8"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>

            <circle r="8" fill="#0891b2" stroke="#ffffff" strokeWidth="2" />
            <circle r="3" fill="#ffffff" />

            {/* "You Are Here" Flag */}
            <g transform="translate(0, -18)">
              <rect
                x="-40"
                y="-14"
                width="80"
                height="18"
                rx="4"
                fill="#0891b2"
                stroke="#67e8f9"
                strokeWidth="1"
              />
              <text
                x="0"
                y="-1"
                fill="#ffffff"
                fontSize="9"
                fontWeight="extrabold"
                textAnchor="middle"
              >
                YOU ARE HERE
              </text>
            </g>
          </g>
        </svg>

        {/* Compass / North indicator */}
        <div className="absolute top-4 right-4 bg-[#070b10]/80 border border-teal-900/40 p-2 rounded-xl backdrop-blur-md text-teal-400 flex flex-col items-center shadow-lg pointer-events-none">
          <Compass className="h-5 w-5 animate-pulse" />
          <span className="text-[9px] font-black tracking-widest text-teal-300">N</span>
        </div>

        {/* Live Map Watermark / Coordinates */}
        <div className="absolute bottom-3 left-4 text-[10px] text-teal-400/60 font-mono bg-[#070b10]/60 px-2 py-0.5 rounded border border-teal-900/30 pointer-events-none">
          GPS: {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E • Click map to set pin
        </div>
      </div>

      {/* 3. BOTTOM FLOATING WAYFINDER ROUTE DRAWER */}
      {activeStore && (
        <div className="p-4 bg-[#091017]/95 border-t border-teal-900/40 backdrop-blur-md z-20 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Store & Route Headline */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Route to {activeStore.storeName}
                </h4>
                {evaluation.fastestStore?.id === activeStore.id && (
                  <Badge className="bg-sky-950/60 border border-sky-600 text-sky-300 text-[10px] py-0 px-2">
                    ⚡ Nearest Dukaan
                  </Badge>
                )}
                {evaluation.bestPriceStore?.id === activeStore.id && (
                  <Badge className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-[10px] py-0 px-2">
                    🏷️ Lowest Price
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-md">
                {activeStore.storeAddress || activeStore.city}
              </p>
            </div>

            {/* Travel Metrics Pill */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal-800/40 flex items-center gap-3">
                <div className="text-center px-1">
                  <span className="text-[10px] text-teal-300/80 block uppercase font-medium">Distance</span>
                  <span className="text-sm font-extrabold text-white font-mono">
                    {activeRoute ? `${activeRoute.distanceKm} km` : "..."}
                  </span>
                </div>
                <div className="h-6 w-px bg-teal-800/40" />
                <div className="text-center px-1">
                  <span className="text-[10px] text-teal-300/80 block uppercase font-medium">Est. Time</span>
                  <span className="text-sm font-extrabold text-teal-300 font-mono">
                    {activeRoute ? activeRoute.formattedTime : "..."}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSteps(!showSteps)}
                  className="border-teal-800/50 text-teal-300 hover:bg-teal-950/50 text-xs h-9"
                >
                  {showSteps ? "Hide Turn-by-Turn" : "View Turn Steps"}
                  <ChevronDown
                    className={`ml-1 h-3.5 w-3.5 transition-transform ${
                      showSteps ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-teal-950"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="h-3 w-3 ml-0.5 opacity-80" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Collapsible Step-by-Step Maneuvers List */}
          {showSteps && activeRoute && activeRoute.steps && (
            <div className="pt-2 border-t border-teal-900/30 animate-in fade-in duration-200">
              <h5 className="text-xs font-semibold text-teal-300 mb-2 flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-teal-400" />
                Live Turn-by-Turn Wayfinding Maneuvers:
              </h5>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-teal-800">
                {activeRoute.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#070b10] border border-teal-950 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-teal-900/40 text-teal-300 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-white">{step.instruction}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px] shrink-0">
                      <span>{step.distanceText}</span>
                      <span>•</span>
                      <span>{step.durationText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TWO-POINT ROUTE PLANNER (Between ANY Store and Location) */}
          {showRoutePlanner && stores.length > 1 && (
            <div className="pt-2 border-t border-teal-900/20 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-medium">Wayfinding Waypoints:</span>
                <select
                  value={originMode}
                  onChange={(e) => setOriginMode(e.target.value)}
                  className="bg-[#070b10] border border-teal-900/40 text-white rounded px-2 py-1 text-xs"
                >
                  <option value="user">From: Current GPS Location</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      From: {s.storeName}
                    </option>
                  ))}
                </select>

                <ArrowRight className="h-3 w-3 text-teal-400" />

                <select
                  value={activeStore.id}
                  onChange={(e) => {
                    const match = stores.find((s) => s.id === e.target.value);
                    if (match) setActiveStore(match);
                  }}
                  className="bg-[#070b10] border border-teal-900/40 text-white rounded px-2 py-1 text-xs"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      To: {s.storeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-teal-400/80">
                Source: {activeRoute?.source || "Optimized Geodesic Engine"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
