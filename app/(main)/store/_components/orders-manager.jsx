"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/store";
import useFetch from "@/hooks/use-fetch";

const STATUS_CONFIG = {
  PENDING: { label: "New Order", color: "bg-amber-900/30 text-amber-300 border-amber-700/40" },
  ACCEPTED: { label: "Accepted", color: "bg-blue-900/30 text-blue-300 border-blue-700/40" },
  PREPARING: { label: "Preparing / Packing", color: "bg-indigo-900/30 text-indigo-300 border-indigo-700/40" },
  READY_FOR_PICKUP: { label: "Ready for Pickup", color: "bg-teal-900/30 text-teal-300 border-teal-700/40" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-purple-900/30 text-purple-300 border-purple-700/40" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-900/30 text-emerald-300 border-emerald-700/40" },
  CANCELLED: { label: "Cancelled", color: "bg-red-900/30 text-red-300 border-red-700/40" },
};

export default function OrdersManager({ orders = [] }) {
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const { fn: updateStatus, loading } = useFetch(updateOrderStatusAction);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("status", newStatus);

    const res = await updateStatus(formData);
    setUpdatingId(null);

    if (res?.success) {
      toast.success(`Order status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
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
                ? "bg-teal-600 hover:bg-teal-700 text-white text-xs"
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
          <p className="text-white font-medium">No orders found in this status</p>
          <p className="text-xs text-muted-foreground mt-1">New incoming patient orders will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;

            return (
              <div
                key={order.id}
                className="p-5 rounded-xl bg-card border border-teal-900/20 hover:border-teal-700/40 transition-all space-y-4"
              >
                {/* Header: Order #, Status, Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-muted/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-teal-400">
                      {order.orderNumber}
                    </span>
                    <Badge variant="outline" className={`text-xs ${statusMeta.color}`}>
                      {statusMeta.label}
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
                      {order.patient?.name || "Patient Customer"}
                    </p>
                    {order.customerPhone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {order.customerPhone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-teal-400" />
                      Delivery Address
                    </p>
                    <p className="line-clamp-2">{order.deliveryAddress}</p>
                  </div>
                </div>

                {/* Items Ordered */}
                <div className="p-3 rounded-lg bg-muted/20 border border-teal-900/10 space-y-2">
                  <p className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> Items Ordered:
                  </p>
                  <div className="space-y-1.5">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs text-white"
                      >
                        <span>
                          {item.product?.name || "Medicine"} ×{" "}
                          <span className="text-teal-400 font-bold">{item.quantity}</span>
                        </span>
                        <span className="font-medium">₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-muted/20 pt-2 flex items-center justify-between text-sm font-bold text-white">
                    <span>Total Amount</span>
                    <span className="text-teal-400">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Action: Status Advancement */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">
                    Update Order Progression:
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select
                      defaultValue={order.status}
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                      disabled={updatingId === order.id}
                    >
                      <SelectTrigger className="w-full sm:w-48 bg-muted/30 border-teal-800/40 text-xs">
                        {updatingId === order.id ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                          </span>
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">New Order (Pending)</SelectItem>
                        <SelectItem value="ACCEPTED">Accept Order</SelectItem>
                        <SelectItem value="PREPARING">Preparing & Packing</SelectItem>
                        <SelectItem value="READY_FOR_PICKUP">Ready for Pickup</SelectItem>
                        <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                        <SelectItem value="DELIVERED">Delivered / Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancel Order</SelectItem>
                      </SelectContent>
                    </Select>
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
