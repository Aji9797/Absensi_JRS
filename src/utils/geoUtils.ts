import { OfficeLocation } from '../types/attendance';

/**
 * Calculates distance between two GPS coordinates using the Haversine formula (returns meters)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format meters into human friendly string (e.g. "35 m", "1.2 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Kantor Pusat Tunggal (Tanpa kantor cabang atau lapangan)
 */
export const DEFAULT_OFFICES: OfficeLocation[] = [
  {
    id: 'off-1',
    name: 'Central Building Office (Kantor Pusat)',
    address: 'Jl. M.H. Thamrin No. 28, Menteng, Jakarta Pusat',
    city: 'Jakarta Pusat',
    latitude: -6.1925,
    longitude: 106.8236,
    radiusMeters: 100, // 100 meter radius toleransi geofence kantor pusat
    isMainBranch: true,
  },
];

/**
 * Find closest office to current coordinates
 */
export function findClosestOffice(
  lat: number,
  lon: number,
  offices: OfficeLocation[]
): { office: OfficeLocation; distance: number } {
  let closest = offices[0];
  let minDistance = calculateHaversineDistance(
    lat,
    lon,
    closest.latitude,
    closest.longitude
  );

  for (let i = 1; i < offices.length; i++) {
    const dist = calculateHaversineDistance(
      lat,
      lon,
      offices[i].latitude,
      offices[i].longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      closest = offices[i];
    }
  }

  return { office: closest, distance: minDistance };
}
