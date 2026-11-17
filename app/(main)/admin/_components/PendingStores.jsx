"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { updateStoreStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";

export default function PendingStores({ stores = [] }) {
  const [processingId, setProcessingId] = useState(null);
  const { fn: updateStatus, loading } = useFetch(updateStoreStatus);

  const handleStatusUpdate = async (storeId, status) => {
    setProcessingId(storeId);
    const formData = new FormData();
    formData.append("storeId", storeId);
    formData.append("status", status);

    const res = await updateStatus(formData);
    setProcessingId(null);

    if (res?.success) {
      toast.success(
        status === "VERIFIED"
          ? "Pharmacy store approved successfully!"
          : "Pharmacy store rejected"
      );
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  if (stores.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-card border border-teal-900/20">
        <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Pending Pharmacy Stores</h3>
        <p className="text-xs text-muted-foreground mt-1">
          All submitted pharmacy applications have been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-400" />
          Pending Pharmacy Store Approvals ({stores.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {stores.map((store) => (
          <Card
            key={store.id}
            className="bg-card border-teal-900/30 hover:border-teal-700/40 transition-all p-5"
          >
            <CardContent className="p-0 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-muted/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-teal-900/30 border border-teal-700/40">
                    <Store className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {store.storeName}
                    </h3>
                    <p className="text-xs text-teal-400">
                      Owner: {store.ownerName} ({store.ownerEmail})
                    </p>
                  </div>
                </div>

                <Badge className="bg-amber-900/30 text-amber-300 border-amber-700/40 self-start sm:self-center">
                  Pending Verification
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-white">
                    <Phone className="h-3.5 w-3.5 text-teal-400" />
                    <span>Phone: {store.phone}</span>
                  </p>
                  <p className="flex items-center gap-2 text-white">
                    <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    <span>
                      {store.storeAddress}, {store.city} {store.postalCode ? `- ${store.postalCode}` : ""}
                    </span>
                  </p>
                  <p className="text-muted-foreground pl-5.5">
                    GPS Coordinates: {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/20 border border-muted/30">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Drug License Number / GSTIN:
                    </span>
                    <span className="font-mono text-sm text-teal-300 font-bold">
                      {store.licenseNumber}
                    </span>
                  </div>

                  {store.licenseDocumentUrl && (
                    <a
                      href={store.licenseDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline pt-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Uploaded License Document
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-muted/20">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={processingId === store.id}
                  onClick={() => handleStatusUpdate(store.id, "REJECTED")}
                  className="border-red-900/40 text-red-400 hover:bg-red-950/30 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject Store
                </Button>

                <Button
                  size="sm"
                  disabled={processingId === store.id}
                  onClick={() => handleStatusUpdate(store.id, "VERIFIED")}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                >
                  {processingId === store.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Approve & Verify Store
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
