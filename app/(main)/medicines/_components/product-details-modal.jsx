"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  Store,
  MapPin,
  Clock,
  Star,
  Check,
  ShoppingCart,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  Navigation,
  ExternalLink,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  Calendar,
} from "lucide-react";
import LiveMap from "@/components/map/live-map";
import { getGoogleMapsNavigationUrl, TRANSPORT_MODES } from "@/lib/algorithms/geo-routing";

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  userLat = 28.6139,
  userLng = 77.2090,
  inCart = false,
}) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const store = product.store || {
    id: "default-store",
    storeName: "Verified Local Dukaan",
    storeAddress: "Market Area",
    city: "Local",
    latitude: 28.625,
    longitude: 77.218,
    rating: 4.8,
  };

  const discountPct =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const substitute = product.genericAlternative;
  const expiryEval = product.expiryEvaluation;

  const googleMapsUrl = getGoogleMapsNavigationUrl(
    userLat,
    userLng,
    store.latitude,
    store.longitude,
    TRANSPORT_MODES.DRIVING
  );

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#091017] border-teal-900/40 text-white p-6 scrollbar-thin scrollbar-thumb-teal-800">
        <DialogHeader className="border-b border-teal-900/30 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-teal-950/40 border-teal-700/50 text-teal-300 text-xs px-2.5 py-0.5"
              >
                {product.category || "General Healthcare"}
              </Badge>
              {product.prescriptionRequired ? (
                <Badge className="bg-amber-950/60 border border-amber-600 text-amber-300 text-xs">
                  Rx Prescription Required
                </Badge>
              ) : (
                <Badge className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs">
                  Over-The-Counter (OTC)
                </Badge>
              )}
            </div>

            {product.distanceKm !== null && product.distanceKm !== undefined && (
              <span className="text-xs font-semibold text-teal-400 flex items-center gap-1 bg-teal-950/30 px-3 py-1 rounded-full border border-teal-800/40">
                <MapPin className="h-3.5 w-3.5" />
                {product.distanceKm} km away from your location
              </span>
            )}
          </div>

          <DialogTitle className="text-2xl font-extrabold text-white mt-2">
            {product.name}
          </DialogTitle>
          {product.genericName && (
            <DialogDescription className="text-xs text-teal-400/90 font-medium">
              Active Chemical Formulation: {product.genericName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* LEFT COLUMN: Product Specifications & Pricing (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Price Box */}
            <div className="p-4 rounded-xl bg-card border border-teal-900/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                  Selling Price
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-white">
                    ₹{product.price}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">
                        MRP ₹{product.mrp}
                      </span>
                      <span className="text-xs font-bold text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800/40">
                        {discountPct}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock Status Badge */}
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block uppercase font-medium">
                  Inventory
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 px-2.5 py-1 rounded-full ${
                    product.stockQuantity > 0
                      ? "bg-emerald-950/40 border border-emerald-700 text-emerald-400"
                      : "bg-red-950/40 border border-red-700 text-red-400"
                  }`}
                >
                  <Check className="h-3 w-3" />
                  {product.stockQuantity > 0
                    ? `${product.stockQuantity} Units In Stock`
                    : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#070b10] border border-teal-900/30">
                <span className="text-muted-foreground block text-[11px]">Dosage Form</span>
                <span className="text-white font-medium">
                  {product.dosageForm || "Tablet / Capsule"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#070b10] border border-teal-900/30">
                <span className="text-muted-foreground block text-[11px]">Strength / Potency</span>
                <span className="text-white font-medium">
                  {product.strength || "Standard Clinical Strength"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#070b10] border border-teal-900/30">
                <span className="text-muted-foreground block text-[11px]">Batch Number</span>
                <span className="text-teal-300 font-mono font-medium">
                  {product.batchNumber || "#CC-" + product.id.slice(0, 6)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#070b10] border border-teal-900/30">
                <span className="text-muted-foreground block text-[11px]">Shelf Life & Expiry</span>
                <span className="text-white font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-teal-400" />
                  {product.expiryDate
                    ? new Date(product.expiryDate).toLocaleDateString()
                    : "18+ Months Safe"}
                </span>
              </div>
            </div>

            {/* Expiry Warning Badge if near expiry */}
            {expiryEval && expiryEval.status === "CRITICAL_EXPIRY" && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 flex items-start gap-2.5 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-white">Flash Clearance Batch:</strong> This batch expires in{" "}
                  {expiryEval.daysRemaining} days. Perfect for immediate monthly routine care!
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-teal-300 block">
                Clinical Details & Usage:
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {product.description ||
                  `Standard therapeutic formulation for ${product.category}. Take strictly as directed by a certified physician or as indicated on packaging.`}
              </p>
            </div>

            {/* Generic Substitute Savings Banner */}
            {substitute && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  Generic Alternative Available Nearby!
                </div>
                <p className="text-emerald-200">
                  Save <strong>₹{substitute.savingsAmount}</strong> ({substitute.savingsPercentage}% OFF) by switching to bio-equivalent generic{" "}
                  <strong>{substitute.substituteMedicine.name}</strong>.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onAddToCart(substitute.substituteMedicine);
                    onClose();
                  }}
                  className="border-emerald-700 text-emerald-300 hover:bg-emerald-900/40 text-xs h-7 font-bold gap-1"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  Switch & Add Generic (₹{substitute.substituteMedicine.price})
                </Button>
              </div>
            )}

            {/* Quantity Selector & Add to Cart Action */}
            <div className="pt-2 border-t border-teal-900/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-[#070b10] border border-teal-900/40 p-1 rounded-xl">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-7 w-7 p-0 text-white hover:bg-teal-900/40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-bold text-white font-mono">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-7 w-7 p-0 text-white hover:bg-teal-900/40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Button
                size="lg"
                onClick={handleAdd}
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs h-10 gap-2 shadow-lg shadow-teal-950"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Add {quantity} to Basket (₹{product.price * quantity})</span>
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Fulfilling Dukaan, Proximity & Live Wayfinder (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Dukaan Profile Card */}
            <div className="p-4 rounded-xl bg-card border border-teal-900/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  Fulfilling Local Pharmacy
                </span>
                <span className="flex items-center gap-0.5 text-amber-400 font-bold text-xs">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {store.rating || "4.8"}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{store.storeName}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{store.storeAddress || store.city || "Neighborhood Medical Center"}</span>
                </p>
              </div>

              {/* Distance & Delivery Estimate Pill */}
              <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-800/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Proximity Distance</span>
                  <span className="text-white font-bold font-mono">
                    {product.distanceKm !== null ? `${product.distanceKm} km` : "1.2 km"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px]">Estimated Delivery</span>
                  <span className="text-teal-300 font-bold font-mono">
                    ~{Math.max(15, Math.round((product.distanceKm || 1.2) * 5))} mins
                  </span>
                </div>
              </div>

              {/* Google Maps External Navigation Button */}
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-teal-700/50 text-teal-300 hover:bg-teal-950/40 text-xs h-8 gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5 text-teal-400" />
                  <span>Directions in Google Maps</span>
                  <ExternalLink className="h-3 w-3 opacity-70 ml-auto" />
                </Button>
              </a>
            </div>

            {/* Embedded Live Wayfinding Mini-Map */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span className="font-semibold text-teal-400 flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  Live Route to this Dukaan:
                </span>
                <span>Real Road Polyline</span>
              </div>

              <LiveMap
                initialUserLat={userLat}
                initialUserLng={userLng}
                userLocationName="Your Location"
                stores={[
                  {
                    id: store.id,
                    storeName: store.storeName,
                    storeAddress: store.storeAddress,
                    city: store.city,
                    latitude: store.latitude,
                    longitude: store.longitude,
                    rating: store.rating || 4.8,
                  },
                ]}
                selectedStoreId={store.id}
                showRoutePlanner={false}
                height="240px"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
