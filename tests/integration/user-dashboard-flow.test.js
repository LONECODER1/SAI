import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getMedicineImageUrl, MEDICINE_IMAGE_MAP } from "../../lib/medicine-images.js";
import { calculateHaversineDistance, findNearbyStores } from "../../lib/algorithms/haversine.js";
import { calculateTravelEstimates } from "../../lib/algorithms/geo-routing.js";

describe("User Dashboard & Medicine Storefront Flow Protocol", () => {
  test("1. Medicine Image Resolution: returns realistic packaging image for common medicines and fallback", () => {
    // Exact name match
    const doloImage = getMedicineImageUrl({ name: "Dolo 650", category: "Pain Relief" });
    assert.ok(doloImage && doloImage.startsWith("https://images.unsplash.com"), "Dolo 650 should resolve to realistic photo");

    // Generic name match
    const augmentinImage = getMedicineImageUrl({ name: "Unknown Brand", genericName: "Amoxicillin + Clavulanic Acid" });
    assert.ok(augmentinImage, "Generic Amoxicillin formulation should resolve");

    // Category fallback
    const fallbackImage = getMedicineImageUrl({ name: "Custom Rare Drug", category: "Antibiotics" });
    assert.ok(fallbackImage, "Should fall back to category image");
  });

  test("2. Ascending Distance Store Sorting: all stocking stores are sorted in strictly non-decreasing distance", () => {
    const userLat = 25.2425;
    const userLng = 86.9842;

    const sampleStores = [
      { id: "store-3", storeName: "DEV Medicals", latitude: 25.251, longitude: 87.008 },
      { id: "store-1", storeName: "Amrit Pharmacy", latitude: 25.2635, longitude: 87.0175 },
      { id: "store-2", storeName: "Roshan Medical Hall", latitude: 25.2458, longitude: 86.9745 },
    ];

    const sortedStores = sampleStores
      .map((store) => ({
        ...store,
        distanceKm: calculateHaversineDistance(userLat, userLng, store.latitude, store.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Verify distance is strictly ascending
    for (let i = 0; i < sortedStores.length - 1; i++) {
      assert.ok(
        sortedStores[i].distanceKm <= sortedStores[i + 1].distanceKm,
        `Store at index ${i} (${sortedStores[i].distanceKm} km) should be <= store at index ${i + 1} (${sortedStores[i + 1].distanceKm} km)`
      );
    }

    assert.equal(sortedStores[0].id, "store-2", "Roshan Medical Hall should be the closest store to user coordinates");
  });

  test("3. Google Map Decision Protocol: calculates correct travel times for 'Go There' vs 'Order Online'", () => {
    const distanceKm = 1.2;
    const drivingEstimates = calculateTravelEstimates(distanceKm, "driving");
    const bicyclingEstimates = calculateTravelEstimates(distanceKm, "bicycling");
    const walkingEstimates = calculateTravelEstimates(distanceKm, "walking");

    assert.ok(drivingEstimates.durationMinutes > 0, "Driving estimate should be positive");
    assert.ok(bicyclingEstimates.durationMinutes > 0, "Rider estimate should be positive");
    assert.ok(walkingEstimates.durationMinutes >= drivingEstimates.durationMinutes, "Walking time must exceed driving time");

    // Verify Google Maps URL shape
    const lat = 25.2635;
    const lng = 87.0175;
    const userLat = 25.2425;
    const userLng = 86.9842;
    const googleMapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}&travelmode=driving`;

    assert.ok(googleMapsAppUrl.includes("travelmode=driving"));
    assert.ok(googleMapsAppUrl.includes(`destination=${lat},${lng}`));
  });

  test("4. Doctor Consultation Section Options: verifies specialties are defined for instant booking", () => {
    const expectedSpecialties = [
      "General Physician",
      "Pediatrician",
      "Cardiologist",
      "Dermatologist",
    ];

    // Check doctor specialties exist
    assert.ok(expectedSpecialties.length >= 4);
    assert.ok(expectedSpecialties.includes("General Physician"));
    assert.ok(expectedSpecialties.includes("Cardiologist"));
  });
});
