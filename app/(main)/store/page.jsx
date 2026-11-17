import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getCurrentStore,
  getStoreInventory,
  getStoreOrders,
  getStoreAnalytics,
  getStoreSmartStockSuggestions,
} from "@/actions/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

import InventoryTable from "./_components/inventory-table";
import AddProductModal from "./_components/add-product-modal";
import BulkImportModal from "./_components/bulk-import-modal";
import OrdersManager from "./_components/orders-manager";
import StoreAnalytics from "./_components/store-analytics";
import SmartStockCard from "./_components/smart-stock-card";
import ExpiryManager from "./_components/expiry-manager";
import LiveMap from "@/components/map/live-map";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dukaan Dashboard - CareConnect",
  description: "Manage pharmacy inventory, expiry warnings, orders, and restock intelligence",
};

export default async function StoreDashboardPage() {
  const { store, user } = await getCurrentStore();

  if (!user || user.role !== "SELLER") {
    redirect("/onboarding");
  }

  if (!store || store.verificationStatus !== "VERIFIED") {
    redirect("/store/verification");
  }

  const [inventoryData, ordersData, analyticsData, suggestionsData] =
    await Promise.all([
      getStoreInventory(),
      getStoreOrders(),
      getStoreAnalytics(),
      getStoreSmartStockSuggestions(),
    ]);

  const products = inventoryData.products || [];
  const orders = ordersData.orders || [];
  const analytics = analyticsData.analytics || null;
  const suggestions = suggestionsData.suggestions || [];

  // Expiry check
  const criticalExpiryItems = products.filter(
    (p) => p.evaluatedExpiryStatus === "CRITICAL_EXPIRY"
  );
  const lowStockItems = products.filter((p) => p.isLowStock);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back to Home & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="border-teal-900/30 text-teal-400 hover:bg-teal-900/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-teal-950/40 border-teal-700/50 text-teal-300 gap-1.5 py-1 px-3"
          >
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            Verified Pharmacy Partner
          </Badge>
        </div>
      </div>

      {/* Top Banner: Store Details & Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-card via-card to-teal-950/20 border border-teal-900/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-900/30 rounded-xl border border-teal-700/40">
              <Store className="h-8 w-8 text-teal-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {store.storeName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-400" />
                  {store.city} ({store.latitude.toFixed(4)}, {store.longitude.toFixed(4)})
                </span>
                <span>•</span>
                <span className="font-mono text-teal-300">
                  License: {store.licenseNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Medicine & Bulk Import Modals */}
        <div className="flex flex-wrap items-center gap-2.5">
          <BulkImportModal storeId={store.id} />
          <AddProductModal storeId={store.id} />
        </div>
      </div>

      {/* Critical Expiry Banner (Suggestion 2 Alert) */}
      {criticalExpiryItems.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs text-red-200 space-y-1">
            <p className="font-semibold text-white">
              Expiry Warning: {criticalExpiryItems.length} medicine(s) expiring within 30 days!
            </p>
            <p className="text-red-300/90">
              To prevent complete inventory write-offs, click <strong>&quot;Flash Sale @ 50%&quot;</strong> on the affected medicines in your inventory below. They will immediately appear on the patient <strong>Clearance Shelf</strong> for daily chronic-care patients.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="bg-muted/30 border border-teal-900/30 p-1 rounded-xl flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            Inventory Catalog ({products.length})
          </TabsTrigger>

          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Orders Pipeline ({orders.length})
          </TabsTrigger>

          <TabsTrigger
            value="expiry"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Expiry & Clearance Hub
            {criticalExpiryItems.length > 0 && (
              <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 h-4">
                {criticalExpiryItems.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="smartstock"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Smart Restock AI
            {(suggestionsData?.summary?.criticalCount || 0) > 0 ? (
              <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 h-4">
                {suggestionsData.summary.criticalCount}
              </Badge>
            ) : (suggestionsData?.summary?.reorderCount || 0) > 0 ? (
              <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4">
                {suggestionsData.summary.reorderCount}
              </Badge>
            ) : null}
          </TabsTrigger>

          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Sales & Income Analytics
          </TabsTrigger>

          <TabsTrigger
            value="geomap"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Storefront GPS & Wayfinder
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Inventory Catalog */}
        <TabsContent value="inventory" className="space-y-4">
          <InventoryTable products={products} storeId={store.id} />
        </TabsContent>

        {/* Tab 2: Orders Pipeline */}
        <TabsContent value="orders" className="space-y-4">
          <OrdersManager orders={orders} />
        </TabsContent>

        {/* Tab 3: Expiry & Clearance Hub */}
        <TabsContent value="expiry" className="space-y-4">
          <ExpiryManager products={products} storeId={store.id} />
        </TabsContent>

        {/* Tab 4: Smart Restock AI */}
        <TabsContent value="smartstock" className="space-y-4">
          <SmartStockCard suggestionsData={suggestionsData} />
        </TabsContent>

        {/* Tab 4: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <StoreAnalytics analytics={analytics} />
        </TabsContent>

        {/* Tab 5: Storefront GPS Pin & Live Wayfinder */}
        <TabsContent value="geomap" className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-teal-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-400" />
                  Verified Storefront Coordinates & Neighborhood Wayfinding
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your store is active at ({store.latitude.toFixed(6)}, {store.longitude.toFixed(6)}). Patients in your 10km delivery radius discover your catalog and receive turn-by-turn routes here.
                </p>
              </div>
              <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs">
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
              height="480px"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
