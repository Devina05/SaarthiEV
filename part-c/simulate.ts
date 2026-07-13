// Simulates one driver moving through Patna and one rider watching them.
// Start the server first (npm run server), then: npm run simulate
import { io } from "socket.io-client";
import type { LocationEvent } from "./server";

const URL = "http://localhost:3001";
const driverId = "drv-42";

const rider = io(URL);
rider.on("connect", () => {
  rider.emit("subscribe", { driverId });
  console.log("[rider ] watching", driverId);
});
rider.on("location", (loc: LocationEvent) => {
  console.log(`[rider ] ${loc.driverId} is at ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
});

const driver = io(URL);
const start = { lat: 25.5941, lng: 85.1376 }; // Patna Junction-ish
const end = { lat: 25.612, lng: 85.158 };
const steps = 10;
let step = 0;

const timer = setInterval(() => {
  const t = step / steps;
  const loc: LocationEvent = {
    driverId,
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  };
  console.log(`[driver] emitting  ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
  driver.emit("location", loc);

  if (step++ >= steps) {
    clearInterval(timer);
    console.log("[sim   ] trip complete");
    setTimeout(() => {
      driver.close();
      rider.close();
    }, 500); // let the last broadcast arrive before disconnecting
  }
}, 2000);
