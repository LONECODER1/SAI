"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Star,
  Check,
  ShoppingCart,
  Sparkles,
  ArrowRightLeft,
  Navigation,
  ExternalLink,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import MedicineThumbnail from "@/components/medicine-thumbnail";
import GoogleMapStoreView from "@/components/map/google-map-store-view";
import { calculateHaversineDistance } from "@/lib/algorithms/haversine";
import { calculateTravelEstimates } from "@/lib/algorithms/geo-routing";
import { toast } from "sonner";

export default function SingleMedicineView({
  product,
  allStores = [],
  userLat = 25.2425,
  userLng = 86.9842,
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedStoreForMap, setSelectedStoreForMap] = useState(null);

  if (!product) return null;

  // Calculate distance for all stores and sort in ASCENDING ORDER OF DISTANCE
  const storesWithDistance = allStores
    .map((store) => {
      let dist = store.distanceKm;
      if (dist === null || dist === undefined) {
        try {
          dist = calculateHaversineDistance(
            userLat,
            userLng,
            store.latitude,
            store.longitude
          );
        } catch {
          dist = 1.2;
        }
      }

      return {
        ...store,
        distanceKm: parseFloat(Number(dist).toFixed(1)),
        storePrice: product.price,
        storeStock: product.stockQuantity || 45,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm); // ASCENDING ORDER OF DISTANCE!

  const discountPct =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const substitute = product.genericAlternative;
  const expiryEval = product.expiryEvaluation;

  const handleOrderOnline = (prod, store) => {
    toast.success(`Order placed with ${store.storeName} for ${prod.name}!`);
    setSelectedStoreForMap(null);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Back Link */}
      <div className="flex items-center justify-between pb-3 border-b border-teal-900/30">
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="border-teal-800/40 text-teal-300 hover:bg-teal-950/40 text-xs gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User Dashboard
          </Button>
        </Link>

        <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5 bg-teal-950/30 px-3 py-1.5 rounded-full border border-teal-800/40">
          <MapPin className="h-3.5 w-3.5 text-teal-400" />
          Nearest verified store: {storesWithDistance[0]?.distanceKm || 0.8} km away
        </span>
      </div>

      {selectedStoreForMap ? (
        /* ========================================================= */
        /* VIEW 2: DEDICATED GOOGLE MAP + ORDER VS GO THERE DECISION */
        /* ========================================================= */
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <GoogleMapStoreView
            store={selectedStoreForMap}
            product={product}
            userLat={userLat}
            userLng={userLng}
            onClose={() => setSelectedStoreForMap(null)}
            onOrderOnline={handleOrderOnline}
          />
        </div>
      ) : (
        /* ========================================================= */
        /* VIEW 1: PRODUCT DETAILS (LEFT) & STORES BY DISTANCE (RIGHT) */
        /* ========================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Medicine Profile, Pricing & Specifications (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Large Realistic Product Image */}
            <div className="w-full h-72 rounded-2xl overflow-hidden shadow-xl border border-teal-900/40">
              <MedicineThumbnail
                product={product}
                className="w-full h-full"
                priority={true}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-teal-950/40 border-teal-700/50 text-teal-300 text-xs"
                >
                  {product.category}
                </Badge>
                {product.prescriptionRequired ? (
                  <Badge className="bg-amber-950/60 border border-amber-600 text-amber-300 text-xs">
                    Prescription (Rx) Required
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs">
                    Over-The-Counter (OTC)
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {product.name}
              </h1>

              {product.genericName && (
                <p className="text-sm text-teal-400 font-medium">
                  Active Formulation: {product.genericName}
                </p>
              )}
            </div>

            {/* Pricing Box */}
            <div className="p-5 rounded-2xl bg-card border border-teal-900/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium block">
                  Best Local Price
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-extrabold text-white">
                    ₹{product.price}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <>
                      <span className="text-base text-muted-foreground line-through">
                        MRP ₹{product.mrp}
                      </span>
                      <span className="text-xs font-bold text-teal-400 bg-teal-950/50 px-2.5 py-1 rounded-full border border-teal-800/40">
                        {discountPct}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground uppercase font-medium block">
                  Stock Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold mt-1 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-700 text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  In Stock ({product.stockQuantity || 45} Units)
                </span>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
                <span className="text-muted-foreground block text-[11px]">Dosage Form</span>
                <span className="text-white font-semibold mt-0.5 block">
                  {product.dosageForm || "Tablet"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
                <span className="text-muted-foreground block text-[11px]">Strength</span>
                <span className="text-white font-semibold mt-0.5 block">
                  {product.strength || "Standard"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
                <span className="text-muted-foreground block text-[11px]">Batch Number</span>
                <span className="text-teal-300 font-mono font-semibold mt-0.5 block">
                  {product.batchNumber || "#BGP-" + product.id.slice(0, 5)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
                <span className="text-muted-foreground block text-[11px]">Shelf Life</span>
                <span className="text-white font-semibold mt-0.5 block flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-teal-400" />
                  {product.expiryDate
                    ? new Date(product.expiryDate).toLocaleDateString()
                    : "Safe Shelf Life"}
                </span>
              </div>
            </div>

            {/* Clinical Usage */}
            <div className="p-5 rounded-2xl bg-card border border-teal-900/30 space-y-2">
              <h3 className="text-sm font-bold text-white">
                Clinical Usage & Indications
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {product.description ||
                  `Therapeutic formulation for ${product.category}. Dispensed by verified pharmacist partners in compliance with medical standards.`}
              </p>
            </div>

            {/* Generic Substitute Savings Banner */}
            {substitute && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  Generic Alternative Available Nearby!
                </div>
                <p className="text-emerald-200">
                  Save <strong>₹{substitute.savingsAmount}</strong> ({substitute.savingsPercentage}% OFF) by switching to bio-equivalent generic{" "}
                  <strong>{substitute.substituteMedicine.name}</strong> from nearby verified Dukaan.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STORES IN ASCENDING ORDER OF DISTANCE (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-card border border-teal-900/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-teal-900/30">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Store className="h-5 w-5 text-teal-400" />
                    Available in {storesWithDistance.length} Verified Stores
                  </h3>
                  <p className="text-xs text-teal-400/80 mt-0.5">
                    Stores sorted in <strong>ascending order of distance</strong>
                  </p>
                </div>
                <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs">
                  Ascending
                </Badge>
              </div>

              {/* List of Stores */}
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-teal-800">
                {storesWithDistance.map((store, index) => {
                  const drivingTravel = calculateTravelEstimates(store.distanceKm, "driving");
                  const walkingTravel = calculateTravelEstimates(store.distanceKm, "walking");
                  const isNearest = index === 0;

                  return (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStoreForMap(store)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:-translate-y-0.5 ${
                        isNearest
                          ? "bg-teal-950/40 border-teal-500/70 hover:border-teal-400"
                          : "bg-[#070b10] border-teal-900/30 hover:border-teal-700 hover:bg-teal-950/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">
                              {store.storeName}
                            </h4>
                            {isNearest && (
                              <Badge className="bg-teal-600 text-white text-[10px] px-1.5 py-0 font-bold">
                                ⚡ Nearest
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                            {store.storeAddress || store.city}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold shrink-0">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{store.rating || 4.8}</span>
                        </div>
                      </div>

                      {/* Distance & Travel Times */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-muted/10">
                        <div className="flex items-center gap-2 text-teal-300 font-semibold text-xs">
                          <span className="flex items-center gap-1 bg-teal-900/40 px-2 py-0.5 rounded border border-teal-700/40">
                            <MapPin className="h-3.5 w-3.5 text-teal-400" />
                            {store.distanceKm} km
                          </span>
                          <span className="text-muted-foreground font-normal text-[11px]">
                            🚗 ~{drivingTravel.durationMinutes}m · 🚶 ~{walkingTravel.durationMinutes}m
                          </span>
                        </div>

                        <span className="text-white font-extrabold text-sm">
                          ₹{store.storePrice}
                        </span>
                      </div>

                      {/* Select Store & View Google Map Button */}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStoreForMap(store);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Select Store & View Google Map</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
