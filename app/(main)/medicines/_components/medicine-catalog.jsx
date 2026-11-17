"use client";

import React, { useState } from "react";
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
  Map,
  Layers,
  Store,
  Compass,
  X,
} from "lucide-react";
import { toast } from "sonner";
import LiveMap from "@/components/map/live-map";

const CATEGORIES = [
  "ALL",
  "Antibiotics",
  "Pain Relief",
  "Diabetes Care",
  "Cardiovascular",
  "Vitamins & Supplements",
  "Respiratory & Cough",
  "General Healthcare",
];

const DEFAULT_SAMPLE_STORES = [
  {
    id: "dukaan-apex",
    storeName: "Apex Medico & Telepharmacy",
    storeAddress: "Shop 4, Main Market, Connaught Circus",
    city: "New Delhi",
    latitude: 28.6328,
    longitude: 77.2197,
    rating: 4.9,
    basketCost: 130,
  },
  {
    id: "dukaan-lifecare",
    storeName: "LifeCare 24/7 Dukaan",
    storeAddress: "12 Institutional Area, Near Metro Gate 3",
    city: "New Delhi",
    latitude: 28.6185,
    longitude: 77.2125,
    rating: 4.8,
    basketCost: 145,
  },
  {
    id: "dukaan-apollo",
    storeName: "Apollo Local Express Dukaan",
    storeAddress: "Plot 8B, Barakhamba Road",
    city: "New Delhi",
    latitude: 28.6275,
    longitude: 77.2285,
    rating: 4.7,
    basketCost: 160,
  },
];

export default function MedicineCatalog({
  initialProducts = [],
  nearbyStores = [],
  onAddToCart,
  cartItemIds = [],
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState("split"); // "split" | "catalog" | "map"
  const [selectedStore, setSelectedStore] = useState(null);

  // Fallback stores if none in DB
  const displayStores =
    nearbyStores && nearbyStores.length > 0 ? nearbyStores : DEFAULT_SAMPLE_STORES;

  // Filter products by search, category, and selected store
  const filteredProducts = initialProducts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.genericName && item.genericName.toLowerCase().includes(search.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;

    const matchesStore =
      !selectedStore || item.storeId === selectedStore.id || item.store?.id === selectedStore.id;

    return matchesSearch && matchesCategory && matchesStore;
  });

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    toast.info(`Filtered medicines to: ${store.storeName}`);
  };

  const handleClearStoreFilter = () => {
    setSelectedStore(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER: View Mode Switcher & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search 25,000+ medicines, generics, vitamins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-teal-900/30 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-card border border-teal-900/40 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "split"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Map & Catalog</span>
              </button>

              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "map"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Map className="h-3.5 w-3.5" />
                <span>Full Wayfinder</span>
              </button>

              <button
                onClick={() => setViewMode("catalog")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "catalog"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Catalog Only</span>
              </button>
            </div>

            {/* Nearby Stores Badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/30 border border-teal-800/40 px-3 py-1.5 rounded-full">
              <MapPin className="h-3.5 w-3.5 text-teal-400" />
              <span>{displayStores.length} Verified Dukaans nearby</span>
            </div>
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
                  ? "bg-teal-600 hover:bg-teal-700 text-white text-xs whitespace-nowrap rounded-full px-4"
                  : "border-teal-900/30 text-muted-foreground hover:text-white text-xs whitespace-nowrap rounded-full px-4"
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* 2. INTERACTIVE LIVE MAP & GEODESIC WAYFINDER (When in split or map view) */}
      {(viewMode === "split" || viewMode === "map") && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-teal-300 flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-teal-400" />
              Interactive Local Dukaan Map & Live Wayfinder
            </span>
            <span className="text-muted-foreground">
              Click any store pin or button to plot real turn-by-turn road navigation
            </span>
          </div>

          <LiveMap
            stores={displayStores}
            selectedStoreId={selectedStore?.id}
            onSelectStore={handleStoreSelect}
            height={viewMode === "map" ? "640px" : "480px"}
          />
        </div>
      )}

      {/* Store Filter Pill if active */}
      {selectedStore && (
        <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-teal-300">
            <Store className="h-4 w-4 text-teal-400" />
            <span>
              Showing medicines available at: <strong>{selectedStore.storeName}</strong>
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearStoreFilter}
            className="h-7 text-xs text-teal-400 hover:text-white gap-1"
          >
            <X className="h-3.5 w-3.5" /> Show All Stores
          </Button>
        </div>
      )}

      {/* 3. PRODUCT CARDS GRID (When in split or catalog view) */}
      {viewMode !== "map" && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-muted/10 border border-teal-900/20">
              <p className="text-white font-medium">No medicines match your search</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching generic chemical names (e.g. Paracetamol, Amoxicillin).
              </p>
              {selectedStore && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const inCart = cartItemIds.includes(product.id);
                const discountPct =
                  product.mrp && product.mrp > product.price
                    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                    : 0;

                const substitute = product.genericAlternative;
                const storeObj =
                  product.store ||
                  displayStores.find((s) => s.id === product.storeId) ||
                  displayStores[0];

                return (
                  <div
                    key={product.id}
                    className="p-4 rounded-xl bg-card border border-teal-900/20 hover:border-teal-700/50 transition-all flex flex-col justify-between space-y-3 group shadow-md"
                  >
                    <div className="space-y-2">
                      {/* Category & Proximity Badge */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{product.category}</span>
                        {product.distanceKm !== null && (
                          <span className="text-teal-400 font-medium flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" /> {product.distanceKm} km
                          </span>
                        )}
                      </div>

                      {/* Brand & Strength */}
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        {product.strength && (
                          <p className="text-[11px] text-muted-foreground">
                            {product.dosageForm || "Medicine"} • {product.strength}
                          </p>
                        )}
                      </div>

                      {/* Generic Formula */}
                      {product.genericName && (
                        <p className="text-[11px] text-teal-400/80 font-medium line-clamp-1">
                          {product.genericName}
                        </p>
                      )}

                      {/* Store Name, Rating & Map Wayfinder Shortcut */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-muted/15">
                        <span className="truncate max-w-[130px] text-white">
                          {storeObj?.storeName || "Apex Dukaan"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStore(storeObj);
                              if (viewMode === "catalog") setViewMode("split");
                              toast.success(`Wayfinding routed to ${storeObj?.storeName}`);
                            }}
                            className="text-[10px] text-teal-400 hover:text-teal-200 font-semibold flex items-center gap-0.5 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-800/40"
                            title="Find way to this store on map"
                          >
                            <Navigation className="h-2.5 w-2.5" /> Route
                          </button>
                          <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {storeObj?.rating || "4.8"}
                          </span>
                        </div>
                      </div>

                      {/* Generic Substitute Savings Badge (Suggestion 1) */}
                      {substitute && (
                        <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 space-y-1 mt-2">
                          <div className="flex items-center gap-1 font-semibold text-emerald-400">
                            <Sparkles className="h-3 w-3 text-emerald-400" />
                            Generic Savings Available!
                          </div>
                          <p className="leading-tight">
                            Switch to <strong>{substitute.substituteMedicine.name}</strong> & save{" "}
                            <span className="font-bold text-white">₹{substitute.savingsAmount}</span> ({substitute.savingsPercentage}% OFF).
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAddToCart(substitute.substituteMedicine)}
                            className="h-6 w-full text-[10px] text-emerald-300 hover:text-white hover:bg-emerald-900/40 p-0 font-bold"
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" /> Switch to Generic (₹{substitute.substituteMedicine.price})
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Pricing & Add to Cart */}
                    <div className="pt-2 border-t border-muted/20 flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-white">
                          ₹{product.price}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <>
                            <span className="text-xs text-muted-foreground line-through ml-1.5">
                              ₹{product.mrp}
                            </span>
                            <span className="text-[10px] font-bold text-teal-400 ml-1.5">
                              {discountPct}% OFF
                            </span>
                          </>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => onAddToCart(product)}
                        disabled={inCart}
                        className={
                          inCart
                            ? "bg-emerald-700 text-white text-xs h-8"
                            : "bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-8 gap-1.5"
                        }
                      >
                        {inCart ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3.5 w-3.5" /> Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
