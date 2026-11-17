"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import ConsultationHero from "./consultation-hero";
import FlashClearanceShelf from "./flash-clearance-shelf";
import MedicineCatalog from "./medicine-catalog";
import CartDrawer from "./cart-drawer";

export default function MedicinesClient({
  initialProducts = [],
  flashClearanceItems = [],
  nearbyStores = [],
  upcomingAppointment = null,
  prescribedItems = [],
  prescriptionId = null,
}) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (product) => {
    // If cart has items from another store, notify patient
    if (cartItems.length > 0 && cartItems[0].storeId !== product.storeId) {
      toast.warning("Pharmacy items must be ordered from the same store. Your basket has been refreshed with this local dukaan.");
      setCartItems([{ ...product, quantity: 1 }]);
      setIsCartOpen(true);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    toast.success(`Added ${product.name} to basket`);
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

  const cartTotal = cartItems.reduce((acc, item) => {
    const price = item.isFlashSale && item.flashSalePrice ? item.flashSalePrice : item.price;
    return acc + price * item.quantity;
  }, 0);

  const cartItemIds = cartItems.map((i) => i.id);

  return (
    <div className="space-y-10 pb-24">
      {/* 1. TOP HERO SECTION: Doctor Consultation Suggestion & Upcoming Video Consult */}
      <ConsultationHero upcomingAppointment={upcomingAppointment} />

      {/* Prescription Linked Banner if arriving from consultation */}
      {prescribedItems.length > 0 && (
        <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              Prescription Matched from Your Doctor Consultation
            </h4>
            <p className="text-xs text-teal-300/80 mt-0.5">
              We found your {prescribedItems.length} prescribed medications across local verified stores with best-price comparison.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              // Auto-add prescribed items
              prescribedItems.forEach((rxItem) => {
                const match = initialProducts.find(
                  (p) =>
                    p.name.toLowerCase().includes(rxItem.medicineName.toLowerCase()) ||
                    (p.genericName && rxItem.genericName && p.genericName.toLowerCase().includes(rxItem.genericName.toLowerCase()))
                );
                if (match) handleAddToCart(match);
              });
              setIsCartOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
          >
            Fulfill All Prescribed Meds
          </Button>
        </div>
      )}

      {/* 2. SUGGESTION 2: FLASH CLEARANCE HUB (Near-Expiry Daily Chronic Medicines @ 50% OFF) */}
      <FlashClearanceShelf
        items={flashClearanceItems}
        onAddToCart={handleAddToCart}
        cartItemIds={cartItemIds}
      />

      {/* 3. TATA 1MG-STYLE LOCAL MEDICINE STOREFRONT & SUGGESTION 1 GENERIC SAVINGS */}
      <MedicineCatalog
        initialProducts={initialProducts}
        nearbyStores={nearbyStores}
        onAddToCart={handleAddToCart}
        cartItemIds={cartItemIds}
      />

      {/* Floating Cart Button */}
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

      {/* Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        prescriptionId={prescriptionId}
      />
    </div>
  );
}
