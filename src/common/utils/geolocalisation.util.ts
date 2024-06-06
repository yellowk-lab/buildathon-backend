export interface GeographicCoordinate {
  lng: number;
  lat: number;
}

export function calculateDistance(
  coord1: GeographicCoordinate,
  coord2: GeographicCoordinate,
): number {
  const earthRadius = 6371;
  const latDiff = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const lonDiff = (coord2.lng - coord1.lng) * (Math.PI / 180);
  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(lonDiff / 2) *
      Math.sin(lonDiff / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  return distance;
}
