/**
 * Kıble açısı hesaplama
 * Küresel trigonometri (Great Circle) formülü
 * Kabe koordinatları: 21.4225°N, 39.8262°E
 */

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export interface QiblaResult {
  degrees: number;       // 0–360, kuzeyden saat yönüne
  cardinalDir: string;   // "KD", "GD", "GB", "KB" vb.
  distanceKm: number;    // Kabe'ye mesafe (km)
}

export function calculateQibla(lat: number, lng: number): QiblaResult {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LNG - lng);

  const x = Math.sin(Δλ) * Math.cos(φ2);
  const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(x, y);
  const degrees = ((toDeg(θ) + 360) % 360);

  return {
    degrees,
    cardinalDir: getCardinalDir(degrees),
    distanceKm:  haversineDistance(lat, lng, KAABA_LAT, KAABA_LNG),
  };
}

function getCardinalDir(deg: number): string {
  const dirs = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  return dirs[Math.round(deg / 45) % 8];
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371;
  const dφ = toRad(lat2 - lat1);
  const dλ = toRad(lng2 - lng1);
  const a  = Math.sin(dφ / 2) ** 2 +
             Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;