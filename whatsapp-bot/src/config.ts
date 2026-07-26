import "dotenv/config";
import { z } from "zod";
import pino from "pino";

// ============================================= //
// ✅ ENVIRONMENT VARIABLE VALIDATION (Zod)     //
// ============================================= //
// All variables have sensible defaults so the
// bot works out of the box in both local dev
// and production on Render/Vercel.

const envSchema = z.object({
  BOT_NAME: z.string().default("NexusBot"),
  
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),
  
  WHATSAPP_SESSION_DIR: z.string().default("./sessions"),
  
  PORT: z.coerce.number().positive().max(65535).default(3001),
  
  WHATSAPP_GROUP_JIDS: z.string().optional().default(""),
  
  ADMIN_JIDS: z.string().optional().default(""),
  
  // ✅ Key fix: No .url() validation — allows both localhost and production URLs
  // If not set, auto-detects based on NODE_ENV
  NEXUS_API_URL: z.string().optional().default(""),
  
  NEXUS_API_SECRET: z.string().optional().default(""),
  
  WEBHOOK_SECRET: z.string().optional().default(""),
  
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// ============================================= //
// ✅ PARSE & VALIDATE ENVIRONMENT              //
// ============================================= //

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");
  for (const issue of parsedEnv.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsedEnv.data;

// ============================================= //
// ✅ AUTO-DETECT NEXUS API URL                 //
// ============================================= //
// If NEXUS_API_URL is not explicitly set, auto-detect:
//   - In development (local dev): http://localhost:3000
//   - In production: https://nexusesportshub.vercel.app
// This allows the same .env file to work everywhere.

function getNexusApiUrl(): string {
  // 1. If explicitly set in env, use that
  if (env.NEXUS_API_URL) {
    return env.NEXUS_API_URL;
  }
  
  // 2. Auto-detect based on NODE_ENV
  if (env.NODE_ENV === "production") {
    return "https://nexusesportshub.vercel.app/api";
  }
  
  // 3. Default to localhost for development
  return "http://localhost:3000/api";
}

// ============================================= //
// ✅ DEFAULT NEXUS API SECRET                  //
// ============================================= //
// Same secret works for both local and production
// as long as it's set in both places.

function getNexusApiSecret(): string | null {
  if (env.NEXUS_API_SECRET) {
    return env.NEXUS_API_SECRET;
  }
  
  // Default shared secret for local development
  // This MUST be the same as what's in your .env.local for the Nexus app
  if (env.NODE_ENV === "development") {
    return "4a2bfa6ef184b1c4c686fadcb407ef05ff9276a25045550b5aeaa4121f3c7144";
  }
  
  return null;
}

// ============================================= //
// ✅ DERIVED CONFIGURATION                     //
// ============================================= //

export const config = {
  /** Bot display name */
  botName: env.BOT_NAME,

  /** Logging level */
  logLevel: env.LOG_LEVEL as pino.Level,

  /** Directory for WhatsApp auth state persistence */
  sessionDir: env.WHATSAPP_SESSION_DIR,

  /** HTTP port for health checks */
  port: env.PORT,

  /** Approved WhatsApp group JIDs for the bot to respond in */
  allowedGroupJids: env.WHATSAPP_GROUP_JIDS.split(",")
    .map((j) => j.trim())
    .filter(Boolean),

  /** Admin WhatsApp JIDs */
  adminJids: env.ADMIN_JIDS.split(",")
    .map((j) => j.trim())
    .filter(Boolean),

  /** Nexus platform API base URL — auto-detected or overridden */
  nexusApiUrl: getNexusApiUrl(),

  /** Shared secret for Nexus API authentication */
  nexusApiSecret: getNexusApiSecret(),

  /** Webhook secret for receiving events from Nexus */
  webhookSecret: env.WEBHOOK_SECRET || null,

  /** Current runtime environment */
  nodeEnv: env.NODE_ENV,
} as const;

export type Config = typeof config;
