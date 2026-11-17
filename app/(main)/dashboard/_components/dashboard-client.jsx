"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Stethoscope,
  Pill,
  Calendar,
  ShoppingBag,
  Clock,
  Video,
  CreditCard,
  Store,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  Search,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppointmentCard } from "@/components/appointment-card";
import MedicineCatalog from "@/app/(main)/medicines/_components/medicine-catalog";
import FlashClearanceShelf from "@/app/(main)/medicines/_components/flash-clearance-shelf";
import CartDrawer from "@/app/(main)/medicines/_components/cart-drawer";
import LiveMap from "@/components/map/live-map";
import { SPECIALTIES } from "@/lib/specialities";
import { toast } from "sonner";

export default function DashboardClient({
  user,
  appointments = [],
  orders = [],
  initialProducts = [],
  flashClearanceItems = [],
  nearbyStores = [],
  prescribedItems = [],
  prescriptionId = null,
  initialTab = "overview",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const validTabs = ["overview", "doctors", "medicines", "orders"];
  const tabFromQuery = searchParams.get("tab");
  const [internalTab, setInternalTab] = useState(initialTab);
  const activeTab = (tabFromQuery && validTabs.includes(tabFromQuery)) ? tabFromQuery : internalTab;

  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activePrescriptionId, setActivePrescriptionId] = useState(prescriptionId);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  const setActiveTab = (newTab) => {
    setInternalTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", newTab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  // Cart operations
  const handleAddToCart = (product) => {
    if (cartItems.length > 0 && cartItems[0].storeId !== product.storeId) {
      toast.warning(
        "Pharmacy items must be ordered from the same dukaan. Cart updated to this store."
      );
      setCartItems([{ ...product, quantity: 1 }]);
      setIsCartOpen(true);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    toast.success(`Added ${product.name} to pharmacy basket`);
  };

  const handleUpdateQuantity = (productId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // 1-Click Move from Doctor Prescription -> Medicine Storefront
  const handleOrderPrescriptionMeds = (prescription) => {
    setActivePrescriptionId(prescription.id);
    setActiveTab("medicines");
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "medicines");
    params.set("prescriptionId", prescription.id);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });

    // Auto-match items from prescription into cart
    let addedCount = 0;
    if (prescription.items && prescription.items.length > 0) {
      prescription.items.forEach((rxItem) => {
        const match = initialProducts.find(
          (p) =>
            p.name.toLowerCase().includes(rxItem.medicineName.toLowerCase()) ||
            (p.genericName &&
              rxItem.genericName &&
              p.genericName.toLowerCase().includes(rxItem.genericName.toLowerCase()))
        );
        if (match) {
          handleAddToCart(match);
          addedCount++;
        }
      });
    }

    if (addedCount > 0) {
      toast.success(
        `Matched ${addedCount} prescribed medication(s) from local verified Dukaan!`
      );
      setIsCartOpen(true);
    } else {
      toast.info(
        "Switched to Medicines storefront. Search your local Dukaan catalog below."
      );
    }
  };

  // Find next upcoming appointment
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (a) => a.status === "SCHEDULED" && new Date(a.startTime) >= now
  );
  const nextAppointment = upcomingAppointments[0] || null;

  // Active / in-progress orders
  const activeOrders = orders.filter(
    (o) => o.status === "PENDING" || o.status === "ACCEPTED" || o.status === "PREPARING"
  );
  const latestActiveOrder = activeOrders[0] || null;

  // Prescriptions count
  const allPrescriptions = appointments
    .filter((a) => a.prescription)
    .map((a) => ({ ...a.prescription, doctor: a.doctor, appointmentDate: a.startTime }));

  const cartTotal = cartItems.reduce((acc, item) => {
    const price = item.isFlashSale && item.flashSalePrice ? item.flashSalePrice : item.price;
    return acc + price * item.quantity;
  }, 0);

  const cartItemIds = cartItems.map((i) => i.id);

  return (
    <div className="space-y-8 pb-20">
      {/* 1. TOP EXECUTIVE HEADER: Patient Profile & Health Metric Tiles */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-950/60 via-card to-background border border-teal-900/40 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="bg-teal-900/40 border-teal-700/50 text-teal-300 text-xs px-2.5 py-0.5"
              >
                <Sparkles className="h-3 w-3 mr-1 text-teal-400" />
                Unified Health & Telepharmacy Hub
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || "Patient"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Manage doctor consultations, join encrypted video rooms, order prescribed medicines from verified local Dukaans, and track deliveries—all in one place.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-muted/20 border border-teal-900/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-teal-400 mb-1">
                <CreditCard className="h-4 w-4 mr-1" />
                <span className="text-lg font-bold text-white">{user?.credits || 0}</span>
              </div>
              <span className="text-[11px] text-muted-foreground block">Consult Credits</span>
            </div>

            <div className="bg-muted/20 border border-teal-900/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-teal-400 mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-lg font-bold text-white">{upcomingAppointments.length}</span>
              </div>
              <span className="text-[11px] text-muted-foreground block">Upcoming Consults</span>
            </div>

            <div className="bg-muted/20 border border-teal-900/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-teal-400 mb-1">
                <FileText className="h-4 w-4 mr-1" />
                <span className="text-lg font-bold text-white">{allPrescriptions.length}</span>
              </div>
              <span className="text-[11px] text-muted-foreground block">E-Prescriptions</span>
            </div>

            <div className="bg-muted/20 border border-teal-900/30 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-teal-400 mb-1">
                <ShoppingBag className="h-4 w-4 mr-1" />
                <span className="text-lg font-bold text-white">{orders.length}</span>
              </div>
              <span className="text-[11px] text-muted-foreground block">Dukaan Orders</span>
            </div>
          </div>
        </div>

        {/* 2. DUAL-INTERFACE SWITCHER: Smooth Movement between Both Parts */}
        <div className="mt-8 pt-6 border-t border-teal-900/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/60 border border-teal-900/40 backdrop-blur-md">
            <button
              onClick={() => handleTabChange("overview")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "overview"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-muted-foreground hover:text-white hover:bg-muted/30"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Dual Overview</span>
            </button>

            <button
              onClick={() => handleTabChange("doctors")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "doctors"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-muted-foreground hover:text-white hover:bg-muted/30"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5 text-teal-300" />
              <span>Doctor Consultations</span>
              {upcomingAppointments.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => handleTabChange("medicines")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "medicines"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-muted-foreground hover:text-white hover:bg-muted/30"
              }`}
            >
              <Pill className="h-3.5 w-3.5 text-cyan-300" />
              <span>Medicines & Dukaan Store</span>
            </button>

            <button
              onClick={() => handleTabChange("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === "orders"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                  : "text-muted-foreground hover:text-white hover:bg-muted/30"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
              <span>Orders & Prescriptions</span>
              {activeOrders.length > 0 && (
                <Badge className="h-4 px-1.5 text-[10px] bg-amber-500 text-black font-bold">
                  {activeOrders.length}
                </Badge>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTabChange("doctors")}
              className="border-teal-800/40 text-teal-300 hover:bg-teal-900/30 text-xs"
            >
              <Stethoscope className="h-3.5 w-3.5 mr-1" />
              Find Specialist
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 shadow-md shadow-teal-900/30"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DUAL OVERVIEW (Both Interfaces Coordinated)       */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Linked Hero: Doctor Consultation Card + Pharmacy Live Order Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PART 1 SNAPSHOT: DOCTOR CONSULTATION & UPCOMING VIDEO */}
            <Card className="border-teal-900/30 bg-card hover:border-teal-700/50 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-900/30 text-teal-400">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">
                        Doctor Consultations
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Encrypted Vonage video appointments & e-prescriptions
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange("doctors")}
                    className="text-teal-400 hover:text-teal-300 text-xs gap-1"
                  >
                    Open View <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                {nextAppointment ? (
                  <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-teal-900/40 border border-teal-600/50 text-teal-300 text-xs gap-1">
                        <Clock className="h-3 w-3" /> Next Consultation
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(nextAppointment.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-900/40 border border-teal-600/30 flex items-center justify-center font-bold text-teal-300">
                        Dr
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          Dr. {nextAppointment.doctor?.name || "Specialist"}
                        </h4>
                        <p className="text-xs text-teal-400">
                          {nextAppointment.doctor?.specialty}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleTabChange("doctors")}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Enter Doctor Video Room
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 rounded-xl bg-muted/10 border border-teal-900/20">
                    <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <h4 className="text-sm font-semibold text-white">No upcoming consults</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Need medical advice? Book an immediate video appointment with a verified specialist.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleTabChange("doctors")}
                      className="mt-3 bg-teal-600 hover:bg-teal-700 text-xs"
                    >
                      Book a Doctor (10 min)
                    </Button>
                  </div>
                )}

                {/* Quick Specialist Pills */}
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-2 font-medium">
                    Fast Specialty Access:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SPECIALTIES.slice(0, 4).map((spec) => (
                      <Link key={spec.name} href={`/doctors/${encodeURIComponent(spec.name)}`}>
                        <Badge
                          variant="outline"
                          className="border-teal-800/40 hover:border-teal-600 bg-muted/20 hover:bg-teal-900/20 text-teal-300 text-[11px] py-0.5 px-2 cursor-pointer transition-all"
                        >
                          {spec.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PART 2 SNAPSHOT: MEDICINE DISCOVERY & DUKAAN ORDERS */}
            <Card className="border-teal-900/30 bg-card hover:border-teal-700/50 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-900/30 text-teal-400">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">
                        Medicines & Local Dukaans
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Tata 1mg-style storefront & nearest pharmacy delivery
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTabChange("medicines")}
                    className="text-teal-400 hover:text-teal-300 text-xs gap-1"
                  >
                    Open Storefront <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                {latestActiveOrder ? (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-950/40 border border-amber-600/50 text-amber-300 text-xs gap-1">
                        <Truck className="h-3 w-3" /> Active Delivery Order
                      </Badge>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {latestActiveOrder.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-teal-400" />
                        {latestActiveOrder.store?.storeName || "Verified Dukaan"}
                      </span>
                      <span className="text-muted-foreground">
                        Status: <strong className="text-amber-300">{latestActiveOrder.status}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-1.5 rounded-full transition-all"
                        style={{
                          width:
                            latestActiveOrder.status === "DELIVERED"
                              ? "100%"
                              : latestActiveOrder.status === "PREPARING"
                              ? "65%"
                              : "30%",
                        }}
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleTabChange("orders")}
                      variant="outline"
                      className="w-full border-amber-700/50 text-amber-300 hover:bg-amber-900/30 text-xs"
                    >
                      Track Order & View Receipt
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-900/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Find Local Pharmacy Meds</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Nearby verified stores delivering in 30 mins with generic savings.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleTabChange("medicines")}
                      className="bg-teal-600 hover:bg-teal-700 text-xs"
                    >
                      Browse Catalog
                    </Button>
                  </div>
                )}

                {/* Flash Clearance Spotlight */}
                {flashClearanceItems.length > 0 && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/30 to-amber-950/30 border border-red-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                        🔥 50% OFF Clearance Deal:
                      </span>
                      <Badge className="bg-red-900/40 border border-red-700 text-red-300 text-[10px]">
                        Save & Liquidate
                      </Badge>
                    </div>
                    <p className="text-xs text-white mt-1 font-semibold truncate">
                      {flashClearanceItems[0].name} (₹{flashClearanceItems[0].flashSalePrice}{" "}
                      <span className="line-through text-muted-foreground font-normal">
                        ₹{flashClearanceItems[0].price}
                      </span>
                      )
                    </p>
                    <button
                      onClick={() => {
                        handleAddToCart(flashClearanceItems[0]);
                      }}
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold mt-1 inline-flex items-center gap-1"
                    >
                      Add to basket & save 50% <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Connected Prescription -> Dukaan Quick Pipeline */}
          {allPrescriptions.length > 0 && (
            <div className="rounded-2xl border border-teal-900/40 bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-400" />
                    Active E-Prescriptions from Your Consultations
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Directly order certified medications prescribed by your doctors from verified local Dukaans.
                  </p>
                </div>
                <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs">
                  {allPrescriptions.length} Prescription(s) Available
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {allPrescriptions.slice(0, 2).map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-teal-400 font-semibold">
                          Dr. {rx.doctor?.name || "Specialist"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(rx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {rx.diagnosis && (
                        <p className="text-xs text-white font-medium mt-1">
                          Diagnosis: {rx.diagnosis}
                        </p>
                      )}
                      <div className="mt-2 space-y-1">
                        {rx.items?.map((item) => (
                          <div
                            key={item.id}
                            className="text-xs text-muted-foreground flex justify-between"
                          >
                            <span>• {item.medicineName}</span>
                            <span className="text-teal-300 font-mono">
                              {item.quantity} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleOrderPrescriptionMeds(rx)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-md"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Fulfill Meds at Nearest Dukaan (1-Click)
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DOCTOR CONSULTATIONS & TELEHEALTH INTERFACE       */}
      {/* ========================================================= */}
      {activeTab === "doctors" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-muted/20">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-400" />
                Your Consultations & Digital Care Room
              </h2>
              <p className="text-xs text-muted-foreground">
                Join active video calls, view clinical notes, and access e-prescriptions.
              </p>
            </div>

            <Badge variant="outline" className="border-teal-700/40 text-teal-300 text-xs py-1 px-3">
              <Sparkles className="h-3 w-3 mr-1 text-teal-400" />
              Direct In-Dashboard Scheduling
            </Badge>
          </div>

          {/* Embedded Specialty Booking Grid */}
          <div className="p-5 rounded-2xl bg-card border border-teal-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-teal-400" />
                  Consult a Specialist by Medical Discipline
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select a category to view verified doctors and schedule an instant video slot.
                </p>
              </div>
              <Badge variant="outline" className="border-teal-700 text-teal-300 text-xs">
                {SPECIALTIES.length} Disciplines Available
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
              {SPECIALTIES.map((specialty) => (
                <Link
                  key={specialty.name}
                  href={`/doctors/${encodeURIComponent(specialty.name)}`}
                  className="group"
                >
                  <Card className="hover:border-teal-700/50 hover:bg-teal-950/20 transition-all cursor-pointer border-teal-900/20 h-full p-3 text-center flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-teal-900/30 flex items-center justify-center mb-1.5 text-teal-400 group-hover:scale-110 transition-transform">
                      <div>{specialty.icon}</div>
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {specialty.name}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pt-2">
                <Calendar className="h-4 w-4 text-teal-400" />
                Scheduled Consultations ({appointments.length})
              </h3>
              {appointments.map((appointment) => (
                <div key={appointment.id} className="relative">
                  <AppointmentCard
                    appointment={appointment}
                    userRole="PATIENT"
                  />
                  {/* Action bridge to order prescription */}
                  {appointment.prescription && (
                    <div className="mt-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOrderPrescriptionMeds(appointment.prescription)}
                        className="border-teal-700 text-teal-300 hover:bg-teal-900/30 text-xs gap-1.5"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Switch to Store & Fulfill Prescription
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-teal-900/20 bg-card py-10 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-base font-bold text-white mb-1">
                No active appointments scheduled
              </h3>
              <p className="text-muted-foreground text-xs max-w-md mx-auto">
                Choose any specialty discipline above to connect with a certified physician in under 10 minutes.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MEDICINES & DUKAAN STOREFRONT INTERFACE            */}
      {/* ========================================================= */}
      {activeTab === "medicines" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Prescription Notification Banner if active */}
          {activePrescriptionId && (
            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  Filtering for Your Active Prescription
                </h4>
                <p className="text-xs text-teal-300/80 mt-0.5">
                  Showing lowest local prices from verified Dukaans in your radius.
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setActivePrescriptionId(null);
                  const params = new URLSearchParams(window.location.search);
                  params.delete("prescriptionId");
                  router.replace(`/dashboard?${params.toString()}`, { scroll: false });
                }}
                className="text-xs text-teal-400 hover:text-white"
              >
                Clear Filter
              </Button>
            </div>
          )}

          {/* Flash Clearance Shelf (Suggestion 2 from AGENTS.md) */}
          <FlashClearanceShelf
            items={flashClearanceItems}
            onAddToCart={handleAddToCart}
            cartItemIds={cartItemIds}
          />

          {/* Tata 1mg-Style Catalog & Generic Savings (Suggestion 1 from AGENTS.md) */}
          <MedicineCatalog
            initialProducts={initialProducts}
            nearbyStores={nearbyStores}
            onAddToCart={handleAddToCart}
            cartItemIds={cartItemIds}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PRESCRIPTIONS & ORDERS HISTORY                    */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="pb-2 border-b border-muted/20">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-teal-400" />
              Medicine Orders & Fulfillments
            </h2>
            <p className="text-xs text-muted-foreground">
              Track real-time Dukaan order progression from dispatch to doorstep delivery.
            </p>
          </div>

          {orders.length === 0 ? (
            <Card className="text-center py-12 bg-card border-teal-900/20">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">No Medicine Orders Placed Yet</h3>
              <p className="text-muted-foreground text-xs max-w-md mx-auto mb-4">
                Order prescription refills or browse over-the-counter essentials from verified pharmacies near you.
              </p>
              <Button
                onClick={() => handleTabChange("medicines")}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
              >
                Explore Medicines Storefront
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="bg-card border-teal-900/30 hover:border-teal-700/40 transition-all p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-muted/20 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-teal-400">
                        {order.orderNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          order.status === "DELIVERED"
                            ? "bg-emerald-950/30 border-emerald-700 text-emerald-400 text-xs"
                            : order.status === "CANCELLED"
                            ? "bg-red-950/30 border-red-700 text-red-400 text-xs"
                            : "bg-amber-950/30 border-amber-700 text-amber-300 text-xs"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Ordered: {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs text-muted-foreground">
                    <div>
                      <span className="text-white font-semibold block flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-teal-400" />
                        Fulfilling Dukaan: {order.store?.storeName || "Verified Pharmacy"}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block">
                        Phone: {order.store?.phone || "Verified Store"}
                      </span>
                      <span className="text-muted-foreground block">
                        Delivery Address: {order.deliveryAddress}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between sm:items-end gap-2">
                      <div className="text-left sm:text-right">
                        <span className="text-white font-bold text-sm block">
                          ₹{order.totalAmount}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          {order.items?.length || 0} items ({order.deliveryType})
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setTrackingOrderId(
                            trackingOrderId === order.id ? null : order.id
                          )
                        }
                        className="border-teal-700/50 text-teal-300 hover:bg-teal-950/40 text-xs h-7 gap-1"
                      >
                        <Truck className="h-3 w-3" />
                        {trackingOrderId === order.id
                          ? "Hide Route Map"
                          : "Track Live Delivery Route"}
                      </Button>
                    </div>
                  </div>

                  {/* Live Delivery Route Map Viewer */}
                  {trackingOrderId === order.id && (
                    <div className="mt-4 pt-3 border-t border-teal-900/30 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs text-teal-300">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-teal-400" />
                          Live Delivery Route: {order.store?.storeName || "Dukaan"} ➔ Your Doorstep
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          Delivery Status: <strong className="text-teal-300">{order.status}</strong>
                        </span>
                      </div>

                      <LiveMap
                        initialUserLat={order.store?.latitude || 28.6185}
                        initialUserLng={order.store?.longitude || 77.2125}
                        userLocationName={order.store?.storeName || "Fulfilling Dukaan"}
                        stores={[
                          {
                            id: "delivery-destination",
                            storeName: `Delivery to: ${order.deliveryAddress || "Home"}`,
                            storeAddress: order.deliveryAddress,
                            city: order.store?.city || "Local Area",
                            latitude: (order.store?.latitude || 28.6185) + 0.012,
                            longitude: (order.store?.longitude || 77.2125) + 0.015,
                            rating: 5.0,
                          },
                        ]}
                        height="360px"
                      />
                    </div>
                  )}

                  {/* Order Items Detail */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-muted/10 space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <span className="text-white">
                            {item.product?.name || "Medicine"} x {item.quantity}
                          </span>
                          <span className="font-mono">₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Launcher Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4">
          <Button
            size="lg"
            onClick={() => setIsCartOpen(true)}
            className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold shadow-2xl shadow-teal-950 gap-3 px-6 rounded-full border border-teal-400/30"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <span>View Basket (₹{cartTotal})</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Slide-Over Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        prescriptionId={activePrescriptionId}
      />
    </div>
  );
}
