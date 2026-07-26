// ============================================= //
// ✅ ADMIN CHECK MIDDLEWARE                    //
// ============================================= //
// Verifies that the sender's WhatsApp JID is   //
// in the configured admin list before allowing //
// admin-level commands. Ensures only authorized//
// personnel can execute privileged operations. //
// ============================================= //

import { config } from "../config";
import { IncomingMessage } from "../types/events";
import { createLogger } from "../core/logger";

const log = createLogger("middleware.admin-check");

// ============================================= //
// ✅ JID MATCHING                              //
// ============================================= //

/**
 * Extract the numeric part of a WhatsApp JID.
 * Example: "254712345678@s.whatsapp.net" → "254712345678"
 * Example: "254712345678" → "254712345678"
 */
function extractJidNumber(jid: string): string {
  return jid.split("@")[0].trim();
}

/**
 * Check if a given user JID matches any admin JID in the config.
 * Supports both full JID matching and numeric-only matching.
 */
function isAdminJid(jid: string): boolean {
  const normalizedJid = extractJidNumber(jid);

  return config.adminJids.some((adminJid) => {
    const normalizedAdmin = extractJidNumber(adminJid);
    return normalizedJid === normalizedAdmin;
  });
}

// ============================================= //
// ✅ PUBLIC API                                //
// ============================================= //

/**
 * Check if the sender of a message is an authorized admin.
 * Logs a warning if an unauthorized user tries an admin command.
 *
 * @param message - The incoming message to check
 * @returns true if the sender is an admin
 */
export function isAdmin(message: IncomingMessage): boolean {
  const senderJid = message.senderJid;
  const isAuthorized = isAdminJid(senderJid);
  const participantJid = message.isGroup
    ? message.groupJid
    : senderJid;

  if (!isAuthorized) {
    log.warn(
      {
        sender: senderJid,
        group: message.isGroup ? message.groupJid : "DM",
        command: message.commandName,
        participantJid,
      },
      "Unauthorized user attempted admin command"
    );
  }

  return isAuthorized;
}

/**
 * Check if a specific JID is an admin (without a message context).
 * Useful for programmatic checks.
 */
export function isJidAdmin(jid: string): boolean {
  return isAdminJid(jid);
}

/**
 * Get the list of configured admin JIDs.
 */
export function getAdminJids(): string[] {
  return [...config.adminJids];
}

/**
 * Add a JID to the admin list (in memory only — does not persist).
 * For persistent changes, update the ADMIN_JIDS env var.
 */
export function addAdminJid(jid: string): void {
  const normalized = extractJidNumber(jid);
  if (!isAdminJid(normalized)) {
    config.adminJids.push(normalized);
    log.info({ jid: normalized }, "Admin JID added (in-memory)");
  }
}
