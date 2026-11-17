"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  PackageCheck,
  ShieldAlert,
  Zap,
  ArrowRight,
  Loader2,
  DollarSign,
  Activity,
  Layers,
  HelpCircle,
  Pill,
  CheckCircle2,
  Stethoscope,
  Search,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { applyRestockAction, applyBulkRestockAction } from "@/actions/store";
import useFetch from "@/hooks/use-fetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SmartStockCard({
  suggestionsData = {},
  suggestions: legacySuggestions = [],
}) {
  const suggestions = suggestionsData?.suggestions || legacySuggestions || [];
  const summary = suggestionsData?.summary || {
    totalEvaluated: suggestions.length,
    criticalCount: suggestions.filter((s) => s.recommendation?.status === "CRITICAL_LOW").length,
    reorderCount: suggestions.filter((s) => s.recommendation?.status === "REORDER_RECOMMENDED").length,
    overstockCount: suggestions.filter((s) => s.recommendation?.status === "OVERSTOCK_WARNING").length,
    optimalCount: suggestions.filter((s) => s.recommendation?.status === "OPTIMAL").length,
    totalRestockUnits: suggestions.reduce((sum, s) => sum + (s.recommendation?.recommendedRestock || 0), 0),
    estimatedCapitalRequired: suggestions.reduce((sum, s) => sum + (s.recommendation?.capitalCost || 0), 0),
  };
  const genericOpportunities = suggestionsData?.genericOpportunities || [];
  const inventoryHealth = suggestionsData?.inventoryHealth || {
    score: 88,
    grade: "Healthy Inventory",
    totalInventoryValue: 0,
    stockoutRiskCount: summary.criticalCount,
    overstockRiskCount: summary.overstockCount,
  };

  const [filter, setFilter] = useState("ALL"); // ALL, CRITICAL, REORDER, OVERSTOCK, OPTIMAL
  const [restockingId, setRestockingId] = useState(null);
  const [isMathOpen, setIsMathOpen] = useState(false);

  const { fn: applyRestock, loading: singleLoading } = useFetch(applyRestockAction);
  const { fn: applyBulkRestock, loading: bulkLoading } = useFetch(applyBulkRestockAction);

  // Filter suggestions
  const filteredSuggestions = suggestions.filter((item) => {
    if (filter === "CRITICAL") return item.recommendation?.status === "CRITICAL_LOW";
    if (filter === "REORDER") return item.recommendation?.status === "REORDER_RECOMMENDED";
    if (filter === "OVERSTOCK") return item.recommendation?.status === "OVERSTOCK_WARNING";
    if (filter === "OPTIMAL") return item.recommendation?.status === "OPTIMAL";
    return true;
  });

  const criticalAndReorderItems = suggestions.filter(
    (s) =>
      s.recommendation?.recommendedRestock > 0 &&
      (s.recommendation?.status === "CRITICAL_LOW" || s.recommendation?.status === "REORDER_RECOMMENDED")
  );

  const handleRestockSingle = async (productId, restockUnits, medicineName) => {
    setRestockingId(productId);
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("quantity", restockUnits.toString());

    const res = await applyRestock(formData);
    setRestockingId(null);
    if (res?.success) {
      toast.success(res.message);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleBulkRestockAll = async () => {
    if (criticalAndReorderItems.length === 0) {
      toast.info("No depleted items require restocking at this time.");
      return;
    }

    const payload = criticalAndReorderItems.map((s) => ({
      productId: s.product.id,
      quantity: s.recommendation.recommendedRestock,
      name: s.product.name,
    }));

    const formData = new FormData();
    formData.append("itemsJson", JSON.stringify(payload));

    const res = await applyBulkRestock(formData);
    if (res?.success) {
      toast.success(res.message);
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-card border border-teal-900/30 text-center space-y-3">
        <PackageCheck className="h-10 w-10 text-teal-400 mx-auto" />
        <h4 className="text-lg font-bold text-white">All Stock Levels Are Optimal</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          The SmartStock engine continuously monitors local doctor prescriptions and patient searches. No stockouts or overstock risks detected at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Inventory Health Score & Anti-Overstock Summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-card via-card to-teal-950/30 border border-teal-900/40 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                AI SmartStock Demand & Anti-Overstocking Engine
              </h3>
              <Badge
                variant="outline"
                className="bg-teal-950/60 border-teal-700/50 text-teal-300 text-xs gap-1"
              >
                <Activity className="h-3 w-3" />
                Health Score: {inventoryHealth.score}/100 ({inventoryHealth.grade})
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Calculates daily demand velocity using local doctor e-prescriptions (50%), patient searches (20%), and store run-rate (30%). Strictly enforces dynamic safety ceilings (S_max) to prevent excess capital tie-up.
            </p>
          </div>

          {/* Action: 1-Click Restock All Critical Depleted Items */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMathOpen(true)}
              className="border-teal-800/40 text-teal-300 hover:bg-teal-950 text-xs gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Demand Math
            </Button>

            {criticalAndReorderItems.length > 0 && (
              <Button
                onClick={handleBulkRestockAll}
                disabled={bulkLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-md"
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Restocking...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    Restock All Depleted ({criticalAndReorderItems.length} items)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* 4 Metric KPI Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-muted/20 border border-teal-900/20">
            <span className="text-[11px] text-muted-foreground block">Critical Depletion (SS)</span>
            <span className="text-xl font-bold text-red-400">
              {summary.criticalCount} <span className="text-xs font-normal text-muted-foreground">items</span>
            </span>
            <span className="text-[10px] text-red-300/80 block mt-0.5">High stockout risk</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-teal-900/20">
            <span className="text-[11px] text-muted-foreground block">Reorder Advised (ROP)</span>
            <span className="text-xl font-bold text-amber-400">
              {summary.reorderCount} <span className="text-xs font-normal text-muted-foreground">items</span>
            </span>
            <span className="text-[10px] text-amber-300/80 block mt-0.5">Reorder point reached</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-teal-900/20">
            <span className="text-[11px] text-muted-foreground block">Anti-Overstock Suppressed</span>
            <span className="text-xl font-bold text-teal-300">
              {summary.overstockCount} <span className="text-xs font-normal text-muted-foreground">items</span>
            </span>
            <span className="text-[10px] text-teal-400/80 block mt-0.5">Capital protected</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-teal-900/20">
            <span className="text-[11px] text-muted-foreground block">Restock Capital Required</span>
            <span className="text-xl font-bold text-white">
              ₹{summary.estimatedCapitalRequired.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              +{summary.totalRestockUnits} total units
            </span>
          </div>
        </div>
      </div>

      {/* Suggestion 1: Generic Substitute Savings Opportunity Box */}
      {genericOpportunities.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/40 via-card to-card border border-teal-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Generic Substitute Demand Intelligence (Core Feature 1)
              </h4>
            </div>
            <Badge className="bg-teal-900/50 text-teal-300 border-teal-700/40 text-[10px]">
              High Retail Margin Opportunity
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {genericOpportunities.map((opp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-card/60 border border-teal-900/30 text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-white">
                    Doctors prescribe: <span className="text-amber-300">{opp.prescribedBrand}</span>
                  </p>
                  <p className="text-[11px] text-teal-400 font-mono mt-0.5">
                    Your Generic: {opp.storeProduct.name} ({opp.genericSalt})
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Patients save {opp.patientSavingsPercent}% vs brand name — Higher Dukaan margin
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="border-teal-700 text-teal-300 text-[11px]">
                    In Stock: {opp.storeProduct.stockQuantity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-muted-foreground font-medium mr-1">Filter Inventory:</span>
        <Button
          size="sm"
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
          className={filter === "ALL" ? "bg-teal-700 text-white h-7 text-xs" : "h-7 text-xs border-teal-900/30"}
        >
          All Evaluated ({suggestions.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "CRITICAL" ? "default" : "outline"}
          onClick={() => setFilter("CRITICAL")}
          className={
            filter === "CRITICAL"
              ? "bg-red-700 text-white h-7 text-xs"
              : "h-7 text-xs border-red-900/40 text-red-300 hover:bg-red-950/20"
          }
        >
          Critical Low ({summary.criticalCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "REORDER" ? "default" : "outline"}
          onClick={() => setFilter("REORDER")}
          className={
            filter === "REORDER"
              ? "bg-amber-700 text-white h-7 text-xs"
              : "h-7 text-xs border-amber-900/40 text-amber-300 hover:bg-amber-950/20"
          }
        >
          Reorder Point ({summary.reorderCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "OVERSTOCK" ? "default" : "outline"}
          onClick={() => setFilter("OVERSTOCK")}
          className={
            filter === "OVERSTOCK"
              ? "bg-cyan-800 text-white h-7 text-xs"
              : "h-7 text-xs border-cyan-900/40 text-cyan-300 hover:bg-cyan-950/20"
          }
        >
          Overstock Capped ({summary.overstockCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "OPTIMAL" ? "default" : "outline"}
          onClick={() => setFilter("OPTIMAL")}
          className={
            filter === "OPTIMAL"
              ? "bg-emerald-700 text-white h-7 text-xs"
              : "h-7 text-xs border-emerald-900/40 text-emerald-300 hover:bg-emerald-950/20"
          }
        >
          Optimal ({summary.optimalCount})
        </Button>
      </div>

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuggestions.map(({ product, recommendation }) => {
          const isCritical = recommendation?.status === "CRITICAL_LOW";
          const isReorder = recommendation?.status === "REORDER_RECOMMENDED";
          const isOverstock = recommendation?.status === "OVERSTOCK_WARNING";
          const isOptimal = recommendation?.status === "OPTIMAL";
          const isActing = restockingId === product.id;

          return (
            <Card
              key={product.id}
              className={`border transition-all flex flex-col justify-between ${
                isCritical
                  ? "bg-red-950/15 border-red-900/50 shadow-md shadow-red-950/20"
                  : isReorder
                  ? "bg-amber-950/15 border-amber-900/50"
                  : isOverstock
                  ? "bg-cyan-950/15 border-cyan-900/40"
                  : "bg-card border-teal-900/30"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
                      <Pill className="h-4 w-4 text-teal-400" />
                      {product.name}
                    </CardTitle>
                    {product.genericName && (
                      <p className="text-xs text-teal-400 font-mono mt-0.5">
                        {product.genericName}
                      </p>
                    )}
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {product.category} • Selling Price: ₹{product.price}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isCritical && (
                    <Badge className="bg-red-900/50 text-red-200 border-red-700/60 text-xs shrink-0 animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Critical Restock
                    </Badge>
                  )}
                  {isReorder && (
                    <Badge className="bg-amber-900/50 text-amber-200 border-amber-700/60 text-xs shrink-0">
                      <TrendingUp className="h-3 w-3 mr-1" /> Reorder Soon
                    </Badge>
                  )}
                  {isOverstock && (
                    <Badge className="bg-cyan-900/50 text-cyan-200 border-cyan-700/60 text-xs shrink-0">
                      <ShieldAlert className="h-3 w-3 mr-1" /> Overstock Cap
                    </Badge>
                  )}
                  {isOptimal && (
                    <Badge variant="outline" className="border-emerald-700 text-emerald-300 text-xs shrink-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Stock Healthy
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 text-xs">
                {/* 3 Metric Pills: Current Stock vs ROP vs Max Cap */}
                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-lg bg-muted/20 border border-muted/30">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Current Units</span>
                    <span
                      className={`font-bold text-sm ${
                        isCritical
                          ? "text-red-400"
                          : isReorder
                          ? "text-amber-400"
                          : isOverstock
                          ? "text-cyan-300"
                          : "text-white"
                      }`}
                    >
                      {recommendation?.currentStock}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Reorder Point (ROP)</span>
                    <span className="font-bold text-sm text-amber-400">
                      {recommendation?.reorderPoint}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Safety Cap (S_max)</span>
                    <span className="font-bold text-sm text-teal-300">
                      {recommendation?.maxStockCap}
                    </span>
                  </div>
                </div>

                {/* Local Telemetry Signals Breakdown */}
                {recommendation?.telemetry && (
                  <div className="grid grid-cols-4 gap-1 p-2 rounded-lg bg-card/60 border border-teal-900/20 text-center text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">Rx Signals</span>
                      <span className="font-bold text-white flex items-center justify-center gap-0.5">
                        <Stethoscope className="h-2.5 w-2.5 text-teal-400" />
                        {recommendation.telemetry.prescriptions}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Searches</span>
                      <span className="font-bold text-white flex items-center justify-center gap-0.5">
                        <Search className="h-2.5 w-2.5 text-teal-400" />
                        {recommendation.telemetry.searches}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Orders</span>
                      <span className="font-bold text-white flex items-center justify-center gap-0.5">
                        <ShoppingBag className="h-2.5 w-2.5 text-teal-400" />
                        {recommendation.telemetry.storeSales}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Velocity (D_v)</span>
                      <span className="font-bold text-teal-300">
                        {recommendation.demandVelocity}/day
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {recommendation?.reason}
                </p>

                {/* Recommendation Bottom Action Bar */}
                <div className="flex items-center justify-between pt-2.5 border-t border-muted/20">
                  <div>
                    <span className="text-muted-foreground font-medium block text-[11px]">
                      Recommended Restock:
                    </span>
                    <span className="text-sm font-bold text-teal-300">
                      {recommendation?.recommendedRestock > 0
                        ? `+${recommendation.recommendedRestock} units`
                        : "0 units (Restock Suppressed)"}
                    </span>
                    {recommendation?.capitalCost > 0 && (
                      <span className="text-[10px] text-muted-foreground block">
                        Capital: ~₹{recommendation.capitalCost.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* 1-Click Action Button */}
                  {recommendation?.recommendedRestock > 0 ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleRestockSingle(
                          product.id,
                          recommendation.recommendedRestock,
                          product.name
                        )
                      }
                      disabled={isActing}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5 h-8 shadow-sm"
                    >
                      {isActing ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Restocking...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 text-amber-300" />
                          Restock +{recommendation.recommendedRestock}
                        </>
                      )}
                    </Button>
                  ) : isOverstock ? (
                    <Badge variant="outline" className="border-cyan-800 text-cyan-300 text-[11px] py-1">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Capital Protected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-800 text-emerald-300 text-[11px] py-1">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Adequate Stock
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Demand Math Formula Explainer Dialog */}
      <Dialog open={isMathOpen} onOpenChange={setIsMathOpen}>
        <DialogContent className="max-w-2xl bg-card border-teal-900/40 text-xs space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-400" />
              SmartStock & Anti-Overstocking Mathematical Formulations
            </DialogTitle>
            <DialogDescription>
              Detailed specifications from AGENTS.md Section 4.B
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/30 space-y-1.5">
              <p className="font-semibold text-white">1. Local Daily Demand Velocity (D_v):</p>
              <code className="text-teal-300 font-mono block">
                D_v = 0.50 * (N_prescriptions / 14) + 0.20 * (N_searches / 14) + 0.30 * (N_sales / 14)
              </code>
              <p className="text-[11px]">
                Doctor e-prescriptions receive 50% predictive weight because patients must purchase them within 48 hours.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/30 space-y-1.5">
              <p className="font-semibold text-white">2. Safety Stock (SS) & Reorder Point (ROP):</p>
              <code className="text-teal-300 font-mono block">
                SS = 1.65 * sigma_D * sqrt(L) (L = 2 Lead Time Days)
                <br />
                ROP = (D_v * L) + SS
              </code>
              <p className="text-[11px]">
                Guarantees 95% service level protection against local flu surges and supply distributor delays.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/30 space-y-1.5">
              <p className="font-semibold text-white">3. Anti-Overstock Safety Ceiling (S_max):</p>
              <code className="text-teal-300 font-mono block">
                S_max = ROP + (D_v * 14 days)
                <br />
                Q_recommended = min(EOQ, S_max - CurrentStock)
              </code>
              <p className="text-[11px]">
                Caps replenishment to a strict 14-day supply horizon. Prevents medical stores from buying excess stock that expires on the shelf.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
