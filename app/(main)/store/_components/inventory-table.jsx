"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Zap,
  Tag,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { updateProductStockAction, toggleFlashSaleAction } from "@/actions/store";
import useFetch from "@/hooks/use-fetch";

export default function InventoryTable({ products = [], storeId }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const { fn: updateStock, loading: stockLoading } = useFetch(updateProductStockAction);
  const { fn: toggleFlashSale, loading: flashLoading } = useFetch(toggleFlashSaleAction);

  // Extract unique categories
  const categories = ["ALL", ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filtered products
  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.genericName && item.genericName.toLowerCase().includes(search.toLowerCase())) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleStockAdjust = async (productId, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    setUpdatingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("stockQuantity", newStock.toString());

    const res = await updateStock(formData);
    setUpdatingId(null);
    if (res?.success) {
      toast.success("Stock updated successfully");
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleToggleFlashSale = async (productId, currentIsFlashSale) => {
    setUpdatingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("discountPercentage", "50");

    const res = await toggleFlashSale(formData);
    setUpdatingId(null);
    if (res?.success) {
      toast.success(res.message);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls: Search & Category Chips */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand, generic formula, or batch #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-teal-900/30"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {categories.slice(0, 6).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={
                selectedCategory === cat
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "border-teal-900/30 text-muted-foreground hover:text-white"
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Inventory Cards / Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-muted/10 border border-teal-900/20">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-white font-medium">No medicines match your filter</p>
          <p className="text-xs text-muted-foreground mt-1">Try searching a different keyword or add a new medicine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                item.isFlashSale
                  ? "bg-amber-950/15 border-amber-800/40"
                  : item.evaluatedExpiryStatus === "CRITICAL_EXPIRY"
                  ? "bg-red-950/15 border-red-900/30"
                  : item.isLowStock
                  ? "bg-amber-950/10 border-amber-900/30"
                  : "bg-card border-teal-900/20 hover:border-teal-700/40"
              }`}
            >
              {/* Product Info */}
              <div className="space-y-1.5 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-white tracking-wide">
                    {item.name}
                  </h4>
                  {item.dosageForm && (
                    <Badge variant="outline" className="text-xs border-teal-800/40 text-teal-300">
                      {item.dosageForm} {item.strength ? `• ${item.strength}` : ""}
                    </Badge>
                  )}
                  {item.batchNumber && (
                    <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                      {item.batchNumber}
                    </span>
                  )}
                </div>

                {item.genericName && (
                  <p className="text-xs text-teal-400/90 font-medium">
                    Generic: {item.genericName}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span>Category: {item.category}</span>
                  {item.expiryDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {new Date(item.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Expiry Badge */}
                {item.evaluatedExpiryStatus === "CRITICAL_EXPIRY" && (
                  <Badge className="bg-red-900/40 border border-red-700/50 text-red-300 gap-1 animate-pulse">
                    <AlertTriangle className="h-3 w-3" />
                    Critical: {item.expiryDaysRemaining}d left
                  </Badge>
                )}
                {item.evaluatedExpiryStatus === "APPROACHING_EXPIRY" && (
                  <Badge className="bg-amber-900/30 border border-amber-700/40 text-amber-300 gap-1">
                    <Calendar className="h-3 w-3" />
                    Expiry: {item.expiryDaysRemaining}d
                  </Badge>
                )}
                {item.evaluatedExpiryStatus === "SAFE" && (
                  <Badge variant="outline" className="border-emerald-800/40 text-emerald-400">
                    Safe ({item.expiryDaysRemaining}d)
                  </Badge>
                )}
                {item.evaluatedExpiryStatus === "EXPIRED" && (
                  <Badge className="bg-red-950 border border-red-800 text-red-400">
                    <XCircle className="h-3 w-3 mr-1" /> Expired
                  </Badge>
                )}

                {/* Low Stock Badge */}
                {item.isLowStock && (
                  <Badge className="bg-amber-900/30 border border-amber-800 text-amber-300">
                    Low Stock (&le; {item.safetyStock})
                  </Badge>
                )}

                {/* Flash Sale Active */}
                {item.isFlashSale && (
                  <Badge className="bg-amber-500/20 border border-amber-500/50 text-amber-300 gap-1 font-semibold">
                    <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                    50% Flash Clearance
                  </Badge>
                )}
              </div>

              {/* Pricing & Stock Controls */}
              <div className="flex items-center justify-between lg:justify-end gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-muted/20">
                {/* Price Display */}
                <div className="text-left lg:text-right">
                  {item.isFlashSale ? (
                    <div>
                      <span className="text-lg font-bold text-amber-400">
                        ₹{item.flashSalePrice}
                      </span>
                      <span className="text-xs text-muted-foreground line-through ml-1.5">
                        ₹{item.price}
                      </span>
                      <p className="text-[10px] text-amber-300 font-medium">Liquidation Price</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-lg font-bold text-white">₹{item.price}</span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-xs text-muted-foreground line-through ml-1.5">
                          ₹{item.mrp}
                        </span>
                      )}
                      <p className="text-[10px] text-teal-400">Unit Retail Price</p>
                    </div>
                  )}
                </div>

                {/* Stock Controls */}
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-teal-900/30">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-white"
                    disabled={updatingId === item.id || item.stockQuantity <= 0}
                    onClick={() => handleStockAdjust(item.id, item.stockQuantity, -1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-9 text-center font-bold text-sm text-white">
                    {updatingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-teal-400" />
                    ) : (
                      item.stockQuantity
                    )}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-white"
                    disabled={updatingId === item.id}
                    onClick={() => handleStockAdjust(item.id, item.stockQuantity, +1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Suggestion 2: Flash Clearance Action */}
                {item.isEligibleForFlashSale && (
                  <Button
                    size="sm"
                    variant={item.isFlashSale ? "outline" : "default"}
                    onClick={() => handleToggleFlashSale(item.id, item.isFlashSale)}
                    disabled={updatingId === item.id}
                    className={
                      item.isFlashSale
                        ? "border-amber-700/50 text-amber-300 hover:bg-amber-950/40 text-xs"
                        : "bg-amber-600 hover:bg-amber-700 text-black font-semibold text-xs gap-1"
                    }
                  >
                    <Zap className="h-3 w-3" />
                    {item.isFlashSale ? "Cancel Flash Sale" : "Flash Sale @ 50%"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
