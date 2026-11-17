"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Package, TrendingUp, Calendar } from "lucide-react";

export default function StoreAnalytics({ analytics }) {
  if (!analytics) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-xl border border-teal-900/20">
        <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-white font-medium">No sales data available yet</p>
        <p className="text-xs text-muted-foreground mt-1">Analytics will generate as orders are delivered.</p>
      </div>
    );
  }

  const {
    storeName,
    totalRevenue,
    totalDeliveredOrders,
    totalOrders,
    totalProducts,
    monthlyCounts,
  } = analytics;

  const months = [
    { key: "jan", label: "Jan", count: monthlyCounts.jan || 0 },
    { key: "feb", label: "Feb", count: monthlyCounts.feb || 0 },
    { key: "march", label: "Mar", count: monthlyCounts.march || 0 },
    { key: "april", label: "Apr", count: monthlyCounts.april || 0 },
    { key: "may", label: "May", count: monthlyCounts.may || 0 },
    { key: "june", label: "Jun", count: monthlyCounts.june || 0 },
    { key: "july", label: "Jul", count: monthlyCounts.july || 0 },
    { key: "aug", label: "Aug", count: monthlyCounts.aug || 0 },
    { key: "sept", label: "Sep", count: monthlyCounts.sept || 0 },
    { key: "oct", label: "Oct", count: monthlyCounts.oct || 0 },
    { key: "nov", label: "Nov", count: monthlyCounts.nov || 0 },
    { key: "dec", label: "Dec", count: monthlyCounts.dec || 0 },
  ];

  const maxCount = Math.max(...months.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-teal-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{totalRevenue}</div>
            <p className="text-xs text-teal-400/80 mt-1">From fulfilled orders</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-teal-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalDeliveredOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {totalOrders} total orders</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-teal-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Medicines
            </CardTitle>
            <Package className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Listed in catalog</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-teal-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{totalDeliveredOrders > 0 ? Math.round(totalRevenue / totalDeliveredOrders) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per delivered basket</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Delivered Orders Histogram (Ported from Medstore getAnalytics) */}
      <Card className="bg-card border-teal-900/30">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-400" />
            Monthly Delivered Orders Performance (Jan – Dec)
          </CardTitle>
          <CardDescription>
            Annual distribution of completed medicine dispatches for {storeName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2">
            {months.map((m) => {
              const heightPct = Math.round((m.count / maxCount) * 100);

              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-teal-300">
                    {m.count > 0 ? m.count : ""}
                  </span>
                  <div
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                    className={`w-full max-w-[32px] rounded-t-md transition-all duration-500 ${
                      m.count > 0
                        ? "bg-gradient-to-t from-teal-700 to-teal-400 hover:brightness-125"
                        : "bg-muted/30"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
