"use client";

import React, { useState } from "react";
import { Pill, Droplets, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { getMedicineImageUrl } from "@/lib/medicine-images";

const MedicineThumbnail = React.memo(function MedicineThumbnail({
  product,
  alt = "Medicine Packaging",
  className = "w-full h-40",
  aspectRatio = "aspect-square",
  priority = false,
}) {
  const initialUrl = getMedicineImageUrl(product);
  const [imgSrc, setImgSrc] = useState(initialUrl);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const category = product?.category || "General Healthcare";
  const dosageForm = product?.dosageForm || "Tablet";

  // Category Theme Colors for fallback badge
  const categoryThemes = {
    "Antibiotics": "from-red-950/80 to-amber-950/80 text-red-400 border-red-800/40",
    "Pain Relief": "from-blue-950/80 to-cyan-950/80 text-cyan-400 border-cyan-800/40",
    "Diabetes Care": "from-purple-950/80 to-indigo-950/80 text-purple-400 border-purple-800/40",
    "Cardiovascular": "from-rose-950/80 to-red-950/80 text-rose-400 border-rose-800/40",
    "Respiratory & Cough": "from-emerald-950/80 to-teal-950/80 text-emerald-400 border-emerald-800/40",
    "Gastrointestinal": "from-amber-950/80 to-orange-950/80 text-amber-400 border-amber-800/40",
    "Vitamins & Supplements": "from-teal-950/80 to-emerald-950/80 text-teal-400 border-teal-800/40",
  };

  const themeClass = categoryThemes[category] || "from-teal-950/80 to-slate-900 text-teal-400 border-teal-800/40";

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#091118] border border-teal-900/30 flex items-center justify-center group ${className}`}
    >
      {!hasError ? (
        <>
          {/* Skeleton placeholder while loading */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center">
              <Pill className="h-8 w-8 text-teal-600/40 animate-spin" />
            </div>
          )}

          <img
            src={imgSrc}
            alt={alt || product?.name || "Medicine"}
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
            }}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a0f]/80 via-transparent to-black/20 pointer-events-none" />
        </>
      ) : (
        /* High-Fidelity SVG Pharmaceutical Vector Fallback */
        <div
          className={`w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br ${themeClass} border`}
        >
          <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-lg mb-2">
            {dosageForm.toLowerCase().includes("syrup") ? (
              <Droplets className="h-6 w-6 text-cyan-400" />
            ) : (
              <Pill className="h-6 w-6 text-teal-400" />
            )}
          </div>
          <span className="text-xs font-bold text-white text-center line-clamp-1">
            {product?.name || "Medicine"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {product?.strength || product?.dosageForm || "Clinical Grade"}
          </span>
        </div>
      )}

      {/* Floating Dosage Form Pill on top-right */}
      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] font-medium text-white flex items-center gap-1 shadow-md">
        <Pill className="h-2.5 w-2.5 text-teal-400" />
        <span>{dosageForm}</span>
      </div>

      {/* Prescription badge indicator on top-left */}
      {product?.prescriptionRequired ? (
        <div className="absolute top-2 left-2 bg-red-950/80 border border-red-700/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-red-300 shadow">
          Rx
        </div>
      ) : (
        <div className="absolute top-2 left-2 bg-emerald-950/80 border border-emerald-700/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-300 shadow">
          OTC
        </div>
      )}
    </div>
  );
});

export default MedicineThumbnail;
