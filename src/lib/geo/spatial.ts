/**
 * Geo-Spatial Utilities for Commons
 * Supports Appwrite TablesDB Point [longitude, latitude] and Polygon columns
 * Privacy-preserving: coordinates are fuzzed to neighborhood centroids (~1km radius)
 */

export type CoordinatePoint = [number, number]; // [longitude, latitude]
export type CoordinatePolygon = number[][][]; // GeoJSON Polygon rings [[[lon, lat], ...]]

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two [lon, lat] points using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  pointA: CoordinatePoint,
  pointB: CoordinatePoint
): number {
  const [lon1, lat1] = pointA;
  const [lon2, lat2] = pointB;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10; // 1 decimal place
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Human-friendly distance formatting.
 * e.g. "800 m away", "2.4 km away"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

/**
 * Fuzzes coordinates to neighborhood centroid precision (~1.1 km grid)
 * Never stores or exposes exact residential coordinates.
 */
export function fuzzCoordinates(
  point: CoordinatePoint,
  decimals: number = 2
): CoordinatePoint {
  const factor = Math.pow(10, decimals);
  return [
    Math.round(point[0] * factor) / factor,
    Math.round(point[1] * factor) / factor,
  ];
}

/**
 * Standard Ray-casting algorithm to determine if a point [lon, lat]
 * is enclosed within a polygon boundary.
 */
export function isPointInPolygon(
  point: CoordinatePoint,
  polygon: CoordinatePolygon
): boolean {
  if (!polygon || polygon.length === 0) return true;
  const ring = polygon[0]; // exterior ring
  if (!ring || ring.length < 3) return true;

  const [px, py] = point; // px = lon, py = lat
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Approximate centroids for major neighborhoods and hubs.
 * Fallback coordinate resolver when user enters an area name.
 */
export const POPULAR_NEIGHBORHOOD_CENTROIDS: Record<string, CoordinatePoint> = {
  'indiranagar': [77.6412, 12.9784],
  'koramangala': [77.6208, 12.9352],
  'whitefield': [77.7499, 12.9698],
  'hsr layout': [77.6389, 12.9121],
  'jayanagar': [77.5828, 12.9308],
  'jp nagar': [77.5855, 12.9063],
  'malleshwaram': [77.5694, 13.0031],
  'bengaluru': [77.5946, 12.9716],
  'mumbai': [72.8777, 19.0760],
  'bandra': [72.8336, 19.0596],
  'andheri': [72.8467, 19.1136],
  'delhi': [77.1025, 28.7041],
  'gurugram': [77.0266, 28.4595],
  'noida': [77.3910, 28.5355],
  'hyderabad': [78.4867, 17.3850],
  'pune': [73.8567, 18.5204],
  'chennai': [80.2707, 13.0827],
};

/**
 * Resolves a city or area name to an approximate centroid [lon, lat]
 */
export function resolveApproximateLocation(
  areaOrCity: string
): CoordinatePoint | null {
  if (!areaOrCity) return null;
  const normalized = areaOrCity.trim().toLowerCase();

  for (const [key, coords] of Object.entries(POPULAR_NEIGHBORHOOD_CENTROIDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  // Default fallback if area is unrecognized but in Bengaluru
  return [77.5946, 12.9716];
}

