"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertTriangle,
  Zap,
  Clock,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Trash2,
  TrendingDown,
  Layers,
  ArrowRight,
  Loader2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import {
  toggleFlashSaleAction,
  disposeExpiredProductAction,
  liquidateAllCriticalAction,
} from "@/actions/store";
import useFetch from "@/hooks/use-fetch";

export default function ExpiryManager({ products = [], storeId }) {
  const [activeSubTab, setActiveSubTab] = useState("critical");
  const [actingId, setActingId] = useState(null);

  const { fn: toggleFlashSale, loading: flashLoading } = useFetch(toggleFlashSaleAction);
  const { fn: disposeExpired, loading: disposeLoading } = useFetch(disposeExpiredProductAction);
  const { fn: liquidateAllCritical, loading: bulkLoading } = useFetch(liquidateAllCriticalAction);

  // Group items by evaluated expiry status
  const criticalItems = products.filter(
    (p) => p.evaluatedExpiryStatus === "CRITICAL_EXPIRY" && p.stockQuantity > 0
  );
  const approachingItems = products.filter(
    (p) => p.evaluatedExpiryStatus === "APPROACHING_EXPIRY" && p.stockQuantity > 0
  );
  const expiredItems = products.filter(
    (p) => p.evaluatedExpiryStatus === "EXPIRED" || (p.expiryDaysRemaining !== null && p.expiryDaysRemaining <= 0)
  );
  const safeItems = products.filter(
    (p) => p.evaluatedExpiryStatus === "SAFE" && p.stockQuantity > 0
  );
  const flashSaleItems = products.filter((p) => p.isFlashSale && p.stockQuantity > 0);

  // Financial calculations
  const criticalValueAtRisk = criticalItems.reduce(
    (sum, p) => sum + p.price * p.stockQuantity,
    0
  );
  const totalValueAtRisk = [...criticalItems, ...approachingItems].reduce(
    (sum, p) => sum + p.price * p.stockQuantity,
    0
  );
  const activeClearanceValue = flashSaleItems.reduce(
    (sum, p) => sum + (p.flashSalePrice || p.price * 0.5) * p.stockQuantity,
    0
  );

  const handleToggleFlashSale = async (productId, currentIsFlashSale) => {
    setActingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("discountPercentage", "50");

    const res = await toggleFlashSale(formData);
    setActingId(null);
    if (res?.success) {
      toast.success(res.message);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleDisposeExpired = async (productId) => {
    if (
      !window.confirm(
        "Are you sure you want to write off and safely dispose this expired medicine batch? This action permanently removes it from active inventory."
      )
    ) {
      return;
    }

    setActingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);

    const res = await disposeExpired(formData);
    setActingId(null);
    if (res?.success) {
      toast.success(res.message);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleLiquidateAll = async () => {
    if (criticalItems.length === 0) {
      toast.info("No critical items require liquidation right now");
      return;
    }

    if (
      !window.confirm(
        `Enroll all ${criticalItems.length} critical medicine(s) into 50% Flash Clearance? They will immediately appear on the patient Clearance Shelf for chronic patients.`
      )
    ) {
      return;
    }

    const res = await liquidateAllCritical();
    if (res?.success) {
      toast.success(res.message);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Algorithmic Explanation Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/20 via-card to-amber-950/20 border border-teal-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Clock className="h-5 w-5 text-teal-400" />
            Intelligent Expiry Alert & Flash-Sale Clearance Engine
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Continuous algorithmic shelf-life evaluation ($\Delta T = \text{Expiry} - \text{Today}$). Prevents pharmacy dead-stock losses by enrolling near-expiry batches into the <strong>50% Flash Clearance Shelf</strong> for chronic-care patients (diabetes, hypertension) who consume monthly supplies immediately.
          </p>
        </div>

        {criticalItems.length > 0 && (
          <Button
            onClick={handleLiquidateAll}
            disabled={bulkLoading}
            className="bg-amber-600 hover:bg-amber-700 text-black font-bold gap-2 shrink-0 shadow-lg shadow-amber-950/50"
          >
            {bulkLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 fill-black" />
            )}
            1-Click Liquidate All Critical ({criticalItems.length})
          </Button>
        )}
      </div>

      {/* 4 Summary KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical Expiry */}
        <Card className="bg-card border-red-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Critical Alerts (&le; 30 Days)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-400">
              {criticalItems.length} {criticalItems.length === 1 ? "Item" : "Items"}
            </div>
            <p className="text-[11px] text-red-300/80 mt-1">
              ₹{Math.round(criticalValueAtRisk)} inventory value at risk
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Approaching Expiry */}
        <Card className="bg-card border-amber-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Approaching (31–90 Days)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-300">
              {approachingItems.length} Items
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Early priority dispensing recommended
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Active in Flash Clearance */}
        <Card className="bg-card border-teal-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active in Clearance (50% OFF)
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-teal-300">
              {flashSaleItems.length} Medicines
            </div>
            <p className="text-[11px] text-teal-400/80 mt-1">
              ₹{Math.round(activeClearanceValue)} cash recovery potential
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Expired Items */}
        <Card className="bg-card border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Expired (Blocked)
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {expiredItems.length} Batches
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Legally blocked from sale • Safe disposal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex gap-2 border-b border-teal-900/30 pb-2 overflow-x-auto">
        <Button
          variant={activeSubTab === "critical" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("critical")}
          className={
            activeSubTab === "critical"
              ? "bg-red-950/60 text-red-300 border border-red-800 text-xs gap-1.5"
              : "text-muted-foreground text-xs gap-1.5 hover:text-white"
          }
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          Critical Alert (&le; 30d)
          {criticalItems.length > 0 && (
            <Badge className="bg-red-600 text-white text-[10px] px-1 py-0 h-4">
              {criticalItems.length}
            </Badge>
          )}
        </Button>

        <Button
          variant={activeSubTab === "approaching" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("approaching")}
          className={
            activeSubTab === "approaching"
              ? "bg-amber-950/60 text-amber-300 border border-amber-800 text-xs gap-1.5"
              : "text-muted-foreground text-xs gap-1.5 hover:text-white"
          }
        >
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          Approaching (31–90d) ({approachingItems.length})
        </Button>

        <Button
          variant={activeSubTab === "flash" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("flash")}
          className={
            activeSubTab === "flash"
              ? "bg-teal-950/60 text-teal-300 border border-teal-800 text-xs gap-1.5"
              : "text-muted-foreground text-xs gap-1.5 hover:text-white"
          }
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          Clearance Hub Live ({flashSaleItems.length})
        </Button>

        <Button
          variant={activeSubTab === "expired" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("expired")}
          className={
            activeSubTab === "expired"
              ? "bg-zinc-800 text-white border border-zinc-700 text-xs gap-1.5"
              : "text-muted-foreground text-xs gap-1.5 hover:text-white"
          }
        >
          <ShieldAlert className="h-3.5 w-3.5 text-zinc-400" />
          Expired / Blocked ({expiredItems.length})
        </Button>
      </div>

      {/* TAB CONTENT 1: CRITICAL ALERT ITEMS */}
      {activeSubTab === "critical" && (
        <div className="space-y-4">
          {criticalItems.length === 0 ? (
            <div className="p-10 rounded-xl bg-card border border-teal-900/20 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">No Critical Expiry Medicines</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                All medicine batches have more than 30 days of shelf life. No immediate write-off risk detected.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/50 flex items-center justify-between text-xs text-red-200">
                <span>
                  <strong>Immediate Action Required:</strong> {criticalItems.length} medicine(s) expire in fewer than 30 days. Liquidate at 50% discount to turn dead-stock into cash.
                </span>
                <span className="font-bold text-red-300">
                  Total At Risk: ₹{Math.round(criticalValueAtRisk)}
                </span>
              </div>

              {criticalItems.map((item) => {
                const totalLoss = item.price * item.stockQuantity;
                const recoveryPotential = (item.price * 0.5) * item.stockQuantity;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-card border border-red-900/40 hover:border-red-700/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-base">{item.name}</span>
                        {item.strength && (
                          <Badge variant="outline" className="border-teal-800/40 text-teal-300 text-xs">
                            {item.strength}
                          </Badge>
                        )}
                        <Badge className="bg-red-900/60 border border-red-700 text-red-300 text-xs gap-1 font-mono animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          {item.expiryDaysRemaining} Days Left
                        </Badge>
                      </div>

                      {item.genericName && (
                        <p className="text-xs text-teal-400/90 font-medium">
                          Formula: {item.genericName}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">Batch: {item.batchNumber || "N/A"}</span>
                        <span>•</span>
                        <span>Category: {item.category}</span>
                        <span>•</span>
                        <span>Expiry Date: {new Date(item.expiryDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Stock, Loss Risk & Actions */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-muted/20">
                      <div className="text-left md:text-right">
                        <div className="text-sm font-bold text-white">
                          {item.stockQuantity} Units in Stock
                        </div>
                        <p className="text-[11px] text-red-400">
                          ₹{Math.round(totalLoss)} write-off risk
                        </p>
                        <p className="text-[10px] text-teal-400">
                          ₹{Math.round(recoveryPotential)} recoverable @ 50%
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleToggleFlashSale(item.id, item.isFlashSale)}
                        disabled={actingId === item.id}
                        className={
                          item.isFlashSale
                            ? "bg-amber-950/60 border border-amber-700 text-amber-300 hover:bg-amber-900/40 text-xs gap-1.5"
                            : "bg-amber-600 hover:bg-amber-700 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-950/40"
                        }
                      >
                        {actingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Zap className="h-3.5 w-3.5 fill-current" />
                        )}
                        {item.isFlashSale ? "Active in Flash Sale (Cancel)" : "1-Click Flash Sale @ 50%"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: APPROACHING EXPIRY ITEMS */}
      {activeSubTab === "approaching" && (
        <div className="space-y-4">
          {approachingItems.length === 0 ? (
            <div className="p-10 rounded-xl bg-card border border-teal-900/20 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-teal-400 mx-auto" />
              <h4 className="text-base font-bold text-white">No Medicines Approaching Expiry</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No inventory batches currently in the 31–90 days window.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200">
                <strong>Priority Dispensing Shelf:</strong> {approachingItems.length} items will expire in 31–90 days. Dispense these batches first when filling doctor prescriptions.
              </div>

              {approachingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-card border border-amber-900/30 hover:border-amber-700/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{item.name}</span>
                      <Badge variant="outline" className="border-amber-700 text-amber-300 text-xs">
                        {item.expiryDaysRemaining} Days Left
                      </Badge>
                    </div>
                    {item.genericName && (
                      <p className="text-xs text-muted-foreground">{item.genericName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Batch #{item.batchNumber} • Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">{item.stockQuantity} Units</span>
                      <p className="text-xs text-teal-400">₹{item.price} Retail</p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFlashSale(item.id, item.isFlashSale)}
                      disabled={actingId === item.id}
                      className={
                        item.isFlashSale
                          ? "border-amber-600 text-amber-300"
                          : "border-teal-800 text-teal-300 hover:bg-teal-900/30"
                      }
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {item.isFlashSale ? "In Clearance" : "Early Discount @ 50%"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: ACTIVE FLASH CLEARANCE HUB */}
      {activeSubTab === "flash" && (
        <div className="space-y-4">
          {flashSaleItems.length === 0 ? (
            <div className="p-10 rounded-xl bg-card border border-teal-900/20 text-center space-y-2">
              <Zap className="h-10 w-10 text-muted-foreground mx-auto" />
              <h4 className="text-base font-bold text-white">Clearance Hub Is Currently Empty</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Enroll near-expiry medications in the Critical or Approaching tab to display them on the patient Clearance Shelf.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-800/40 flex items-center justify-between text-xs text-teal-200">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <strong>Active on Patient Storefront:</strong> These {flashSaleItems.length} medicines are live on the 50% Clearance Shelf for chronic-care patients.
                </span>
                <span className="font-bold text-amber-300">
                  Total Recoverable Cash: ₹{Math.round(activeClearanceValue)}
                </span>
              </div>

              {flashSaleItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-card border border-amber-800/40 flex items-center justify-between gap-4"
                >
                  <div>
                    <h5 className="font-bold text-white">{item.name}</h5>
                    <p className="text-xs text-muted-foreground font-mono">
                      Batch #{item.batchNumber} • Shelf Life: {item.expiryDaysRemaining}d remaining
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1.5 justify-end">
                        <span className="text-lg font-bold text-amber-400">
                          ₹{item.flashSalePrice || item.price * 0.5}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{item.price}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {item.stockQuantity} units left in clearance
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFlashSale(item.id, true)}
                      disabled={actingId === item.id}
                      className="border-red-900/40 text-red-400 hover:bg-red-900/20 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: EXPIRED / BLOCKED ITEMS */}
      {activeSubTab === "expired" && (
        <div className="space-y-4">
          {expiredItems.length === 0 ? (
            <div className="p-10 rounded-xl bg-card border border-teal-900/20 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Zero Expired Medicines</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Excellent inventory compliance! All products on your shelves are within legal shelf life.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-700 text-xs text-zinc-300">
                <strong>Legal Compliance Gate:</strong> Expired medicines are permanently blocked from checkout. Click &quot;Write-Off &amp; Dispose&quot; to safely deduct them from inventory and log disposal.
              </div>

              {expiredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-300">{item.name}</span>
                      <Badge className="bg-red-950 border border-red-800 text-red-400 text-xs">
                        BLOCKED FROM DISPENSING
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">
                      Batch #{item.batchNumber} • Expired on: {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400 font-mono">
                      {item.stockQuantity} Units
                    </span>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDisposeExpired(item.id)}
                      disabled={actingId === item.id}
                      className="text-xs gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Write-Off &amp; Dispose
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
