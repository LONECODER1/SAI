import React from "react";
import { getCurrentUser } from "@/actions/onboarding";
import { getPatientAppointments } from "@/actions/patient";
import { getPatientOrders } from "@/actions/orders";
import { getFeaturedMedicines, searchMedicinesAndStores } from "@/actions/medicines";
import { redirect } from "next/navigation";
import DashboardClient from "./_components/dashboard-client";

export const metadata = {
  title: "Patient Dashboard - MedStore",
  description: "Unified Telehealth Consultations & Local Dukaan Telepharmacy Dashboard",
};

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role === "DOCTOR") {
    redirect("/doctor");
  } else if (user.role === "SELLER") {
    redirect("/store");
  } else if (user.role === "ADMIN") {
    redirect("/admin");
  } else if (user.role !== "PATIENT") {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const initialTab = params?.tab || "overview";
  const prescriptionId = params?.prescriptionId || null;
  const query = params?.q || "";
  const category = params?.category || "ALL";

  // Fetch appointments, medicine orders, pharmacy catalog & nearby stores in parallel
  const [appointmentsRes, ordersRes, searchData, featuredData] = await Promise.all([
    getPatientAppointments(),
    getPatientOrders(),
    searchMedicinesAndStores({ query, category, prescriptionId }),
    getFeaturedMedicines(),
  ]);

  const appointments = appointmentsRes.appointments || [];
  const orders = ordersRes.orders || [];
  const products = searchData.products?.length
    ? searchData.products
    : featuredData.products || [];
  const flashClearanceItems = featuredData.flashClearanceItems || [];
  const nearbyStores = searchData.nearbyStores || [];
  const prescribedItems = searchData.prescribedItems || [];

  return (
    <div className="w-full max-w-[1800px] mx-auto pb-6">
      <DashboardClient
        user={user}
        appointments={appointments}
        orders={orders}
        initialProducts={products}
        flashClearanceItems={flashClearanceItems}
        nearbyStores={nearbyStores}
        prescribedItems={prescribedItems}
        prescriptionId={prescriptionId}
        initialTab={initialTab}
      />
    </div>
  );
}
