"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Table,
  Pill,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { bulkImportProductsAction } from "@/actions/store";
import useFetch from "@/hooks/use-fetch";
import {
  SAMPLE_CSV_TEMPLATE,
  parseMedicineCsv,
  PHARMACOPEIA_DATABASE,
} from "@/lib/pharmacopeia";

export default function BulkImportModal({ storeId }) {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [parsedItems, setParsedItems] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [activeMode, setActiveMode] = useState("file"); // "file" | "paste" | "starter"
  const fileInputRef = useRef(null);

  const { fn: bulkImport, loading } = useFetch(bulkImportProductsAction);

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "medstore_medicine_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample CSV template downloaded successfully");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Please select a valid .csv file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCsvText(content);
        const result = parseMedicineCsv(content);
        if (result.success) {
          setParsedItems(result.products);
          setParseErrors(result.errors || []);
          toast.success(`Parsed ${result.products.length} medicines from file`);
        } else {
          toast.error(result.error);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    if (!csvText.trim()) {
      toast.error("Please paste CSV text first");
      return;
    }

    const result = parseMedicineCsv(csvText);
    if (result.success) {
      setParsedItems(result.products);
      setParseErrors(result.errors || []);
      toast.success(`Parsed ${result.products.length} medicines from text`);
    } else {
      toast.error(result.error);
    }
  };

  const handleLoadStarterPack = () => {
    // Loads 15 essential Indian pharmacy medicines directly from Pharmacopeia
    const starterMedicines = PHARMACOPEIA_DATABASE.slice(0, 15).map((m) => ({
      name: m.name,
      genericName: m.genericName,
      category: m.category,
      dosageForm: m.dosageForm,
      strength: m.strength,
      batchNumber: `BATCH-2026-STARTER-${Math.floor(100 + Math.random() * 900)}`,
      price: m.suggestedPrice,
      mrp: m.mrp,
      stockQuantity: 40,
      safetyStock: m.safetyStock,
      maxStockCap: m.maxStockCap,
      expiryDate: new Date(Date.now() + 540 * 86400000).toISOString().split("T")[0],
      imageUrl: m.imageUrl,
      description: m.description,
    }));

    setParsedItems(starterMedicines);
    setParseErrors([]);
    toast.success("Loaded 15 Essential Pharmacy Starter Medicines!");
  };

  const handleExecuteImport = async () => {
    if (parsedItems.length === 0) {
      toast.error("No valid medicines to import");
      return;
    }

    const formData = new FormData();
    formData.append("productsJson", JSON.stringify(parsedItems));

    const res = await bulkImport(formData);
    if (res?.success) {
      toast.success(res.message);
      setOpen(false);
      setParsedItems([]);
      setCsvText("");
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleRemoveParsedRow = (idx) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-teal-800/40 text-teal-300 hover:bg-teal-900/30 gap-2 font-medium"
        >
          <FileSpreadsheet className="h-4 w-4 text-teal-400" />
          Bulk CSV Import
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-teal-900/40">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-teal-400" />
              Bulk Medicine Catalog Import
            </DialogTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadSample}
              className="border-teal-700/40 text-teal-300 hover:bg-teal-950 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV Template
            </Button>
          </div>
          <DialogDescription>
            Quickly onboard your full pharmacy inventory from an Excel / CSV sheet or auto-load our 15-Medicine Essential Starter Pack.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-teal-900/30 pb-3">
            <Button
              size="sm"
              variant={activeMode === "file" ? "default" : "outline"}
              onClick={() => setActiveMode("file")}
              className={activeMode === "file" ? "bg-teal-600 text-white text-xs" : "border-teal-900/40 text-xs"}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload File (.CSV)
            </Button>
            <Button
              size="sm"
              variant={activeMode === "paste" ? "default" : "outline"}
              onClick={() => setActiveMode("paste")}
              className={activeMode === "paste" ? "bg-teal-600 text-white text-xs" : "border-teal-900/40 text-xs"}
            >
              <Table className="h-3.5 w-3.5 mr-1.5" /> Paste Raw CSV Data
            </Button>
            <Button
              size="sm"
              variant={activeMode === "starter" ? "default" : "outline"}
              onClick={() => {
                setActiveMode("starter");
                handleLoadStarterPack();
              }}
              className={activeMode === "starter" ? "bg-teal-600 text-white text-xs" : "border-teal-900/40 text-xs"}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" /> 1-Click Essential Starter Pack
            </Button>
          </div>

          {/* Mode 1: File Upload */}
          {activeMode === "file" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-800/50 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-teal-950/10 hover:bg-teal-950/20 space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-10 w-10 text-teal-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Click to browse or drop your medicine inventory CSV file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columns supported: name, genericName, category, dosageForm, strength, price, mrp, stockQuantity, expiryDate
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: Paste Raw CSV */}
          {activeMode === "paste" && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">
                Paste your CSV content with headers below:
              </Label>
              <Textarea
                placeholder={SAMPLE_CSV_TEMPLATE}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={6}
                className="font-mono text-xs bg-muted/20 border-teal-900/40"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleParsePastedText}
                  className="bg-teal-700 hover:bg-teal-600 text-white text-xs"
                >
                  Parse & Verify CSV
                </Button>
              </div>
            </div>
          )}

          {/* Mode 3: Starter Pack Info */}
          {activeMode === "starter" && (
            <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-800/40 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-white">Pre-Loaded 15 Essential Pharmacy Medicines</p>
                <p>
                  Includes verified high-demand pain relievers (Dolo 650, Crocin), broad-spectrum antibiotics (Augmentin, Amoxyclav, Azithral), antacids (Pan-D, Pantocid), diabetes care (Metformin, Glycomet), and BP maintenance (Telma 40).
                </p>
              </div>
            </div>
          )}

          {/* Parse Errors Banner */}
          {parseErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> CSV Warnings ({parseErrors.length})
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-200/80">
                {parseErrors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {parseErrors.length > 3 && <li>...and {parseErrors.length - 3} more warnings</li>}
              </ul>
            </div>
          )}

          {/* Parsed Items Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  Ready to Import: {parsedItems.length} Medicines
                </span>
                <span className="text-xs text-muted-foreground">
                  Review the catalog entries before saving
                </span>
              </div>

              <div className="border border-teal-900/30 rounded-lg overflow-x-auto max-h-64">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0 bg-card">
                    <tr>
                      <th className="p-2.5">Medicine Name</th>
                      <th className="p-2.5">Generic Molecule</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Form & Strength</th>
                      <th className="p-2.5">Price / MRP</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5">Expiry</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/20">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-teal-950/20 transition-colors">
                        <td className="p-2.5 font-medium text-white flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                          {item.name}
                        </td>
                        <td className="p-2.5 text-teal-300 font-mono text-[11px]">
                          {item.genericName || "—"}
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-teal-900/40">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          {item.dosageForm} {item.strength ? `(${item.strength})` : ""}
                        </td>
                        <td className="p-2.5 font-medium text-white">
                          ₹{item.price} <span className="text-muted-foreground line-through text-[10px]">₹{item.mrp}</span>
                        </td>
                        <td className="p-2.5 font-bold text-teal-300">
                          {item.stockQuantity}
                        </td>
                        <td className="p-2.5 text-muted-foreground text-[11px]">
                          {item.expiryDate}
                        </td>
                        <td className="p-2.5 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveParsedRow(idx)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                            title="Remove item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-teal-900/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setParsedItems([]);
              }}
              disabled={loading}
              className="text-xs border-teal-900/40"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleExecuteImport}
              disabled={loading || parsedItems.length === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium gap-2 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing {parsedItems.length} Medicines...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Import {parsedItems.length} Medicine(s) to Catalog
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
