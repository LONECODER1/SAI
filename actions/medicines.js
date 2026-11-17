"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { findNearbyStores, calculateHaversineDistance } from "@/lib/algorithms/haversine";
import { findBestGenericSubstitute } from "@/lib/algorithms/generic-substitute";
import { evaluateExpiryStatus } from "@/lib/algorithms/expiry-engine";

/**
 * Retrieves curated products for the patient storefront discovery shelf
 * Ported & elevated from Medstore-mern: getrandomproducts
 */
export async function getFeaturedMedicines() {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { gt: 0 },
        store: {
          verificationStatus: "VERIFIED",
          isActive: true,
        },
      },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            city: true,
            latitude: true,
            longitude: true,
            rating: true,
          },
        },
      },
      take: 24,
      orderBy: { createdAt: "desc" },
    });

    // Separate flash clearance items (Suggestion 2)
    const flashClearanceItems = products
      .filter((p) => p.isFlashSale && p.flashSalePrice)
      .map((p) => ({
        ...p,
        expiryEvaluation: evaluateExpiryStatus(p.expiryDate),
      }));

    return {
      products,
      flashClearanceItems,
    };
  } catch (error) {
    console.error("Failed to fetch featured medicines:", error);
    return { products: [], flashClearanceItems: [], error: error.message };
  }
}

/**
 * Searches medicines, evaluates nearby stores via Haversine, and checks generic alternatives
 * Ported & elevated from Medstore-mern: searchProduct
 */
export async function searchMedicinesAndStores({
  query = "",
  category = "ALL",
  userLat = 28.6139,
  userLng = 77.2090,
  maxRadiusKm = 20,
  prescriptionId = null,
}) {
  try {
    const lat = Number(userLat) || 28.6139;
    const lng = Number(userLng) || 77.2090;

    // Fetch verified active stores
    const allStores = await db.store.findMany({
      where: {
        verificationStatus: "VERIFIED",
        isActive: true,
      },
    });

    // Haversine proximity sort
    const nearbyStores = findNearbyStores(allStores, lat, lng, maxRadiusKm);
    const nearbyStoreIds = nearbyStores.map((s) => s.id);

    // If searching from a doctor prescription
    let prescribedItems = [];
    if (prescriptionId) {
      const rx = await db.prescription.findUnique({
        where: { id: prescriptionId },
        include: { items: true, doctor: { select: { name: true, specialty: true } } },
      });
      if (rx) {
        prescribedItems = rx.items || [];
      }
    }

    // Build product search filter
    const whereClause = {
      isActive: true,
      stockQuantity: { gt: 0 },
      storeId: { in: nearbyStoreIds },
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (query && query.trim()) {
      whereClause.OR = [
        { name: { contains: query.trim(), mode: "insensitive" } },
        { genericName: { contains: query.trim(), mode: "insensitive" } },
        { description: { contains: query.trim(), mode: "insensitive" } },
      ];

      // Record DemandSignal for patient search
      await db.demandSignal.create({
        data: {
          medicineName: query.trim(),
          latitude: lat,
          longitude: lng,
          signalType: "SEARCH",
          weight: 0.5,
        },
      });
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            storeAddress: true,
            city: true,
            latitude: true,
            longitude: true,
            rating: true,
          },
        },
      },
      orderBy: { price: "asc" }, // Show cheapest first
    });

    // Attach store distance and check Suggestion 1: Generic Alternatives
    const enrichedProducts = products.map((prod) => {
      const storeWithDist = nearbyStores.find((s) => s.id === prod.storeId);
      const distanceKm = storeWithDist ? storeWithDist.distanceKm : null;

      // Check for cheaper generic alternatives among all available products
      const genericAlternative = findBestGenericSubstitute(prod, products);

      return {
        ...prod,
        distanceKm,
        genericAlternative,
        expiryEvaluation: evaluateExpiryStatus(prod.expiryDate),
      };
    });

    return {
      products: enrichedProducts,
      nearbyStores,
      prescribedItems,
    };
  } catch (error) {
    console.error("Failed to search medicines:", error);
    return { products: [], nearbyStores: [], prescribedItems: [], error: error.message };
  }
}
