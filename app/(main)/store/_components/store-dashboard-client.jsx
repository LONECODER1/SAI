"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Store,
  Layers,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Zap,
  Phone,
  Calendar,
  DollarSign,
  Compass,
} from "lucide-react";

import InventoryTable from "./inventory-table";
import AddProductModal from "./add-product-modal";
import BulkImportModal from "./bulk-import-modal";
import OrdersManager from "./orders-manager";
import StoreAnalytics from "./store-analytics";
import SmartStockCard from "./smart-stock-card";
import ExpiryManager from "./expiry-manager";
import LiveMap from "@/components/map/live-map";

export default function StoreDashboardClient({
  store,
  products = [],
  orders = [],
  analytics = null,
  suggestionsData = {},
  criticalExpiryItems = [],
  lowStockItems = [],
}) {
  const [activeTab, setActiveTab] = useState("inventory");

  // Summary counts
  const pendingOrdersCount = orders.filter((o) => o.status === "PENDING" || o.status === "ACCEPTED").length;
  const criticalExpiryCount = criticalExpiryItems.length;
  const restockNeededCount =
    (suggestionsData?.summary?.criticalCount || 0) + (suggestionsData?.summary?.reorderCount || 0);

  // Total valuation
  const totalValuation = products.reduce((sum, p) => sum + (p.price || 0) * (p.stockQuantity || 0), 0);
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);

  return (
    <div className="w-full space-y-5">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="border-teal-900/40 text-teal-300 hover:bg-teal-950/40 h-8 text-xs gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-teal-950/60 border-teal-700/50 text-teal-300 gap-1.5 py-1 px-3 text-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            Verified Pharmacy Partner
          </Badge>
        </div>
      </div>

      {/* Wide Executive Store Header Banner */}
      <div className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-card via-card to-teal-950/30 border border-teal-900/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Store Identification */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-teal-900/50 to-teal-950/70 rounded-2xl border border-teal-600/40 shadow-lg shrink-0">
              <Store className="h-8 w-8 text-teal-300" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {store.storeName}
                </h1>
                <Badge className="bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 text-[10px] py-0.5 px-2">
                  Active Dukaan
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-teal-300/90">
                  <MapPin className="h-3.5 w-3.5 text-teal-400" />
                  {store.city} ({store.latitude.toFixed(4)}, {store.longitude.toFixed(4)})
                </span>
                <span>•</span>
                <span className="font-mono text-muted-foreground">
                  Lic: <strong className="text-white">{store.licenseNumber}</strong>
                </span>
                {store.phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3 text-teal-400" />
                      {store.phone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Bulk Import & Add Medicine */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <BulkImportModal storeId={store.id} />
            <AddProductModal storeId={store.id} />
          </div>
        </div>

        {/* Store Quick KPI Micro-Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-teal-900/20 text-xs">
          <div
            onClick={() => setActiveTab("inventory")}
            className="p-2.5 rounded-xl bg-muted/20 border border-teal-900/20 cursor-pointer hover:border-teal-700/40 transition-all"
          >
            <span className="text-[10px] text-muted-foreground block">Inventory Value</span>
            <span className="font-bold text-sm text-emerald-400">
              ₹{Math.round(totalValuation).toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {totalStockUnits} units in stock
            </span>
          </div>

          <div
            onClick={() => setActiveTab("orders")}
            className="p-2.5 rounded-xl bg-muted/20 border border-teal-900/20 cursor-pointer hover:border-teal-700/40 transition-all"
          >
            <span className="text-[10px] text-muted-foreground block">Pending Orders</span>
            <span className="font-bold text-sm text-white">
              {pendingOrdersCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {orders.length} total
              </span>
            </span>
            <span className="text-[10px] text-teal-300 block">Click to view pipeline</span>
          </div>

          <div
            onClick={() => setActiveTab("smartstock")}
            className="p-2.5 rounded-xl bg-muted/20 border border-teal-900/20 cursor-pointer hover:border-teal-700/40 transition-all"
          >
            <span className="text-[10px] text-muted-foreground block">Restock Suggestions</span>
            <span className="font-bold text-sm text-amber-400">
              {restockNeededCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">needed</span>
            </span>
            <span className="text-[10px] text-amber-300/80 block">AI demand signals active</span>
          </div>

          <div
            onClick={() => setActiveTab("expiry")}
            className="p-2.5 rounded-xl bg-muted/20 border border-teal-900/20 cursor-pointer hover:border-teal-700/40 transition-all"
          >
            <span className="text-[10px] text-muted-foreground block">Expiry Warnings</span>
            <span
              className={`font-bold text-sm ${
                criticalExpiryCount > 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {criticalExpiryCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">critical</span>
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {criticalExpiryCount > 0 ? "Eligible for Flash Sale" : "All batches safe"}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Expiry Banner Alert */}
      {criticalExpiryItems.length > 0 && (
        <div className="w-full p-4 rounded-xl bg-red-950/25 border border-red-800/40 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">
                Urgent Expiry Action: {criticalExpiryItems.length} medicine(s) expiring within 30 days!
              </p>
              <p className="text-red-200/90">
                To prevent total inventory write-off, enroll these medicines in <strong>50% Flash Clearance</strong>. They will immediately appear on the patient <strong>Clearance Shelf</strong> for chronic daily patients.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setActiveTab("expiry")}
            className="bg-red-700 hover:bg-red-600 text-white font-medium text-xs shrink-0"
          >
            Manage Clearance
          </Button>
        </div>
      )}

      {/* Full-Width Horizontal Segmented Tab Navigation */}
      <div className="w-full bg-card/80 backdrop-blur-md border border-teal-900/30 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "inventory"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950"
              : "text-muted-foreground hover:text-white hover:bg-muted/30"
          }`}
        >
          <Layers className="h-4 w-4" />
          Inventory Catalog ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950"
              : "text-muted-foreground hover:text-white hover:bg-muted/30"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Orders Pipeline ({orders.length})
          {pendingOrdersCount > 0 && (
            <Badge className="bg-amber-500 text-black text-[10px] px-1.5 py-0 h-4 font-bold">
              {pendingOrdersCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expiry")}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "expiry"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950"
              : "text-muted-foreground hover:text-white hover:bg-muted/30"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Expiry & Clearance Hub
          {criticalExpiryCount > 0 && (
            <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 h-4 font-bold animate-pulse">
              {criticalExpiryCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("smartstock")}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "smartstock"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950"
              : "text-muted-foreground hover:text-white hover:bg-muted/30"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Smart Restock AI
          {restockNeededCount > 0 && (
            <Badge className="bg-amber-500 text-black text-[10px] px-1.5 py-0 h-4 font-bold">
              {restockNeededCount}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "analytics"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950"
              : "text-muted-foreground hover:text-white hover:bg-muted/30"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Sales & Analytics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("geomap")}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "geomap"
              ? "bg-teal-600 text-white shadow-md shadow-teal-950"
              : "text-muted-foreground hover:text-white hover:bg-muted/30"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Storefront GPS & Wayfinder
        </button>
      </div>

      {/* Main Tab Panels - 100% Full Width (Zero Left-Side Obstructions!) */}
      <div className="w-full">
        {/* Tab 1: Inventory Catalog */}
        {activeTab === "inventory" && (
          <div className="w-full animate-in fade-in duration-200">
            <InventoryTable products={products} storeId={store.id} />
          </div>
        )}

        {/* Tab 2: Orders Pipeline */}
        {activeTab === "orders" && (
          <div className="w-full animate-in fade-in duration-200">
            <OrdersManager orders={orders} />
          </div>
        )}

        {/* Tab 3: Expiry & Clearance Hub */}
        {activeTab === "expiry" && (
          <div className="w-full animate-in fade-in duration-200">
            <ExpiryManager products={products} storeId={store.id} />
          </div>
        )}

        {/* Tab 4: Smart Restock AI */}
        {activeTab === "smartstock" && (
          <div className="w-full animate-in fade-in duration-200">
            <SmartStockCard suggestionsData={suggestionsData} />
          </div>
        )}

        {/* Tab 5: Analytics */}
        {activeTab === "analytics" && (
          <div className="w-full animate-in fade-in duration-200">
            <StoreAnalytics analytics={analytics} />
          </div>
        )}

        {/* Tab 6: Storefront GPS Wayfinder */}
        {activeTab === "geomap" && (
          <div className="w-full p-5 rounded-2xl bg-card border border-teal-900/30 space-y-4 shadow-xl animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="h-4 w-4 text-teal-400" />
                  Verified Storefront Coordinates & Neighborhood Wayfinding
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your store is live at ({store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}). Nearby patients discover your catalog and receive turn-by-turn routes to your storefront.
                </p>
              </div>
              <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs shrink-0 w-fit">
                GPS Verified
              </Badge>
            </div>

            <LiveMap
              initialUserLat={store.latitude}
              initialUserLng={store.longitude}
              userLocationName={store.storeName}
              stores={[
                {
                  id: store.id,
                  storeName: store.storeName,
                  storeAddress: store.storeAddress,
                  city: store.city,
                  latitude: store.latitude,
                  longitude: store.longitude,
                  rating: store.rating || 5.0,
                },
              ]}
              height="500px"
            />
          </div>
        )}
      </div>
    </div>
  );
}
