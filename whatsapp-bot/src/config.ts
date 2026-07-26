import "dotenv/config";
import { z } from "zod";
import pino from "pino";

// ============================================= //
// ✅ ENVIRONMENT VARIABLE VALIDATION (Zod)     //
// ============================================= //

const envSchema = z.object({
  BOT_NAME: z.string().default("NexusBot"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .default("info"),
  WHATSAPP_SESSION_DIR: z.string().default("./sessions"),
  PORT: z.coerce.number().positive().max(65535).default(3001),
  WHATSAPP_GROUP_JIDS: z.string().optional().default(""),
  ADMIN_JIDS: z.string().optional().default(""),
  NEXUS_API_URL: z.string().optional().default(""),
  NEXUS_API_SECRET: z.string().optional().default(""),
  WEBHOOK_SECRET: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // ✅ NEW: Public URL for the bot (used by WhatsApp for pairing)
  BOT_PUBLIC_URL: z.string().optional().default(""),
  RENDER_EXTERNAL_URL: z.string().optional().default(""),
});

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

function getNexusApiUrl(): string {
  if (env.NEXUS_API_URL) {
    return env.NEXUS_API_URL;
  }
  if (env.NODE_ENV === "production") {
    return "https://nexusesportshub.vercel.app/api";
  }
  return "http://localhost:3000/api";
}

// ============================================= //
// ✅ AUTO-DETECT BOT PUBLIC URL                //
// ============================================= //

function getBotPublicUrl(): string {
  // 1. If explicitly set, use that
  if (env.BOT_PUBLIC_URL) {
    return env.BOT_PUBLIC_URL;
  }
  
  // 2. On Render, use the RENDER_EXTERNAL_URL
  if (env.RENDER_EXTERNAL_URL) {
    return env.RENDER_EXTERNAL_URL;
  }
  
  // 3. In production, use the default Render URL pattern
  if (env.NODE_ENV === "production") {
    // This should match your Render service name
    return "https://nexus-whatsapp-bot.onrender.com";
  }
  
  // 4. Default to localhost for development
  return "http://localhost:3001";
}

function getNexusApiSecret(): string | null {
  if (env.NEXUS_API_SECRET) {
    return env.NEXUS_API_SECRET;
  }
  if (env.NODE_ENV === "development") {
    return "4a2bfa6ef184b1c4c686fadcb407ef05ff9276a25045550b5aeaa4121f3c7144";
  }
  return null;
}

// ============================================= //
// ✅ DERIVED CONFIGURATION                     //
// ============================================= //

export const config = {
  botName: env.BOT_NAME,
  logLevel: env.LOG_LEVEL as pino.Level,
  sessionDir: env.WHATSAPP_SESSION_DIR,
  port: env.PORT,
  allowedGroupJids: env.WHATSAPP_GROUP_JIDS.split(",")
    .map((j) => j.trim())
    .filter(Boolean),
  adminJids: env.ADMIN_JIDS.split(",")
    .map((j) => j.trim())
    .filter(Boolean),
  nexusApiUrl: getNexusApiUrl(),
  nexusApiSecret: getNexusApiSecret(),
  webhookSecret: env.WEBHOOK_SECRET || null,
  nodeEnv: env.NODE_ENV,
  // ✅ NEW: Public URL for the bot
  botPublicUrl: getBotPublicUrl(),
} as const;

export type Config = typeof config;