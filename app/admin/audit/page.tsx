"use client";

import { useEffect, useMemo, useState, useCallback, memo, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Shield,
  User,
  FileText,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Search,
  Filter,
  Sparkles,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const actionIcons: Record<string, ReactNode> = {
  APPROVE_RESULT: <CheckCircle className="h-4 w-4 text-green-400" />,
  REJECT_RESULT: <XCircle className="h-4 w-4 text-red-400" />,
  VERIFY_PLAYER: <CheckCircle className="h-4 w-4 text-blue-400" />,
  UNVERIFY_PLAYER: <XCircle className="h-4 w-4 text-yellow-400" />,
  UPDATE_TRUST_SCORE: <Shield className="h-4 w-4 text-purple-400" />,
  CREATE_SEASON: <FileText className="h-4 w-4 text-indigo-400" />,
  UPDATE_SEASON: <Edit className="h-4 w-4 text-blue-400" />,
  DELETE_SEASON: <Trash2 className="h-4 w-4 text-red-400" />,
  UPDATE_SEASON_STATUS: <Clock className="h-4 w-4 text-yellow-400" />,
  CREATE_TOURNAMENT: <FileText className="h-4 w-4 text-purple-400" />,
  GENERATE_BRACKET: <Shield className="h-4 w-4 text-amber-400" />,
  USER_LOGIN: <User className="h-4 w-4 text-green-400" />,
  USER_LOGOUT: <User className="h-4 w-4 text-gray-400" />,
};

const actionColors: Record<string, string> = {
  APPROVE_RESULT: "border-green-500/40 bg-green-500/5",
  REJECT_RESULT: "border-red-500/40 bg-red-500/5",
  VERIFY_PLAYER: "border-blue-500/40 bg-blue-500/5",
  UNVERIFY_PLAYER: "border-yellow-500/40 bg-yellow-500/5",
  UPDATE_TRUST_SCORE: "border-purple-500/40 bg-purple-500/5",
  CREATE_SEASON: "border-indigo-500/40 bg-indigo-500/5",
  UPDATE_SEASON: "border-blue-500/40 bg-blue-500/5",
  DELETE_SEASON: "border-red-500/40 bg-red-500/5",
  UPDATE_SEASON_STATUS: "border-yellow-500/40 bg-yellow-500/5",
  CREATE_TOURNAMENT: "border-purple-500/40 bg-purple-500/5",
  GENERATE_BRACKET: "border-amber-500/40 bg-amber-500/5",
  USER_LOGIN: "border-green-500/40 bg-green-500/5",
  USER_LOGOUT: "border-gray-500/40 bg-gray-500/5",
};

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

// === Mobile Detection Hook ===
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Background - NO ANIMATIONS               */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           Memoized Components                             */
/* -------------------------------------------------------------------------- */

// === STATIC Stat Card ===
const StatCard = memo(({ stat }: { stat: any }) => {
  return (
    <div className={`group relative min-h-[44px] overflow-hidden rounded-2xl border bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/40 ${stat.ring}`}>
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-70`}
      />
      <div className="relative">
        <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
        <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">{stat.label}</p>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";

// === Desktop Log Row ===
const DesktopLogRow = memo(({ log }: { log: AuditEntry }) => {
  const Icon = actionIcons[log.action] || <Activity className="h-4 w-4 text-gray-400" />;
  const borderColor = actionColors[log.action] || "border-gray-500/40 bg-gray-500/5";

  return (
    <tr className={`border-l-2 transition-colors duration-150 hover:bg-white/[0.03] ${borderColor}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon}
          <span className="text-sm text-white">{log.action.replace(/_/g, " ")}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-400">{log.targetType}</span>
        {log.targetId && (
          <span className="block max-w-[120px] truncate text-xs text-gray-500">
            {log.targetId}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-white">{log.user?.name || "Unknown"}</p>
        <p className="text-xs text-gray-500">{log.user?.email || "No email"}</p>
      </td>
      <td className="px-4 py-3">
        <pre className="max-w-md overflow-x-auto whitespace-pre-wrap text-xs text-gray-400">
          {typeof log.details === "object"
            ? JSON.stringify(log.details, null, 2)
            : log.details || "-"}
        </pre>
      </td>
      <td className="px-4 py-3">
        <span className="whitespace-nowrap text-xs text-gray-500">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      </td>
    </tr>
  );
});

DesktopLogRow.displayName = "DesktopLogRow";

// === Mobile Log Card ===
const MobileLogCard = memo(({ log }: { log: AuditEntry }) => {
  const Icon = actionIcons[log.action] || <Activity className="h-4 w-4 text-gray-400" />;
  const borderColor = actionColors[log.action] || "border-gray-500/40 bg-gray-500/5";

  return (
    <div className={`rounded-2xl border border-l-2 border-white/10 bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl ${borderColor}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon}
          <span className="truncate text-sm font-medium text-white">
            {log.action.replace(/_/g, " ")}
          </span>
        </div>
        <span className="whitespace-nowrap text-[11px] text-gray-500">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="min-w-0">
          <p className="text-gray-500">Target</p>
          <p className="truncate text-gray-300">{log.targetType || "-"}</p>
          {log.targetId && (
            <p className="truncate text-gray-500">{log.targetId}</p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-gray-500">User</p>
          <p className="truncate text-gray-300">{log.user?.name || "Unknown"}</p>
          <p className="truncate text-gray-500">{log.user?.email || "No email"}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs text-gray-500">Details</p>
        <pre className="mt-1 max-h-40 overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-900/50 p-2 text-[11px] text-gray-400">
          {typeof log.details === "object"
            ? JSON.stringify(log.details, null, 2)
            : log.details || "-"}
        </pre>
      </div>
    </div>
  );
});

MobileLogCard.displayName = "MobileLogCard";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchLogs();
    }
  }, [session]);

  async function fetchLogs() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/audit");
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const actionTypes = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((log) => log.action)))],
    [logs]
  );

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const matchesAction = filter === "all" || log.action === filter;
        const matchesSearch =
          log.action?.toLowerCase().includes(search.toLowerCase()) ||
          log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          log.targetType?.toLowerCase().includes(search.toLowerCase());
        return matchesAction && matchesSearch;
      }),
    [logs, filter, search]
  );

  const statCards = useMemo(() => [
    {
      label: "Total Logs",
      value: logs.length,
      accent: "text-white",
      ring: "border-white/10",
      glow: "from-indigo-500/20",
    },
    {
      label: "Approvals",
      value: logs.filter((l) => l.action.includes("APPROVE")).length,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
    {
      label: "Updates",
      value: logs.filter((l) => l.action.includes("UPDATE")).length,
      accent: "text-yellow-400",
      ring: "border-yellow-500/20",
      glow: "from-yellow-500/20",
    },
    {
      label: "Creations",
      value: logs.filter((l) => l.action.includes("CREATE")).length,
      accent: "text-purple-400",
      ring: "border-purple-500/20",
      glow: "from-purple-500/20",
    },
  ], [logs]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
  }, []);

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Loading audit logs...</p>
          </div>
        </div>
      </>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
        {/* Header - NO animations */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-emerald-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12">
                <Shield className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  Audit Logs
                </h1>
                <p className="mt-0.5 truncate text-xs text-gray-300 sm:text-sm">
                  Track all admin actions and system changes
                </p>
              </div>
            </div>
            <span className="flex w-fit items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              {logs.length} entries
            </span>
          </div>
        </div>

        {/* Stats - NO animations */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Filters - NO animations */}
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={handleSearchChange}
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="hidden flex-shrink-0 text-gray-400 sm:block" />
            <select
              value={filter}
              onChange={handleFilterChange}
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:flex-none"
            >
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action === "all" ? "All Actions" : action.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              onClick={fetchLogs}
              disabled={refreshing}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-gray-900/50 text-gray-300 transition-colors duration-150 hover:bg-gray-700/60 disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Logs - NO animations */}
        {filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 py-12 text-center shadow-2xl backdrop-blur-xl">
            <Activity className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Audit Logs Found</h3>
            <p className="text-gray-400">Admin actions will appear here.</p>
          </div>
        ) : (
          <>
            {/* Desktop table - NO animations */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="border-b border-white/10 bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Target</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.map((log) => (
                      <DesktopLogRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card list - NO animations */}
            <div className="space-y-3 md:hidden">
              {filteredLogs.map((log) => (
                <MobileLogCard key={log.id} log={log} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}