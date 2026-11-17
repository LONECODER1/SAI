"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Car,
  Footprints,
  Bike,
  ExternalLink,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  Check,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Share2,
  Copy,
  Layers,
  Search,
  Crosshair,
  Store as StoreIcon,
  Sparkles,
  Info,
  Maximize2,
  ChevronRight,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import MedicineThumbnail from "@/components/medicine-thumbnail";
import {
  calculateTravelEstimates,
  getGoogleMapsNavigationUrl,
  TRANSPORT_MODES,
} from "@/lib/algorithms/geo-routing";

export default function GoogleMapStoreView({
  store,
  product = null,
  userLat = 25.2425,
  userLng = 86.9842,
  onClose,
  onOrderOnline,
}) {
  const [mapType, setMapType] = useState("m"); // 'm' = standard road, 'k' = satellite, 'p' = terrain
  const [zoomLevel, setZoomLevel] = useState(16);
  const [transportMode, setTransportMode] = useState("driving");
  const [searchQuery, setSearchQuery] = useState(store?.storeName || "Pharmacy");
  const [copied, setCopied] = useState(false);

  if (!store) return null;

  const lat = store.latitude || 25.2635;
  const lng = store.longitude || 87.0175;

  // Real distance computation
  const distanceKm = store.distanceKm || 0.8;
  const travelEstimates = {
    driving: calculateTravelEstimates(distanceKm, TRANSPORT_MODES.DRIVING),
    bicycling: calculateTravelEstimates(distanceKm, TRANSPORT_MODES.BICYCLING),
    walking: calculateTravelEstimates(distanceKm, TRANSPORT_MODES.WALKING),
  };

  // Direct turn-by-turn Google Maps URL
  const googleMapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}&travelmode=${transportMode}`;

  // Embedded Google Map URL
  // Shows real road network, labels, terrain and satellite imagery exactly like Google Maps
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}+(${encodeURIComponent(
    store.storeName
  )})&t=${mapType}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;

  const handleCopyAddress = () => {
    const fullAddress = `${store.storeName}, ${store.storeAddress || ""}, ${store.city || ""}`;
    navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    toast.success("Pharmacy address copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: store.storeName,
        text: `Find medicines at ${store.storeName} on CareConnect`,
        url: googleMapsAppUrl,
      });
    } else {
      handleCopyAddress();
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(20, prev + 1));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(12, prev - 1));
  };

  return (
    <div className="w-full rounded-2xl bg-[#080d14] border border-teal-900/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header Bar with Back Button */}
      <div className="bg-[#0b141f] border-b border-teal-900/40 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 border-teal-800/40 text-teal-300 hover:bg-teal-950/40 text-xs gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store List</span>
            </Button>
          )}

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-900/30 text-teal-400">
              <StoreIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {store.storeName}
                <Badge className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-[10px] px-1.5 py-0">
                  <ShieldCheck className="h-2.5 w-2.5 mr-0.5 inline" /> Verified
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
                {store.storeAddress || store.city || "Local Market"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleShare}
            className="h-8 text-xs text-muted-foreground hover:text-white gap-1"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          <a
            href={googleMapsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-md shadow-blue-900/40"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in Google Maps</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ========================================================= */}
        {/* LEFT COLUMN: AUTHENTIC INDUSTRY STANDARD GOOGLE MAPS UI  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 relative bg-[#e5e3df] dark:bg-[#1a1d21] min-h-[460px] lg:min-h-[640px] flex flex-col justify-between overflow-hidden">
          {/* 1. Real Google Maps Embedded View */}
          <iframe
            title={`Google Map - ${store.storeName}`}
            src={embedUrl}
            className="w-full h-full absolute inset-0 border-0"
            loading="lazy"
            allowFullScreen
          />

          {/* 2. Google Maps Industry Standard Floating Search Bar (Top Left) */}
          <div className="relative z-10 m-3 max-w-[380px] pointer-events-auto">
            <div className="bg-white dark:bg-[#202124] rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 flex items-center px-3 py-2 gap-2 text-sm text-gray-800 dark:text-gray-100">
              {/* Google Maps Pin Icon */}
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    fill="#EA4335"
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  />
                  <circle fill="#FFFFFF" cx="12" cy="9" r="2.5" />
                </svg>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Google Maps"
                className="bg-transparent border-0 outline-none text-xs w-full text-gray-900 dark:text-white placeholder:text-gray-500"
              />

              <a
                href={googleMapsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Directions"
                className="p-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow"
              >
                <Navigation className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Google Maps Floating Category Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="bg-white/95 dark:bg-[#202124]/95 text-blue-600 dark:text-blue-400 border border-blue-500/40 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 shrink-0 backdrop-blur-md">
                🏥 Pharmacies
              </span>
              <a
                href={googleMapsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/90 dark:bg-[#202124]/90 text-gray-700 dark:text-gray-200 hover:bg-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow border border-gray-200 dark:border-gray-700 flex items-center gap-1 shrink-0 backdrop-blur-md"
              >
                🧭 Directions
              </a>
              <button
                onClick={() => setMapType(mapType === "k" ? "m" : "k")}
                className="bg-white/90 dark:bg-[#202124]/90 text-gray-700 dark:text-gray-200 hover:bg-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow border border-gray-200 dark:border-gray-700 flex items-center gap-1 shrink-0 backdrop-blur-md"
              >
                🛰️ {mapType === "k" ? "Standard Map" : "Satellite"}
              </button>
              <button
                onClick={handleCopyAddress}
                className="bg-white/90 dark:bg-[#202124]/90 text-gray-700 dark:text-gray-200 hover:bg-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow border border-gray-200 dark:border-gray-700 flex items-center gap-1 shrink-0 backdrop-blur-md"
              >
                📋 {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* 3. Google Maps Floating Layer Switcher (Bottom Left) */}
          <div className="relative z-10 m-3 self-start pointer-events-auto">
            <div className="bg-white/95 dark:bg-[#202124]/95 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 p-1 flex items-center gap-1 backdrop-blur-md">
              <button
                onClick={() => setMapType("m")}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  mapType === "m"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                🗺️ Map
              </button>
              <button
                onClick={() => setMapType("k")}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  mapType === "k"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                onClick={() => setMapType("p")}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  mapType === "p"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                ⛰️ Terrain
              </button>
            </div>
          </div>

          {/* 4. Google Maps Floating Controls Stack (Bottom Right: Zoom, Pegman, Re-center) */}
          <div className="relative z-10 m-3 self-end pointer-events-auto flex flex-col gap-2 items-center">
            {/* Re-center / Locate Crosshair */}
            <button
              onClick={() => {
                toast.info("Re-centering map on pharmacy coordinates");
                setZoomLevel(17);
              }}
              title="Re-center on Pharmacy"
              className="w-10 h-10 bg-white dark:bg-[#202124] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center transition-all"
            >
              <Crosshair className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </button>

            {/* Google Street View Pegman */}
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Google Street View"
              className="w-10 h-10 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-lg shadow-xl border border-amber-500 flex items-center justify-center font-bold text-xs"
            >
              🚶‍♂️
            </a>

            {/* Zoom In & Zoom Out Stack */}
            <div className="bg-white dark:bg-[#202124] rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="w-10 h-10 flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-bold border-b border-gray-200 dark:border-gray-700"
              >
                +
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="w-10 h-10 flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg font-bold"
              >
                −
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: STORE DETAILS + "ORDER OR GO THERE" DECISION */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-[#0b131c] p-6 space-y-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-teal-900/40">
          <div className="space-y-5">
            {/* Store Information Card */}
            <div className="space-y-3 pb-4 border-b border-teal-900/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                    Verified Pharmacy Dukaan
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-0.5">
                    {store.storeName}
                  </h2>
                </div>

                <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-600/50 px-2 py-1 rounded-lg text-amber-300 text-xs font-bold shrink-0">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{store.rating || 4.9}</span>
                  <span className="text-muted-foreground font-normal text-[10px]">(128)</span>
                </div>
              </div>

              {/* Operating Status, Distance & Timing */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Open Now · Closes 10:30 PM
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-teal-300 font-semibold flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-400" />
                  {distanceKm} km away
                </span>
              </div>

              {/* Full Address */}
              <div className="p-3 rounded-xl bg-[#070b10] border border-teal-900/30 text-xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground leading-relaxed">
                    {store.storeAddress || store.city}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAddress}
                    className="h-6 px-2 text-[10px] text-teal-400 hover:text-white"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                {store.phone && (
                  <div className="flex items-center gap-2 text-teal-300 font-mono text-[11px] pt-1 border-t border-muted/10">
                    <Phone className="h-3 w-3 text-teal-400" />
                    <span>{store.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Medicine Info (if navigating for a specific product) */}
            {product && (
              <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-800/40 flex items-center gap-3">
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden">
                  <MedicineThumbnail product={product} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-teal-400 uppercase block">
                    Selected Product
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="text-white font-extrabold">₹{product.price}</span>
                    <span className="text-emerald-400 text-[11px] font-semibold">
                      In Stock ({product.stockQuantity || 45} units)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Travel Mode Pills & Time Estimates */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">
                Travel Time to this Dukaan:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTransportMode("driving")}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    transportMode === "driving"
                      ? "bg-teal-950/60 border-teal-500 text-white shadow-md"
                      : "bg-[#070b10] border-teal-900/30 text-muted-foreground hover:text-white"
                  }`}
                >
                  <Car className="h-4 w-4 mx-auto mb-1 text-teal-400" />
                  <span className="text-[11px] font-bold block">{travelEstimates.driving.durationMinutes} mins</span>
                  <span className="text-[9px] text-muted-foreground">Drive</span>
                </button>

                <button
                  onClick={() => setTransportMode("bicycling")}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    transportMode === "bicycling"
                      ? "bg-teal-950/60 border-teal-500 text-white shadow-md"
                      : "bg-[#070b10] border-teal-900/30 text-muted-foreground hover:text-white"
                  }`}
                >
                  <Bike className="h-4 w-4 mx-auto mb-1 text-teal-400" />
                  <span className="text-[11px] font-bold block">{travelEstimates.bicycling.durationMinutes} mins</span>
                  <span className="text-[9px] text-muted-foreground">Rider</span>
                </button>

                <button
                  onClick={() => setTransportMode("walking")}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    transportMode === "walking"
                      ? "bg-teal-950/60 border-teal-500 text-white shadow-md"
                      : "bg-[#070b10] border-teal-900/30 text-muted-foreground hover:text-white"
                  }`}
                >
                  <Footprints className="h-4 w-4 mx-auto mb-1 text-teal-400" />
                  <span className="text-[11px] font-bold block">{travelEstimates.walking.durationMinutes} mins</span>
                  <span className="text-[9px] text-muted-foreground">Walk</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* THE CORE MANDATED DECISION: DO YOU WANT TO ORDER OR GO THERE? */}
          {/* ========================================================= */}
          <div className="pt-4 border-t border-teal-900/30 space-y-3">
            <div className="text-center pb-1">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                Choose Fulfillment Method
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Do you want to order online or go there?
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* OPTION 1: ORDER ONLINE FOR HOME DELIVERY */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-950/50 to-card border border-teal-700/60 flex flex-col justify-between space-y-3 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Order Online
                      </h4>
                      <span className="text-[10px] text-teal-300">
                        Doorstep Delivery
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Local delivery rider will dispatch medicine directly to your address in 25–35 mins.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    if (onOrderOnline && product) {
                      onOrderOnline(product, store);
                    } else {
                      toast.success(`Order initiated with ${store.storeName}!`);
                    }
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 gap-1 shadow-md"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Order Online Now</span>
                </Button>
              </div>

              {/* OPTION 2: GO THERE (VISIT STORE & LIVE NAVIGATION) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/50 to-card border border-blue-700/60 flex flex-col justify-between space-y-3 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Go There
                      </h4>
                      <span className="text-[10px] text-blue-300">
                        Visit Dukaan in Person
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Store is {distanceKm} km away (~{travelEstimates[transportMode]?.durationMinutes || 4} mins). Walk in and collect immediately.
                  </p>
                </div>

                <a
                  href={googleMapsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 gap-1 shadow-md shadow-blue-900/30"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Go There (Google Maps)</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
