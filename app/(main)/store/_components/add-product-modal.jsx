"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Loader2,
  Pill,
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  Tag,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { addProductAction } from "@/actions/store";
import useFetch from "@/hooks/use-fetch";
import {
  searchPharmacopeia,
  getPopularMedicinePresets,
  generateBatchNumber,
  getDefaultExpiryDate,
} from "@/lib/pharmacopeia";

const CATEGORIES = [
  "General Healthcare",
  "Antibiotics",
  "Pain Relief",
  "Diabetes Care",
  "Cardiovascular",
  "Vitamins & Supplements",
  "Respiratory & Cough",
  "Gastrointestinal",
  "Dermatology & Skin",
  "First Aid & Devices",
];

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Ointment",
  "Drops",
  "Inhaler",
  "Suspension",
];

export default function AddProductModal({
  storeId,
  initialData = null,
  isOpen = false,
  onOpenChange = null,
  trigger = null,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = onOpenChange ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const { fn: addProduct, loading } = useFetch(addProductAction);

  // Pharmacopeia Autocomplete State
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const popularPresets = getPopularMedicinePresets();

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    category: "General Healthcare",
    dosageForm: "Tablet",
    strength: "",
    batchNumber: "",
    price: "",
    mrp: "",
    stockQuantity: "30",
    safetyStock: "15",
    maxStockCap: "120",
    expiryDate: getDefaultExpiryDate(18),
    imageUrl: "",
    productDetails: "",
    description: "",
  });

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: initialData.name || "",
        genericName: initialData.genericName || "",
        category: initialData.category || "General Healthcare",
        dosageForm: initialData.dosageForm || "Tablet",
        strength: initialData.strength || "",
        batchNumber: generateBatchNumber(initialData.name || "BATCH"),
        price: initialData.price ? initialData.price.toString() : "",
        mrp: initialData.mrp ? initialData.mrp.toString() : "",
        stockQuantity: initialData.stockQuantity ? initialData.stockQuantity.toString() : "30",
        safetyStock: initialData.safetyStock ? initialData.safetyStock.toString() : "15",
        maxStockCap: initialData.maxStockCap ? initialData.maxStockCap.toString() : "120",
        expiryDate: getDefaultExpiryDate(18),
        imageUrl: initialData.imageUrl || "",
        productDetails: initialData.productDetails || "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Trigger autocomplete on medicine name input
    if (field === "name") {
      if (value.trim().length >= 2) {
        const matches = searchPharmacopeia(value, "ALL", 5);
        setSearchSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      genericName: preset.genericName,
      category: preset.category,
      dosageForm: preset.dosageForm,
      strength: preset.strength,
      batchNumber: generateBatchNumber(preset.name),
      price: preset.suggestedPrice.toString(),
      mrp: preset.mrp.toString(),
      safetyStock: preset.safetyStock.toString(),
      maxStockCap: preset.maxStockCap.toString(),
      imageUrl: preset.imageUrl || prev.imageUrl,
      description: preset.description || prev.description,
    }));
    setShowSuggestions(false);
    toast.success(`Autofilled standard specifications for ${preset.name}!`);
  };

  const handleSetExpiryMonths = (months) => {
    setFormData((prev) => ({
      ...prev,
      expiryDate: getDefaultExpiryDate(months),
    }));
  };

  const handleGenerateBatch = () => {
    setFormData((prev) => ({
      ...prev,
      batchNumber: generateBatchNumber(formData.name || "MED"),
    }));
  };

  const handleSubmit = async (e, addAnother = false) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error("Medicine name and selling price are required");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      payload.append(key, val);
    });

    const res = await addProduct(payload);
    if (res?.success) {
      toast.success(`"${formData.name}" added to inventory successfully!`);
      if (addAnother) {
        // Reset form for next item
        setFormData({
          name: "",
          genericName: "",
          category: formData.category,
          dosageForm: "Tablet",
          strength: "",
          batchNumber: "",
          price: "",
          mrp: "",
          stockQuantity: "30",
          safetyStock: "15",
          maxStockCap: "120",
          expiryDate: getDefaultExpiryDate(18),
          imageUrl: "",
          productDetails: "",
          description: "",
        });
      } else {
        setOpen(false);
      }
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  // Live discount calculation
  const numPrice = parseFloat(formData.price) || 0;
  const numMrp = parseFloat(formData.mrp) || 0;
  const discountPct =
    numMrp > numPrice && numMrp > 0
      ? Math.round(((numMrp - numPrice) / numMrp) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-medium shadow-md">
            <PlusCircle className="h-4 w-4" /> Add Medicine
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-card border-teal-900/40">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Pill className="h-5 w-5 text-teal-400" />
              Add Medicine to Dukaan Inventory
            </DialogTitle>
          </div>
          <DialogDescription>
            Quickly list a medicine using Indian Pharmacopeia autofill or enter custom batch details.
          </DialogDescription>
        </DialogHeader>

        {/* 1-Click Quick-Pick Essentials Pills */}
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            1-Click Popular Pharmacy Essentials:
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {popularPresets.slice(0, 8).map((preset) => (
              <Badge
                key={preset.name}
                variant="outline"
                onClick={() => handleSelectPreset(preset)}
                className="cursor-pointer hover:bg-teal-900/40 hover:border-teal-500 border-teal-900/40 text-teal-300 text-[11px] py-1 px-2.5 transition-all"
              >
                + {preset.name}
              </Badge>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 pt-2">
          {/* Brand Name & Generic Formulation with Live Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <Label htmlFor="name" className="text-xs font-semibold">
                Medicine Brand Name *
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="e.g. Augmentin 625 Duo, Dolo 650"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onFocus={() => {
                    if (formData.name.length >= 2) {
                      const matches = searchPharmacopeia(formData.name, "ALL", 5);
                      setSearchSuggestions(matches);
                      setShowSuggestions(matches.length > 0);
                    }
                  }}
                  required
                  autoComplete="off"
                  className="bg-muted/20 border-teal-900/40 pr-8"
                />
                <Search className="h-4 w-4 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-teal-800 rounded-lg shadow-2xl overflow-hidden divide-y divide-teal-900/30">
                  {searchSuggestions.map((sug) => (
                    <div
                      key={sug.name}
                      onClick={() => handleSelectPreset(sug)}
                      className="p-2.5 hover:bg-teal-950/50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{sug.name}</p>
                        <p className="text-[11px] text-teal-400 font-mono">
                          {sug.genericName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">₹{sug.suggestedPrice}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          MRP ₹{sug.mrp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="genericName" className="text-xs font-semibold">
                Generic Salt / Molecule
              </Label>
              <Input
                id="genericName"
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
                value={formData.genericName}
                onChange={(e) => handleChange("genericName", e.target.value)}
                className="bg-muted/20 border-teal-900/40 font-mono text-xs"
              />
              <p className="text-[10px] text-teal-400 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Enables Patient Generic Alternative Savings Engine
              </p>
            </div>
          </div>

          {/* Category & Dosage Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Therapeutic Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => handleChange("category", val)}
              >
                <SelectTrigger className="bg-muted/20 border-teal-900/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-teal-900/40 max-h-56">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Dosage Form</Label>
              <Select
                value={formData.dosageForm}
                onValueChange={(val) => handleChange("dosageForm", val)}
              >
                <SelectTrigger className="bg-muted/20 border-teal-900/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-teal-900/40">
                  {DOSAGE_FORMS.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Strength & Batch Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="strength" className="text-xs font-semibold">
                Strength / Packaging Size
              </Label>
              <Input
                id="strength"
                placeholder="e.g. 625mg (Strip of 10 Tablets)"
                value={formData.strength}
                onChange={(e) => handleChange("strength", e.target.value)}
                className="bg-muted/20 border-teal-900/40"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="batchNumber" className="text-xs font-semibold">
                  Batch Number
                </Label>
                <button
                  type="button"
                  onClick={handleGenerateBatch}
                  className="text-[10px] text-teal-400 hover:text-teal-300 underline"
                >
                  Generate Batch #
                </button>
              </div>
              <Input
                id="batchNumber"
                placeholder="e.g. BATCH-2026-AUG-489"
                value={formData.batchNumber}
                onChange={(e) => handleChange("batchNumber", e.target.value)}
                className="bg-muted/20 border-teal-900/40 font-mono text-xs"
              />
            </div>
          </div>

          {/* Pricing: Selling Price & MRP with Live Savings Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-xs font-semibold">
                Selling Price (₹) *
              </Label>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="e.g. 195"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
                className="bg-muted/20 border-teal-900/40 font-bold text-teal-300"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mrp" className="text-xs font-semibold">
                  Maximum Retail Price (MRP in ₹)
                </Label>
                {discountPct > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    {discountPct}% Patient Discount
                  </span>
                )}
              </div>
              <Input
                id="mrp"
                type="number"
                step="any"
                placeholder="e.g. 228"
                value={formData.mrp}
                onChange={(e) => handleChange("mrp", e.target.value)}
                className="bg-muted/20 border-teal-900/40"
              />
            </div>
          </div>

          {/* Stock, Safety Stock, Expiry Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stockQuantity" className="text-xs font-semibold">
                Initial Stock Units
              </Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleChange("stockQuantity", e.target.value)}
                className="bg-muted/20 border-teal-900/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="safetyStock" className="text-xs font-semibold">
                Safety Stock Threshold
              </Label>
              <Input
                id="safetyStock"
                type="number"
                value={formData.safetyStock}
                onChange={(e) => handleChange("safetyStock", e.target.value)}
                className="bg-muted/20 border-teal-900/40"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="expiryDate" className="text-xs font-semibold">
                  Batch Expiry Date
                </Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetExpiryMonths(6)}
                    className="text-[9px] px-1 py-0.5 rounded bg-muted/40 text-muted-foreground hover:text-white"
                  >
                    +6M
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExpiryMonths(12)}
                    className="text-[9px] px-1 py-0.5 rounded bg-muted/40 text-muted-foreground hover:text-white"
                  >
                    +1Y
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExpiryMonths(24)}
                    className="text-[9px] px-1 py-0.5 rounded bg-muted/40 text-muted-foreground hover:text-white"
                  >
                    +2Y
                  </button>
                </div>
              </div>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
                className="bg-muted/20 border-teal-900/40"
              />
            </div>
          </div>

          {/* Product Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl" className="text-xs font-semibold">
              Product Image URL (Optional)
            </Label>
            <Input
              id="imageUrl"
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.imageUrl}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
              className="bg-muted/20 border-teal-900/40 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Clinical Usage & Indications
            </Label>
            <Textarea
              id="description"
              placeholder="Dosage administration instructions, indications, side-effect warnings..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
              className="bg-muted/20 border-teal-900/40 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-teal-900/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-xs border-teal-900/40"
            >
              Cancel
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={(e) => handleSubmit(e, true)}
                className="border-teal-700 text-teal-300 hover:bg-teal-950/40 text-xs"
              >
                Save & Add Another
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Save Medicine
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
