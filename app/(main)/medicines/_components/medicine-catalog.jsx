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
  Map,
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
import { toast } from "sonner";
import LiveMap from "@/components/map/live-map";
import ProductDetailsModal from "./product-details-modal";
import { evaluateBestPriceAndFastestStores } from "@/lib/algorithms/geo-routing";

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
  userLat = 28.6139,
  userLng = 77.2090,
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeMapStore, setActiveMapStore] = useState(null); // When set, right side full map opens!
  const [selectedStoreFilter, setSelectedStoreFilter] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null); // When set, product details modal opens!

  // Fallback stores if none in DB
  const displayStores =
    nearbyStores && nearbyStores.length > 0 ? nearbyStores : DEFAULT_SAMPLE_STORES;

  const evaluation = evaluateBestPriceAndFastestStores(userLat, userLng, displayStores);

  // Filter products by search, category, and selected store filter
  const filteredProducts = initialProducts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.genericName && item.genericName.toLowerCase().includes(search.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;

    const matchesStore =
      !selectedStoreFilter ||
      item.storeId === selectedStoreFilter.id ||
      item.store?.id === selectedStoreFilter.id;

    return matchesSearch && matchesCategory && matchesStore;
  });

  const handleOpenStoreMap = (store) => {
    setActiveMapStore(store);
    setSelectedStoreFilter(store);
    toast.success(`Wayfinding map opened for ${store.storeName}`);
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
      {/* 1. TOP HEADER: Search Bar & Nearby Counter */}
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
            {/* Active Dukaan Route Indicator Pill if map is open */}
            {activeMapStore ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCloseMap}
                className="bg-teal-950/40 border-teal-700/60 text-teal-300 text-xs h-8 gap-1.5"
              >
                <X className="h-3.5 w-3.5 text-teal-400" />
                <span>Close Right Map</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/30 border border-teal-800/40 px-3 py-1.5 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-teal-400" />
                <span>{displayStores.length} Verified Dukaans within your delivery radius</span>
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
                  ? "bg-teal-600 hover:bg-teal-700 text-white text-xs whitespace-nowrap rounded-full px-4"
                  : "border-teal-900/30 text-muted-foreground hover:text-white text-xs whitespace-nowrap rounded-full px-4"
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* 2. NEARBY SHOPS / DUKAANS SHOWCASE CARDS (Shown FIRST so the user picks a store or medicine, not forcing direct map) */}
      <div className="p-4 rounded-2xl bg-card border border-teal-900/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="h-4 w-4 text-teal-400" />
              Verified Local Pharmacies (Dukaans) Near You
            </h3>
            <p className="text-xs text-muted-foreground">
              Select any local pharmacy to inspect its catalog and open live road navigation on the right side.
            </p>
          </div>

          <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs">
            {displayStores.length} Nearby
          </Badge>
        </div>

        {/* Horizontal Scroll / Grid of Nearby Shops */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {displayStores.map((store) => {
            const isSelected = activeMapStore?.id === store.id;
            const isFastest = evaluation.fastestStore?.id === store.id;
            const isBestPrice = evaluation.bestPriceStore?.id === store.id;
            const distance = store.distanceKm || 1.2;

            return (
              <div
                key={store.id}
                onClick={() => handleOpenStoreMap(store)}
                className={`p-3.5 rounded-xl transition-all cursor-pointer flex flex-col justify-between space-y-2.5 border ${
                  isSelected
                    ? "bg-teal-950/40 border-teal-500 shadow-lg shadow-teal-950/50 ring-1 ring-teal-500/50"
                    : "bg-[#070b10] border-teal-900/30 hover:border-teal-700/60 hover:bg-teal-950/20"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">
                      {store.storeName}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold text-xs">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {store.rating || "4.8"}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate">
                    {store.storeAddress || store.city || "Local Market"}
                  </p>
                </div>

                {/* Badges: Distance & Price/Speed */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-muted/10">
                  <div className="flex items-center gap-1.5 text-teal-400 font-semibold text-[11px]">
                    <MapPin className="h-3 w-3" />
                    <span>{distance} km</span>
                    <span className="text-muted-foreground font-normal">• ~{Math.round(distance * 4 + 2)} mins</span>
                  </div>

                  {isFastest ? (
                    <Badge className="bg-sky-950/60 border border-sky-600 text-sky-300 text-[10px] py-0 px-1.5">
                      ⚡ Fastest
                    </Badge>
                  ) : isBestPrice ? (
                    <Badge className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-[10px] py-0 px-1.5">
                      🏷️ Best Price
                    </Badge>
                  ) : null}
                </div>

                {/* Trigger Button */}
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStoreMap(store);
                  }}
                  className={`w-full text-xs h-7 font-semibold gap-1.5 ${
                    isSelected
                      ? "bg-teal-600 hover:bg-teal-700 text-white"
                      : "border-teal-800/50 text-teal-300 hover:bg-teal-900/40"
                  }`}
                >
                  <Navigation className="h-3 w-3" />
                  <span>{isSelected ? "Map Route Active" : "View Route on Map"}</span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Store Filter Banner if active */}
      {selectedStoreFilter && (
        <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-teal-300">
            <Store className="h-4 w-4 text-teal-400" />
            <span>
              Showing medicines fulfilling at: <strong>{selectedStoreFilter.storeName}</strong> ({selectedStoreFilter.distanceKm || 1.2} km away)
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

      {/* 3. MAIN SECTION: SPLIT LAYOUT (When Dukaan clicked, full map comes on the RIGHT side!) */}
      <div className={`grid grid-cols-1 ${activeMapStore ? "lg:grid-cols-12" : "grid-cols-1"} gap-6`}>
        {/* LEFT SECTION: MEDICINE CATALOG CARDS (Takes 7 cols when map is active, 12 cols when map is closed) */}
        <div className={activeMapStore ? "lg:col-span-7 space-y-4" : "space-y-4"}>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold text-white">
              Available Medicines & Healthcare ({filteredProducts.length})
            </span>
            <span>Click any medicine to view full specifications & Dukaan location</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-muted/10 border border-teal-900/20">
              <p className="text-white font-medium">No medicines match your search</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching generic chemical names (e.g. Paracetamol, Amoxicillin).
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
            <div
              className={`grid grid-cols-1 ${
                activeMapStore
                  ? "sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2"
                  : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              } gap-4`}
            >
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
                    onClick={() => setViewingProduct(product)}
                    className="p-4 rounded-xl bg-card border border-teal-900/20 hover:border-teal-700/60 transition-all flex flex-col justify-between space-y-3 group shadow-md cursor-pointer hover:shadow-teal-950/40 hover:-translate-y-0.5"
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
                        <span className="truncate max-w-[120px] text-white">
                          {storeObj?.storeName || "Apex Dukaan"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStoreMap(storeObj);
                            }}
                            className="text-[10px] text-teal-400 hover:text-teal-200 font-semibold flex items-center gap-0.5 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-800/40"
                            title="Open map route on right side"
                          >
                            <Navigation className="h-2.5 w-2.5" /> Map
                          </button>
                          <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {storeObj?.rating || "4.8"}
                          </span>
                        </div>
                      </div>

                      {/* Generic Substitute Savings Badge */}
                      {substitute && (
                        <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 space-y-1 mt-1">
                          <div className="flex items-center gap-1 font-semibold text-emerald-400">
                            <Sparkles className="h-3 w-3 text-emerald-400" />
                            Generic Savings: ₹{substitute.savingsAmount} OFF
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing, View Details & Add to Cart */}
                    <div className="pt-2 border-t border-muted/20 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-base font-bold text-white">
                          ₹{product.price}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-[10px] font-bold text-teal-400 ml-1.5">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingProduct(product);
                          }}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-white"
                          title="View product specifications & Dukaan location"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          disabled={inCart}
                          className={
                            inCart
                              ? "bg-emerald-700 text-white text-xs h-8 px-2.5"
                              : "bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-8 px-2.5 gap-1"
                          }
                        >
                          {inCart ? (
                            <>
                              <Check className="h-3 w-3" /> Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3 w-3" /> Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SECTION: FULL INTERACTIVE MAP (Comes smoothly on the right side when a shop is clicked!) */}
        {activeMapStore && (
          <div className="lg:col-span-5 space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-3 bg-card border border-teal-900/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-teal-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Live Route: {activeMapStore.storeName}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                    {activeMapStore.storeAddress || activeMapStore.city}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleCloseMap}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                title="Close map"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <LiveMap
              stores={displayStores}
              selectedStoreId={activeMapStore.id}
              initialUserLat={userLat}
              initialUserLng={userLng}
              height="620px"
              className="sticky top-20 shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* 4. PRODUCT DETAILS MODAL (Opens when clicking any medicine, showing info, prices, distance & store location!) */}
      <ProductDetailsModal
        product={viewingProduct}
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        onAddToCart={onAddToCart}
        userLat={userLat}
        userLng={userLng}
        inCart={viewingProduct ? cartItemIds.includes(viewingProduct.id) : false}
      />
    </div>
  );
}
