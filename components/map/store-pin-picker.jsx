"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Crosshair,
  Search,
  CheckCircle2,
  Navigation,
  Compass,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { geocodeAddress, reverseGeocode } from "@/lib/algorithms/geo-routing";

export default function StorePinPicker({
  initialLat = 28.6139,
  initialLng = 77.2090,
  onCoordinatesChange = () => {},
  className = "",
}) {
  const [coords, setCoords] = useState({
    lat: Number(initialLat) || 28.6139,
    lng: Number(initialLng) || 77.2090,
  });

  const [addressPreview, setAddressPreview] = useState("Detecting address...");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Synchronize on mount or coordinate change
  useEffect(() => {
    let active = true;
    async function updateAddr() {
      const addr = await reverseGeocode(coords.lat, coords.lng);
      if (active) {
        setAddressPreview(addr);
        onCoordinatesChange({
          latitude: coords.lat,
          longitude: coords.lng,
          address: addr,
        });
      }
    }
    updateAddr();
    return () => {
      active = false;
    };
  }, [coords.lat, coords.lng, onCoordinatesChange]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by browser");
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setDetectingGps(false);
        toast.success("GPS Location successfully detected!");
      },
      (err) => {
        setDetectingGps(false);
        toast.error("Failed to detect location: " + err.message);
      },
      { timeout: 8000 }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const matches = await geocodeAddress(searchQuery.trim());
      if (matches.length > 0) {
        const match = matches[0];
        setCoords({
          lat: parseFloat(match.lat.toFixed(6)),
          lng: parseFloat(match.lng.toFixed(6)),
        });
        toast.success(`Centered pin to: ${match.city || match.name}`);
        setSearchQuery("");
      } else {
        toast.warning("Could not find that location");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  // Canvas bounds projection centered around pin
  const delta = 0.02; // Roughly 2km box around pin
  const minLat = coords.lat - delta;
  const maxLat = coords.lat + delta;
  const minLng = coords.lng - delta;
  const maxLng = coords.lng + delta;

  const project = (lat, lng) => {
    const x = ((lng - minLng) / (2 * delta)) * 500 + 50;
    const y = ((maxLat - lat) / (2 * delta)) * 250 + 25;
    return [x, y];
  };

  const [pinX, pinY] = [300, 150]; // Center of view

  return (
    <div className={`rounded-xl border border-teal-900/40 bg-[#091017] overflow-hidden space-y-0 ${className}`}>
      {/* Top Search & Auto-Detect Controls */}
      <div className="p-3 bg-[#0d1620] border-b border-teal-900/30 flex items-center justify-between gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-teal-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type pharmacy address or landmark..."
            className="pl-8 pr-16 h-8 bg-[#070b10] border-teal-900/40 text-xs text-white"
          />
          <Button
            type="submit"
            size="sm"
            disabled={searching}
            className="absolute right-1 top-1 h-6 px-2 text-[10px] bg-teal-600 hover:bg-teal-700 text-white rounded"
          >
            {searching ? "..." : "Pin"}
          </Button>
        </form>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleDetectGPS}
          disabled={detectingGps}
          className="h-8 border-teal-700/50 text-teal-300 hover:bg-teal-950/40 text-xs px-2.5 shrink-0"
        >
          <Crosshair className={`h-3.5 w-3.5 mr-1 ${detectingGps ? "animate-spin text-teal-400" : ""}`} />
          {detectingGps ? "Locating..." : "Auto-Detect GPS"}
        </Button>
      </div>

      {/* Interactive Drag & Pin Canvas */}
      <div className="relative h-64 w-full bg-[#070d14] cursor-crosshair select-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 600 300"
          preserveAspectRatio="xMidYMid meet"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 600;
            const clickY = ((e.clientY - rect.top) / rect.height) * 300;

            const newLng = minLng + (clickX / 600) * (2 * delta);
            const newLat = maxLat - (clickY / 300) * (2 * delta);

            setCoords({
              lat: parseFloat(newLat.toFixed(6)),
              lng: parseFloat(newLng.toFixed(6)),
            });
            toast.info("Store coordinates updated to clicked position");
          }}
        >
          <defs>
            <pattern id="pickerGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(20, 184, 166, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="600" height="300" fill="#070d14" />
          <rect width="600" height="300" fill="url(#pickerGrid)" />

          {/* Crosshair guidelines */}
          <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(20, 184, 166, 0.15)" strokeDasharray="4 4" />
          <line x1="300" y1="0" x2="300" y2="300" stroke="rgba(20, 184, 166, 0.15)" strokeDasharray="4 4" />

          {/* Concentric distance guidance circles */}
          <circle cx="300" cy="150" r="40" fill="none" stroke="rgba(20, 184, 166, 0.2)" strokeWidth="1" />
          <circle cx="300" cy="150" r="90" fill="none" stroke="rgba(20, 184, 166, 0.1)" strokeWidth="1" />

          {/* STORE PIN MARKER */}
          <g transform="translate(300, 150)">
            <circle r="16" fill="rgba(20, 184, 166, 0.3)" stroke="#14b8a6" strokeWidth="2">
              <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="6" fill="#14b8a6" />

            {/* Dropped Pin Head */}
            <path
              d="M 0 0 C -8 -14 -10 -24 0 -34 C 10 -24 8 -14 0 0 Z"
              fill="#0d9488"
              stroke="#2dd4bf"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="-24" r="3.5" fill="#ffffff" />

            {/* Label Flag */}
            <g transform="translate(0, -42)">
              <rect x="-60" y="-14" width="120" height="18" rx="4" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1" />
              <text x="0" y="-1" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                STOREFRONT PIN
              </text>
            </g>
          </g>
        </svg>

        {/* Instructions pill overlay */}
        <div className="absolute bottom-2 left-3 bg-[#070b10]/90 border border-teal-900/40 px-2.5 py-1 rounded-md text-[10px] text-teal-300 font-mono pointer-events-none">
          Click anywhere to drop pin on your storefront door
        </div>

        <div className="absolute top-2 right-3 bg-[#070b10]/90 border border-teal-900/40 px-2 py-0.5 rounded text-[10px] text-muted-foreground pointer-events-none">
          Drag & Drop Coordinates Mode
        </div>
      </div>

      {/* Bottom Coordinates & Resolved Address Bar */}
      <div className="p-3 bg-[#0d1620] border-t border-teal-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-teal-400 block">Pin Location:</span>
          <p className="text-white text-xs truncate max-w-sm">{addressPreview}</p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs bg-[#070b10] border border-teal-900/40 px-3 py-1.5 rounded-lg text-teal-300 shrink-0">
          <span>Lat: <strong>{coords.lat.toFixed(6)}</strong></span>
          <span>•</span>
          <span>Lng: <strong>{coords.lng.toFixed(6)}</strong></span>
        </div>
      </div>
    </div>
  );
}
