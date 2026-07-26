export interface BotHealthData {
  state: string;
  reconnectAttempts: number;
  uptimeMs: number;
  connectedSince: string | null;
  isHealthy: boolean;
  serverUptimeMs: number;
  serverStartTime: string;
  botName: string;
}

export interface BotHealthResponse {
  status: string;
  bot: BotHealthData | null;
  error?: string;
  proxyTimestamp: string;
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  minRoleLevel: number;
}

export interface GroupEntry {
  jid: string;
  label: string;
  role: "main" | "admin" | "tournament";
  enabled: boolean;
}

export interface AdminEntry {
  jid: string;
  name: string;
  role: "OWNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR";
  addedAt: string;
}
