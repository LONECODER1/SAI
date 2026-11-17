"use client";

import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2, Pill } from "lucide-react";
import { toast } from "sonner";
import { addProductAction } from "@/actions/store";
import useFetch from "@/hooks/use-fetch";

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

export default function AddProductModal({ storeId }) {
  const [open, setOpen] = useState(false);
  const { fn: addProduct, loading } = useFetch(addProductAction);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    category: "General Healthcare",
    dosageForm: "Tablet",
    strength: "",
    batchNumber: "",
    price: "",
    mrp: "",
    stockQuantity: "25",
    safetyStock: "15",
    maxStockCap: "120",
    expiryDate: "",
    imageUrl: "",
    productDetails: "",
    description: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error("Medicine name and price are required");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      payload.append(key, val);
    });

    const res = await addProduct(payload);
    if (res?.success) {
      toast.success("Medicine added to inventory successfully!");
      setOpen(false);
      setFormData({
        name: "",
        genericName: "",
        category: "General Healthcare",
        dosageForm: "Tablet",
        strength: "",
        batchNumber: "",
        price: "",
        mrp: "",
        stockQuantity: "25",
        safetyStock: "15",
        maxStockCap: "120",
        expiryDate: "",
        imageUrl: "",
        productDetails: "",
        description: "",
      });
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-medium">
          <PlusCircle className="h-4 w-4" /> Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-teal-900/40">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Pill className="h-5 w-5 text-teal-400" />
            Add Medicine to Dukaan Inventory
          </DialogTitle>
          <DialogDescription>
            Enter the pharmaceutical details, pricing, batch number, and expiry date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Brand Name & Generic Formulation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Medicine Brand Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Augmentin 625 Duo"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="genericName">Generic Salt / Formulation</Label>
              <Input
                id="genericName"
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
                value={formData.genericName}
                onChange={(e) => handleChange("genericName", e.target.value)}
              />
              <p className="text-[11px] text-teal-400">Enables patient generic substitute savings</p>
            </div>
          </div>

          {/* Category & Dosage Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => handleChange("category", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dosage Form</Label>
              <Select
                value={formData.dosageForm}
                onValueChange={(val) => handleChange("dosageForm", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="strength">Strength / Pack Size</Label>
              <Input
                id="strength"
                placeholder="e.g. 625mg / 10 Tablets per Strip"
                value={formData.strength}
                onChange={(e) => handleChange("strength", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                placeholder="e.g. BATCH-89410"
                value={formData.batchNumber}
                onChange={(e) => handleChange("batchNumber", e.target.value)}
              />
            </div>
          </div>

          {/* Pricing: Selling Price & MRP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Selling Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="any"
                placeholder="e.g. 180"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mrp">Maximum Retail Price (MRP in ₹)</Label>
              <Input
                id="mrp"
                type="number"
                step="any"
                placeholder="e.g. 210"
                value={formData.mrp}
                onChange={(e) => handleChange("mrp", e.target.value)}
              />
            </div>
          </div>

          {/* Stock, Safety Stock, Expiry Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stockQuantity">Initial Stock Units</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleChange("stockQuantity", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="safetyStock">Safety Stock Threshold</Label>
              <Input
                id="safetyStock"
                type="number"
                value={formData.safetyStock}
                onChange={(e) => handleChange("safetyStock", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiryDate">Batch Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
              />
            </div>
          </div>

          {/* Image & Product Details */}
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">Product Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              placeholder="https://example.com/medicine.jpg"
              value={formData.imageUrl}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Indications / Usage Description</Label>
            <Textarea
              id="description"
              placeholder="Short description of administration, side-effects, or precautions..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Medicine"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
