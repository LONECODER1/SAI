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
} from "lucide-react";
import { toast } from "sonner";
import {
  updateProductStockAction,
  updateProductDetailsAction,
  deleteProductAction,
  toggleFlashSaleAction,
} from "@/actions/store";
import useFetch from "@/hooks/use-fetch";

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
  const [updatingId, setUpdatingId] = useState(null);

  // Edit Modal State
  const [editProduct, setEditProduct] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { fn: updateStock } = useFetch(updateProductStockAction);
  const { fn: updateDetails, loading: editLoading } = useFetch(updateProductDetailsAction);
  const { fn: deleteProduct, loading: deleteLoading } = useFetch(deleteProductAction);
  const { fn: toggleFlashSale } = useFetch(toggleFlashSaleAction);

  // Filtered products
  const filteredProducts = products.filter((item) => {
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
          {CATEGORIES.slice(0, 6).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={
                selectedCategory === cat
                  ? "bg-teal-600 hover:bg-teal-700 text-white text-xs"
                  : "border-teal-900/30 text-muted-foreground hover:text-white text-xs"
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Filter by Status Chips */}
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className="text-muted-foreground font-medium mr-1">Status Filter:</span>
        <Button
          size="sm"
          variant={statusFilter === "ALL" ? "default" : "outline"}
          onClick={() => setStatusFilter("ALL")}
          className={statusFilter === "ALL" ? "bg-teal-700 text-white h-7 text-xs" : "h-7 text-xs border-teal-900/30"}
        >
          All Items ({products.length})
        </Button>
        <Button
          size="sm"
          variant={statusFilter === "CRITICAL" ? "default" : "outline"}
          onClick={() => setStatusFilter("CRITICAL")}
          className={
            statusFilter === "CRITICAL"
              ? "bg-red-700 text-white h-7 text-xs"
              : "h-7 text-xs border-red-900/40 text-red-300 hover:bg-red-950/20"
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
              ? "bg-amber-700 text-white h-7 text-xs"
              : "h-7 text-xs border-amber-900/40 text-amber-300 hover:bg-amber-950/20"
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
              ? "bg-amber-600 text-black h-7 text-xs"
              : "h-7 text-xs border-amber-800 text-amber-400 hover:bg-amber-950/20"
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
              ? "bg-amber-500 text-black h-7 text-xs"
              : "h-7 text-xs border-amber-600 text-amber-300 hover:bg-amber-950/20"
          }
        >
          Flash Clearance ({products.filter((p) => p.isFlashSale).length})
        </Button>
      </div>

      {/* Inventory Cards / Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-muted/10 border border-teal-900/20">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-white font-medium">No medicines match your filter</p>
          <p className="text-xs text-muted-foreground mt-1">Try searching a different keyword or reset filters.</p>
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
                    Generic Formula: {item.genericName}
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

              {/* Pricing, Stock & Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-5 pt-2 lg:pt-0 border-t lg:border-t-0 border-muted/20">
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

                {/* Stock Incrementor */}
                <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-lg border border-teal-900/30">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-white"
                    disabled={updatingId === item.id || item.stockQuantity <= 0}
                    onClick={() => handleStockAdjust(item.id, item.stockQuantity, -1)}
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
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
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
                        ? "border-amber-700/50 text-amber-300 hover:bg-amber-950/40 text-xs"
                        : "bg-amber-600 hover:bg-amber-700 text-black font-semibold text-xs gap-1"
                    }
                  >
                    <Zap className="h-3 w-3" />
                    {item.isFlashSale ? "Cancel Flash" : "Flash @ 50%"}
                  </Button>
                )}

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditModal(item)}
                    className="h-8 w-8 text-muted-foreground hover:text-teal-300"
                    title="Edit Medicine Details"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteProduct(item.id, item.name)}
                    disabled={updatingId === item.id}
                    className="h-8 w-8 text-muted-foreground hover:text-red-400"
                    title="Delete Medicine"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-teal-900/40">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Pill className="h-5 w-5 text-teal-400" />
              Edit Medicine Details
            </DialogTitle>
            <DialogDescription>
              Update formulation, retail pricing, stock quantity, and batch expiration.
            </DialogDescription>
          </DialogHeader>

          {editProduct && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Brand Name *</Label>
                  <Input
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Generic Formula</Label>
                  <Input
                    value={editProduct.genericName}
                    onChange={(e) => setEditProduct({ ...editProduct, genericName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Input
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dosage Form</Label>
                  <Input
                    value={editProduct.dosageForm}
                    onChange={(e) => setEditProduct({ ...editProduct, dosageForm: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Strength</Label>
                  <Input
                    value={editProduct.strength}
                    onChange={(e) => setEditProduct({ ...editProduct, strength: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Selling Price (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">MRP (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editProduct.mrp}
                    onChange={(e) => setEditProduct({ ...editProduct, mrp: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Current Stock</Label>
                  <Input
                    type="number"
                    value={editProduct.stockQuantity}
                    onChange={(e) => setEditProduct({ ...editProduct, stockQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Batch Number</Label>
                  <Input
                    value={editProduct.batchNumber}
                    onChange={(e) => setEditProduct({ ...editProduct, batchNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expiry Date</Label>
                  <Input
                    type="date"
                    value={editProduct.expiryDate}
                    onChange={(e) => setEditProduct({ ...editProduct, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-muted/20">
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
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
