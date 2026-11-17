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
  ChevronRight,
  ArrowLeft,
  Car,
  Footprints,
  Bike,
  Building2,
  Phone,
  X,
} from "lucide-react";
import MedicineThumbnail from "@/components/medicine-thumbnail";
import GoogleMapStoreView from "@/components/map/google-map-store-view";
import { calculateHaversineDistance } from "@/lib/algorithms/haversine";
import { calculateTravelEstimates } from "@/lib/algorithms/geo-routing";

const DEFAULT_STORES_FALLBACK = [
  {
    id: "store-amrit",
    storeName: "Amrit Pharmacy (JLNMCH Campus)",
    storeAddress: "Emergency Gate Road, JLNMCH Hospital Complex, Mayaganj",
    city: "Bhagalpur",
    latitude: 25.2635,
    longitude: 87.0175,
    rating: 4.9,
    phone: "+91 94312 87654",
  },
  {
    id: "store-davaindia",
    storeName: "Davaindia Generic Pharmacy (Tilkamanjhi)",
    storeAddress: "Trimurti Chowk, RBSS Road, Tilkamanjhi",
    city: "Bhagalpur",
    latitude: 25.2472,
    longitude: 86.9928,
    rating: 4.8,
    phone: "+91 98350 44321",
  },
  {
    id: "store-roshan",
    storeName: "Roshan Medical Hall (Khalifabag)",
    storeAddress: "Near Jama Masjid, Khalifabag Market Road",
    city: "Bhagalpur",
    latitude: 25.2458,
    longitude: 86.9745,
    rating: 4.7,
    phone: "+91 91223 55678",
  },
  {
    id: "store-uma",
    storeName: "Uma Medical Hall (MG Road)",
    storeAddress: "Opposite Head Post Office, Mahatma Gandhi Road",
    city: "Bhagalpur",
    latitude: 25.2435,
    longitude: 86.9712,
    rating: 4.8,
    phone: "+91 93041 98765",
  },
  {
    id: "store-dev",
    storeName: "DEV Medicals (Zero Mile)",
    storeAddress: "Zero Mile Chowk, Barari / Tilkamanjhi Sector",
    city: "Bhagalpur",
    latitude: 25.251,
    longitude: 87.008,
    rating: 4.9,
    phone: "+91 99342 11223",
  },
];

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  nearbyStores = [],
  allProducts = [],
  userLat = 25.2425,
  userLng = 86.9842,
  inCart = false,
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedStoreForMap, setSelectedStoreForMap] = useState(null);

  if (!product) return null;

  // Base list of verified stores
  const baseStoreList =
    nearbyStores && nearbyStores.length > 0
      ? nearbyStores
      : DEFAULT_STORES_FALLBACK;

  // Calculate distance for all stores and sort strictly in ASCENDING ORDER OF DISTANCE
  const storesWithDistance = baseStoreList
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

      // Check if this store has a specific price or stock for this product
      const matchingStoreProduct = allProducts.find(
        (p) =>
          p.storeId === store.id &&
          (p.name?.toLowerCase() === product.name?.toLowerCase() ||
            p.id === product.id)
      );

      const storePrice = matchingStoreProduct?.price || product.price;
      const storeStock = matchingStoreProduct?.stockQuantity || product.stockQuantity || 35;

      return {
        ...store,
        distanceKm: parseFloat(Number(dist).toFixed(1)),
        storePrice,
        storeStock,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm); // Strictly ascending distance

  const discountPct =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const substitute = product.genericAlternative;
  const expiryEval = product.expiryEvaluation;

  const handleAdd = (targetProduct = product) => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(targetProduct);
    }
    onClose();
  };

  const handleOrderOnlineFromMap = (targetProduct, store) => {
    onAddToCart({
      ...targetProduct,
      storeId: store.id,
      store: store,
    });
    setSelectedStoreForMap(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-[98vw] max-w-[1640px] max-h-[92vh] overflow-y-auto bg-[#070b12] border border-teal-900/40 text-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl scrollbar-thin scrollbar-thumb-teal-800"
      >
        {selectedStoreForMap ? (
          /* ========================================================= */
          /* VIEW 2: DEDICATED GOOGLE MAP + ORDER VS GO THERE DECISION */
          /* ========================================================= */
          <div className="space-y-4">
            <GoogleMapStoreView
              store={selectedStoreForMap}
              product={product}
              userLat={userLat}
              userLng={userLng}
              onClose={() => setSelectedStoreForMap(null)}
              onOrderOnline={handleOrderOnlineFromMap}
            />
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 1: PRODUCT DETAILS (LEFT) & STORES BY DISTANCE (RIGHT) */
          /* ========================================================= */
          <div className="space-y-8">
            {/* Top Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-teal-900/30">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-teal-950/60 border-teal-700/60 text-teal-300 text-xs px-3 py-1 font-medium"
                  >
                    {product.category || "General Healthcare"}
                  </Badge>

                  {product.prescriptionRequired ? (
                    <Badge className="bg-amber-950/70 border border-amber-600 text-amber-300 text-xs px-2.5 py-0.5">
                      Rx Prescription Required
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-950/70 border border-emerald-600 text-emerald-300 text-xs px-2.5 py-0.5">
                      Over-The-Counter (OTC)
                    </Badge>
                  )}
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {product.name}
                </h2>

                {product.genericName && (
                  <p className="text-sm sm:text-base text-teal-400 font-medium">
                    Active Chemical Formulation: {product.genericName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-semibold text-teal-300 bg-teal-950/60 px-4 py-2 rounded-full border border-teal-800/60 flex items-center gap-2 shadow-sm">
                  <MapPin className="h-4 w-4 text-teal-400" />
                  Nearest dukaan: {storesWithDistance[0]?.distanceKm || 0.8} km away
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-10 w-10 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Split Two-Column Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ========================================================= */}
              {/* LEFT COLUMN: PRODUCT SPECIFICATIONS & DETAILS (5 COLS)   */}
              {/* ========================================================= */}
              <div className="lg:col-span-5 space-y-6 bg-[#0a111a] p-6 sm:p-8 rounded-3xl border border-teal-900/30 shadow-xl">
                {/* Product Packaging Image */}
                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-xl border border-teal-900/40 bg-black/50">
                  <MedicineThumbnail
                    product={product}
                    className="w-full h-full object-cover"
                    priority={true}
                  />
                </div>

                {/* Price and Stock Status Banner */}
                <div className="p-5 rounded-2xl bg-[#060a0f] border border-teal-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold block">
                      Selling Price
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        ₹{product.price}
                      </span>
                      {product.mrp && product.mrp > product.price && (
                        <>
                          <span className="text-base text-muted-foreground line-through">
                            MRP ₹{product.mrp}
                          </span>
                          <span className="text-xs font-bold text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-800/40">
                            {discountPct}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase font-semibold block">
                      Availability
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold mt-1.5 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-600 text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      In Stock ({product.stockQuantity || 35} Units)
                    </span>
                  </div>
                </div>

                {/* Clean Specs Tags */}
                <div className="flex flex-wrap gap-2.5 text-xs">
                  <div className="px-3.5 py-2 rounded-xl bg-[#060a0f] border border-teal-900/30">
                    <span className="text-muted-foreground mr-1.5">Form:</span>
                    <span className="text-white font-semibold">{product.dosageForm || "Tablet"}</span>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-[#060a0f] border border-teal-900/30">
                    <span className="text-muted-foreground mr-1.5">Strength:</span>
                    <span className="text-white font-semibold">{product.strength || "Standard"}</span>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-[#060a0f] border border-teal-900/30 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-400" />
                    <span className="text-muted-foreground mr-1">Expiry:</span>
                    <span className="text-white font-semibold">
                      {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : "Safe Shelf Life"}
                    </span>
                  </div>
                </div>

                {/* Clinical Usage Details */}
                <div className="p-4 rounded-2xl bg-[#060a0f] border border-teal-900/30 space-y-1">
                  <span className="text-xs font-bold text-teal-300 block">
                    Clinical Usage & Directions:
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {product.description ||
                      `Therapeutic formulation for ${product.category}. Administer as prescribed by your verified doctor or as indicated on packaging.`}
                  </p>
                </div>

                {/* Generic Substitute Savings Banner */}
                {substitute && (
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-700/50 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <Sparkles className="h-4 w-4" />
                      Generic Alternative Available Nearby!
                    </div>
                    <p className="text-emerald-200 text-xs leading-relaxed">
                      Save <strong>₹{substitute.savingsAmount}</strong> ({substitute.savingsPercentage}% OFF) with bio-equivalent generic{" "}
                      <strong>{substitute.substituteMedicine.name}</strong>.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onAddToCart(substitute.substituteMedicine);
                        onClose();
                      }}
                      className="border-emerald-600 text-emerald-300 hover:bg-emerald-900/40 text-xs h-9 font-bold gap-1.5 mt-1 rounded-xl"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Switch to Generic (₹{substitute.substituteMedicine.price})
                    </Button>
                  </div>
                )}

                {/* Quantity Selector & Add to Cart Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#060a0f] border border-teal-900/40 p-1.5 rounded-2xl shrink-0">
                    <span className="text-xs text-muted-foreground px-2 sm:hidden">Qty:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-9 w-9 p-0 text-white hover:bg-teal-900/40 rounded-xl"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-9 text-center font-bold text-base text-teal-300">
                        {quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-9 w-9 p-0 text-white hover:bg-teal-900/40 rounded-xl"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAdd()}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm h-12 px-6 gap-2.5 shadow-lg shadow-teal-900/40 rounded-2xl"
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                    <span>Add to Pharmacy Basket (₹{product.price * quantity})</span>
                  </Button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* RIGHT COLUMN: STORES IN ASCENDING ORDER OF DISTANCE (7 COLS) */}
              {/* ========================================================= */}
              <div className="lg:col-span-7 space-y-4 bg-[#0a111a] p-6 sm:p-8 rounded-3xl border border-teal-900/30 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-teal-900/40">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                      <Store className="h-5 w-5 text-teal-400" />
                      Available in {storesWithDistance.length} Verified Local Pharmacies
                    </h3>
                    <p className="text-xs sm:text-sm text-teal-400/90 mt-1">
                      All local Dukaans listed strictly in <strong>ascending order of distance</strong> ($d_1 \le d_2 \le \dots$)
                    </p>
                  </div>

                  <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs px-3 py-1 font-semibold">
                    Nearest First
                  </Badge>
                </div>

                {/* List of Stores (Wide, Spacious & Clean) */}
                <div className="space-y-4 max-h-[620px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-800">
                  {storesWithDistance.map((store, index) => {
                    const drivingTravel = calculateTravelEstimates(store.distanceKm, "driving");
                    const walkingTravel = calculateTravelEstimates(store.distanceKm, "walking");
                    const isNearest = index === 0;

                    return (
                      <div
                        key={store.id}
                        onClick={() => setSelectedStoreForMap(store)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-md hover:-translate-y-0.5 ${
                          isNearest
                            ? "bg-teal-950/40 border-teal-500/80 hover:border-teal-400 shadow-teal-950/40"
                            : "bg-[#060a0f] border-teal-900/40 hover:border-teal-700 hover:bg-teal-950/20"
                        }`}
                      >
                        {/* Store Top Row: Name, Badges & Rating */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base sm:text-lg font-bold text-white">
                                {store.storeName}
                              </h4>
                              {isNearest && (
                                <Badge className="bg-teal-600 text-white text-[11px] px-2.5 py-0.5 font-bold shadow-sm">
                                  ⚡ Nearest Dukaan
                                </Badge>
                              )}
                              <Badge className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-[10px] px-2 py-0">
                                <ShieldCheck className="h-3 w-3 mr-1 inline" /> Verified
                              </Badge>
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {store.storeAddress || store.city}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-600/50 px-3 py-1.5 rounded-xl text-amber-300 text-xs sm:text-sm font-bold shrink-0">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span>{store.rating || 4.8}</span>
                          </div>
                        </div>

                        {/* Store Metrics: Distance, Travel Times, Pricing & Stock */}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm pt-3 border-t border-muted/15">
                          <div className="flex items-center gap-3 text-teal-300 font-semibold flex-wrap">
                            <span className="flex items-center gap-1.5 bg-teal-900/50 px-3 py-1 rounded-lg border border-teal-700/50 text-teal-200">
                              <MapPin className="h-4 w-4 text-teal-400" />
                              {store.distanceKm} km away
                            </span>
                            <span className="text-muted-foreground text-xs">
                              🚗 ~{drivingTravel.durationMinutes}m drive · 🚶 ~{walkingTravel.durationMinutes}m walk
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-extrabold text-white">
                              ₹{store.storePrice}
                            </span>
                            <span className="text-xs text-emerald-400 block font-medium">
                              In Stock ({store.storeStock} units)
                            </span>
                          </div>
                        </div>

                        {/* Prominent High-Contrast Action Button */}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStoreForMap(store);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm h-11 px-5 gap-2 shadow-md shadow-blue-900/30 rounded-xl flex items-center justify-center transition-all"
                        >
                          <Navigation className="h-4 w-4 shrink-0" />
                          <span>Select Store & View Google Map</span>
                          <ChevronRight className="h-4 w-4 ml-auto shrink-0" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
