# Part B — Bug Notes

## Bug 1 — Haversine fed degrees where it needs radians

`distanceKm` called `Math.cos(lat1)` and `Math.cos(lat2)` on raw degree values; the haversine formula needs radians (`Math.cos(toRad(lat1))`). The longitude term of the distance is scaled by an essentially random factor, so computed distances are wrong and the sort by distance picks the wrong "nearest" driver. Users notice immediately: a driver 5 km away gets assigned while one 500 m away sits idle, so pickups take far longer than the app promises.

## Bug 2 — Race condition: driver locked after the slow notify

`assignDriver` awaited `notifyDriver()` (~2 s) **before** setting `nearest.isAvailable = false`. Any second ride request arriving inside that 2-second window filters on `isAvailable`, still sees the same driver as free, and assigns them too. Fixed by marking the driver unavailable before the await (and releasing the lock if the notification throws, so a failed notify doesn't strand the driver as busy forever). Users notice at peak hours: two riders are told the same e-rickshaw is coming, and one gets silently dropped or cancelled.

## Bug 3 — OTP expiry compared seconds against milliseconds

`isOtpValid` computes `now - created` in **milliseconds** but compared it to `expiryMinutes * 60`, which is **seconds**. A 5-minute OTP was actually valid for 300 ms. Fixed with `expiryMinutes * 60 * 1000`. Users notice on every single ride: by the time the rider reads the OTP to the driver, validation already fails and the ride can't start.

## Bug 4 — Fare split truncates via `parseInt` on a stringified float

`parseInt((fareRupees * 0.8).toString())` truncates instead of rounding, so the driver loses up to a rupee on many fares (e.g. ₹97 → driver gets ₹77 instead of ₹78, platform pockets the difference). It's also fragile: for values whose string form is scientific notation (`1e-7`), `parseInt` parses just the `1`. Fixed with `Math.round(fareRupees * 0.8)`; the platform keeps the exact remainder. Drivers notice at payout time — earnings consistently a rupee short across many rides adds up.
