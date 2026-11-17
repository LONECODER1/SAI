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
  userLat = null,
  userLng = null,
  maxRadiusKm = 30,
  prescriptionId = null,
}) {
  try {
    // Fetch verified active stores
    const allStores = await db.store.findMany({
      where: {
        verificationStatus: "VERIFIED",
        isActive: true,
      },
    });

    // Default coordinates to Bhagalpur area or first verified store
    const defaultLat = allStores.length > 0 ? allStores[0].latitude : 25.2425;
    const defaultLng = allStores.length > 0 ? allStores[0].longitude : 86.9842;
    const lat = userLat ? Number(userLat) : defaultLat;
    const lng = userLng ? Number(userLng) : defaultLng;

    // Haversine proximity sort
    let nearbyStores = findNearbyStores(allStores, lat, lng, maxRadiusKm);

    // If no stores within maxRadiusKm, fallback to all verified stores sorted by distance
    if (nearbyStores.length === 0 && allStores.length > 0) {
      nearbyStores = allStores
        .map((store) => {
          try {
            const distanceKm = calculateHaversineDistance(
              lat,
              lng,
              store.latitude,
              store.longitude
            );
            return { ...store, distanceKm };
          } catch {
            return { ...store, distanceKm: 1.2 };
          }
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

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

/**
 * Retrieves comprehensive details for a single medicine product,
 * including store location coordinates, patient distance, and generic substitutes.
 * Ported & elevated from Medstore-mern: getsingleproduct
 */
export async function getMedicineById(productId, userLat = null, userLng = null) {
  try {
    if (!productId) throw new Error("Product ID is required");

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            storeAddress: true,
            city: true,
            postalCode: true,
            phone: true,
            latitude: true,
            longitude: true,
            rating: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!product) {
      return { product: null, error: "Medicine not found" };
    }

    // Calculate distance from user location
    let distanceKm = null;
    if (userLat && userLng && product.store) {
      try {
        distanceKm = calculateHaversineDistance(
          Number(userLat),
          Number(userLng),
          product.store.latitude,
          product.store.longitude
        );
      } catch {
        distanceKm = null;
      }
    }

    // Check for potential generic substitute
    const sameGenericAlternatives = await db.product.findMany({
      where: {
        id: { not: product.id },
        genericName: product.genericName,
        isActive: true,
        stockQuantity: { gt: 0 },
      },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            city: true,
            rating: true,
          },
        },
      },
      orderBy: { price: "asc" },
      take: 3,
    });

    const genericAlternative = findBestGenericSubstitute(product, sameGenericAlternatives);

    return {
      product: {
        ...product,
        distanceKm,
        genericAlternative,
        expiryEvaluation: evaluateExpiryStatus(product.expiryDate),
      },
      genericSubstitutes: sameGenericAlternatives,
    };
  } catch (error) {
    console.error("Failed to get medicine details:", error);
    return { product: null, error: error.message };
  }
}
