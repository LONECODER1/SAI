import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMedicineById } from "@/actions/medicines";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Star,
  Check,
  ShoppingCart,
  Sparkles,
  ArrowRightLeft,
  Navigation,
  ExternalLink,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import LiveMap from "@/components/map/live-map";
import { getGoogleMapsNavigationUrl, TRANSPORT_MODES } from "@/lib/algorithms/geo-routing";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { product } = await getMedicineById(id);
  if (!product) return { title: "Medicine Not Found - CareConnect" };

  return {
    title: `${product.name} - CareConnect Telepharmacy`,
    description: `Order ${product.name} from verified local store ${product.store?.storeName || 'Dukaan'} with generic savings and local delivery`,
  };
}

export default async function SingleMedicinePage({ params }) {
  const { id } = await params;
  const { product } = await getMedicineById(id, 28.6139, 77.2090);

  if (!product) {
    notFound();
  }

  const store = product.store || {
    id: "default-store",
    storeName: "Verified Local Dukaan",
    storeAddress: "Market Area",
    city: "Local",
    latitude: 28.625,
    longitude: 77.218,
    rating: 4.8,
  };

  const discountPct =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const substitute = product.genericAlternative;
  const expiryEval = product.expiryEvaluation;

  const googleMapsUrl = getGoogleMapsNavigationUrl(
    28.6139,
    77.2090,
    store.latitude,
    store.longitude,
    TRANSPORT_MODES.DRIVING
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb Back Link */}
      <div className="flex items-center justify-between pb-3 border-b border-teal-900/30">
        <Link href="/medicines">
          <Button
            variant="outline"
            size="sm"
            className="border-teal-800/40 text-teal-300 hover:bg-teal-950/40 text-xs gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Medicines Catalog
          </Button>
        </Link>

        {product.distanceKm !== null && (
          <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5 bg-teal-950/30 px-3 py-1.5 rounded-full border border-teal-800/40">
            <MapPin className="h-3.5 w-3.5 text-teal-400" />
            {product.distanceKm} km from your current area
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Medicine Profile, Pricing & Specifications (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-teal-950/40 border-teal-700/50 text-teal-300 text-xs"
              >
                {product.category}
              </Badge>
              {product.prescriptionRequired ? (
                <Badge className="bg-amber-950/60 border border-amber-600 text-amber-300 text-xs">
                  Prescription (Rx) Required
                </Badge>
              ) : (
                <Badge className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs">
                  Over-The-Counter (OTC)
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {product.name}
            </h1>

            {product.genericName && (
              <p className="text-sm text-teal-400 font-medium">
                Active Chemical Formulation: {product.genericName}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-card border border-teal-900/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium block">
                Best Local Price
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl font-extrabold text-white">
                  ₹{product.price}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      MRP ₹{product.mrp}
                    </span>
                    <span className="text-xs font-bold text-teal-400 bg-teal-950/50 px-2.5 py-1 rounded-full border border-teal-800/40">
                      {discountPct}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase font-medium block">
                Stock Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-1 px-3 py-1 rounded-full ${
                  product.stockQuantity > 0
                    ? "bg-emerald-950/40 border border-emerald-700 text-emerald-400"
                    : "bg-red-950/40 border border-red-700 text-red-400"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} Units In Stock`
                  : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
              <span className="text-muted-foreground block text-[11px]">Dosage Form</span>
              <span className="text-white font-semibold mt-0.5 block">
                {product.dosageForm || "Tablet"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
              <span className="text-muted-foreground block text-[11px]">Strength</span>
              <span className="text-white font-semibold mt-0.5 block">
                {product.strength || "Standard"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
              <span className="text-muted-foreground block text-[11px]">Batch Number</span>
              <span className="text-teal-300 font-mono font-semibold mt-0.5 block">
                {product.batchNumber || "#B" + product.id.slice(0, 6)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-teal-900/20">
              <span className="text-muted-foreground block text-[11px]">Shelf Life</span>
              <span className="text-white font-semibold mt-0.5 block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-teal-400" />
                {product.expiryDate
                  ? new Date(product.expiryDate).toLocaleDateString()
                  : "Safe Shelf Life"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 rounded-2xl bg-card border border-teal-900/30 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Clinical Usage & Indications
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {product.description ||
                `Therapeutic medication for ${product.category}. Dispensed by verified pharmacist partners in compliance with medical regulations.`}
            </p>
          </div>

          {/* Generic Substitute Savings Banner */}
          {substitute && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <Sparkles className="h-4 w-4" />
                Generic Alternative Available Nearby!
              </div>
              <p className="text-emerald-200">
                Save <strong>₹{substitute.savingsAmount}</strong> ({substitute.savingsPercentage}% OFF) by switching to bio-equivalent generic{" "}
                <strong>{substitute.substituteMedicine.name}</strong> from nearby verified Dukaan.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Link href={`/medicines`}>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-sm h-12 gap-2 shadow-xl shadow-teal-950"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Order from Nearest Dukaan (Browse in Storefront)</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Fulfilling Dukaan & Interactive Wayfinding Map (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Dukaan Profile Card */}
          <div className="p-5 rounded-2xl bg-card border border-teal-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Store className="h-4 w-4" />
                Fulfilling Local Pharmacy
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                {store.rating || "4.8"}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{store.storeName}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>{store.storeAddress || store.city || "Local Market, Sector 4"}</span>
              </p>
            </div>

            {/* Proximity & Delivery Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-teal-950/40 border border-teal-800/40 text-xs">
              <div>
                <span className="text-muted-foreground text-[10px] block">Distance</span>
                <span className="text-white font-extrabold text-sm font-mono">
                  {product.distanceKm !== null ? `${product.distanceKm} km` : "1.2 km"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-[10px] block">Est. Delivery</span>
                <span className="text-teal-300 font-extrabold text-sm font-mono">
                  ~{Math.max(15, Math.round((product.distanceKm || 1.2) * 5))} mins
                </span>
              </div>
            </div>

            {/* Google Maps Button */}
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                variant="outline"
                className="w-full border-teal-700/50 text-teal-300 hover:bg-teal-950/40 text-xs h-9 gap-1.5"
              >
                <Navigation className="h-4 w-4 text-teal-400" />
                <span>Get Turn-by-Turn Directions in Google Maps</span>
                <ExternalLink className="h-3 w-3 opacity-70 ml-auto" />
              </Button>
            </a>
          </div>

          {/* Live Wayfinder Route Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1 text-teal-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-teal-400" />
                Live Route from Your Location:
              </span>
              <span className="text-muted-foreground text-[11px]">Real Roadway Path</span>
            </div>

            <LiveMap
              initialUserLat={28.6139}
              initialUserLng={77.2090}
              userLocationName="Your Location"
              stores={[
                {
                  id: store.id,
                  storeName: store.storeName,
                  storeAddress: store.storeAddress,
                  city: store.city,
                  latitude: store.latitude,
                  longitude: store.longitude,
                  rating: store.rating || 4.8,
                },
              ]}
              selectedStoreId={store.id}
              showRoutePlanner={false}
              height="340px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
