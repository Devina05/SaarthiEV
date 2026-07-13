import Fastify from "fastify";
import { routes } from "./routes";

const app = Fastify({ logger: true });

app.register(routes);

const port = Number(process.env.PORT ?? 3000);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
