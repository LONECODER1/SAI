"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, ShoppingCart, Check, Tag } from "lucide-react";

export default function FlashClearanceShelf({ items = [], onAddToCart, cartItemIds = [] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Zap className="h-5 w-5 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Flash Clearance Hub (Save up to 50% on Daily Essentials)
            </h3>
            <p className="text-xs text-amber-300/80">
              Verified medicines near expiry (30–60 days) from local dukaans. Ideal for immediate 30-day chronic courses!
            </p>
          </div>
        </div>
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-600/40 text-xs self-start sm:self-center">
          Limited Local Stock
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const inCart = cartItemIds.includes(item.id);
          const daysLeft = item.expiryEvaluation?.daysRemaining || 45;

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-gradient-to-b from-card to-amber-950/20 border border-amber-800/40 hover:border-amber-600 transition-all flex flex-col justify-between space-y-3 relative group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <Badge variant="outline" className="border-amber-700/60 text-amber-300 text-[10px] gap-1">
                    <Clock className="h-3 w-3" /> {daysLeft} Days Expiry
                  </Badge>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    50% OFF
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h4>
                  {item.dosageForm && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.dosageForm} {item.strength ? `• ${item.strength}` : ""}
                    </p>
                  )}
                  {item.store?.storeName && (
                    <p className="text-[10px] text-teal-400 font-medium mt-1">
                      From: {item.store.storeName}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-amber-900/30 flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-amber-400">
                    ₹{item.flashSalePrice || Math.round(item.price * 0.5)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through ml-1.5">
                    ₹{item.price}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() => onAddToCart(item)}
                  disabled={inCart}
                  className={
                    inCart
                      ? "bg-emerald-700 text-white text-xs h-8"
                      : "bg-amber-600 hover:bg-amber-700 text-black font-bold text-xs h-8 gap-1.5"
                  }
                >
                  {inCart ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" /> Grab Deal
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
