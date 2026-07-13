import type { FastifyInstance } from "fastify";
import { estimateFare, type EstimateRequest, type EstimateResponse } from "./fare";

type HistoryEntry = EstimateRequest & EstimateResponse & { at: string };

// ponytail: in-memory per the assignment; swap for a DB before production
const history: HistoryEntry[] = [];
const HISTORY_LIMIT = 10;

const coordinateSchema = {
  type: "object",
  required: ["lat", "lng"],
  properties: {
    lat: { type: "number", minimum: -90, maximum: 90 },
    lng: { type: "number", minimum: -180, maximum: 180 },
  },
} as const;

const estimateBodySchema = {
  type: "object",
  required: ["pickup", "drop", "vehicleType"],
  properties: {
    pickup: coordinateSchema,
    drop: coordinateSchema,
    vehicleType: { type: "string", enum: ["e-rickshaw", "e-cab"] },
  },
} as const;

export async function routes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: EstimateRequest; Reply: EstimateResponse }>(
    "/estimate",
    { schema: { body: estimateBodySchema } }, // invalid input -> 400 with message
    async (req) => {
      const estimate = estimateFare(req.body);
      history.push({ ...req.body, ...estimate, at: new Date().toISOString() });
      if (history.length > HISTORY_LIMIT) history.shift();
      return estimate;
    }
  );

  app.get<{ Reply: HistoryEntry[] }>("/estimate/history", async () => history);
}
