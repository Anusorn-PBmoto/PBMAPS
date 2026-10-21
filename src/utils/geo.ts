import { GeoPoint, TrackRecord } from '../types';

/**
 * Calculates great-circle distance between two points on the Earth's surface in meters
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates initial bearing from point 1 to point 2 in degrees (0 - 360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;
  return bearing;
}

/**
 * Calculates cardinal direction from bearing
 */
export function bearingToCardinal(bearing: number): string {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  const index = Math.round((bearing % 360) / 45);
  return cardinals[index];
}

/**
 * Formats distance into human readable string (m or km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats latitude/longitude to military/aviation DMS notation
 */
export function formatDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';

  return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"${direction}`;
}

/**
 * Calculates track metrics: total distance, elevation gain/loss, min/max elevation
 */
export function computeTrackMetrics(points: GeoPoint[]): {
  totalDistanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  maxElevationMeters: number;
  minElevationMeters: number;
} {
  if (points.length < 2) {
    const ele = points[0]?.altitude ?? 0;
    return {
      totalDistanceMeters: 0,
      elevationGainMeters: 0,
      elevationLossMeters: 0,
      maxElevationMeters: ele,
      minElevationMeters: ele,
    };
  }

  let totalDistance = 0;
  let gain = 0;
  let loss = 0;
  let maxEle = points[0].altitude ?? 0;
  let minEle = points[0].altitude ?? 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const dist = calculateHaversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    totalDistance += dist;

    if (curr.altitude !== undefined && prev.altitude !== undefined) {
      const diff = curr.altitude - prev.altitude;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);

      if (curr.altitude > maxEle) maxEle = curr.altitude;
      if (curr.altitude < minEle) minEle = curr.altitude;
    }
  }

  return {
    totalDistanceMeters: Math.round(totalDistance),
    elevationGainMeters: Math.round(gain),
    elevationLossMeters: Math.round(loss),
    maxElevationMeters: Math.round(maxEle),
    minElevationMeters: Math.round(minEle),
  };
}

/**
 * Calculates distance from point to a track polyline to detect off-trail deviation
 */
export function calculateCrossTrackDeviation(
  currentPos: GeoPoint,
  trackPoints: GeoPoint[]
): { minDistanceMeters: number; nearestPointIndex: number } {
  if (trackPoints.length === 0) return { minDistanceMeters: 0, nearestPointIndex: 0 };

  let minDistance = Infinity;
  let nearestIndex = 0;

  for (let i = 0; i < trackPoints.length; i++) {
    const d = calculateHaversineDistance(
      currentPos.lat,
      currentPos.lng,
      trackPoints[i].lat,
      trackPoints[i].lng
    );
    if (d < minDistance) {
      minDistance = d;
      nearestIndex = i;
    }
  }

  return { minDistanceMeters: Math.round(minDistance), nearestPointIndex: nearestIndex };
}
