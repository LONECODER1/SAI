import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateHaversineDistance,
  findNearbyStores,
} from "../../lib/algorithms/haversine.js";

describe("Haversine Geodesic Distance Engine", () => {
  it("should calculate correct distance between Mumbai and Pune (~120 km)", () => {
    // Mumbai: 19.0760° N, 72.8777° E
    // Pune: 18.5204° N, 73.8567° E
    const distance = calculateHaversineDistance(19.076, 72.8777, 18.5204, 73.8567);
    assert.ok(distance > 115 && distance < 125, `Expected ~120km, got ${distance}`);
  });

  it("should return 0 when coordinates are identical", () => {
    const distance = calculateHaversineDistance(28.6139, 77.209, 28.6139, 77.209);
    assert.equal(distance, 0);
  });

  it("should accurately calculate short urban neighborhood distances (~1-2 km)", () => {
    // Two points roughly 1.5 km apart in Delhi
    const distance = calculateHaversineDistance(28.6139, 77.209, 28.625, 77.218);
    assert.ok(distance > 1.0 && distance < 2.5, `Expected ~1.5km, got ${distance}`);
  });

  it("should filter and sort nearby stores by proximity", () => {
    const userLat = 19.076;
    const userLng = 72.8777;

    const mockStores = [
      { id: "store-far", name: "Distant Store", latitude: 18.5204, longitude: 73.8567 }, // ~120km
      { id: "store-near", name: "Local Dukaan", latitude: 19.08, longitude: 72.88 }, // ~0.5km
      { id: "store-mid", name: "Metro Pharmacy", latitude: 19.12, longitude: 72.9 }, // ~5km
    ];

    const nearbyStores = findNearbyStores(mockStores, userLat, userLng, 10);

    assert.equal(nearbyStores.length, 2);
    assert.equal(nearbyStores[0].id, "store-near");
    assert.equal(nearbyStores[1].id, "store-mid");
    assert.ok(nearbyStores[0].distanceKm < nearbyStores[1].distanceKm);
  });

  it("should throw on missing coordinates", () => {
    assert.throws(() => calculateHaversineDistance(19.076, 72.8777), /required/);
  });
});
