import React from "react";
import { redirect } from "next/navigation";
import {
  getCurrentStore,
  getStoreInventory,
  getStoreOrders,
  getStoreAnalytics,
  getStoreSmartStockSuggestions,
} from "@/actions/store";
import StoreDashboardClient from "./_components/store-dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dukaan Dashboard - MedStore",
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

  // Expiry check
  const criticalExpiryItems = products.filter(
    (p) => p.evaluatedExpiryStatus === "CRITICAL_EXPIRY"
  );
  const lowStockItems = products.filter((p) => p.isLowStock);

  return (
    <div className="w-full">
      <StoreDashboardClient
        store={store}
        products={products}
        orders={orders}
        analytics={analytics}
        suggestionsData={suggestionsData}
        criticalExpiryItems={criticalExpiryItems}
        lowStockItems={lowStockItems}
      />
    </div>
  );
}
