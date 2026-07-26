// ============================================= //
// ✅ GROUP ALLOWLIST MIDDLEWARE                //
// ============================================= //
// Ensures the bot only responds in approved    //
// WhatsApp groups. Unauthorized group messages //
// are silently ignored (no response, no error).//
// ============================================= //

import { config } from "../config";
import { IncomingMessage } from "../types/events";
import { createLogger } from "../core/logger";

const log = createLogger("middleware.group-allowlist");

// ============================================= //
// ✅ ALLOWLIST CHECK                           //
// ============================================= //

/**
 * Check if a group is authorized to interact with the bot.
 * Non-group messages (DMs) are always allowed.
 *
 * @param message - The incoming message to check
 * @returns true if the message is allowed to proceed
 */
export function isGroupAllowed(message: IncomingMessage): boolean {
  // DMs to the bot are always allowed
  if (!message.isGroup) {
    return true;
  }

  // If no groups are configured, deny ALL group messages (safe default)
  if (config.allowedGroupJids.length === 0) {
    log.warn(
      { groupJid: message.groupJid },
      "No groups configured in WHATSAPP_GROUP_JIDS — all group messages denied"
    );
    return false;
  }

  const isAllowed = config.allowedGroupJids.includes(message.groupJid || "");

  if (!isAllowed) {
    log.warn(
      {
        groupJid: message.groupJid,
        groupName: message.pushName,
        allowedGroups: config.allowedGroupJids,
      },
      "Message from unauthorized group — ignored"
    );
  }

  return isAllowed;
}

/**
 * Get the list of currently allowed group JIDs.
 */
export function getAllowedGroups(): string[] {
  return [...config.allowedGroupJids];
}

/**
 * Check if a specific group JID is in the allowlist.
 */
export function isGroupAllowedByJid(jid: string): boolean {
  return config.allowedGroupJids.includes(jid);
}

/**
 * Get a human-readable summary of allowed groups.
 */
export function getAllowedGroupsSummary(): string {
  const groups = config.allowedGroupJids;
  if (groups.length === 0) {
    return "No groups configured — bot will only respond in DMs";
  }
  return groups.map((g, i) => `${i + 1}. \`${g}\``).join("\n");
}
