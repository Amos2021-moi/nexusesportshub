"use client";

import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
  Users,
  Command,
  Shield,
  Activity,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  AlertCircle,
  Settings,
  Bot,
  Database,
  UserPlus,
  UserMinus,
  Power,
  PowerOff,
  Zap,
  TrendingUp,
  BarChart3,
  Server,
  CheckCircle,
  Info,
  Link,
  Gauge,
  Timer,
  Crown,
  Eye,
} from "lucide-react";

// ============================================ //
// TYPES                                       //
// ============================================ //

interface BotHealthData {
  state: string;
  reconnectAttempts: number;
  uptimeMs: number;
  connectedSince: string | null;
  isHealthy: boolean;
  serverUptimeMs: number;
  serverStartTime: string;
  botName: string;
}

interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  minRoleLevel: number;
  enabled: boolean;
}

interface GroupEntry {
  jid: string;
  label: string;
  role: "main" | "admin" | "tournament";
  enabled: boolean;
}

interface AdminEntry {
  jid: string;
  name: string;
  role: "OWNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR";
  addedAt: string;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: "command" | "message" | "error" | "connection" | "admin";
  message: string;
  user: string;
}

interface StatsData {
  messagesReceived: number;
  commandsExecuted: number;
  uniqueUsers: number;
  activeGroups: number;
  topCommands: Array<{ name: string; count: number }>;
  hourlyActivity: Array<{ hour: string; count: number }>;
  dailyMessages: Array<{ date: string; count: number }>;
}

// ============================================ //
// UTILITY FUNCTIONS                            //
// ============================================ //

const formatUptime = (ms: number): string => {
  if (!ms || ms <= 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const getStatusColor = (state: string): string => {
  const map: Record<string, string> = {
    OPEN: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    CONNECTING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    RECONNECTING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    CLOSED: "text-red-400 bg-red-400/10 border-red-400/30",
    LOGGED_OUT: "text-red-500 bg-red-500/10 border-red-500/30",
    SHUTTING_DOWN: "text-gray-400 bg-gray-400/10 border-gray-400/30",
    UNKNOWN: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  };
  return map[state] || map.UNKNOWN;
};

const getStatusIcon = (state: string) => {
  const map: Record<string, any> = {
    OPEN: Wifi,
    CONNECTING: Loader2,
    RECONNECTING: RefreshCw,
    CLOSED: WifiOff,
    LOGGED_OUT: AlertCircle,
    UNKNOWN: AlertCircle,
  };
  return map[state] || AlertCircle;
};

const getRoleBadgeColor = (role: string): string => {
  const map: Record<string, string> = {
    OWNER: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    SUPER_ADMIN: "text-red-400 bg-red-400/10 border-red-400/30",
    ADMIN: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    MODERATOR: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  };
  return map[role] || "text-gray-400 bg-gray-400/10 border-gray-400/30";
};

const getActivityIcon = (type: string) => {
  const map: Record<string, any> = {
    command: Command,
    message: MessageSquare,
    error: AlertCircle,
    connection: Wifi,
    admin: Shield,
  };
  return map[type] || Activity;
};

const getRoleLabel = (level: number): string => {
  switch (level) {
    case 0: return "Everyone";
    case 1: return "Verified";
    case 2: return "Moderator";
    case 3: return "Admin";
    default: return "Unknown";
  }
};

// ============================================ //
// DECORATIVE BACKGROUND                        //
// ============================================ //

const DecorativeBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070913]">
    <div className="absolute inset-0 bg-gradient-to-br from-[#070913] via-[#0b0e1d] to-[#12102a]" />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
    <div className="absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[140px]" />
    <div className="absolute -right-48 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-600/15 blur-[140px]" />
  </div>
));
DecorativeBackground.displayName = "DecorativeBackground";

// ============================================ //
// STAT CARD                                   //
// ============================================ //

const StatCard = memo(({ title, value, icon: Icon, color, subtitle, trend }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="group relative flex h-full min-h-[120px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-xl backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] hover:shadow-2xl sm:p-5">
    <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-r ${color} opacity-15 blur-3xl transition-opacity duration-300 group-hover:opacity-30`} />
    <div className="relative flex items-center justify-between gap-2">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg shadow-black/30 ring-1 ring-white/20 transition-transform duration-150 group-hover:scale-105 sm:h-11 sm:w-11`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      {trend && (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
          trend.isPositive
            ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
            : "border border-red-500/30 bg-red-500/15 text-red-400"
        }`}>
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </span>
      )}
    </div>
    <div className="relative mt-3">
      <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</p>
      <div className="mt-1 flex items-center justify-between border-t border-white/[0.05] pt-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
        {subtitle && <span className="text-[9px] font-medium text-gray-500">{subtitle}</span>}
      </div>
    </div>
  </div>
));
StatCard.displayName = "StatCard";

// ============================================ //
// MAIN COMPONENT                               //
// ============================================ //

export default function WhatsAppAdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "commands" | "groups" | "admins" | "activity" | "settings">("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // --- Data Fetching ---

  // Bot health — returns offline status gracefully (not error)
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["whatsapp-bot-health"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/whatsapp/health");
      if (res.status === 503) {
        // Bot is offline or unreachable — return graceful offline state
        return { 
          status: "offline", 
          bot: { 
            state: "UNKNOWN", 
            reconnectAttempts: 0, 
            uptimeMs: 0, 
            connectedSince: null, 
            isHealthy: false, 
            serverUptimeMs: 0, 
            serverStartTime: new Date().toISOString(), 
            botName: "NexusBot" 
          } as BotHealthData, 
          proxyTimestamp: new Date().toISOString() 
        };
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data as { status: string; bot: BotHealthData | null; proxyTimestamp: string };
    },
    refetchInterval: (query) => {
      // Still poll even on error/offline
      return 15000;
    },
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 5000,
  });

  // Commands - these work even when health check fails
  const { data: commandsData, isLoading: commandsLoading } = useQuery({
    queryKey: ["whatsapp-commands"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/whatsapp?type=commands");
      if (!res.ok) throw new Error("Failed to fetch commands");
      return res.json() as Promise<{ commands: CommandDefinition[] }>;
    },
    refetchInterval: 30000,
  });

  // Groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["whatsapp-groups"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/whatsapp?type=groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json() as Promise<{ groups: GroupEntry[] }>;
    },
    refetchInterval: 30000,
  });

  // Admins
  const { data: adminsData, isLoading: adminsLoading } = useQuery({
    queryKey: ["whatsapp-admins"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/whatsapp?type=admins");
      if (!res.ok) throw new Error("Failed to fetch admins");
      return res.json() as Promise<{ admins: AdminEntry[] }>;
    },
    refetchInterval: 30000,
  });

  // Activity log
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["whatsapp-activity"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/whatsapp?type=activity");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json() as Promise<{ activities: ActivityLogEntry[] }>;
    },
    refetchInterval: 10000,
  });

  // Stats / Analytics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["whatsapp-stats"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/whatsapp?type=stats");
      if (!res.ok) {
        return { messagesReceived: 0, commandsExecuted: 0, uniqueUsers: 0, activeGroups: 0, topCommands: [], hourlyActivity: [], dailyMessages: [] } as StatsData;
      }
      return res.json() as Promise<StatsData>;
    },
    refetchInterval: 30000,
  });

  // --- Mutations ---

  const toggleCommand = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleCommand", name, enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle command");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-commands"] });
      toast.success("Command updated");
    },
    onError: () => toast.error("Failed to update command"),
  });

  const addGroup = useMutation({
    mutationFn: async (group: { jid: string; label: string; role: "main" | "admin" | "tournament" }) => {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addGroup", ...group }),
      });
      if (!res.ok) throw new Error("Failed to add group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-groups"] });
      toast.success("Group added");
    },
    onError: () => toast.error("Failed to add group"),
  });

  const removeGroup = useMutation({
    mutationFn: async (jid: string) => {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeGroup", jid }),
      });
      if (!res.ok) throw new Error("Failed to remove group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-groups"] });
      toast.success("Group removed");
    },
    onError: () => toast.error("Failed to remove group"),
  });

  const addAdmin = useMutation({
    mutationFn: async (admin: { jid: string; name: string; role: "OWNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR" }) => {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addAdmin", ...admin }),
      });
      if (!res.ok) throw new Error("Failed to add admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-admins"] });
      toast.success("Admin added");
    },
    onError: () => toast.error("Failed to add admin"),
  });

  const removeAdmin = useMutation({
    mutationFn: async (jid: string) => {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeAdmin", jid }),
      });
      if (!res.ok) throw new Error("Failed to remove admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-admins"] });
      toast.success("Admin removed");
    },
    onError: () => toast.error("Failed to remove admin"),
  });

  // --- Handlers ---

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    await refetchHealth();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // --- Derived State ---
  // Determine if health check failed but other endpoints work
  const bot = healthData?.bot;
  const isHealthCheckFailed = healthData?.status === "offline";
  const isOnline = bot?.isHealthy ?? false;
  
  // Use bot state if available, otherwise UNKNOWN
  const status = bot?.state || "UNKNOWN";
  const StatusIcon = getStatusIcon(status);
  const statusColor = getStatusColor(status);

  // Show "Unknown" when health check fails, not "Offline"
  const displayStatus = isHealthCheckFailed ? "Unknown" : isOnline ? "Online" : status;

  const isLoading = healthLoading || commandsLoading || groupsLoading || adminsLoading || activityLoading || statsLoading;

  // --- Render ---

  return (
    <div className="min-h-screen p-6">
      <DecorativeBackground />

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              WhatsApp Bot Manager
              <span className="text-sm font-normal text-gray-400">v1.0.0</span>
            </h1>
            <p className="text-gray-400">Monitor and manage your Nexus Esports WhatsApp integration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusColor}`}>
            <StatusIcon className={`h-4 w-4 ${status === "RECONNECTING" || status === "CONNECTING" ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">
              {displayStatus}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Status"
          value={displayStatus}
          icon={isOnline ? Wifi : isHealthCheckFailed ? AlertCircle : WifiOff}
          color={isOnline ? "from-emerald-500 to-emerald-600" : isHealthCheckFailed ? "from-yellow-500 to-yellow-600" : "from-red-500 to-red-600"}
          subtitle={bot?.connectedSince ? `Since ${new Date(bot.connectedSince).toLocaleTimeString()}` : isHealthCheckFailed ? "Health check failed" : "Not connected"}
        />
        <StatCard
          title="Uptime"
          value={bot?.uptimeMs ? formatUptime(bot.uptimeMs) : "0s"}
          icon={Clock}
          color="from-blue-500 to-blue-600"
          subtitle={`Server: ${bot?.serverUptimeMs ? formatUptime(bot.serverUptimeMs) : "0s"}`}
        />
        <StatCard
          title="Reconnects"
          value={bot?.reconnectAttempts ?? 0}
          icon={RefreshCw}
          color="from-yellow-500 to-yellow-600"
          subtitle="Attempts since last session"
        />
        <StatCard
          title="Commands"
          value={commandsData?.commands?.length ?? 0}
          icon={Command}
          color="from-purple-500 to-purple-600"
          subtitle="Registered commands"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "commands", label: "Commands", icon: Command },
          { id: "groups", label: "Groups", icon: Users },
          { id: "admins", label: "Admins", icon: Shield },
          { id: "activity", label: "Activity", icon: MessageSquare },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          {activeTab === "overview" && (
            <OverviewTab healthData={healthData} statsData={statsData} bot={bot} isOnline={isOnline} isHealthCheckFailed={isHealthCheckFailed} />
          )}
          {activeTab === "commands" && (
            <CommandsTab commands={commandsData?.commands || []} onToggle={toggleCommand.mutate} isMutating={toggleCommand.isPending} />
          )}
          {activeTab === "groups" && (
            <GroupsTab groups={groupsData?.groups || []} onAdd={addGroup.mutate} onRemove={removeGroup.mutate} isMutating={addGroup.isPending || removeGroup.isPending} />
          )}
          {activeTab === "admins" && (
            <AdminsTab admins={adminsData?.admins || []} onAdd={addAdmin.mutate} onRemove={removeAdmin.mutate} isMutating={addAdmin.isPending || removeAdmin.isPending} />
          )}
          {activeTab === "activity" && (
            <ActivityTab activities={activityData?.activities || []} />
          )}
          {activeTab === "settings" && (
            <SettingsTab />
          )}
        </>
      )}
    </div>
  );
}

// ============================================ //
// OVERVIEW TAB                                 //
// ============================================ //

function OverviewTab({ healthData, statsData, bot, isOnline, isHealthCheckFailed }: any) {
  return (
    <div className="space-y-6">
      {/* Connection Details */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-400" />
          Connection Details
        </h3>
        {isHealthCheckFailed && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Health check failed — bot is unreachable or BOT_HEALTH_URL is misconfigured. Other data may still load.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs uppercase tracking-wider text-gray-400">Bot Name</p>
            <p className="text-white font-medium mt-1">{bot?.botName || "NexusBot"}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs uppercase tracking-wider text-gray-400">State</p>
            <p className={`font-medium mt-1 ${isOnline ? "text-emerald-400" : isHealthCheckFailed ? "text-yellow-400" : "text-red-400"}`}>
              {bot?.state || "UNKNOWN"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs uppercase tracking-wider text-gray-400">Reconnect Attempts</p>
            <p className="text-white font-medium mt-1">{bot?.reconnectAttempts ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs uppercase tracking-wider text-gray-400">Connected Since</p>
            <p className="text-white font-medium mt-1">
              {bot?.connectedSince ? new Date(bot.connectedSince).toLocaleString() : isHealthCheckFailed ? "Unknown" : "Not connected"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs uppercase tracking-wider text-gray-400">Server Start</p>
            <p className="text-white font-medium mt-1">
              {bot?.serverStartTime ? new Date(bot.serverStartTime).toLocaleString() : "Unknown"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs uppercase tracking-wider text-gray-400">Last Updated</p>
            <p className="text-white font-medium mt-1">
              {healthData?.proxyTimestamp ? new Date(healthData.proxyTimestamp).toLocaleString() : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
          <p className="text-2xl font-bold text-white">{statsData?.messagesReceived ?? 0}</p>
          <p className="text-xs text-gray-400">Messages</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
          <p className="text-2xl font-bold text-white">{statsData?.commandsExecuted ?? 0}</p>
          <p className="text-xs text-gray-400">Commands</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
          <p className="text-2xl font-bold text-white">{statsData?.uniqueUsers ?? 0}</p>
          <p className="text-xs text-gray-400">Users</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
          <p className="text-2xl font-bold text-white">{statsData?.activeGroups ?? 0}</p>
          <p className="text-xs text-gray-400">Active Groups</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all">
            <RefreshCw className="h-4 w-4" />
            Restart Bot
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 hover:bg-blue-500/30 transition-all">
            <Eye className="h-4 w-4" />
            View Logs
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30 hover:bg-purple-500/30 transition-all">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================ //
// COMMANDS TAB                                 //
// ============================================ //

function CommandsTab({ commands, onToggle, isMutating }: any) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Command className="h-5 w-5 text-emerald-400" />
          Registered Commands
        </h3>
        <span className="text-sm text-gray-400">{commands.length} commands</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Command</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Usage</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {commands.map((cmd: CommandDefinition) => (
              <tr key={cmd.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white font-mono">.{cmd.name}</td>
                <td className="py-3 px-4 text-gray-300">{cmd.description}</td>
                <td className="py-3 px-4 text-gray-400 font-mono text-xs">{cmd.usage}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300">
                    {getRoleLabel(cmd.minRoleLevel)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${cmd.enabled !== false ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30' : 'text-red-400 bg-red-400/10 border border-red-400/30'}`}>
                    {cmd.enabled !== false ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onToggle({ name: cmd.name, enabled: cmd.enabled !== false ? false : true })}
                    disabled={isMutating}
                    className={`p-1 rounded-lg transition-all ${
                      cmd.enabled !== false
                        ? "text-emerald-400 hover:bg-emerald-400/20"
                        : "text-red-400 hover:bg-red-400/20"
                    }`}
                  >
                    {cmd.enabled !== false ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================ //
// GROUPS TAB                                   //
// ============================================ //

function GroupsTab({ groups, onAdd, onRemove, isMutating }: any) {
  const [newJid, setNewJid] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newRole, setNewRole] = useState<"main" | "admin" | "tournament">("main");

  const handleAdd = () => {
    if (!newJid.trim()) { toast.error("Please enter a group JID"); return; }
    onAdd({ jid: newJid.trim(), label: newLabel.trim() || newJid.trim(), role: newRole });
    setNewJid("");
    setNewLabel("");
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-400" />
          Allowed Groups
        </h3>
        <span className="text-sm text-gray-400">{groups.length} groups</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <input
          type="text"
          placeholder="Group JID (e.g., 123456789@g.us)"
          value={newJid}
          onChange={(e) => setNewJid(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400/50"
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1 min-w-[150px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400/50"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as any)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/50"
        >
          <option value="main">Main</option>
          <option value="admin">Admin</option>
          <option value="tournament">Tournament</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={isMutating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">JID</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Label</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group: GroupEntry) => (
              <tr key={group.jid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white font-mono text-xs">{group.jid}</td>
                <td className="py-3 px-4 text-gray-300">{group.label}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs border ${
                    group.role === "main" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" :
                    group.role === "admin" ? "text-red-400 bg-red-400/10 border-red-400/30" :
                    "text-blue-400 bg-blue-400/10 border-blue-400/30"
                  }`}>
                    {group.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    group.enabled !== false ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30' :
                    'text-red-400 bg-red-400/10 border border-red-400/30'
                  }`}>
                    {group.enabled !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onRemove(group.jid)}
                    disabled={isMutating}
                    className="p-1 rounded-lg text-red-400 hover:bg-red-400/20 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================ //
// ADMINS TAB                                   //
// ============================================ //

function AdminsTab({ admins, onAdd, onRemove, isMutating }: any) {
  const [newJid, setNewJid] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"OWNER" | "SUPER_ADMIN" | "ADMIN" | "MODERATOR">("ADMIN");

  const handleAdd = () => {
    if (!newJid.trim()) { toast.error("Please enter a JID"); return; }
    onAdd({ jid: newJid.trim(), name: newName.trim() || newJid.trim(), role: newRole });
    setNewJid("");
    setNewName("");
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          Administrators
        </h3>
        <span className="text-sm text-gray-400">{admins.length} admins</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <input
          type="text"
          placeholder="JID (e.g., 254712345678@s.whatsapp.net)"
          value={newJid}
          onChange={(e) => setNewJid(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400/50"
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 min-w-[150px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400/50"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as any)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/50"
        >
          <option value="OWNER">OWNER</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MODERATOR">MODERATOR</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={isMutating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          Add Admin
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">JID</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Added</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin: AdminEntry) => (
              <tr key={admin.jid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white font-mono text-xs">{admin.jid}</td>
                <td className="py-3 px-4 text-gray-300">{admin.name}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getRoleBadgeColor(admin.role)}`}>
                    {admin.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {admin.addedAt ? new Date(admin.addedAt).toLocaleDateString() : "—"}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onRemove(admin.jid)}
                    disabled={isMutating}
                    className="p-1 rounded-lg text-red-400 hover:bg-red-400/20 transition-all"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================ //
// ACTIVITY TAB                                 //
// ============================================ //

function ActivityTab({ activities }: any) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-emerald-400" />
        Recent Activity
      </h3>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          activities.map((entry: ActivityLogEntry) => {
            const Icon = getActivityIcon(entry.type);
            const isError = entry.type === "error";
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  isError
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-white/5 border border-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`p-2 rounded-lg ${isError ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-400"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{entry.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{entry.user}</span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================ //
// SETTINGS TAB                                 //
// ============================================ //

function SettingsTab() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Settings className="h-5 w-5 text-emerald-400" />
        Bot Settings
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-white font-medium">Rate Limits</p>
            <p className="text-sm text-gray-400">Clear all rate limit data for all users</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-500/30 transition-all">
            Clear Rate Limits
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-white font-medium">Logging Level</p>
            <p className="text-sm text-gray-400">Control the verbosity of bot logs</p>
          </div>
          <select className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400/50">
            <option value="info">Info</option>
            <option value="debug">Debug</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <p className="text-white font-medium">Restart Bot</p>
            <p className="text-sm text-gray-400">Restart the WhatsApp bot process</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30 transition-all">
            <Power className="h-4 w-4 inline mr-2" />
            Restart
          </button>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white font-medium mb-3">Environment Variables</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">BOT_NAME</span>
              <span className="text-white font-mono">NexusBot</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">LOG_LEVEL</span>
              <span className="text-white font-mono">info</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-gray-400">PORT</span>
              <span className="text-white font-mono">3001</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">NEXUS_API_URL</span>
              <span className="text-white font-mono text-xs truncate max-w-[200px]">http://localhost:3000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}