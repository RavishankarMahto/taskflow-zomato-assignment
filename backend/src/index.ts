import express from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";

import { config } from "./config.js";
import { pool } from "./db.js";
import { HttpError, notFound } from "./http/errors.js";
import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/", tasksRouter); // /tasks/:id

app.use((_req, _res, next) => next(notFound()));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).type("application/json").send(err.body);
  }
  logger.error({ err }, "Unhandled error");
  return res.status(500).type("application/json").send({ error: "internal server error" });
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "API listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  server.close(async () => {
    await pool.end().catch(() => undefined);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

