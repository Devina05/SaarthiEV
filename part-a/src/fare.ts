export interface Coordinates {
  lat: number;
  lng: number;
}

export type VehicleType = "e-rickshaw" | "e-cab";

export interface EstimateRequest {
  pickup: Coordinates;
  drop: Coordinates;
  vehicleType: VehicleType;
}

export interface EstimateResponse {
  distanceKm: number;
  fare: number;
  surgeApplied: boolean;
}

export const RATES: Record<VehicleType, { base: number; perKm: number }> = {
  "e-rickshaw": { base: 20, perKm: 10 },
  "e-cab": { base: 40, perKm: 15 },
};

const SURGE_MULTIPLIER = 1.25;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

// straight-line (haversine) distance in km
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// hour of day (0-23) in IST, regardless of server timezone
export function istHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now)
  );
}

// `now` is injectable so tests can pin surge/non-surge times
export function estimateFare(req: EstimateRequest, now: Date = new Date()): EstimateResponse {
  const distance = haversineKm(req.pickup, req.drop);
  const { base, perKm } = RATES[req.vehicleType];
  const hour = istHour(now);
  const surgeApplied = hour >= 22 || hour < 5; // 10 PM - 5 AM IST
  const fare = Math.round((base + perKm * distance) * (surgeApplied ? SURGE_MULTIPLIER : 1));
  return { distanceKm: Math.round(distance * 100) / 100, fare, surgeApplied };
}
