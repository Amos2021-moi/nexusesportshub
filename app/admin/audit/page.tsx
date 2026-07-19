"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function DecorBackground() {
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
}

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  const statCards = [
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
  ];

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-emerald-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
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
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Track all admin actions and system changes
                </p>
              </div>
            </div>
            <span className="flex w-fit items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              {logs.length} entries
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`group relative min-h-[44px] overflow-hidden rounded-2xl border bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40 ${stat.ring}`}
            >
              <div
                className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity group-hover:opacity-70`}
              />
              <div className="relative">
                <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="hidden flex-shrink-0 text-gray-400 sm:block" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-gray-900/50 text-gray-300 transition-all hover:bg-gray-700/60 disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>

        {/* Logs */}
        {filteredLogs.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-gray-800/40 py-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <Activity className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Audit Logs Found</h3>
            <p className="text-gray-400">Admin actions will appear here.</p>
          </motion.div>
        ) : (
          <>
            {/* Desktop table */}
            <motion.div
              variants={itemVariants}
              className="hidden overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl md:block"
            >
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
                    {filteredLogs.map((log) => {
                      const Icon = actionIcons[log.action] || (
                        <Activity className="h-4 w-4 text-gray-400" />
                      );
                      const borderColor =
                        actionColors[log.action] || "border-gray-500/40 bg-gray-500/5";

                      return (
                        <tr
                          key={log.id}
                          className={`border-l-2 transition-colors hover:bg-white/[0.03] ${borderColor}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {Icon}
                              <span className="text-sm text-white">
                                {log.action.replace(/_/g, " ")}
                              </span>
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
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Mobile card list */}
            <motion.div variants={containerVariants} className="space-y-3 md:hidden">
              {filteredLogs.map((log) => {
                const Icon = actionIcons[log.action] || (
                  <Activity className="h-4 w-4 text-gray-400" />
                );
                const borderColor =
                  actionColors[log.action] || "border-gray-500/40 bg-gray-500/5";

                return (
                  <motion.div
                    key={log.id}
                    variants={itemVariants}
                    className={`rounded-2xl border border-l-2 border-white/10 bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl ${borderColor}`}
                  >
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
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </motion.div>
    </>
  );
}