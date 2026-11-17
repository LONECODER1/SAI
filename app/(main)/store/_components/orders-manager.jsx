"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Loader2,
  FileText,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/store";
import useFetch from "@/hooks/use-fetch";

const STATUS_CONFIG = {
  PENDING: {
    label: "New Incoming",
    color: "bg-amber-900/40 text-amber-300 border-amber-700/50",
    nextStatus: "ACCEPTED",
    nextLabel: "Accept Order",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-blue-900/40 text-blue-300 border-blue-700/50",
    nextStatus: "PREPARING",
    nextLabel: "Start Preparing & Packing",
  },
  PREPARING: {
    label: "Preparing / Packing",
    color: "bg-indigo-900/40 text-indigo-300 border-indigo-700/50",
    nextStatus: "OUT_FOR_DELIVERY",
    nextLabel: "Dispatch for Delivery",
  },
  READY_FOR_PICKUP: {
    label: "Ready for Pickup",
    color: "bg-teal-900/40 text-teal-300 border-teal-700/50",
    nextStatus: "DELIVERED",
    nextLabel: "Mark Delivered / Handed Over",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    color: "bg-purple-900/40 text-purple-300 border-purple-700/50",
    nextStatus: "DELIVERED",
    nextLabel: "Mark Delivered",
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
    nextStatus: null,
    nextLabel: null,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-900/40 text-red-300 border-red-700/50",
    nextStatus: null,
    nextLabel: null,
  },
};

export default function OrdersManager({ orders = [] }) {
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const { fn: updateStatus, loading } = useFetch(updateOrderStatusAction);

  const handleAdvanceStatus = async (orderId, newStatus) => {
    if (!newStatus) return;
    setUpdatingId(orderId);
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("status", newStatus);

    const res = await updateStatus(formData);
    setUpdatingId(null);

    if (res?.success) {
      toast.success(
        `Order progressed to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`
      );
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? This will mark the order as CANCELLED."
      )
    ) {
      return;
    }

    setUpdatingId(orderId);
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("status", "CANCELLED");

    const res = await updateStatus(formData);
    setUpdatingId(null);

    if (res?.success) {
      toast.info("Order marked as cancelled");
    } else if (res?.error) {
      toast.error(res.error);
    }
  };

  const filteredOrders =
    selectedFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ALL", "PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
          <Button
            key={st}
            variant={selectedFilter === st ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(st)}
            className={
              selectedFilter === st
                ? "bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
                : "border-teal-900/30 text-muted-foreground text-xs"
            }
          >
            {st === "ALL" ? "All Orders" : STATUS_CONFIG[st]?.label || st}
            {st !== "ALL" && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-muted/40 text-[10px]">
                {orders.filter((o) => o.status === st).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-muted/10 rounded-xl border border-teal-900/20">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-white font-medium">No orders in this status</p>
          <p className="text-xs text-muted-foreground mt-1">
            Incoming patient orders from doctors or direct shopping will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const isProcessing = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="p-5 rounded-xl bg-card border border-teal-900/30 hover:border-teal-700/50 transition-all space-y-4"
              >
                {/* Header: Order #, Status Badge, Prescription Badge, Placed Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-muted/20 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-teal-400">
                      {order.orderNumber}
                    </span>
                    <Badge variant="outline" className={`text-xs ${statusMeta.color}`}>
                      {statusMeta.label}
                    </Badge>
                    {order.prescriptionId && (
                      <Badge className="bg-teal-950/80 border border-teal-700/60 text-teal-300 text-xs gap-1">
                        <FileText className="h-3 w-3" />
                        Doctor E-Prescription Order
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-teal-900/30 text-muted-foreground text-xs">
                      {order.deliveryType === "HOME_DELIVERY" ? "Home Delivery" : "Store Pickup"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Placed: {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Customer Details & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="space-y-1">
                    <p className="text-white font-medium flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-teal-400" />
                      {order.patient?.name || "Patient Customer"} ({order.patient?.email || "N/A"})
                    </p>
                    {order.customerPhone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-teal-400" />
                        {order.customerPhone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-teal-400" />
                      Delivery Destination
                    </p>
                    <p className="line-clamp-2 text-zinc-300">{order.deliveryAddress}</p>
                  </div>
                </div>

                {/* Items Ordered List */}
                <div className="p-3.5 rounded-lg bg-muted/20 border border-teal-900/20 space-y-2">
                  <p className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> Itemized Order Breakdown:
                  </p>
                  <div className="divide-y divide-muted/20">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="py-1.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-white">{item.product?.name}</span>
                          {item.product?.strength && (
                            <span className="text-muted-foreground ml-1">
                              ({item.product.strength})
                            </span>
                          )}
                          <span className="text-teal-400/90 ml-2">
                            × {item.quantity} units
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-zinc-200">
                          ₹{item.totalPrice}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Subtotal / Delivery / Total */}
                  <div className="pt-2 border-t border-muted/30 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Subtotal: ₹{order.subtotal} {order.deliveryFee > 0 ? `+ ₹${order.deliveryFee} Delivery` : ""}
                    </span>
                    <span className="text-sm font-bold text-teal-300">
                      Grand Total: ₹{order.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Pipeline Progression Stepper Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-muted-foreground">
                    Current Step: <strong className="text-white">{statusMeta.label}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Next Progression Step Button */}
                    {statusMeta.nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => handleAdvanceStatus(order.id, statusMeta.nextStatus)}
                        disabled={isProcessing}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-md shadow-teal-950/40"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                        {statusMeta.nextLabel}
                      </Button>
                    )}

                    {/* Direct Quick Delivered Button for Pickups */}
                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdvanceStatus(order.id, "DELIVERED")}
                        disabled={isProcessing}
                        className="border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/30 text-xs gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Instant Mark Delivered
                      </Button>
                    )}

                    {/* Cancel Button */}
                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={isProcessing}
                        className="text-red-400 hover:bg-red-950/30 text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
