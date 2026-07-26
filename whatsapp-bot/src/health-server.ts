import http from "http";
import pino from "pino";
import { ConnectionManager, buildHealthInfo, HealthInfo } from "./connection-manager";

// ============================================= //
// ✅ HEALTH CHECK HTTP SERVER                  //
// ============================================= //

const logger = pino({
  name: "health-server",
  level: process.env.LOG_LEVEL || "info",
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

// Track when the health server started
const serverStartTime = new Date();

/**
 * Start a lightweight HTTP server for health checks.
 * This is intentionally minimal — no Express, just Node's built-in http module.
 * Listens on 0.0.0.0 so it works in containerized environments (Render, Docker, etc.).
 *
 * @param connectionManager - The bot's connection manager instance
 * @param connectedSince - A getter for the timestamp when the connection was last established
 * @param port - Port to listen on (default: 3001 or PORT env)
 */
export function startHealthServer(
  connectionManager: ConnectionManager,
  getConnectedSince: () => Date | null,
  port: number = parseInt(process.env.PORT || "3001", 10)
): void {
  const server = http.createServer((req, res) => {
    // Only respond to GET /health
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    if (req.url !== "/health") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const health: HealthInfo = buildHealthInfo(
      connectionManager,
      getConnectedSince()
    );

    const statusCode = health.isHealthy ? 200 : 503;

    res.writeHead(statusCode, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    });

    res.end(
      JSON.stringify({
        ...health,
        serverUptimeMs: Date.now() - serverStartTime.getTime(),
        serverStartTime: serverStartTime.toISOString(),
        botName: process.env.BOT_NAME || "NexusBot",
      })
    );
  });

  server.listen(port, "0.0.0.0", () => {
    logger.info(
      { port, endpoint: `http://0.0.0.0:${port}/health` },
      "✅ Health check server started"
    );
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      logger.error(
        { port },
        `Port ${port} is already in use. Set PORT env to a different value.`
      );
    } else {
      logger.error({ error }, "Health server error");
    }
  });

  // Allow the process to exit even if the server is still listening
  server.unref();
}
