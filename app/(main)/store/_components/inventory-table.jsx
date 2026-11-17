"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Edit2,
  Trash2,
  Pill,
  Download,
  Copy,
  ArrowUpDown,
  Boxes,
  IndianRupee,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateProductStockAction,
  updateProductDetailsAction,
  deleteProductAction,
  toggleFlashSaleAction,
} from "@/actions/store";
import useFetch from "@/hooks/use-fetch";
import AddProductModal from "./add-product-modal";
import { getMedicineImageUrl } from "@/lib/medicine-images";

const CATEGORIES = [
  "ALL",
  "General Healthcare",
  "Antibiotics",
  "Pain Relief",
  "Diabetes Care",
  "Cardiovascular",
  "Vitamins & Supplements",
  "Respiratory & Cough",
  "Gastrointestinal",
  "First Aid & Devices",
];

export default function InventoryTable({ products = [], storeId }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, CRITICAL, APPROACHING, LOW_STOCK, FLASH, SAFE
  const [sortBy, setSortBy] = useState("expiry_asc"); // expiry_asc, stock_asc, stock_desc, price_asc, price_desc, name_asc
  const [updatingId, setUpdatingId] = useState(null);

  // Edit Modal State
  const [editProduct, setEditProduct] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Clone / New Batch Modal State
  const [cloneData, setCloneData] = useState(null);
  const [isCloneOpen, setIsCloneOpen] = useState(false);

  const { fn: updateStock } = useFetch(updateProductStockAction);
  const { fn: updateDetails, loading: editLoading } = useFetch(updateProductDetailsAction);
  const { fn: deleteProduct, loading: deleteLoading } = useFetch(deleteProductAction);
  const { fn: toggleFlashSale } = useFetch(toggleFlashSaleAction);

  // Filter products
  const filteredProducts = products
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.genericName && item.genericName.toLowerCase().includes(search.toLowerCase())) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === "CRITICAL") {
        matchesStatus = item.evaluatedExpiryStatus === "CRITICAL_EXPIRY";
      } else if (statusFilter === "APPROACHING") {
        matchesStatus = item.evaluatedExpiryStatus === "APPROACHING_EXPIRY";
      } else if (statusFilter === "LOW_STOCK") {
        matchesStatus = item.isLowStock;
      } else if (statusFilter === "FLASH") {
        matchesStatus = item.isFlashSale;
      } else if (statusFilter === "SAFE") {
        matchesStatus = item.evaluatedExpiryStatus === "SAFE";
      }

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "expiry_asc") {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === "stock_asc") return a.stockQuantity - b.stockQuantity;
      if (sortBy === "stock_desc") return b.stockQuantity - a.stockQuantity;
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      return 0;
    });

  // Inventory KPI calculations
  const totalUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
  const totalValuation = products.reduce((sum, p) => sum + (p.price || 0) * (p.stockQuantity || 0), 0);
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const criticalExpiryCount = products.filter((p) => p.evaluatedExpiryStatus === "CRITICAL_EXPIRY").length;

  const handleStockAdjust = async (productId, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    setUpdatingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("stockQuantity", newStock.toString());

    const res = await updateStock(formData);
    setUpdatingId(null);
    if (res?.success) {
      toast.success("Stock adjusted successfully");
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

  const openEditModal = (product) => {
    setEditProduct({
      productId: product.id,
      name: product.name,
      genericName: product.genericName || "",
      category: product.category || "General Healthcare",
      dosageForm: product.dosageForm || "Tablet",
      strength: product.strength || "",
      batchNumber: product.batchNumber || "",
      price: product.price.toString(),
      mrp: (product.mrp || product.price).toString(),
      stockQuantity: product.stockQuantity.toString(),
      safetyStock: (product.safetyStock || 15).toString(),
      maxStockCap: (product.maxStockCap || 120).toString(),
      expiryDate: product.expiryDate
        ? new Date(product.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditOpen(true);
  };

  const openCloneModal = (product) => {
    setCloneData({
      name: product.name,
      genericName: product.genericName || "",
      category: product.category || "General Healthcare",
      dosageForm: product.dosageForm || "Tablet",
      strength: product.strength || "",
      price: product.price,
      mrp: product.mrp || product.price,
      stockQuantity: 30,
      safetyStock: product.safetyStock || 15,
      maxStockCap: product.maxStockCap || 120,
      imageUrl: product.imageUrl || "",
      description: product.description || "",
    });
    setIsCloneOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    const formData = new FormData();
    Object.entries(editProduct).forEach(([key, val]) => {
      formData.append(key, val);
    });

    const res = await updateDetails(formData);
    if (res?.success) {
      toast.success("Medicine details updated successfully!");
      setIsEditOpen(false);
      setEditProduct(null);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${productName}" from your inventory catalog?`
      )
    ) {
      return;
    }

    setUpdatingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);

    const res = await deleteProduct(formData);
    setUpdatingId(null);
    if (res?.success) {
      toast.success("Medicine removed successfully");
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.info("No products to export");
      return;
    }

    const headers = [
      "Name",
      "Generic Formula",
      "Category",
      "Dosage Form",
      "Strength",
      "Batch Number",
      "Price",
      "MRP",
      "Stock Units",
      "Safety Stock",
      "Expiry Date",
      "Expiry Status",
      "Flash Sale",
    ];

    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.genericName || "").replace(/"/g, '""')}"`,
      `"${p.category || ""}"`,
      `"${p.dosageForm || ""}"`,
      `"${p.strength || ""}"`,
      `"${p.batchNumber || ""}"`,
      p.price,
      p.mrp || p.price,
      p.stockQuantity,
      p.safetyStock,
      p.expiryDate ? new Date(p.expiryDate).toISOString().split("T")[0] : "",
      p.evaluatedExpiryStatus || "SAFE",
      p.isFlashSale ? "YES" : "NO",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `MedStore_Inventory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory exported to CSV successfully!");
  };

  return (
    <div className="w-full space-y-5">
      {/* 4 Inventory Health Ribbon Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-teal-900/30 shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground block font-medium">Active Listed SKUs</span>
          <span className="text-2xl font-bold text-white">{products.length}</span>
          <span className="text-[10px] text-teal-400 block">Listed in catalog</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-teal-900/30 shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground block font-medium">Physical Units in Stock</span>
          <span className="text-2xl font-bold text-teal-300">{totalUnits}</span>
          <span className="text-[10px] text-muted-foreground block">Across all batches</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-teal-900/30 shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground block font-medium">Inventory Valuation</span>
          <span className="text-2xl font-bold text-white">₹{Math.round(totalValuation).toLocaleString()}</span>
          <span className="text-[10px] text-emerald-400 block">At current retail pricing</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-teal-900/30 shadow-sm space-y-1">
          <span className="text-[11px] text-muted-foreground block font-medium">Stockout / Expiry Risk</span>
          <span className="text-2xl font-bold text-amber-400">
            {lowStockCount + criticalExpiryCount}{" "}
            <span className="text-xs font-normal text-muted-foreground">alerts</span>
          </span>
          <span className="text-[10px] text-amber-300 block">
            {lowStockCount} low stock • {criticalExpiryCount} critical expiry
          </span>
        </div>
      </div>

      {/* Controls Bar: Search, Category Chips, Sort & Export */}
      <div className="w-full p-4 rounded-2xl bg-card border border-teal-900/30 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by brand name, active molecule salt, or batch #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/20 border-teal-900/30 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 bg-muted/20 border-teal-900/30 text-xs h-9">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-card border-teal-900/40 text-xs">
                <SelectItem value="expiry_asc">Expiry: Soonest First</SelectItem>
                <SelectItem value="stock_asc">Stock: Lowest First</SelectItem>
                <SelectItem value="stock_desc">Stock: Highest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="name_asc">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Export to CSV Action */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="border-teal-800/40 text-teal-300 hover:bg-teal-950 text-xs gap-1.5 h-9 shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className={`h-7 px-3 text-xs shrink-0 rounded-lg transition-all ${
                selectedCategory === cat
                  ? "bg-teal-600 text-white font-medium"
                  : "border-teal-900/30 text-muted-foreground hover:text-white hover:bg-muted/30"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Filter by Status Chips */}
        <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-teal-900/20 text-xs">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">Status:</span>
          <Button
            size="sm"
            variant={statusFilter === "ALL" ? "default" : "outline"}
            onClick={() => setStatusFilter("ALL")}
            className={statusFilter === "ALL" ? "bg-teal-700 text-white h-6 text-[11px] px-2.5" : "h-6 text-[11px] px-2.5 border-teal-900/30"}
          >
            All Items ({products.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "CRITICAL" ? "default" : "outline"}
            onClick={() => setStatusFilter("CRITICAL")}
            className={
              statusFilter === "CRITICAL"
                ? "bg-red-700 text-white h-6 text-[11px] px-2.5"
                : "h-6 text-[11px] px-2.5 border-red-900/40 text-red-300 hover:bg-red-950/20"
            }
          >
            Critical Expiry ({products.filter((p) => p.evaluatedExpiryStatus === "CRITICAL_EXPIRY").length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "APPROACHING" ? "default" : "outline"}
            onClick={() => setStatusFilter("APPROACHING")}
            className={
              statusFilter === "APPROACHING"
                ? "bg-amber-700 text-white h-6 text-[11px] px-2.5"
                : "h-6 text-[11px] px-2.5 border-amber-900/40 text-amber-300 hover:bg-amber-950/20"
            }
          >
            Approaching Expiry ({products.filter((p) => p.evaluatedExpiryStatus === "APPROACHING_EXPIRY").length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "LOW_STOCK" ? "default" : "outline"}
            onClick={() => setStatusFilter("LOW_STOCK")}
            className={
              statusFilter === "LOW_STOCK"
                ? "bg-amber-600 text-black h-6 text-[11px] px-2.5 font-bold"
                : "h-6 text-[11px] px-2.5 border-amber-800 text-amber-400 hover:bg-amber-950/20"
            }
          >
            Low Stock ({products.filter((p) => p.isLowStock).length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "FLASH" ? "default" : "outline"}
            onClick={() => setStatusFilter("FLASH")}
            className={
              statusFilter === "FLASH"
                ? "bg-amber-500 text-black h-6 text-[11px] px-2.5 font-bold"
                : "h-6 text-[11px] px-2.5 border-amber-600 text-amber-300 hover:bg-amber-950/20"
            }
          >
            Flash Clearance ({products.filter((p) => p.isFlashSale).length})
          </Button>
        </div>
      </div>

      {/* Professional Medicine Cards List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-card border border-teal-900/20 shadow-sm space-y-3">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-white font-semibold">No medicines match your search criteria</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search terms or resetting the category and status filters.
          </p>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {filteredProducts.map((item) => {
            const imageUrl = getMedicineImageUrl(item);
            const discountPct =
              item.mrp && item.mrp > item.price
                ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                : 0;

            return (
              <div
                key={item.id}
                className={`w-full p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                  item.isFlashSale
                    ? "bg-amber-950/15 border-amber-800/40"
                    : item.evaluatedExpiryStatus === "CRITICAL_EXPIRY"
                    ? "bg-red-950/15 border-red-900/40"
                    : item.isLowStock
                    ? "bg-amber-950/10 border-amber-900/30"
                    : "bg-card border-teal-900/30 hover:border-teal-700/50"
                }`}
              >
                {/* Left: Product Thumbnail & Specifications */}
                <div className="flex items-start gap-3.5">
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted/40 border border-teal-900/30 shrink-0">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {item.name}
                      </h4>
                      {item.dosageForm && (
                        <Badge variant="outline" className="text-[11px] border-teal-800/40 text-teal-300 py-0 px-2">
                          {item.dosageForm} {item.strength ? `• ${item.strength}` : ""}
                        </Badge>
                      )}
                      {item.batchNumber && (
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-muted/20">
                          {item.batchNumber}
                        </span>
                      )}
                    </div>

                    {item.genericName && (
                      <p className="text-xs text-teal-300 font-mono">
                        Generic Formulation: {item.genericName}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                      <span className="text-muted-foreground">Category: {item.category}</span>
                      {item.expiryDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-teal-400" />
                          Batch Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Expiry & Stock Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {item.evaluatedExpiryStatus === "CRITICAL_EXPIRY" && (
                    <Badge className="bg-red-900/40 border border-red-700/60 text-red-200 gap-1 animate-pulse text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Critical: {item.expiryDaysRemaining}d left
                    </Badge>
                  )}
                  {item.evaluatedExpiryStatus === "APPROACHING_EXPIRY" && (
                    <Badge className="bg-amber-900/30 border border-amber-700/40 text-amber-300 gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      Expires in {item.expiryDaysRemaining}d
                    </Badge>
                  )}
                  {item.evaluatedExpiryStatus === "SAFE" && (
                    <Badge variant="outline" className="border-emerald-800/40 text-emerald-300 text-xs">
                      Safe ({item.expiryDaysRemaining}d)
                    </Badge>
                  )}
                  {item.evaluatedExpiryStatus === "EXPIRED" && (
                    <Badge className="bg-red-950 border border-red-800 text-red-400 text-xs">
                      <XCircle className="h-3 w-3 mr-1" /> Expired
                    </Badge>
                  )}

                  {item.isLowStock && (
                    <Badge className="bg-amber-900/30 border border-amber-800 text-amber-300 text-xs">
                      Low Stock (&le; {item.safetyStock})
                    </Badge>
                  )}

                  {item.isFlashSale && (
                    <Badge className="bg-amber-500/20 border border-amber-500/50 text-amber-300 gap-1 font-semibold text-xs">
                      <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                      50% Flash Clearance
                    </Badge>
                  )}
                </div>

                {/* Right: Price, Stock Stepper & Quick Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-muted/20 shrink-0">
                  {/* Price */}
                  <div className="text-left md:text-right">
                    {item.isFlashSale ? (
                      <div>
                        <span className="text-lg font-bold text-amber-400">
                          ₹{item.flashSalePrice}
                        </span>
                        <span className="text-xs text-muted-foreground line-through ml-1.5">
                          ₹{item.price}
                        </span>
                        <p className="text-[10px] text-amber-300 font-medium">Liquidation Deal</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-white">₹{item.price}</span>
                          {item.mrp && item.mrp > item.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₹{item.mrp}
                            </span>
                          )}
                          {discountPct > 0 && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded border border-emerald-800/40">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-teal-400">Unit Retail Price</p>
                      </div>
                    )}
                  </div>

                  {/* Stock Stepper */}
                  <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-teal-900/30">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-white"
                      disabled={updatingId === item.id || item.stockQuantity <= 0}
                      onClick={() => handleStockAdjust(item.id, item.stockQuantity, -1)}
                      title="Decrease 1 unit"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center font-bold text-sm text-white">
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
                      title="Increase 1 unit"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleStockAdjust(item.id, item.stockQuantity, +10)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground hover:text-white border border-teal-900/30 font-mono"
                      title="Quick add 10 units"
                    >
                      +10
                    </button>
                  </div>

                  {/* Flash Clearance Toggle */}
                  {item.isEligibleForFlashSale && (
                    <Button
                      size="sm"
                      variant={item.isFlashSale ? "outline" : "default"}
                      onClick={() => handleToggleFlashSale(item.id, item.isFlashSale)}
                      disabled={updatingId === item.id}
                      className={
                        item.isFlashSale
                          ? "border-amber-700/50 text-amber-300 hover:bg-amber-950/40 text-xs h-8"
                          : "bg-amber-600 hover:bg-amber-700 text-black font-semibold text-xs gap-1 h-8"
                      }
                    >
                      <Zap className="h-3 w-3" />
                      {item.isFlashSale ? "Exit Flash" : "Flash @ 50%"}
                    </Button>
                  )}

                  {/* Clone Batch Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-teal-300 hover:bg-teal-950/30"
                    onClick={() => openCloneModal(item)}
                    title="Clone details into a new batch"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  {/* Edit Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-white"
                    onClick={() => openEditModal(item)}
                    title="Edit medicine details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
                    onClick={() => handleDeleteProduct(item.id, item.name)}
                    title="Remove from inventory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Medicine Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-teal-900/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-teal-400" />
              Edit Medicine Details
            </DialogTitle>
            <DialogDescription>
              Update pharmaceutical specifications, batch number, pricing, or expiry date.
            </DialogDescription>
          </DialogHeader>

          {editProduct && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Medicine Brand Name *</Label>
                  <Input
                    id="edit-name"
                    value={editProduct.name}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-genericName">Generic Salt / Molecule</Label>
                  <Input
                    id="edit-genericName"
                    value={editProduct.genericName}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, genericName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editProduct.category}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, category: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dosageForm">Dosage Form</Label>
                  <Input
                    id="edit-dosageForm"
                    value={editProduct.dosageForm}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, dosageForm: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-strength">Strength / Pack Size</Label>
                  <Input
                    id="edit-strength"
                    value={editProduct.strength}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, strength: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-batch">Batch Number</Label>
                  <Input
                    id="edit-batch"
                    value={editProduct.batchNumber}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, batchNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-price">Selling Price (₹) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="any"
                    value={editProduct.price}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-mrp">MRP (₹)</Label>
                  <Input
                    id="edit-mrp"
                    type="number"
                    step="any"
                    value={editProduct.mrp}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, mrp: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-stock">Stock Units</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editProduct.stockQuantity}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, stockQuantity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-safety">Safety Stock</Label>
                  <Input
                    id="edit-safety"
                    type="number"
                    value={editProduct.safetyStock}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, safetyStock: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-expiry">Expiry Date</Label>
                  <Input
                    id="edit-expiry"
                    type="date"
                    value={editProduct.expiryDate}
                    onChange={(e) =>
                      setEditProduct({ ...editProduct, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Clone / New Batch Modal */}
      {cloneData && (
        <AddProductModal
          storeId={storeId}
          initialData={cloneData}
          isOpen={isCloneOpen}
          onOpenChange={setIsCloneOpen}
        />
      )}
    </div>
  );
}
