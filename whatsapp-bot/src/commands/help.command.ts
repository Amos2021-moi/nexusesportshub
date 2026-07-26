// ============================================= //
// ✅ HELP COMMAND — SHOW AVAILABLE COMMANDS    //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { createLogger } from "../core/logger";

const log = createLogger("command.help");

export const helpCommand: CommandHandler = {
  definition: {
    name: "help",
    description: "Show all available bot commands and their usage",
    usage: ".help [command]",
    minRoleLevel: 0,
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    const args = message.commandArgs || [];

    // If a specific command is requested
    if (args.length > 0) {
      const cmdName = args[0].toLowerCase();
      return showCommandDetail(cmdName, message.senderJid);
    }

    // Show all commands grouped by category
    const allCommands = [
      // General
      { name: "ping", desc: "Check bot status", category: "General" },
      { name: "nexus", desc: "Test Nexus connectivity", category: "General" },
      { name: "help", desc: "Show this help message", category: "General" },
      { name: "profile", desc: "View your player profile", category: "General" },
      { name: "players", desc: "List registered players", category: "General" },
      // League
      { name: "fixtures", desc: "View upcoming matches", category: "League" },
      { name: "standings", desc: "View league table", category: "League" },
      { name: "table", desc: "Full league standings", category: "League" },
      { name: "results", desc: "Recent match results", category: "League" },
      { name: "nextmatch", desc: "Your next match", category: "League" },
      { name: "league", desc: "League season info", category: "League" },
      // Tournament
      { name: "tournament", desc: "Active tournament info", category: "Tournament" },
      // Admin (minRoleLevel >= 3)
      { name: "announce", desc: "Broadcast message", category: "Admin" },
      { name: "broadcast", desc: "Send to specific group", category: "Admin" },
      { name: "maintenance", desc: "Toggle maintenance mode", category: "Admin" },
    ];

    const grouped: Record<string, typeof allCommands> = {};
    for (const cmd of allCommands) {
      if (!grouped[cmd.category]) grouped[cmd.category] = [];
      grouped[cmd.category].push(cmd);
    }

    let response = "╔══════════════════════════════╗\n";
    response += "║  *🤖 NEXUS ESPORTS BOT*     ║\n";
    response += "╚══════════════════════════════╝\n\n";

    const categoryOrder = ["General", "League", "Tournament", "Admin"];

    for (const cat of categoryOrder) {
      const cmds = grouped[cat];
      if (!cmds) continue;

      const emoji = cat === "General" ? "⚡" : cat === "League" ? "🏟️" : cat === "Tournament" ? "🏆" : "🛡️";
      response += `*${emoji} ${cat}*\n`;

      for (const cmd of cmds) {
        response += `  \`• ${cmd.name}\` — ${cmd.desc}\n`;
      }
      response += "\n";
    }

    response += "_Type \`.help <command>\` for detailed info on a specific command._";

    return {
      to: message.senderJid,
      text: response,
    };
  },
};

async function showCommandDetail(cmdName: string, senderJid: string): Promise<OutgoingMessage | null> {
  const details: Record<string, { desc: string; usage: string; example: string; note?: string }> = {
    ping: {
      desc: "Check if the bot is online and responding.",
      usage: ".ping",
      example: ".ping",
    },
    nexus: {
      desc: "Test the connection between the WhatsApp bot and the Nexus platform.",
      usage: ".nexus",
      example: ".nexus",
    },
    help: {
      desc: "Show available commands or get details on a specific command.",
      usage: ".help [command]",
      example: ".help fixtures",
    },
    fixtures: {
      desc: "View upcoming scheduled matches. Shows date, opponent, and status.",
      usage: ".fixtures",
      example: ".fixtures",
    },
    standings: {
      desc: "View the current league table with positions, points, and stats.",
      usage: ".standings",
      example: ".standings",
    },
    table: {
      desc: "View the full league standings including GD, form, and more.",
      usage: ".table",
      example: ".table",
    },
    results: {
      desc: "View recent match results with scores and status.",
      usage: ".results",
      example: ".results",
    },
    nextmatch: {
      desc: "View your next scheduled match with opponent and date.",
      usage: ".nextmatch",
      example: ".nextmatch",
    },
    league: {
      desc: "View information about the current league season.",
      usage: ".league",
      example: ".league",
    },
    tournament: {
      desc: "View active tournament details and brackets.",
      usage: ".tournament",
      example: ".tournament",
    },
    profile: {
      desc: "View your or another player's profile and statistics.",
      usage: ".profile [@player]",
      example: ".profile @username",
    },
    players: {
      desc: "List all registered players on the platform.",
      usage: ".players",
      example: ".players",
    },
    announce: {
      desc: "[Admin] Send a broadcast message to all WhatsApp groups.",
      usage: ".announce <message>",
      example: ".announce Fixtures for week 5 are now live!",
      note: "Admin only command.",
    },
    broadcast: {
      desc: "[Admin] Send a message to a specific group.",
      usage: ".broadcast <group> <message>",
      example: ".broadcast main Tournament registration closes Friday",
      note: "Admin only command.",
    },
    maintenance: {
      desc: "[Admin] Toggle bot maintenance mode on or off.",
      usage: ".maintenance <on/off>",
      example: ".maintenance on",
      note: "Owner only command.",
    },
  };

  const cmd = details[cmdName];
  if (!cmd) {
    return {
      to: senderJid,
      text: `❌ Unknown command: \`${cmdName}\`. Type \`.help\` to see all available commands.`,
    };
  }

  let response = `*📖 ${cmdName} Command*\n\n`;
  response += `*Description:* ${cmd.desc}\n`;
  response += `*Usage:* \`${cmd.usage}\`\n`;
  response += `*Example:* \`${cmd.example}\`\n`;

  if (cmd.note) {
    response += `\n_⚠️ ${cmd.note}_\n`;
  }

  return {
    to: senderJid,
    text: response,
  };
}
