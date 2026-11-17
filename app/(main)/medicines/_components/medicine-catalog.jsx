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
} from "lucide-react";
import { toast } from "sonner";

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

export default function MedicineCatalog({
  initialProducts = [],
  nearbyStores = [],
  onAddToCart,
  cartItemIds = [],
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Filtering
  const filteredProducts = initialProducts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.genericName && item.genericName.toLowerCase().includes(search.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar & Category Chips */}
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

          {/* Nearby Stores Badge Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/30 border border-teal-800/40 px-3 py-1.5 rounded-full self-start sm:self-center">
            <MapPin className="h-3.5 w-3.5 text-teal-400" />
            <span>
              {nearbyStores.length > 0
                ? `${nearbyStores.length} Verified Dukaans within your radius`
                : "Local Pharmacy Delivery Available"}
            </span>
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

      {/* Product Cards Grid (Tata 1mg Layout) */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-muted/10 border border-teal-900/20">
          <p className="text-white font-medium">No medicines match your search</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try searching generic chemical names (e.g. Paracetamol, Amoxicillin).
          </p>
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

                  {/* Store Name & Rating */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-muted/15">
                    <span className="truncate max-w-[140px] text-white">
                      {product.store?.storeName || "Apex Dukaan"}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                      <Star className="h-3 w-3 fill-amber-400" />
                      {product.store?.rating || "4.8"}
                    </span>
                  </div>

                  {/* Suggestion 1: Generic Substitute Savings Badge */}
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
    </div>
  );
}
