"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  MapPin,
  Phone,
  Package,
  ShoppingBag,
  ShieldCheck,
  Power,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { toggleStoreActiveStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";

export default function VerifiedStores({ stores = [] }) {
  const [togglingId, setTogglingId] = useState(null);
  const { fn: toggleActive, loading } = useFetch(toggleStoreActiveStatus);

  const handleToggle = async (storeId, currentStatus) => {
    setTogglingId(storeId);
    const formData = new FormData();
    formData.append("storeId", storeId);
    formData.append("isActive", (!currentStatus).toString());

    const res = await toggleActive(formData);
    setTogglingId(storeId);

    if (res?.success) {
      toast.success(
        !currentStatus
          ? "Store activated for patient discovery"
          : "Store temporarily suspended"
      );
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  if (stores.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-card border border-teal-900/20">
        <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Verified Pharmacy Stores Yet</h3>
        <p className="text-xs text-muted-foreground mt-1">
          When pharmacy applications are approved, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-400" />
          Active Verified Pharmacy Stores ({stores.length})
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
                    <p className="text-xs text-muted-foreground">
                      Owner: {store.ownerName} • {store.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      store.isActive
                        ? "border-emerald-800 bg-emerald-950/30 text-emerald-400 text-xs"
                        : "border-red-800 bg-red-950/30 text-red-400 text-xs"
                    }
                  >
                    {store.isActive ? "Live in Patient App" : "Suspended"}
                  </Badge>
                </div>
              </div>

              {/* Stats & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/20">
                  <span className="text-muted-foreground block text-[11px]">Location:</span>
                  <span className="text-white font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-teal-400" />
                    {store.city} ({store.latitude.toFixed(2)}, {store.longitude.toFixed(2)})
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/20">
                  <span className="text-muted-foreground block text-[11px]">Active Inventory:</span>
                  <span className="text-white font-bold text-sm flex items-center gap-1 mt-0.5">
                    <Package className="h-3.5 w-3.5 text-teal-400" />
                    {store._count?.products || 0} Listed Medicines
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/20">
                  <span className="text-muted-foreground block text-[11px]">Total Orders:</span>
                  <span className="text-white font-bold text-sm flex items-center gap-1 mt-0.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-teal-400" />
                    {store._count?.orders || 0} Dispatched
                  </span>
                </div>
              </div>

              {/* Toggle Status Action */}
              <div className="flex justify-end pt-2 border-t border-muted/20">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(store.id, store.isActive)}
                  disabled={togglingId === store.id}
                  className={
                    store.isActive
                      ? "border-amber-800/40 text-amber-300 hover:bg-amber-950/30 text-xs"
                      : "border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/30 text-xs"
                  }
                >
                  <Power className="h-3.5 w-3.5 mr-1.5" />
                  {store.isActive ? "Suspend Store" : "Re-activate Store"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
