"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import {
  DollarSign,
  RefreshCw,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  Phone,
  Receipt,
  Loader2,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface Payment {
  id: string;
  userId: string;
  seasonEntryId: string;
  action: string;
  notes: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    profile: {
      username: string;
      profilePicture: string | null;
    };
  };
  seasonEntry: {
    id: string;
    entryFee: number;
    currency: string;
    phoneNumber: string;
    mpesaReceipt: string | null;
    status: string;
    season: {
      name: string;
    };
  };
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
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

const statCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ stat }: { stat: { label: string; value: string | number; color?: string; subtext?: string } }) => (
  <motion.div
    variants={statCardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    className="will-change-transform"
  >
    <div className="group relative h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />
      <div className="relative">
        <p className={`text-2xl font-bold ${stat.color || "text-white"}`}>{stat.value}</p>
        <p className="text-sm text-gray-400">{stat.label}</p>
        {stat.subtext && <p className="text-xs text-gray-500">{stat.subtext}</p>}
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";

const PaymentRow = memo(({ payment }: { payment: Payment }) => {
  const getActionBadge = (action: string) => {
    const configs: Record<string, { icon: any; label: string; className: string }> = {
      PAYMENT_SUCCESS: {
        icon: CheckCircle,
        label: "Success",
        className: "bg-green-500/15 text-green-400 border-green-500/30",
      },
      PAYMENT_FAILED: {
        icon: XCircle,
        label: "Failed",
        className: "bg-red-500/15 text-red-400 border-red-500/30",
      },
      PAYMENT_PENDING: {
        icon: Clock,
        label: "Pending",
        className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      },
      ADMIN_MARKED_PAID: {
        icon: CheckCircle,
        label: "Admin Marked",
        className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      },
    };
    const config = configs[action] || {
      icon: AlertCircle,
      label: action,
      className: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const playerName = payment.user.profile?.username || payment.user.name || "Unknown";
  const formattedDate = new Date(payment.createdAt);

  return (
    <tr className="transition-colors hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {payment.user.profile?.profilePicture ? (
            <img
              src={payment.user.profile.profilePicture}
              alt={playerName}
              className="h-8 w-8 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
              {playerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{playerName}</p>
            <p className="truncate text-xs text-gray-400">{payment.user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300">{payment.seasonEntry.season.name}</td>
      <td className="px-4 py-3 text-sm font-medium text-white">
        KES {payment.seasonEntry.entryFee.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm text-gray-300">
        {payment.seasonEntry.mpesaReceipt || "-"}
      </td>
      <td className="px-4 py-3">{getActionBadge(payment.action)}</td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {formattedDate.toLocaleDateString()}
        <br />
        <span className="text-xs text-gray-500">
          {formattedDate.toLocaleTimeString()}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-xs text-green-400">
          <CheckCircle className="h-3 w-3" />
          Confirmed
        </span>
      </td>
    </tr>
  );
});

PaymentRow.displayName = "PaymentRow";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"
    />
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function AdminCompetitionPayments() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 15000);
    return () => clearInterval(interval);
  }, [filter]);

  async function fetchPayments() {
    setRefreshing(true);
    try {
      const url = new URL("/api/admin/competition/payments", window.location.origin);
      if (filter !== "all") url.searchParams.set("action", filter);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();

      const successfulPayments = data.payments?.filter((p: Payment) => p.action === "PAYMENT_SUCCESS") || [];
      setPayments(successfulPayments);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredPayments = useMemo(() => {
    if (!search) return payments;
    const searchLower = search.toLowerCase();
    return payments.filter((payment) =>
      payment.user.name?.toLowerCase().includes(searchLower) ||
      payment.user.email?.toLowerCase().includes(searchLower) ||
      payment.user.profile?.username?.toLowerCase().includes(searchLower) ||
      payment.seasonEntry.mpesaReceipt?.toLowerCase().includes(searchLower)
    );
  }, [payments, search]);

  const statCards = useMemo(() => stats ? [
    { label: "✅ Successful Payments", value: stats.successCount, color: "text-white" },
    { label: "💰 Total Collected", value: `KES ${stats.totalAmount.toLocaleString()}`, color: "text-green-400" },
    { label: "⏳ Pending", value: stats.pendingCount, color: "text-yellow-400" },
    { label: "❌ Failed", value: stats.failedCount, color: "text-red-400" },
    { label: "📊 Total Transactions", value: stats.totalPayments, color: "text-white" },
  ] : [], [stats]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <DollarSign className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading payments...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching transaction data</span>
            </div>
          </div>
        </div>
      </>
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
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12">
                <DollarSign className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  💰 Payment History
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  All successful competition payments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchPayments}
                disabled={refreshing}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-700/50 px-4 py-2 text-white transition-all hover:bg-gray-600/50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <span className="text-xs text-gray-500">Auto-refresh every 15s</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search payments..."
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-4 text-white placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-h-[44px] appearance-none rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-8 text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="all">All Payments</option>
                <option value="PAYMENT_SUCCESS">✅ Success</option>
                <option value="PAYMENT_FAILED">❌ Failed</option>
                <option value="PAYMENT_PENDING">⏳ Pending</option>
              </select>
            </div>

            <button className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-700/50 px-4 py-2 text-white transition-all hover:bg-gray-600/50">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/60 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Season</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Receipt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      {search ? "No payments match your search" : "No successful payments found"}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <PaymentRow key={payment.id} payment={payment} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Summary */}
        {stats && stats.successCount > 0 && (
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center backdrop-blur-xl"
          >
            <p className="text-sm text-green-400">
              💰 Total collected: <span className="font-bold">KES {stats.totalAmount.toLocaleString()}</span>
              from <span className="font-bold">{stats.successCount}</span> successful payments
            </p>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}