import { Server } from "socket.io";

export interface LocationEvent {
  driverId: string;
  lat: number;
  lng: number;
}

// ponytail: standalone Socket.io server to keep part-c/ self-contained per the
// submission layout; on the real Part A server it would attach to Fastify's
// HTTP server instead: new Server(app.server)
const io = new Server(3001, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  // rider subscribes to one driver's location stream
  socket.on("subscribe", ({ driverId }: { driverId: string }) => {
    socket.join(`driver:${driverId}`);
    console.log(`[server] ${socket.id} subscribed to driver:${driverId}`);
  });

  // driver pushes a location update; fan out to that driver's room
  socket.on("location", (loc: LocationEvent) => {
    io.to(`driver:${loc.driverId}`).emit("location", loc);
  });
});

console.log("Live-location Socket.io server listening on :3001");
