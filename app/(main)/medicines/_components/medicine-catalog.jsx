"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShoppingCart,
  Check,
  MapPin,
  Sparkles,
  ArrowRightLeft,
  Tag,
  Star,
  Plus,
  Minus,
  Navigation,
  Layers,
  Store,
  Compass,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import MedicineThumbnail from "@/components/medicine-thumbnail";
import { evaluateBestPriceAndFastestStores } from "@/lib/algorithms/geo-routing";

// Lazy-load heavy map and detail modal components so initial render and compiles stay super-fast
const GoogleMapStoreView = dynamic(
  () => import("@/components/map/google-map-store-view"),
  { ssr: false }
);
const ProductDetailsModal = dynamic(
  () => import("./product-details-modal"),
  { ssr: false }
);

// Memoized individual medicine card to eliminate redundant re-renders of the 50+ item grid
const MedicineCard = React.memo(function MedicineCard({
  item,
  inCart,
  onViewProduct,
  onAddToCart,
}) {
  const discountPct =
    item.mrp && item.mrp > item.minPrice
      ? Math.round(((item.mrp - item.minPrice) / item.mrp) * 100)
      : 0;

  const substitute = item.genericAlternative;

  return (
    <div
      onClick={() => onViewProduct(item.primaryProduct)}
      className="p-4 rounded-2xl bg-[#080e16] border border-teal-900/35 hover:border-teal-500/70 transition-all duration-200 flex flex-col justify-between space-y-3 group shadow-lg cursor-pointer hover:shadow-teal-950/50 hover:-translate-y-1 relative"
    >
      <div className="space-y-3">
        {/* MEDICINE IMAGE (Prominent & Authentic Packaging) */}
        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-black/40 border border-teal-900/40">
          <MedicineThumbnail
            product={item.primaryProduct}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Category & Rx/OTC Badges */}
        <div className="flex items-center justify-between text-[11px]">
          <Badge
            variant="outline"
            className="bg-teal-950/50 border-teal-800/40 text-teal-300 text-[10px] px-2 py-0.5"
          >
            {item.category}
          </Badge>

          {item.prescriptionRequired ? (
            <Badge className="bg-amber-950/60 border border-amber-600/60 text-amber-300 text-[10px] px-1.5 py-0 font-bold">
              Rx Required
            </Badge>
          ) : (
            <Badge className="bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 text-[10px] px-1.5 py-0">
              OTC
            </Badge>
          )}
        </div>

        {/* Brand Name & Strength */}
        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
            {item.name}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {item.dosageForm || "Medicine"} • {item.strength || "Standard"}
          </p>
        </div>

        {/* Generic Formula */}
        {item.genericName && (
          <p className="text-[11px] text-teal-400 font-medium line-clamp-1">
            {item.genericName}
          </p>
        )}

        {/* Dukaan Stock Count & Proximity Pill */}
        <div className="p-2 rounded-xl bg-teal-950/30 border border-teal-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-teal-300 font-semibold truncate text-[11px]">
            <Store className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span className="truncate">
              In Stock at {item.storesCount} {item.storesCount === 1 ? "Dukaan" : "Dukaans"}
            </span>
          </div>
          <span className="text-[10px] font-bold text-teal-400 bg-teal-900/60 px-2 py-0.5 rounded-full border border-teal-700/50 shrink-0">
            ~{item.nearestDistanceKm} km
          </span>
        </div>

        {/* Generic Substitute Savings Badge */}
        {substitute && (
          <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-700/40 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Generic savings: Save ₹{substitute.savingsAmount} ({substitute.savingsPercentage}% OFF)
            </span>
          </div>
        )}
      </div>

      {/* Pricing, View Details & Add to Cart */}
      <div className="pt-3 border-t border-muted/20 space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-muted-foreground mr-1">From</span>
            <span className="text-lg font-black text-white">
              ₹{item.minPrice}
            </span>
            {item.mrp && item.mrp > item.minPrice && (
              <>
                <span className="text-xs text-muted-foreground line-through ml-1.5">
                  ₹{item.mrp}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 ml-1.5 bg-emerald-950/50 px-1.5 py-0.5 rounded">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>
        </div>

        {/* Dual Action Buttons */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(item.primaryProduct);
            }}
            className="col-span-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-teal-900/40"
          >
            <Store className="h-3.5 w-3.5" />
            <span>View Stores & Maps</span>
            <ChevronRight className="h-3.5 w-3.5 ml-auto" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(item.primaryProduct);
            }}
            disabled={inCart}
            title={inCart ? "Item added to cart" : "Quick add to cart"}
            className={
              inCart
                ? "col-span-1 border-emerald-600 text-emerald-300 bg-emerald-950/40 h-9 p-0"
                : "col-span-1 border-teal-800 text-teal-300 hover:bg-teal-900/40 h-9 p-0"
            }
          >
            {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
});

const CATEGORIES = [
  "ALL",
  "Antibiotics",
  "Pain Relief",
  "Diabetes Care",
  "Cardiovascular",
  "Vitamins & Supplements",
  "Respiratory & Cough",
  "Gastrointestinal",
  "General Healthcare",
];

const DEFAULT_SAMPLE_STORES = [
  {
    id: "dukaan-amrit",
    storeName: "Amrit Pharmacy (JLNMCH Campus)",
    storeAddress: "Emergency Gate Road, JLNMCH Hospital Complex, Mayaganj",
    city: "Bhagalpur",
    latitude: 25.2635,
    longitude: 87.0175,
    rating: 4.9,
    phone: "+91 94312 87654",
  },
  {
    id: "dukaan-davaindia",
    storeName: "Davaindia Generic Pharmacy (Tilkamanjhi)",
    storeAddress: "Trimurti Chowk, RBSS Road, Tilkamanjhi",
    city: "Bhagalpur",
    latitude: 25.2472,
    longitude: 86.9928,
    rating: 4.8,
    phone: "+91 98350 44321",
  },
  {
    id: "dukaan-roshan",
    storeName: "Roshan Medical Hall (Khalifabag)",
    storeAddress: "Near Jama Masjid, Khalifabag Market Road",
    city: "Bhagalpur",
    latitude: 25.2458,
    longitude: 86.9745,
    rating: 4.7,
    phone: "+91 91223 55678",
  },
  {
    id: "dukaan-uma",
    storeName: "Uma Medical Hall (MG Road)",
    storeAddress: "Opposite Head Post Office, Mahatma Gandhi Road",
    city: "Bhagalpur",
    latitude: 25.2435,
    longitude: 86.9712,
    rating: 4.8,
    phone: "+91 93041 98765",
  },
  {
    id: "dukaan-dev",
    storeName: "DEV Medicals (Zero Mile)",
    storeAddress: "Zero Mile Chowk, Barari / Tilkamanjhi Sector",
    city: "Bhagalpur",
    latitude: 25.251,
    longitude: 87.008,
    rating: 4.9,
    phone: "+91 99342 11223",
  },
];

export default function MedicineCatalog({
  initialProducts = [],
  nearbyStores = [],
  onAddToCart,
  cartItemIds = [],
  userLat = 25.2425,
  userLng = 86.9842,
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = React.useDeferredValue(search);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeMapStore, setActiveMapStore] = useState(null); // When set, Google Map view opens
  const [selectedStoreFilter, setSelectedStoreFilter] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null); // When set, product details modal opens

  // Fallback stores memoized
  const displayStores = React.useMemo(() => {
    return nearbyStores && nearbyStores.length > 0 ? nearbyStores : DEFAULT_SAMPLE_STORES;
  }, [nearbyStores]);

  const evaluation = React.useMemo(() => {
    return evaluateBestPriceAndFastestStores(userLat, userLng, displayStores);
  }, [userLat, userLng, displayStores]);

  // Memoized product filtering using deferred search for instant, non-blocking typing
  const filteredProducts = React.useMemo(() => {
    const q = (deferredSearch || "").trim().toLowerCase();
    return initialProducts.filter((item) => {
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.genericName && item.genericName.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      const matchesStore =
        !selectedStoreFilter ||
        item.storeId === selectedStoreFilter.id ||
        item.store?.id === selectedStoreFilter.id;

      return matchesSearch && matchesCategory && matchesStore;
    });
  }, [initialProducts, deferredSearch, selectedCategory, selectedStoreFilter]);

  // Deduplicate products across stores to present a clean, master medicine catalog (like Tata 1mg / Apollo 24|7)
  // When a specific store filter is active, show that store's direct inventory items
  const displayMedicines = React.useMemo(() => {
    if (selectedStoreFilter) {
      return filteredProducts.map((p) => ({
        key: p.id,
        name: p.name,
        genericName: p.genericName,
        category: p.category,
        dosageForm: p.dosageForm,
        strength: p.strength,
        description: p.description,
        minPrice: p.price,
        mrp: p.mrp || p.price,
        storesCount: 1,
        nearestDistanceKm: p.distanceKm ?? 0.8,
        nearestStore: p.store || displayStores.find((s) => s.id === p.storeId) || displayStores[0],
        prescriptionRequired: p.prescriptionRequired,
        genericAlternative: p.genericAlternative,
        primaryProduct: p,
        allVariants: [p],
      }));
    }

    const groupedMap = new Map();

    filteredProducts.forEach((product) => {
      const normKey = (product.name || "").trim().toLowerCase();
      if (!groupedMap.has(normKey)) {
        groupedMap.set(normKey, []);
      }
      groupedMap.get(normKey).push(product);
    });

    return Array.from(groupedMap.entries()).map(([normKey, items]) => {
      // Sort variants by distance so nearest Dukaan is primary
      const sortedByDistance = [...items].sort((a, b) => {
        const distA = a.distanceKm ?? 999;
        const distB = b.distanceKm ?? 999;
        return distA - distB;
      });

      const nearestItem = sortedByDistance[0];
      const prices = items.map((i) => i.price).filter((p) => typeof p === "number" && !isNaN(p));
      const minPrice = prices.length ? Math.min(...prices) : nearestItem.price;
      const mrps = items.map((i) => i.mrp).filter((p) => typeof p === "number" && !isNaN(p));
      const maxMrp = mrps.length ? Math.max(...mrps) : nearestItem.mrp || minPrice;
      const uniqueStoreIds = new Set(items.map((i) => i.storeId));

      const nearestStoreObj =
        nearestItem.store ||
        displayStores.find((s) => s.id === nearestItem.storeId) ||
        displayStores[0];

      return {
        key: normKey,
        name: nearestItem.name,
        genericName: nearestItem.genericName,
        category: nearestItem.category,
        dosageForm: nearestItem.dosageForm,
        strength: nearestItem.strength,
        description: nearestItem.description,
        minPrice,
        mrp: maxMrp,
        storesCount: uniqueStoreIds.size,
        nearestDistanceKm: nearestItem.distanceKm !== null && nearestItem.distanceKm !== undefined ? nearestItem.distanceKm : 0.8,
        nearestStore: nearestStoreObj,
        prescriptionRequired: nearestItem.prescriptionRequired,
        genericAlternative: nearestItem.genericAlternative,
        primaryProduct: nearestItem,
        allVariants: items,
      };
    });
  }, [filteredProducts, selectedStoreFilter, displayStores]);

  const handleOpenStoreMap = (store) => {
    setActiveMapStore(store);
    setSelectedStoreFilter(store);
    toast.success(`Google Map opened for ${store.storeName}`);
  };

  const handleCloseMap = () => {
    setActiveMapStore(null);
  };

  const handleClearStoreFilter = () => {
    setSelectedStoreFilter(null);
    setActiveMapStore(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SEARCH BAR & STORE COUNTER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-teal-400" />
            <Input
              placeholder="Search 25,000+ medicines, generics, vitamins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-teal-900/30 text-sm focus-visible:ring-teal-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {activeMapStore ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCloseMap}
                className="bg-teal-950/40 border-teal-700/60 text-teal-300 text-xs h-8 gap-1.5"
              >
                <X className="h-3.5 w-3.5 text-teal-400" />
                <span>Close Map View</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/30 border border-teal-800/40 px-3 py-1.5 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-teal-400" />
                <span>{displayStores.length} Verified Dukaans delivering in your radius</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Carousel Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={
                selectedCategory === cat
                  ? "bg-teal-600 hover:bg-teal-700 text-white text-xs whitespace-nowrap rounded-full px-4 font-semibold"
                  : "border-teal-900/30 text-muted-foreground hover:text-white text-xs whitespace-nowrap rounded-full px-4"
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* 2. DEDICATED GOOGLE MAP VIEW (If active store selected directly) */}
      {activeMapStore && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <GoogleMapStoreView
            store={activeMapStore}
            product={viewingProduct}
            userLat={userLat}
            userLng={userLng}
            onClose={handleCloseMap}
            onOrderOnline={(prod, store) => {
              onAddToCart(prod || filteredProducts[0]);
              handleCloseMap();
            }}
          />
        </div>
      )}

      {/* 3. STORE FILTER BANNER (If filtered by store) */}
      {selectedStoreFilter && !activeMapStore && (
        <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-teal-300">
            <Store className="h-4 w-4 text-teal-400" />
            <span>
              Showing medicines available at: <strong>{selectedStoreFilter.storeName}</strong> ({selectedStoreFilter.distanceKm || 0.8} km away)
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearStoreFilter}
            className="h-7 text-xs text-teal-400 hover:text-white gap-1"
          >
            <X className="h-3.5 w-3.5" /> Show All Medicines
          </Button>
        </div>
      )}

      {/* 4. ALL MEDICINES SECTION WITH IMAGES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground px-1">
          <span className="font-extrabold text-white text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-400" />
            All Medicines & Pharmaceutical Formulations ({displayMedicines.length})
          </span>
          <span className="text-teal-400/90 text-xs font-medium">
            Click any medicine image to inspect nearby stores in ascending distance
          </span>
        </div>

        {displayMedicines.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-muted/10 border border-teal-900/20">
            <p className="text-white font-medium">No medicines match your search</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try searching generic formulations like Paracetamol, Amoxicillin, Metformin.
            </p>
            {selectedStoreFilter && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearStoreFilter}
                className="mt-3 border-teal-800 text-teal-300 text-xs"
              >
                Clear Store Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {displayMedicines.map((item) => {
              const inCart = item.allVariants.some((v) => cartItemIds.includes(v.id));
              return (
                <MedicineCard
                  key={item.key}
                  item={item}
                  inCart={inCart}
                  onViewProduct={setViewingProduct}
                  onAddToCart={onAddToCart}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 5. PRODUCT DETAILS MODAL (Lazy mounted only when viewing a medicine) */}
      {viewingProduct && (
        <ProductDetailsModal
          product={viewingProduct}
          isOpen={true}
          onClose={() => setViewingProduct(null)}
          onAddToCart={onAddToCart}
          nearbyStores={displayStores}
          allProducts={initialProducts}
          userLat={userLat}
          userLng={userLng}
          inCart={cartItemIds.includes(viewingProduct.id)}
        />
      )}
    </div>
  );
}
