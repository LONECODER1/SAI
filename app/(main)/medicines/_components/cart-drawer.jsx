"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  MapPin,
  Phone,
  CheckCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { createMedicineOrder } from "@/actions/orders";
import useFetch from "@/hooks/use-fetch";

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  prescriptionId = null,
}) {
  const [deliveryType, setDeliveryType] = useState("HOME_DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Flat 402, Green Valley Apartments, Andheri West, Mumbai"
  );
  const [customerPhone, setCustomerPhone] = useState("+91 9876543210");
  const [orderComplete, setOrderComplete] = useState(null);

  const { fn: submitOrder, loading } = useFetch(createMedicineOrder);

  // Group items by store (since orders are placed per store)
  const primaryStoreId = cartItems[0]?.storeId;
  const primaryStoreName = cartItems[0]?.store?.storeName || "Local Dukaan";

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.isFlashSale && item.flashSalePrice ? item.flashSalePrice : item.price;
    return acc + price * item.quantity;
  }, 0);

  const deliveryFee = deliveryType === "HOME_DELIVERY" ? 30 : 0;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!deliveryAddress || !customerPhone) {
      toast.error("Please provide your delivery address and contact phone number");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const payload = {
      storeId: primaryStoreId,
      prescriptionId,
      deliveryAddress,
      customerPhone,
      deliveryType,
      items: cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };

    const res = await submitOrder(payload);
    if (res?.success) {
      toast.success("Medicine order placed successfully!");
      setOrderComplete(res.order);
      onClearCart();
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleClose = () => {
    setOrderComplete(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto bg-card border-teal-900/40 p-6">
        {orderComplete ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-10 w-10" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Order Confirmed!
            </DialogTitle>
            <DialogDescription className="text-xs">
              Your order <span className="font-mono text-teal-400 font-bold">{orderComplete.orderNumber}</span> has been dispatched to <span className="text-white font-medium">{primaryStoreName}</span>.
            </DialogDescription>

            <div className="p-4 rounded-xl bg-muted/20 border border-muted/30 text-left text-xs space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Fulfillment Mode:</span>
                <span className="text-white font-medium">
                  {deliveryType === "HOME_DELIVERY" ? "Doorstep Delivery (45 Mins)" : "Store Counter Pickup (15 Mins)"}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Amount:</span>
                <span className="text-teal-400 font-bold text-sm">₹{orderComplete.totalAmount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Status:</span>
                <span className="text-amber-400 font-medium">Preparing at Dukaan</span>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-teal-400" />
                Your Medicine Basket ({cartItems.length} items)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Fulfilling from <span className="text-teal-300 font-semibold">{primaryStoreName}</span>
              </DialogDescription>
            </DialogHeader>

            {cartItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Your basket is empty. Browse medicines below to add.
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                {/* Cart Items List */}
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {cartItems.map((item) => {
                    const price = item.isFlashSale && item.flashSalePrice ? item.flashSalePrice : item.price;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-muted/20 border border-teal-900/20 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 max-w-[200px]">
                          <span className="font-semibold text-white block truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-teal-400">
                            ₹{price} each
                          </span>
                          {item.isFlashSale && (
                            <span className="text-[10px] text-amber-400 block font-semibold">
                              Flash Clearance Price
                            </span>
                          )}
                        </div>

                        {/* Quantity adjuster */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-md">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 text-muted-foreground hover:text-white"
                              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center font-bold text-white">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 text-muted-foreground hover:text-white"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Mode Toggle */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fulfillment Choice</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={deliveryType === "HOME_DELIVERY" ? "default" : "outline"}
                      onClick={() => setDeliveryType("HOME_DELIVERY")}
                      className={
                        deliveryType === "HOME_DELIVERY"
                          ? "bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 gap-1.5"
                          : "border-teal-900/30 text-xs h-9 gap-1.5"
                      }
                    >
                      <Truck className="h-3.5 w-3.5" /> Home Delivery (₹30)
                    </Button>
                    <Button
                      type="button"
                      variant={deliveryType === "STORE_PICKUP" ? "default" : "outline"}
                      onClick={() => setDeliveryType("STORE_PICKUP")}
                      className={
                        deliveryType === "STORE_PICKUP"
                          ? "bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 gap-1.5"
                          : "border-teal-900/30 text-xs h-9 gap-1.5"
                      }
                    >
                      <Store className="h-3.5 w-3.5" /> Counter Pickup (Free)
                    </Button>
                  </div>
                </div>

                {/* Address & Phone Inputs */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="deliveryAddress" className="text-xs">
                      Delivery Address *
                    </Label>
                    <Input
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="customerPhone" className="text-xs">
                      Contact Phone *
                    </Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-3 rounded-lg bg-muted/30 border border-teal-900/20 text-xs space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Medicines Subtotal:</span>
                    <span className="text-white font-medium">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Charge:</span>
                    <span className="text-white font-medium">
                      {deliveryFee > 0 ? `₹${deliveryFee}` : "FREE"}
                    </span>
                  </div>
                  <div className="border-t border-muted/30 pt-1.5 flex justify-between text-sm font-bold text-white">
                    <span>Total Payable:</span>
                    <span className="text-teal-400">₹{total}</span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <Button
                  type="submit"
                  disabled={loading || cartItems.length === 0}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 gap-2 shadow-lg shadow-teal-950"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Place Order (Cash / Counter Pay)
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
