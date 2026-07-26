// ============================================= //
// ✅ SHARED LOGGER — PINO WRAPPER              //
// ============================================= //
// Centralized logger for all bot components.   //
// The main index.ts creates its own pino       //
// instance; this module provides a shared      //
// logger for event-bus, router, handlers, etc. //
// ============================================= //

import pino from "pino";
import { config } from "../config";

// ============================================= //
// ✅ CREATE SHARED LOGGER INSTANCE             //
// ============================================= //

export const logger = pino({
  name: `${config.botName}-internal`,
  level: config.logLevel,
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

// ============================================= //
// ✅ CHILD LOGGER HELPER                       //
// ============================================= //

/**
 * Create a child logger with a specific component name.
 * Use this in modules to identify log sources.
 *
 * @example
 * const cmdLogger = createLogger("command.ping");
 * cmdLogger.info("Ping command executed");
 */
export function createLogger(component: string) {
  return logger.child({ component });
}
