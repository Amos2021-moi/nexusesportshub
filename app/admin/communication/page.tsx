"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Send,
  Mail,
  Bell,
  Users,
  Search,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  UserCheck,
  UserX,
  Zap,
  Shield,
  MailCheck,
  BellRing,
  CheckCheck,
  Inbox,
  SendHorizontal,
  UserPlus,
  UserMinus,
  ArrowRight,
  Paperclip,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import FileAttachment from "@/components/admin/communication/FileAttachment";

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

interface Player {
  id: string;
  name: string;
  email: string;
  emailNotificationsEnabled: boolean;
  isVerified: boolean;
  profile: {
    username: string;
    profilePicture: string | null;
  } | null;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  mimeType: string;
}

interface CommunicationLog {
  id: string;
  subject: string;
  message: string;
  channel: string;
  recipientType: string;
  recipientCount: number;
  status: string;
  sentAt: string;
  deliveredAt: string | null;
  admin: {
    name: string;
    email: string;
  };
  stats?: {
    email: { sent: number; delivered: number; read: number; failed: number };
    inApp: { sent: number; delivered: number; read: number; failed: number };
  };
}

interface StatsData {
  totalSent: number;
  totalRecipients: number;
  todaySent: number;
  readCount: number;
  readRate: number;
  statusBreakdown: Record<string, number>;
  channelBreakdown: Record<string, number>;
}

/* -------------------------------------------------------------------------- */
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const statVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

/* -------------------------------------------------------------------------- */
/*                            Decor Background                                */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"
    />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           Utility Components                               */
/* -------------------------------------------------------------------------- */

const StatusBadge = memo(({ status }: { status: string }) => {
  const configs: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    SENT: {
      label: "Sent",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    },
    PARTIAL: {
      label: "Partial",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    FAILED: {
      label: "Failed",
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    },
    PENDING: {
      label: "Pending",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  };

  const config = configs[status] || configs.PENDING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.bg,
        config.color
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

const ChannelBadge = memo(({ channel }: { channel: string }) => {
  const configs: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    EMAIL: { label: "Email", icon: <Mail className="h-3.5 w-3.5" />, color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
    IN_APP: { label: "In-App", icon: <Bell className="h-3.5 w-3.5" />, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
    BOTH: { label: "Both", icon: <Zap className="h-3.5 w-3.5" />, color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10" },
  };

  const config = configs[channel] || configs.EMAIL;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.color
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
});

ChannelBadge.displayName = "ChannelBadge";

const StatCard = memo(({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  delay?: number;
}) => (
  <motion.div
    variants={statVariants}
    initial="hidden"
    animate="visible"
    transition={{ delay }}
    whileHover={{ y: -4 }}
    className="will-change-transform group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl transition-all hover:border-indigo-500/40"
  >
    <div
      className={cn(
        "pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40",
        color
      )}
    />
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <div className={cn("rounded-xl p-2.5", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {subtitle && <span className="text-[10px] font-medium text-gray-500">{subtitle}</span>}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-400">{label}</p>
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";

/* -------------------------------------------------------------------------- */
/*                           Memoized Components                              */
/* -------------------------------------------------------------------------- */

const PlayerCheckbox = memo(({ player, isSelected, onToggle }: {
  player: Player;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) => (
  <label
    className={cn(
      "flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-all hover:bg-gray-700/30",
      isSelected && "bg-indigo-500/10 ring-1 ring-indigo-500/30"
    )}
  >
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(player.id)}
      className="h-4 w-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">
        {player.profile?.username || player.name || "Unknown"}
      </p>
      <p className="text-xs text-gray-500 truncate">{player.email}</p>
    </div>
    {player.isVerified && (
      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-400" />
    )}
  </label>
));

PlayerCheckbox.displayName = "PlayerCheckbox";

const HistoryMessage = memo(({ log, isExpanded, onToggle, onDelete }: {
  log: CommunicationLog;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="overflow-hidden rounded-xl border border-white/10 bg-gray-900/30 transition-all hover:border-indigo-500/20"
  >
    <div
      className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4 transition-colors hover:bg-white/5"
      onClick={onToggle}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-white">{log.subject}</span>
          <StatusBadge status={log.status} />
          <ChannelBadge channel={log.channel} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {log.recipientType === "ALL" ? "All Players" : `${log.recipientCount} players`}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(log.sentAt).toLocaleString()}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {log.admin.name || log.admin.email}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(log.id);
          }}
          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </div>
    </div>

    <AnimatePresence>
      {isExpanded && log.stats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-white/10 bg-gray-800/30 p-4"
        >
          <p className="mb-4 whitespace-pre-wrap text-sm text-gray-300">{log.message}</p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Email Sent", value: log.stats.email.sent, color: "text-green-400" },
              { label: "Email Delivered", value: log.stats.email.delivered, color: "text-blue-400" },
              { label: "Email Read", value: log.stats.email.read, color: "text-purple-400" },
              { label: "Email Failed", value: log.stats.email.failed, color: "text-red-400" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-gray-900/40 p-3 text-center">
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "In-App Sent", value: log.stats.inApp.sent, color: "text-green-400" },
              { label: "In-App Delivered", value: log.stats.inApp.delivered, color: "text-blue-400" },
              { label: "In-App Read", value: log.stats.inApp.read, color: "text-purple-400" },
              { label: "In-App Failed", value: log.stats.inApp.failed, color: "text-red-400" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-gray-900/40 p-3 text-center">
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
));

HistoryMessage.displayName = "HistoryMessage";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function CommunicationCenterPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "IN_APP" | "BOTH">("BOTH");
  const [recipientType, setRecipientType] = useState<"ALL" | "SPECIFIC">("ALL");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<CommunicationLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterChannel, setFilterChannel] = useState<string>("");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isComposeExpanded, setIsComposeExpanded] = useState(true);

  const fetchPlayers = useCallback(async (search?: string) => {
    try {
      const url = `/api/admin/communication/recipients${search ? `?search=${search}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterChannel) params.append("channel", filterChannel);
      params.append("_t", Date.now().toString());
      const url = `/api/admin/communication/history?${params.toString()}`;

      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        setHistory(data.logs);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, [filterStatus, filterChannel]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/communication/stats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await res.json();

      if (data?.stats && typeof data.stats === "object") {
        setStats(data.stats as StatsData);
      } else if (data && typeof data === "object") {
        setStats(data as StatsData);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(null);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPlayers(), fetchHistory(), fetchStats()]);
    setLoading(false);
  }, [fetchPlayers, fetchHistory, fetchStats]);

  useEffect(() => {
    const loadData = async () => {
      console.log("🔄 [PROD] Loading data...");
      setLoading(true);
      try {
        await Promise.all([
          fetchPlayers(),
          fetchHistory(),
          fetchStats(),
        ]);
        console.log("🔄 [PROD] Data loaded successfully");
      } catch (error) {
        console.error("🔄 [PROD] Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    if (recipientType === "SPECIFIC" && selectedPlayers.length === 0) {
      toast.error("Please select at least one player");
      return;
    }

    const recipients = recipientType === "ALL" ? "all" : selectedPlayers;

    setSending(true);
    try {
      const res = await fetch("/api/admin/communication/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          recipients,
          subject,
          message,
          attachments: attachments.map((a) => ({
            fileName: a.fileName,
            fileSize: a.fileSize,
            fileType: a.fileType,
            fileUrl: a.fileUrl,
            mimeType: a.mimeType,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Message sent successfully!");
        setSubject("");
        setMessage("");
        setSelectedPlayers([]);
        setAttachments([]);
        
        setTimeout(async () => {
          console.log("🔄 Refreshing history after send...");
          await fetchHistory();
          await fetchStats();
          console.log("✅ History refreshed");
        }, 1000);
        
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this message log?")) return;

    try {
      const res = await fetch(`/api/admin/communication/delete?id=${logId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Message deleted");
        await Promise.all([fetchHistory(), fetchStats()]);
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleAllPlayers = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map((p) => p.id));
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    const query = searchTerm.toLowerCase();
    return players.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.profile?.username?.toLowerCase().includes(query)
    );
  }, [players, searchTerm]);

  const totalSelected = selectedPlayers.length;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <MessageCircle className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
          </div>
          <p className="mt-2 font-medium text-gray-400">Loading Communication Center...</p>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
            <Sparkles className="h-3 w-3 text-yellow-400" />
            <span>Preparing your messages</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 will-change-transform sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <MessageCircle className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                  📨 Communication Center
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300">
                    v1.0
                  </span>
                </h1>
                <p className="mt-0.5 text-sm text-gray-400">
                  Send messages to players via Email and/or In-App notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="text-xs font-medium text-green-400">Live</span>
              </div>
              <button
                onClick={loadAllData}
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gray-700/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-600/50 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <StatCard
            icon={SendHorizontal}
            label="Total Messages"
            value={stats?.totalSent || 0}
            color="bg-gradient-to-r from-indigo-500 to-purple-500"
            delay={0}
          />
          <StatCard
            icon={Users}
            label="Recipients Reached"
            value={stats?.totalRecipients || 0}
            color="bg-gradient-to-r from-emerald-500 to-green-500"
            delay={0.05}
          />
          <StatCard
            icon={Calendar}
            label="Sent Today"
            value={stats?.todaySent || 0}
            color="bg-gradient-to-r from-blue-500 to-cyan-500"
            delay={0.1}
          />
          <StatCard
            icon={Eye}
            label="Read Rate"
            value={`${stats?.readRate || 0}%`}
            subtitle={`${stats?.readCount || 0} read`}
            color="bg-gradient-to-r from-amber-500 to-orange-500"
            delay={0.15}
          />
          <StatCard
            icon={CheckCheck}
            label="Read Receipts"
            value={stats?.readCount || 0}
            color="bg-gradient-to-r from-purple-500 to-pink-500"
            delay={0.2}
          />
        </motion.div>

        {/* Status & Channel Breakdown */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-3 text-sm font-semibold text-white">Status Breakdown</h3>
            <div className="flex flex-wrap gap-2">
              {stats?.statusBreakdown &&
                Object.entries(stats.statusBreakdown).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-gray-900/40 px-3 py-2"
                  >
                    <StatusBadge status={status} />
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-3 text-sm font-semibold text-white">Channel Breakdown</h3>
            <div className="flex flex-wrap gap-2">
              {stats?.channelBreakdown &&
                Object.entries(stats.channelBreakdown).map(([channel, count]) => (
                  <div
                    key={channel}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-gray-900/40 px-3 py-2"
                  >
                    <ChannelBadge channel={channel} />
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Compose Message */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

          <div className="relative p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Compose Message</h2>
                  <p className="text-xs text-gray-400">Send announcements, updates, or direct messages</p>
                </div>
              </div>
              <button
                onClick={() => setIsComposeExpanded(!isComposeExpanded)}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                {isComposeExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>

            <AnimatePresence>
              {isComposeExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Channel Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Send via</label>
                    <div className="flex flex-wrap gap-3">
                      {(["EMAIL", "IN_APP", "BOTH"] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => setChannel(option)}
                          className={cn(
                            "flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                            channel === option
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30"
                              : "border border-white/10 bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white"
                          )}
                        >
                          {option === "EMAIL" && <Mail className="h-4 w-4" />}
                          {option === "IN_APP" && <Bell className="h-4 w-4" />}
                          {option === "BOTH" && <Zap className="h-4 w-4" />}
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recipient Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Recipients</label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setRecipientType("ALL")}
                        className={cn(
                          "flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                          recipientType === "ALL"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30"
                            : "border border-white/10 bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white"
                        )}
                      >
                        <Users className="h-4 w-4" />
                        All Players
                      </button>
                      <button
                        onClick={() => setRecipientType("SPECIFIC")}
                        className={cn(
                          "flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                          recipientType === "SPECIFIC"
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30"
                            : "border border-white/10 bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white"
                        )}
                      >
                        <UserCheck className="h-4 w-4" />
                        Select Players
                      </button>
                    </div>

                    {recipientType === "SPECIFIC" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-xl border border-white/10 bg-gray-900/40 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search players..."
                              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-800/60 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={toggleAllPlayers}
                              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-gray-700/50 px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-600/50 hover:text-white"
                            >
                              {selectedPlayers.length === players.length ? (
                                <UserMinus className="h-3.5 w-3.5" />
                              ) : (
                                <UserPlus className="h-3.5 w-3.5" />
                              )}
                              {selectedPlayers.length === players.length ? "Deselect All" : "Select All"}
                            </button>
                            <span className="text-xs text-gray-500">{totalSelected} selected</span>
                          </div>
                        </div>

                        <div className="mt-3 max-h-48 overflow-y-auto space-y-1 rounded-xl border border-white/5 bg-gray-900/30 p-1">
                          {filteredPlayers.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500">No players found</div>
                          ) : (
                            filteredPlayers.map((player) => (
                              <PlayerCheckbox
                                key={player.id}
                                player={player}
                                isSelected={selectedPlayers.includes(player.id)}
                                onToggle={togglePlayerSelection}
                              />
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-300">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter message subject..."
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-800/60 px-4 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">Message</label>
                      <span className="text-xs text-gray-500">{message.length} characters</span>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Write your message here..."
                      className="w-full rounded-xl border border-white/10 bg-gray-800/60 px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                    />
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Attachments (Optional)</label>
                    <FileAttachment
                      onAttachmentsChange={setAttachments}
                      maxFiles={5}
                      maxSize={10}
                      disabled={sending}
                    />
                  </div>

                  {/* Send Button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSend}
                    disabled={sending}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send Message
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Message History */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
        >
          <div className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Inbox className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Message History</h2>
                  <p className="text-xs text-gray-400">{history.length} messages sent</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-white/10 bg-gray-800/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">All Status</option>
                  <option value="SENT">Sent</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-white/10 bg-gray-800/60 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="IN_APP">In-App</option>
                  <option value="BOTH">Both</option>
                </select>
                <button
                  onClick={fetchHistory}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-gray-700/50 text-gray-400 transition-colors hover:bg-gray-600/50 hover:text-white"
                >
                  <RefreshCw className={cn("h-4 w-4", historyLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="text-xl font-semibold text-white">No Messages Yet</h3>
                <p className="mt-1 text-gray-400">Start sending messages to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((log) => (
                  <HistoryMessage
                    key={log.id}
                    log={log}
                    isExpanded={expandedLog === log.id}
                    onToggle={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}