import { LocationCoordinates, RouteWaypoint } from '../types/index.js';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates straight-line Haversine distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Estimates realistic road network distance (accounting for urban street grid tortuosity).
 */
export function estimateRoadDistanceKm(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates,
  roadTortuosityFactor = 1.28
): number {
  const straight = haversineDistanceKm(coord1, coord2);
  return Math.round(straight * roadTortuosityFactor * 100) / 100;
}

/**
 * Calculates estimated travel duration in minutes based on urban driving speeds and congestion.
 */
export function estimateTravelMinutes(
  distanceKm: number,
  congestionMultiplier = 1.0,
  baseSpeedKmH = 32
): number {
  if (distanceKm <= 0) return 0;
  const effectiveSpeed = Math.max(8, baseSpeedKmH / congestionMultiplier);
  const hours = distanceKm / effectiveSpeed;
  return Math.max(1, Math.round(hours * 60 * 10) / 10);
}

/**
 * Generates an interpolated trajectory of waypoints between two points
 * simulating road street navigation geometry for 2D maps and 3D vehicle animations.
 */
export function generateRoadPathGeometry(
  origin: LocationCoordinates,
  destination: LocationCoordinates,
  numWaypoints = 10
): RouteWaypoint[] {
  const waypoints: RouteWaypoint[] = [];

  // Manhattan-style or curved urban street path interpolation
  for (let i = 0; i <= numWaypoints; i++) {
    const t = i / numWaypoints;
    // S-curve ease for realistic street turn feeling
    const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
    // Add subtle curvature perturbation to represent city blocks
    const orthogonalOffset = Math.sin(t * Math.PI) * 0.0012;
    
    const lat = origin.latitude + (destination.latitude - origin.latitude) * t + orthogonalOffset;
    const lng = origin.longitude + (destination.longitude - origin.longitude) * easedT;

    waypoints.push({
      latitude: Math.round(lat * 1000000) / 1000000,
      longitude: Math.round(lng * 1000000) / 1000000,
    });
  }

  return waypoints;
}
