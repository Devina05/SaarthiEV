// ride-service.ts — driver assignment for incoming ride requests (fixed)

interface Driver {
  id: string;
  lat: number;
  lng: number;
  isAvailable: boolean;
}

const drivers: Driver[] = []; // populated elsewhere

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// distance in km between two points
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    // BUG 1 fix: cos() needs radians, not degrees
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// find nearest available driver and lock them for this ride
async function assignDriver(pickupLat: number, pickupLng: number) {
  const available = drivers.filter((d) => d.isAvailable);
  if (available.length === 0) return null;

  available.sort(
    (a, b) =>
      distanceKm(pickupLat, pickupLng, a.lat, a.lng) -
      distanceKm(pickupLat, pickupLng, b.lat, b.lng)
  );

  const nearest = available[0];
  // BUG 2 fix: lock the driver BEFORE the slow notify, so a concurrent
  // request can't pick the same driver during the ~2s await
  nearest.isAvailable = false;
  try {
    await notifyDriver(nearest.id); // takes ~2 seconds
  } catch (err) {
    nearest.isAvailable = true; // release the lock if notification fails
    throw err;
  }
  return nearest;
}

// OTP check for ride start
function isOtpValid(otpCreatedAt: string, expiryMinutes: number) {
  const created = new Date(otpCreatedAt).getTime();
  const now = Date.now();
  // BUG 3 fix: Date deltas are in milliseconds; minutes * 60 is seconds
  return now - created < expiryMinutes * 60 * 1000;
}

// fare split: driver gets 80%, platform keeps 20%
function splitFare(fareRupees: number) {
  // BUG 4 fix: Math.round instead of parseInt-on-a-string, which truncated
  // (shorting the driver) and breaks entirely on scientific notation
  const driverShare = Math.round(fareRupees * 0.8);
  const platformShare = fareRupees - driverShare;
  return { driverShare, platformShare };
}

declare function notifyDriver(id: string): Promise<void>;

export { drivers, distanceKm, assignDriver, isOtpValid, splitFare };
