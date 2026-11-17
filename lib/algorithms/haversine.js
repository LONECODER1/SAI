/**
 * Haversine Geodesic Distance Engine
 * Computes great-circle distances between points on a sphere from their longitudes and latitudes.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 * @param {number} lat1 Latitude of first point in decimal degrees
 * @param {number} lon1 Longitude of first point in decimal degrees
 * @param {number} lat2 Latitude of second point in decimal degrees
 * @param {number} lon2 Longitude of second point in decimal degrees
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  ) {
    throw new Error("All coordinates (lat1, lon1, lat2, lon2) are required");
  }

  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    throw new Error("Coordinates must be valid numbers");
  }

  if (p1 === p2 && l1 === l2) {
    return 0;
  }

  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(p2 - p1);
  const dLon = toRad(l2 - l1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1)) *
      Math.cos(toRad(p2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Filters and sorts stores within a maximum radius from patient coordinates.
 * @param {Array} stores Array of store objects containing latitude and longitude
 * @param {number} userLat Patient latitude
 * @param {number} userLng Patient longitude
 * @param {number} maxRadiusKm Maximum distance threshold in km (default 15km)
 * @returns {Array} Stores with an added `distanceKm` property, sorted by proximity
 */
export function findNearbyStores(stores, userLat, userLng, maxRadiusKm = 15) {
  if (!Array.isArray(stores)) return [];

  return stores
    .map((store) => {
      try {
        const distanceKm = calculateHaversineDistance(
          userLat,
          userLng,
          store.latitude,
          store.longitude
        );
        return {
          ...store,
          distanceKm,
        };
      } catch {
        return null;
      }
    })
    .filter((store) => store !== null && store.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
