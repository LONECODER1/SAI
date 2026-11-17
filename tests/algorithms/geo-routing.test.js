import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTravelEstimates,
  generateGeodesicRoutePoints,
  generateTurnByTurnDirections,
  calculateRoute,
  getGoogleMapsNavigationUrl,
  evaluateBestPriceAndFastestStores,
  geocodeAddress,
  reverseGeocode,
  TRANSPORT_MODES,
} from "../../lib/algorithms/geo-routing.js";
import { calculateHaversineDistance } from "../../lib/algorithms/haversine.js";

describe("Geo-Routing & Wayfinding Navigation Engine", () => {
  it("should accurately estimate travel times for driving, bicycling, and walking", () => {
    const distanceKm = 6.0; // 6 km trip

    const driveEst = calculateTravelEstimates(distanceKm, TRANSPORT_MODES.DRIVING);
    const bikeEst = calculateTravelEstimates(distanceKm, TRANSPORT_MODES.BICYCLING);
    const walkEst = calculateTravelEstimates(distanceKm, TRANSPORT_MODES.WALKING);

    // Driving at 28 km/h ~ 13 mins + delay
    assert.ok(driveEst.durationMinutes >= 10 && driveEst.durationMinutes <= 20);
    // Bicycling at 16 km/h ~ 22 mins + delay
    assert.ok(bikeEst.durationMinutes >= 20 && bikeEst.durationMinutes <= 30);
    // Walking at 4.8 km/h ~ 75 mins
    assert.ok(walkEst.durationMinutes >= 65 && walkEst.durationMinutes <= 85);

    assert.equal(driveEst.distanceKm, 6);
    assert.ok(driveEst.formattedTime.includes("min"));
  });

  it("should generate geodesic route coordinates connecting start and end points", () => {
    const sLat = 28.6139;
    const sLng = 77.2090;
    const eLat = 28.6328;
    const eLng = 77.2197;

    const points = generateGeodesicRoutePoints(sLat, sLng, eLat, eLng, 16);

    assert.ok(Array.isArray(points));
    assert.equal(points.length, 17); // steps + 1

    // First point must be start
    assert.equal(points[0][0], sLat);
    assert.equal(points[0][1], sLng);

    // Last point must be end
    assert.equal(points[points.length - 1][0], eLat);
    assert.equal(points[points.length - 1][1], eLng);

    // Intermediate points should be strictly between or near the bounds
    for (const pt of points) {
      assert.ok(typeof pt[0] === "number" && typeof pt[1] === "number");
      assert.ok(pt[0] >= 28.5 && pt[0] <= 28.8);
      assert.ok(pt[1] >= 77.1 && pt[1] <= 77.3);
    }
  });

  it("should generate structured turn-by-turn navigation steps", () => {
    const steps = generateTurnByTurnDirections({
      startLat: 19.0760,
      startLng: 72.8777,
      endLat: 19.0950,
      endLng: 72.8900,
      startName: "Patient Home",
      endName: "Apex Dukaan",
      mode: TRANSPORT_MODES.DRIVING,
    });

    assert.ok(Array.isArray(steps));
    assert.ok(steps.length >= 3, `Expected at least 3 steps, got ${steps.length}`);

    // Must start with departure and conclude with arrival
    assert.equal(steps[0].type, "depart");
    assert.ok(steps[0].instruction.includes("Patient Home"));

    const lastStep = steps[steps.length - 1];
    assert.equal(lastStep.type, "arrive");
    assert.ok(lastStep.instruction.includes("Apex Dukaan"));
  });

  it("should compute complete wayfinding route with fallback when offline", async () => {
    const route = await calculateRoute({
      startLat: 28.6139,
      startLng: 77.2090,
      endLat: 28.6250,
      endLng: 77.2180,
      startName: "My Location",
      endName: "Connaught Dukaan",
      mode: TRANSPORT_MODES.DRIVING,
    });

    assert.ok(route !== null);
    assert.ok(route.distanceKm > 0);
    assert.ok(route.durationMinutes > 0);
    assert.ok(Array.isArray(route.coordinates));
    assert.ok(route.coordinates.length > 5);
    assert.ok(Array.isArray(route.steps));
    assert.ok(route.googleMapsUrl.includes("google.com/maps/dir"));
  });

  it("should build valid Google Maps turn-by-turn navigation URLs", () => {
    const url = getGoogleMapsNavigationUrl(
      19.0760,
      72.8777,
      19.0850,
      72.8850,
      TRANSPORT_MODES.WALKING
    );

    assert.ok(url.startsWith("https://www.google.com/maps/dir/?api=1"));
    assert.ok(url.includes("origin=19.076,72.8777"));
    assert.ok(url.includes("destination=19.085,72.885"));
    assert.ok(url.includes("travelmode=walking"));
  });

  it("should evaluate and identify fastest store and lowest price store", () => {
    const userLat = 28.6139;
    const userLng = 77.2090;

    const mockStores = [
      {
        id: "s1",
        storeName: "Apex Medico",
        latitude: 28.6180, // ~0.5 km
        longitude: 77.2120,
        averagePrice: 150,
      },
      {
        id: "s2",
        storeName: "MediLife Discount Chemist",
        latitude: 28.6350, // ~2.5 km
        longitude: 77.2250,
        averagePrice: 95, // Much cheaper!
      },
      {
        id: "s3",
        storeName: "Distant Pharmacy",
        latitude: 28.7000, // ~10 km
        longitude: 77.3000,
        averagePrice: 200,
      },
    ];

    const result = evaluateBestPriceAndFastestStores(userLat, userLng, mockStores);

    assert.ok(result.fastestStore !== null);
    assert.equal(result.fastestStore.id, "s1"); // Closest

    assert.ok(result.bestPriceStore !== null);
    assert.equal(result.bestPriceStore.id, "s2"); // Lowest price
  });

  it("should geocode address queries using built-in dictionary and fallbacks", async () => {
    const results = await geocodeAddress("Bandra West, Mumbai");
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0);
    assert.equal(results[0].city, "Mumbai");
    assert.ok(results[0].lat > 19.0 && results[0].lat < 19.2);
  });

  it("should reverse geocode coordinates into readable locality names", async () => {
    // Connaught Place coordinates
    const address = await reverseGeocode(28.6315, 77.2167);
    assert.ok(address.includes("New Delhi") || address.includes("Connaught"));
  });
});
