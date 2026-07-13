# Part C — Live Location (Socket.io bonus)

A driver emits `location` events (`{ driverId, lat, lng }`) every 2 seconds; a rider subscribes to that driver and receives the updates. Each driver has a Socket.io room (`driver:<id>`), so riders only get the driver they asked for.

## Run

Two terminals:

```bash
npm install
npm run server     # Socket.io server on :3001
npm run simulate   # driver moves Patna Junction → drop point, rider watches
```

Expected console output (simulate terminal):

```
[rider ] watching drv-42
[driver] emitting  25.59410, 85.13760
[rider ] drv-42 is at 25.59410, 85.13760
[driver] emitting  25.59589, 85.13964
[rider ] drv-42 is at 25.59589, 85.13964
...
[sim   ] trip complete
```

Note: kept as a standalone server so `part-c/` is self-contained per the submission layout. On the real Part A server, Socket.io would attach to Fastify's underlying HTTP server (`new Server(app.server)`) so REST and websockets share one port.
