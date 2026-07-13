# Part A — Fare Estimator API

Small Fastify + TypeScript REST API that estimates ride fares for SaarthiEv.

## Run

```bash
npm install
npm run dev        # dev server with reload on :3000
npm test           # tests (node:test via tsx)
npm run typecheck  # tsc --noEmit
```

## Endpoints

### `POST /estimate`

```bash
curl -X POST http://localhost:3000/estimate \
  -H "Content-Type: application/json" \
  -d '{"pickup":{"lat":25.5941,"lng":85.1376},"drop":{"lat":25.6120,"lng":85.1580},"vehicleType":"e-rickshaw"}'
```

Response: `{ "distanceKm": 2.86, "fare": 49, "surgeApplied": false }`

- Distance: straight-line haversine.
- Fare: base + per-km (e-rickshaw ₹20 + ₹10/km, e-cab ₹40 + ₹15/km), ×1.25 between 10 PM and 5 AM IST, rounded to the nearest rupee.
- Invalid input (missing fields, lat/lng out of range, unknown vehicle type) → 400 with a descriptive message (Fastify JSON-schema validation).

### `GET /estimate/history`

Returns the last 10 estimates (request + result + timestamp), in memory.

## Assumptions

- Surge is decided by the server's clock at request time, converted to IST — correct even if the server runs in UTC.
- History is per-process and resets on restart (in-memory allowed by the assignment).
- `distanceKm` is rounded to 2 decimals in the response.

## What I'd change before production

Straight-line distance under-estimates real fares, so I'd swap haversine for road distance/ETA from a routing API (Google/OSRM) with haversine as fallback. In-memory history would move to a real store (Postgres/Redis) so it survives restarts and works across multiple instances behind a load balancer. I'd add authentication and rate limiting on the endpoint, move rates and surge windows into config/DB so ops can change pricing without a deploy, add structured request logging + metrics, and run compiled JS (tsc build) in a container behind a health check instead of tsx.
