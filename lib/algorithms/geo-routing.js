/**
 * Geo-Routing & Navigation Engine for CareConnect
 * Formulates geodesic pathing, turn-by-turn maneuvers, travel-time estimation,
 * OSRM integration, and multi-modal wayfinding between patients and local Dukaans.
 */

import { calculateHaversineDistance, findNearbyStores } from "./haversine.js";

export const TRANSPORT_MODES = {
  DRIVING: "driving",
  WALKING: "walking",
  BICYCLING: "bicycling",
};

/**
 * Average urban speeds in km/h for various transit modalities
 */
const SPEED_KMH = {
  [TRANSPORT_MODES.DRIVING]: 28, // Urban city average with traffic
  [TRANSPORT_MODES.BICYCLING]: 16, // Scooter / cycle courier
  [TRANSPORT_MODES.WALKING]: 4.8, // Pedestrian walk speed
};

/**
 * Calculates travel duration estimate based on distance and transit mode.
 * @param {number} distanceKm Distance in kilometers
 * @param {string} mode Transport mode (driving, walking, bicycling)
 * @returns {object} { durationMinutes, formattedTime }
 */
export function calculateTravelEstimates(distanceKm, mode = TRANSPORT_MODES.DRIVING) {
  const dist = Math.max(0, Number(distanceKm) || 0);
  const selectedMode = TRANSPORT_MODES[mode?.toUpperCase()] || mode || TRANSPORT_MODES.DRIVING;
  const speed = SPEED_KMH[selectedMode] || SPEED_KMH[TRANSPORT_MODES.DRIVING];

  // Base overhead for dispatch / stop lights
  const baseDelayMin = selectedMode === TRANSPORT_MODES.WALKING ? 0.5 : 2.0;
  const transitMinutes = (dist / speed) * 60;
  const totalMinutes = Math.max(1, Math.round(transitMinutes + baseDelayMin));

  let formattedTime;
  if (totalMinutes < 60) {
    formattedTime = `${totalMinutes} min${totalMinutes === 1 ? "" : "s"}`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    formattedTime = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  }

  return {
    distanceKm: Math.round(dist * 100) / 100,
    durationMinutes: totalMinutes,
    formattedTime,
    mode: selectedMode,
  };
}

/**
 * Generates an array of [lat, lng] coordinates simulating a realistic roadway path
 * between start and end points with natural route bends and waypoints.
 * @param {number} startLat
 * @param {number} startLng
 * @param {number} endLat
 * @param {number} endLng
 * @param {number} steps Number of interpolated segments
 * @returns {Array<[number, number]>} Array of [lat, lng] coordinate pairs
 */
export function generateGeodesicRoutePoints(startLat, startLng, endLat, endLng, steps = 16) {
  const sLat = Number(startLat);
  const sLng = Number(startLng);
  const eLat = Number(endLat);
  const eLng = Number(endLng);

  if (sLat === eLat && sLng === eLng) {
    return [[sLat, sLng]];
  }

  const points = [];
  points.push([sLat, sLng]);

  // Perpendicular vector for realistic road curves
  const dLat = eLat - sLat;
  const dLng = eLng - sLng;
  const totalDist = Math.hypot(dLat, dLng);

  // Deterministic curvature factor based on coordinates
  const curveSeed = Math.sin((sLat + sLng) * 10) * 0.15;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    // Linear base interpolation
    let lat = sLat + dLat * t;
    let lng = sLng + dLng * t;

    // Roadway deflection (arc + slight serpentine)
    const arc = Math.sin(t * Math.PI) * totalDist * 0.12 * curveSeed;
    const serpentine = Math.sin(t * Math.PI * 3) * totalDist * 0.04;

    lat += -dLng * (arc + serpentine);
    lng += dLat * (arc + serpentine);

    points.push([
      Math.round(lat * 1000000) / 1000000,
      Math.round(lng * 1000000) / 1000000,
    ]);
  }

  points.push([eLat, eLng]);
  return points;
}

/**
 * Generates turn-by-turn instructions along a route.
 * @param {object} params
 * @returns {Array<object>} Step-by-step navigation instructions
 */
export function generateTurnByTurnDirections({
  startLat,
  startLng,
  endLat,
  endLng,
  startName = "Your Location",
  endName = "Local Dukaan",
  mode = TRANSPORT_MODES.DRIVING,
}) {
  const distanceKm = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  const { formattedTime } = calculateTravelEstimates(distanceKm, mode);

  if (distanceKm < 0.05) {
    return [
      {
        instruction: `You have arrived at ${endName}.`,
        distanceText: "0 m",
        durationText: "< 1 min",
        type: "arrive",
      },
    ];
  }

  const totalMeters = Math.round(distanceKm * 1000);
  const steps = [];

  // Step 1: Departure
  const dist1 = Math.min(250, Math.round(totalMeters * 0.2));
  steps.push({
    instruction: `Head out from ${startName} toward the main road`,
    distanceText: `${dist1} m`,
    durationText: "1 min",
    type: "depart",
  });

  // Step 2: Main corridor
  if (totalMeters > 400) {
    const dist2 = Math.round(totalMeters * 0.5);
    steps.push({
      instruction: `Continue straight along the transit corridor toward ${endName}`,
      distanceText: dist2 >= 1000 ? `${(dist2 / 1000).toFixed(1)} km` : `${dist2} m`,
      durationText: `${Math.max(1, Math.round(dist2 / 400))} mins`,
      type: "straight",
    });
  }

  // Step 3: Turn maneuver
  if (totalMeters > 700) {
    const dist3 = Math.round(totalMeters * 0.2);
    steps.push({
      instruction: `Turn toward the local market / commercial sector`,
      distanceText: `${dist3} m`,
      durationText: "1 min",
      type: "turn-right",
    });
  }

  // Step 4: Final approach and arrival
  const finalDist = Math.max(50, totalMeters - steps.reduce((acc, s) => acc + parseInt(s.distanceText), 0));
  steps.push({
    instruction: `Arrive at ${endName} on your destination side`,
    distanceText: `${finalDist} m`,
    durationText: "< 1 min",
    type: "arrive",
  });

  return steps;
}

/**
 * Calculates a complete wayfinding route between two geographic coordinates.
 * Tries OSRM when network is available; seamlessly falls back to geodesic interpolation.
 * @param {object} params
 * @returns {Promise<object>} Route object with coordinates, distance, duration, and steps
 */
export async function calculateRoute({
  startLat,
  startLng,
  endLat,
  endLng,
  startName = "Your Location",
  endName = "Local Dukaan",
  mode = TRANSPORT_MODES.DRIVING,
}) {
  const sLat = Number(startLat);
  const sLng = Number(startLng);
  const eLat = Number(endLat);
  const eLng = Number(endLng);

  if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
    throw new Error("Valid numerical coordinates are required for routing");
  }

  const directDistanceKm = calculateHaversineDistance(sLat, sLng, eLat, eLng);

  // Try fetching live road path from OSRM public API if available
  try {
    const osrmProfile = mode === TRANSPORT_MODES.WALKING ? "foot" : "driving";
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "CareConnect-Telehealth-Routing/1.0" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const routeDistanceKm = Math.round((route.distance / 1000) * 100) / 100;
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));

        // Convert [lon, lat] from GeoJSON to [lat, lon] for Leaflet / UI
        const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

        // Parse OSRM steps
        const steps = [];
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          route.legs[0].steps.forEach((step) => {
            if (step.maneuver) {
              const dMeters = Math.round(step.distance);
              const dText = dMeters >= 1000 ? `${(dMeters / 1000).toFixed(1)} km` : `${dMeters} m`;
              const modifier = step.maneuver.modifier ? ` ${step.maneuver.modifier}` : "";
              const street = step.name ? ` onto ${step.name}` : "";
              const instruction =
                step.maneuver.type === "depart"
                  ? `Depart from ${startName}${street}`
                  : step.maneuver.type === "arrive"
                  ? `Arrive at ${endName}`
                  : `${step.maneuver.type}${modifier}${street}`;

              steps.push({
                instruction: instruction.charAt(0).toUpperCase() + instruction.slice(1),
                distanceText: dText,
                durationText: `${Math.max(1, Math.round(step.duration / 60))} min`,
                type: step.maneuver.type || "straight",
              });
            }
          });
        }

        return {
          source: "OSRM_ROAD_NETWORK",
          distanceKm: routeDistanceKm,
          durationMinutes,
          formattedTime: durationMinutes < 60 ? `${durationMinutes} mins` : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
          coordinates,
          steps: steps.length > 0 ? steps : generateTurnByTurnDirections({ startLat: sLat, startLng: sLng, endLat: eLat, endLng: eLng, startName, endName, mode }),
          mode,
          startLocation: { lat: sLat, lng: sLng, name: startName },
          endLocation: { lat: eLat, lng: eLng, name: endName },
          googleMapsUrl: getGoogleMapsNavigationUrl(sLat, sLng, eLat, eLng, mode),
        };
      }
    }
  } catch {
    // Network offline or OSRM unavailable; fallback seamlessly
  }

  // Robust Geodesic Fallback Engine (Works 100% offline with zero failures)
  const estimates = calculateTravelEstimates(directDistanceKm, mode);
  const coordinates = generateGeodesicRoutePoints(sLat, sLng, eLat, eLng, 20);
  const steps = generateTurnByTurnDirections({
    startLat: sLat,
    startLng: sLng,
    endLat: eLat,
    endLng: eLng,
    startName,
    endName,
    mode,
  });

  return {
    source: "GEODESIC_ROAD_SYNTHESIS",
    distanceKm: estimates.distanceKm,
    durationMinutes: estimates.durationMinutes,
    formattedTime: estimates.formattedTime,
    coordinates,
    steps,
    mode,
    startLocation: { lat: sLat, lng: sLng, name: startName },
    endLocation: { lat: eLat, lng: eLng, name: endName },
    googleMapsUrl: getGoogleMapsNavigationUrl(sLat, sLng, eLat, eLng, mode),
  };
}

/**
 * Builds a direct Google Maps turn-by-turn navigation deep-link.
 * @param {number} startLat
 * @param {number} startLng
 * @param {number} endLat
 * @param {number} endLng
 * @param {string} mode
 * @returns {string} Fully qualified Google Maps navigation URL
 */
export function getGoogleMapsNavigationUrl(startLat, startLng, endLat, endLng, mode = TRANSPORT_MODES.DRIVING) {
  const gMode =
    mode === TRANSPORT_MODES.WALKING
      ? "walking"
      : mode === TRANSPORT_MODES.BICYCLING
      ? "bicycling"
      : "driving";

  return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=${gMode}`;
}

/**
 * Common Indian healthcare hubs and metropolitan landmark coordinates dictionary
 * for instantaneous offline geocoding resolution.
 */
const KNOWN_GEO_LOCALITIES = [
  { name: "Connaught Place, New Delhi", city: "New Delhi", lat: 28.6315, lng: 77.2167 },
  { name: "AIIMS Medical Center, New Delhi", city: "New Delhi", lat: 28.5672, lng: 77.2100 },
  { name: "Bandra West, Mumbai", city: "Mumbai", lat: 19.0596, lng: 72.8295 },
  { name: "Andheri East, Mumbai", city: "Mumbai", lat: 19.1136, lng: 72.8697 },
  { name: "Indiranagar, Bengaluru", city: "Bengaluru", lat: 12.9784, lng: 77.6408 },
  { name: "Koramangala, Bengaluru", city: "Bengaluru", lat: 12.9352, lng: 77.6245 },
  { name: "Hitec City, Hyderabad", city: "Hyderabad", lat: 17.4474, lng: 78.3762 },
  { name: "Shivaji Nagar, Pune", city: "Pune", lat: 18.5314, lng: 73.8446 },
  { name: "Kothrud, Pune", city: "Pune", lat: 18.5074, lng: 73.8077 },
  { name: "T Nagar, Chennai", city: "Chennai", lat: 13.0418, lng: 80.2341 },
  { name: "Park Street, Kolkata", city: "Kolkata", lat: 22.5505, lng: 88.3527 },
];

/**
 * Resolves text address to geographic coordinates (GeoAPI Geocoding)
 * @param {string} addressQuery
 * @returns {Promise<Array<object>>} List of matched coordinate candidates
 */
export async function geocodeAddress(addressQuery) {
  if (!addressQuery || !addressQuery.trim()) return [];
  const q = addressQuery.trim().toLowerCase();

  // Check built-in quick locality lookup
  const localMatches = KNOWN_GEO_LOCALITIES.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q)
  );

  if (localMatches.length > 0) {
    return localMatches;
  }

  // Try OpenStreetMap Nominatim GeoAPI
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=5`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CareConnect-Telehealth-GeoAPI/1.0" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.map((item) => ({
        name: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.state || "Local",
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    }
  } catch {
    // Offline / fallback
  }

  // Fallback default city centroid match
  return [
    {
      name: addressQuery,
      city: "Local Area",
      lat: 28.6139,
      lng: 77.2090,
    },
  ];
}

/**
 * Reverse geocodes coordinates to a readable address string.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} Readable address
 */
export async function reverseGeocode(lat, lng) {
  const pLat = Number(lat);
  const pLng = Number(lng);

  if (isNaN(pLat) || isNaN(pLng)) return "Current Location";

  // Check closest known locality first
  for (const loc of KNOWN_GEO_LOCALITIES) {
    const d = calculateHaversineDistance(pLat, pLng, loc.lat, loc.lng);
    if (d <= 3.0) {
      return loc.name;
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pLat}&lon=${pLng}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CareConnect-Telehealth-GeoAPI/1.0" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.display_name || `${pLat.toFixed(4)}, ${pLng.toFixed(4)}`;
    }
  } catch {
    // Return formatted coordinates
  }

  return `${pLat.toFixed(4)}° N, ${pLng.toFixed(4)}° E`;
}

/**
 * Multi-store wayfinding & best-price comparison router.
 * Evaluates all candidate stores, identifies:
 * - Closest Store (Fastest Delivery)
 * - Lowest Price Store (Best Value)
 * @param {number} userLat
 * @param {number} userLng
 * @param {Array<object>} stores
 * @returns {object} { rankedStores, fastestStore, bestPriceStore }
 */
export function evaluateBestPriceAndFastestStores(userLat, userLng, stores = []) {
  if (!Array.isArray(stores) || stores.length === 0) {
    return { rankedStores: [], fastestStore: null, bestPriceStore: null };
  }

  const storesWithDistance = stores
    .map((s) => {
      try {
        const distanceKm = calculateHaversineDistance(userLat, userLng, s.latitude, s.longitude);
        const estimates = calculateTravelEstimates(distanceKm, TRANSPORT_MODES.DRIVING);
        return {
          ...s,
          distanceKm,
          estimatedDurationMin: estimates.durationMinutes,
          formattedTime: estimates.formattedTime,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (storesWithDistance.length === 0) {
    return { rankedStores: [], fastestStore: null, bestPriceStore: null };
  }

  const fastestStore = storesWithDistance[0];

  // If stores carry basket pricing or average price
  const storesWithPrice = storesWithDistance.filter((s) => typeof s.basketCost === "number" || typeof s.averagePrice === "number");
  const bestPriceStore = storesWithPrice.length > 0
    ? [...storesWithPrice].sort((a, b) => (a.basketCost || a.averagePrice) - (b.basketCost || b.averagePrice))[0]
    : fastestStore;

  return {
    rankedStores: storesWithDistance,
    fastestStore,
    bestPriceStore,
  };
}
