"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, AlertTriangle, TrendingUp, PackageCheck, ShieldAlert } from "lucide-react";

export default function SmartStockCard({ suggestions = [] }) {
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
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-800/30 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-white">AI SmartStock Demand & Anti-Overstocking Intelligence</p>
          <p>
            Recommendations are generated using real-time doctor prescriptions, local patient search spikes, and your store run-rate. Restock caps are strictly enforced to preserve working capital and prevent expired inventory losses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map(({ product, recommendation }) => {
          const isCritical = recommendation.status === "CRITICAL_LOW";
          const isOverstock = recommendation.status === "OVERSTOCK_WARNING";

          return (
            <Card
              key={product.id}
              className={`border transition-all ${
                isCritical
                  ? "bg-red-950/15 border-red-900/40"
                  : isOverstock
                  ? "bg-amber-950/15 border-amber-900/40"
                  : "bg-card border-teal-900/30"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-white">
                      {product.name}
                    </CardTitle>
                    {product.genericName && (
                      <p className="text-xs text-teal-400 font-medium mt-0.5">
                        {product.genericName}
                      </p>
                    )}
                  </div>
                  {isCritical && (
                    <Badge className="bg-red-900/40 text-red-300 border-red-700/50 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Critical Restock
                    </Badge>
                  )}
                  {isOverstock && (
                    <Badge className="bg-amber-900/40 text-amber-300 border-amber-700/50 text-xs">
                      <ShieldAlert className="h-3 w-3 mr-1" /> Overstock Cap
                    </Badge>
                  )}
                  {!isCritical && !isOverstock && (
                    <Badge variant="outline" className="border-teal-800 text-teal-300 text-xs">
                      Reorder Soon
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-lg bg-muted/20 border border-muted/30">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Current Stock</span>
                    <span className="font-bold text-sm text-white">{recommendation.currentStock}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Reorder Point</span>
                    <span className="font-bold text-sm text-amber-400">{recommendation.reorderPoint}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Safety Cap</span>
                    <span className="font-bold text-sm text-teal-300">{recommendation.maxStockCap}</span>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {recommendation.reason}
                </p>

                {/* Recommendation Bottom Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-muted/20">
                  <span className="text-muted-foreground font-medium">Recommended Restock:</span>
                  <span className="text-sm font-bold text-teal-300">
                    {recommendation.recommendedRestock > 0
                      ? `+${recommendation.recommendedRestock} units`
                      : "0 units (Restock Suppressed)"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
