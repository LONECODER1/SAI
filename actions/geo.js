"use server";

import { db } from "@/lib/prisma";
import {
  calculateRoute,
  geocodeAddress,
  reverseGeocode,
  evaluateBestPriceAndFastestStores,
  calculateTravelEstimates,
  TRANSPORT_MODES,
} from "@/lib/algorithms/geo-routing";
import { calculateHaversineDistance } from "@/lib/algorithms/haversine";

/**
 * Server action to compute route and turn-by-turn navigation between any two locations.
 */
export async function getRouteAction({
  startLat,
  startLng,
  endLat,
  endLng,
  startName = "Your Location",
  endName = "Local Dukaan",
  mode = "driving",
}) {
  try {
    const route = await calculateRoute({
      startLat: Number(startLat),
      startLng: Number(startLng),
      endLat: Number(endLat),
      endLng: Number(endLng),
      startName,
      endName,
      mode,
    });

    return { success: true, route };
  } catch (error) {
    console.error("Failed to calculate route:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server action to search text addresses into geo-coordinates.
 */
export async function searchAddressAction(query) {
  try {
    const results = await geocodeAddress(query);
    return { success: true, results };
  } catch (error) {
    console.error("Address search error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server action to reverse geocode coordinates into a human-readable address.
 */
export async function reverseGeocodeAction(lat, lng) {
  try {
    const address = await reverseGeocode(Number(lat), Number(lng));
    return { success: true, address };
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server action to get route from user coordinates to a specific registered store.
 */
export async function getStoreWayfindingAction({ userLat, userLng, storeId, mode = "driving" }) {
  try {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        storeName: true,
        storeAddress: true,
        city: true,
        latitude: true,
        longitude: true,
        phone: true,
        rating: true,
      },
    });

    if (!store) {
      return { success: false, error: "Store not found" };
    }

    const route = await calculateRoute({
      startLat: Number(userLat),
      startLng: Number(userLng),
      endLat: store.latitude,
      endLng: store.longitude,
      startName: "Your Location",
      endName: store.storeName,
      mode,
    });

    return {
      success: true,
      store,
      route,
    };
  } catch (error) {
    console.error("Store wayfinding error:", error);
    return { success: false, error: error.message };
  }
}
