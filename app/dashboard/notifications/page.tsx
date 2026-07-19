"use client";

import { useState, useEffect, useCallback, useMemo,memo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellDot,
  BellRing,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Calendar,
  Award,
  MessageCircle,
  Users,
  Shield,
  Star,
  Crown,
  Gift,
  Mail,
  FileText,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  Filter,
  Search,
  RefreshCw,
  ChevronRight,
  Eye,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: number;
  priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

const priorityConfig = {
  CRITICAL: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Critical",
    icon: AlertCircle,
    ring: "ring-red-500/30",
  },
  HIGH: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    label: "High",
    icon: Zap,
    ring: "ring-orange-500/30",
  },
  MEDIUM: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Medium",
    icon: Clock,
    ring: "ring-yellow-500/30",
  },
  LOW: {
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    label: "Low",
    icon: CheckCircle,
    ring: "ring-gray-500/30",
  },
};

function getIcon(type: string) {
  const icons: Record<string, any> = {
    MATCH_RESULT_PENDING: Trophy,
    MATCH_RESULT_APPROVED: Trophy,
    MATCH_RESULT_REJECTED: XCircle,
    NEW_FIXTURE: Calendar,
    FIXTURE_REMINDER: Clock,
    TOURNAMENT_START: Crown,
    TOURNAMENT_UPDATE: Crown,
    TOURNAMENT_COMPLETED: Crown,
    AWARD_EARNED: Award,
    SEASON_UPDATE: Calendar,
    REGISTRATION_CLOSING: Calendar,
    PAYMENT_CONFIRMED: Gift,
    PAYMENT_FAILED: XCircle,
    NEWS_PUBLISHED: FileText,
    COMMUNITY_REPLY: MessageCircle,
    COMMUNITY_LIKE: MessageCircle,
    SYSTEM_ALERT: Shield,
    ADMIN_ALERT: Shield,
  };
  return icons[type] || Bell;
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return past.toLocaleDateString();
}

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const NotificationCard = memo(({ 
  notification, 
  onMarkRead, 
  onDelete,
  isMarking 
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarking: string | null;
}) => {
  const Icon = getIcon(notification.type);
  const config = priorityConfig[notification.priorityLevel];
  const isUnread = !notification.read;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 transition-colors ${
        isUnread
          ? "border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.ring} ring-1`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">{notification.title}</h3>
              {isUnread && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                  New
                </span>
              )}
            </div>
            <span className="flex-shrink-0 text-xs text-gray-500">
              {getTimeAgo(notification.createdAt)}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-400">{notification.message}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className={`flex items-center gap-1 font-medium ${config.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${config.color.replace("text-", "bg-")}`} />
              {config.label} • {notification.priority}% priority
            </span>
            {notification.reason && (
              <span className="text-gray-500">💡 {notification.reason}</span>
            )}
            {notification.type && (
              <span className="text-gray-500">📌 {notification.type.replace(/_/g, " ")}</span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {isUnread && (
              <button
                onClick={() => onMarkRead(notification.id)}
                disabled={isMarking === notification.id}
                className="flex min-h-[32px] items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-1 text-xs text-indigo-300 transition-colors hover:bg-indigo-500/30 disabled:opacity-50"
              >
                {isMarking === notification.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Mark as read
              </button>
            )}
            {notification.link && (
              <Link
                href={notification.link}
                className="flex min-h-[32px] items-center gap-1.5 rounded-lg bg-gray-700/50 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600/50 hover:text-white"
              >
                View <ChevronRight className="h-3 w-3" />
              </Link>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="flex min-h-[32px] items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

NotificationCard.displayName = "NotificationCard";

const FilterButton = memo(({ 
  value, 
  label, 
  count, 
  isActive, 
  onClick 
}: {
  value: string;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    {label}
    {count > 0 && (
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
        isActive ? "bg-white/20" : "bg-white/5"
      }`}>
        {count}
      </span>
    )}
  </button>
));

FilterButton.displayName = "FilterButton";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
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
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function NotificationCenterPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [counts, setCounts] = useState<NotificationCounts>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  });
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/notifications/smart?limit=100");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setCounts(data.counts || { critical: 0, high: 0, medium: 0, low: 0, total: 0 });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setMarkingId(notificationId);
    try {
      await fetch("/api/notifications/smart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      await fetchNotifications();
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    } finally {
      setMarkingId(null);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/smart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      await fetchNotifications();
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!confirm("Delete this notification?")) return;
    try {
      await fetch(`/api/notifications/smart?id=${notificationId}`, {
        method: "DELETE",
      });
      await fetchNotifications();
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete");
    }
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => filter === "ALL" || n.priorityLevel === filter)
      .filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [notifications, filter, searchTerm]);

  const filterButtons = useMemo(() => [
    { value: "ALL", label: "All", count: counts.total },
    { value: "CRITICAL", label: "Critical", count: counts.critical },
    { value: "HIGH", label: "High", count: counts.high },
    { value: "MEDIUM", label: "Medium", count: counts.medium },
    { value: "LOW", label: "Low", count: counts.low },
  ], [counts]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Bell className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading notifications...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching your updates</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      <DecorBackground />
      <div className="space-y-5 will-change-transform sm:space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-6 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <BellRing className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                  🔔 Notifications
                  {counts.total > 0 && (
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300">
                      {counts.total}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-400">
                  {counts.critical > 0 && `${counts.critical} critical · `}
                  {counts.high > 0 && `${counts.high} high · `}
                  {counts.medium > 0 && `${counts.medium} medium · `}
                  {counts.low > 0 && `${counts.low} low`}
                  {counts.total === 0 && "No notifications"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {counts.total > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs text-indigo-300 transition-colors hover:bg-indigo-600/30 disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Mark All Read
                </button>
              )}
              <button
                onClick={fetchNotifications}
                disabled={refreshing}
                className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gray-700/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-600/50 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterButtons.map((btn) => (
              <FilterButton
                key={btn.value}
                value={btn.value}
                label={btn.label}
                count={btn.count}
                isActive={filter === btn.value}
                onClick={() => setFilter(btn.value as any)}
              />
            ))}
          </div>
          <div className="relative ml-auto flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-[36px] w-full rounded-lg border border-white/10 bg-gray-900/50 pl-8 pr-3 text-xs text-white placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:w-48"
            />
          </div>
        </div>

        {/* Notification List */}
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-700/30">
              <Bell className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">No notifications</h3>
            <p className="text-sm text-gray-400">
              {searchTerm || filter !== "ALL"
                ? "Try adjusting your filters"
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
                isMarking={markingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}