import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { estimateFare, haversineKm, type Coordinates } from "../src/fare";
import { routes } from "../src/routes";

const pickup: Coordinates = { lat: 25.5941, lng: 85.1376 };
const drop: Coordinates = { lat: 25.612, lng: 85.158 };

const NOON_IST = new Date("2026-01-01T12:00:00+05:30");
const ELEVEN_PM_IST = new Date("2026-01-01T23:00:00+05:30");

test("e-rickshaw fare at noon: base + per-km, no surge", () => {
  const result = estimateFare({ pickup, drop, vehicleType: "e-rickshaw" }, NOON_IST);
  const distance = haversineKm(pickup, drop);
  assert.equal(result.surgeApplied, false);
  assert.equal(result.fare, Math.round(20 + 10 * distance));
  assert.ok(result.distanceKm > 2.7 && result.distanceKm < 3.0, `distance ${result.distanceKm} out of expected range`);
});

test("e-cab fare at 11 PM IST: 1.25x surge applied", () => {
  const result = estimateFare({ pickup, drop, vehicleType: "e-cab" }, ELEVEN_PM_IST);
  const distance = haversineKm(pickup, drop);
  assert.equal(result.surgeApplied, true);
  assert.equal(result.fare, Math.round((40 + 15 * distance) * 1.25));
});

test("invalid input (lat out of range) returns 400", async () => {
  const app = Fastify();
  app.register(routes);
  const res = await app.inject({
    method: "POST",
    url: "/estimate",
    payload: { pickup: { lat: 999, lng: 85.1376 }, drop, vehicleType: "e-rickshaw" },
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.json<{ message: string }>().message, /lat/);
  await app.close();
});
