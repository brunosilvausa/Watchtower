import pino, { type DestinationStream } from "pino";
import { logLevelSchema, parseEnv } from "./env.js";

export function createLogger(service: string, destination?: DestinationStream) {
  const options = {
    name: "watchtower",
    level: parseEnv("LOG_LEVEL", process.env.LOG_LEVEL, logLevelSchema),
    base: { service },
    redact: {
      paths: [
        "password", "token", "secret", "authorization", "cookie", "DATABASE_URL", "DATABASE_MIGRATION_URL", "databaseUrl",
        "*.password", "*.token", "*.secret", "*.authorization", "*.cookie",
        "req.headers.authorization", "req.headers.cookie", 'req.headers["x-api-key"]',
      ],
      remove: true,
    },
  };
  return destination ? pino(options, destination) : pino(options);
}
