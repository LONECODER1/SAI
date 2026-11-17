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
  FileText,
  Plus,
  Trash2,
  Loader2,
  Pill,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { issueDigitalPrescriptionAction } from "@/actions/doctor";
import useFetch from "@/hooks/use-fetch";

export default function PrescriptionModal({ appointment }) {
  if (!appointment) return null;

  const [open, setOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState(appointment?.prescription?.diagnosis || "");
  const [instructions, setInstructions] = useState(
    appointment?.prescription?.instructions || "Take all medications after food with water. Stay hydrated."
  );

  const initialItems = appointment?.prescription?.items?.length
    ? appointment.prescription.items.map((i) => ({
        medicineName: i.medicineName || "",
        genericName: i.genericName || "",
        dosage: i.dosage || "1 Tab daily",
        durationDays: (i.durationDays ?? 5).toString(),
        quantity: (i.quantity ?? 10).toString(),
        instructions: i.instructions || "",
      }))
    : [
        {
          medicineName: "Amoxicillin 500mg",
          genericName: "Amoxicillin",
          dosage: "1 Tab twice daily",
          durationDays: "5",
          quantity: "10",
          instructions: "After meals",
        },
      ];

  const [items, setItems] = useState(initialItems);

  const { fn: issuePrescription, loading } = useFetch(issueDigitalPrescriptionAction);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        medicineName: "",
        genericName: "",
        dosage: "1 Tab daily",
        durationDays: "5",
        quantity: "10",
        instructions: "After meals",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error("At least one medicine is required");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const invalidItem = items.find((i) => !i.medicineName.trim());
    if (invalidItem) {
      toast.error("Please provide a medicine name for all rows");
      return;
    }

    const payload = {
      appointmentId: appointment?.id,
      diagnosis,
      instructions,
      items,
    };

    const res = await issuePrescription(payload);
    if (res?.success) {
      toast.success("Digital E-Prescription issued successfully!");
      setOpen(false);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const hasExistingPrescription = !!appointment?.prescription;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasExistingPrescription ? "outline" : "default"}
          size="sm"
          className={
            hasExistingPrescription
              ? "border-teal-700/50 text-teal-300 hover:bg-teal-900/30 text-xs gap-1.5"
              : "bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
          }
        >
          <FileText className="h-3.5 w-3.5" />
          {hasExistingPrescription ? "View / Edit Prescription" : "Write Digital Prescription"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-teal-900/40">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Pill className="h-5 w-5 text-teal-400" />
            Digital E-Prescription Builder
          </DialogTitle>
          <DialogDescription>
            Prescribe medications for patient <span className="text-white font-medium">{appointment?.patient?.name || "Patient"}</span>. Once signed, nearby pharmacies are alerted and the patient receives direct 1-click lowest price routing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Clinical Diagnosis */}
          <div className="space-y-1.5">
            <Label htmlFor="diagnosis">Clinical Diagnosis / Reason for Visit</Label>
            <Input
              id="diagnosis"
              placeholder="e.g. Upper Respiratory Tract Infection / Seasonal Allergy"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
          </div>

          {/* Medicines List Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-teal-300 flex items-center gap-1.5">
                <Pill className="h-4 w-4" /> Prescribed Medicines & Dosages
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="border-teal-800 text-teal-300 hover:bg-teal-900/30 text-xs gap-1"
              >
                <Plus className="h-3 w-3" /> Add Medicine
              </Button>
            </div>

            {/* Repeatable Medicine Rows */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-muted/20 border border-teal-900/30 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-teal-400">
                      Medicine #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-6 w-6 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Medicine Name *</Label>
                      <Input
                        placeholder="e.g. Paracetamol 500mg"
                        value={item.medicineName}
                        onChange={(e) => handleItemChange(idx, "medicineName", e.target.value)}
                        className="text-xs mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Generic Salt (Enables Generic Savings)
                      </Label>
                      <Input
                        placeholder="e.g. Acetaminophen"
                        value={item.genericName}
                        onChange={(e) => handleItemChange(idx, "genericName", e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Dosage Schedule</Label>
                      <Input
                        placeholder="e.g. 1-0-1 after food"
                        value={item.dosage}
                        onChange={(e) => handleItemChange(idx, "dosage", e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Duration (Days)</Label>
                      <Input
                        type="number"
                        placeholder="5"
                        value={item.durationDays}
                        onChange={(e) => handleItemChange(idx, "durationDays", e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Units</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Physician Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="instructions">Physician Clinical Notes & Patient Advice</Label>
            <Textarea
              id="instructions"
              placeholder="e.g. Complete the antibiotic course. Follow up after 5 days if fever persists."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-muted/20">
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
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Issuing E-Prescription...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Sign & Issue E-Prescription
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
