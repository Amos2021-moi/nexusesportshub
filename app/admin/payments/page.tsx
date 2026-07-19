"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import {
  Users,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  Loader2,
  Zap,
  Calendar,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { generatePDFReport, generateExcelReport } from "@/lib/utils/exportPayments";
import { Skeleton } from "@/components/ui/Skeleton";

// Types
interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successRate: number;
  averageFee: number;
  activePayers: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  revenueChange: number;
  paymentChange: number;
}

interface RevenueData {
  date: string;
  amount: number;
  count: number;
}

interface PaymentMethod {
  method: string;
  count: number;
  percentage: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface Payment {
  id: string;
  playerName: string;
  playerEmail: string;
  amount: number;
  status: string;
  method: string;
  seasonName: string;
  receipt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ----------------------------------------------------------------------------
// Animation Variants
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Decor Background
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Format Currency
// ----------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString()}`;
}

// Build a smooth (catmull-rom -> bezier) SVG path from points for a premium curve.
function smoothLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const t = 0.18;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ stat }: { stat: any }) => {
  const Icon = stat.icon;
  const isPositive = stat.change && stat.change > 0;
  const isNegative = stat.change && stat.change < 0;

  return (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="will-change-transform"
    >
      <div className="group relative h-full min-h-[80px] overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/50">
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="mb-2 flex items-center justify-between">
            <div className={`rounded-lg ${stat.bg} p-2`}>
              <Icon className={`h-4 w-4 ${stat.accent}`} />
            </div>
            {stat.change !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  isPositive
                    ? "text-emerald-400"
                    : isNegative
                    ? "text-red-400"
                    : "text-gray-500"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : isNegative ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : null}
                {Math.abs(stat.change)}%
              </span>
            )}
          </div>
          <div>
            <p className="truncate text-xl font-bold text-white">{stat.value}</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">{stat.label}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

const StatusBar = memo(({ item }: { item: StatusDistribution }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-300">{item.status}</span>
      <span className="font-medium text-white">{item.count}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-gray-700">
      <motion.div
        className={`h-full rounded-full ${getStatusColor(item.color)}`}
        initial={{ width: 0 }}
        animate={{ width: `${item.percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
    <div className="text-right text-xs text-gray-500">{item.percentage}%</div>
  </div>
));

StatusBar.displayName = "StatusBar";

const PaymentRow = memo(({ payment }: { payment: Payment }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-400">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      case "PAYMENT_PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "NOT_ENROLLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/15 px-2.5 py-0.5 text-xs font-medium text-gray-400">
            Refunded
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-500/15 px-2.5 py-0.5 text-xs text-gray-400">
            {status}
          </span>
        );
    }
  };

  return (
    <tr className="transition-colors hover:bg-white/5">
      <td className="py-2.5 pr-2 font-medium text-white">{payment.playerName}</td>
      <td className="py-2.5 pr-2 text-emerald-400">{formatCurrency(payment.amount)}</td>
      <td className="py-2.5 pr-2">{getStatusBadge(payment.status)}</td>
      <td className="py-2.5 pr-2 text-gray-300">{payment.method}</td>
      <td className="py-2.5 pr-2 text-gray-400">{payment.seasonName}</td>
      <td className="py-2.5 text-gray-500">
        {payment.paidAt
          ? new Date(payment.paidAt).toLocaleDateString()
          : new Date(payment.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
});

PaymentRow.displayName = "PaymentRow";

const PaymentCard = memo(({ payment }: { payment: Payment }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-400">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      case "PAYMENT_PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "NOT_ENROLLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-500/15 px-2.5 py-0.5 text-xs text-gray-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-gray-900/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{payment.playerName}</p>
          <p className="truncate text-xs text-gray-500">{payment.seasonName}</p>
        </div>
        <span className="flex-shrink-0 font-bold text-emerald-400">
          {formatCurrency(payment.amount)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getStatusBadge(payment.status)}
          <span className="text-xs text-gray-400">{payment.method}</span>
        </div>
        <span className="text-xs text-gray-500">
          {payment.paidAt
            ? new Date(payment.paidAt).toLocaleDateString()
            : new Date(payment.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
});

PaymentCard.displayName = "PaymentCard";

// Helper function for status color
function getStatusColor(color: string) {
  switch (color) {
    case "emerald":
      return "bg-emerald-500";
    case "yellow":
      return "bg-yellow-500";
    case "red":
      return "bg-red-500";
    case "gray":
      return "bg-gray-500";
    default:
      return "bg-indigo-500";
  }
}

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function PaymentAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistribution[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [revenueDays, setRevenueDays] = useState(30);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchAllData();
    }
  }, [session, revenueDays]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchPayments();
    }
  }, [searchTerm, filterStatus, pagination.page]);

  async function fetchAllData() {
    setLoading(true);
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchRevenue(),
        fetchMethods(),
        fetchStatusDistribution(),
        fetchPayments(),
      ]);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchStats() {
    const res = await fetch("/api/admin/payments/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  }

  async function fetchRevenue() {
    const res = await fetch(`/api/admin/payments/revenue?days=${revenueDays}`);
    if (res.ok) {
      const data = await res.json();
      setRevenueData(data);
    }
  }

  async function fetchMethods() {
    const res = await fetch("/api/admin/payments/methods");
    if (res.ok) {
      const data = await res.json();
      setMethods(data);
    }
  }

  async function fetchStatusDistribution() {
    const res = await fetch("/api/admin/payments/status-distribution");
    if (res.ok) {
      const data = await res.json();
      setStatusDist(data);
    }
  }

  async function fetchPayments() {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: "20",
      status: filterStatus,
      search: searchTerm,
    });

    const res = await fetch(`/api/admin/payments/list?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPayments(data.payments);
      setPagination(data.pagination);
    }
  }

  const handleExportPDF = useCallback(async () => {
    if (!stats || payments.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      toast.loading("Generating PDF...");
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - revenueDays);

      const exportData = {
        payments: payments,
        stats: {
          totalRevenue: stats.totalRevenue,
          totalPayments: stats.totalPayments,
          successRate: stats.successRate,
          averageFee: stats.averageFee,
        },
        dateRange: {
          from: startDate.toISOString(),
          to: now.toISOString(),
        },
        platformName: "Nexus Esports",
      };

      generatePDFReport(exportData);
      toast.dismiss();
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.dismiss();
      toast.error("Failed to export PDF");
    }
    setIsExportOpen(false);
  }, [stats, payments, revenueDays]);

  const handleExportExcel = useCallback(async () => {
    if (!stats || payments.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      toast.loading("Generating Excel...");
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - revenueDays);

      const exportData = {
        payments: payments,
        stats: {
          totalRevenue: stats.totalRevenue,
          totalPayments: stats.totalPayments,
          successRate: stats.successRate,
          averageFee: stats.averageFee,
        },
        dateRange: {
          from: startDate.toISOString(),
          to: now.toISOString(),
        },
        platformName: "Nexus Esports",
      };

      generateExcelReport(exportData);
      toast.dismiss();
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.dismiss();
      toast.error("Failed to export Excel");
    }
    setIsExportOpen(false);
  }, [stats, payments, revenueDays]);

  const statCards = useMemo(() => stats ? [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      change: stats.revenueChange,
    },
    {
      label: "Total Payments",
      value: stats.totalPayments,
      icon: CreditCard,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      change: stats.paymentChange,
    },
    {
      label: "Success Rate",
      value: `${stats.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      accent: "text-green-400",
      bg: "bg-green-500/10",
      change: 0,
    },
    {
      label: "Avg Entry Fee",
      value: formatCurrency(stats.averageFee),
      icon: Wallet,
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
      change: 0,
    },
    {
      label: "Active Payers",
      value: stats.activePayers,
      icon: Users,
      accent: "text-cyan-400",
      bg: "bg-cyan-500/10",
      change: 0,
    },
    {
      label: "Pending",
      value: stats.pendingCount,
      icon: Clock,
      accent: "text-yellow-400",
      bg: "bg-yellow-500/10",
      change: 0,
    },
  ] : [], [stats]);

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <BarChart3 className="absolute inset-0 m-auto h-7 w-7 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading payment analytics...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching your data</span>
            </div>
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
        className="space-y-5 will-change-transform sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-indigo-500/40 sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition-opacity group-hover:opacity-75" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl transition-opacity group-hover:opacity-75" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-14 sm:w-14">
                <BarChart3 className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                  💰 Payment Analytics
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300">
                    v1.0
                  </span>
                </h1>
                <p className="text-xs text-gray-400 sm:text-sm">
                  Track revenue, payments, and financial insights
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="text-xs font-medium text-green-400">Live</span>
              </div>
              <button
                onClick={fetchAllData}
                disabled={refreshing}
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gray-700/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-600/50 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-indigo-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                  <span className="text-[10px]">▼</span>
                </button>
                {isExportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-gray-800 shadow-xl">
                      <button
                        onClick={handleExportPDF}
                        className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Export as PDF
                      </button>
                      <button
                        onClick={handleExportExcel}
                        className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Export as Excel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Revenue Chart */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl transition-colors hover:border-indigo-500/40 sm:p-6 lg:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-500/10 p-2">
                  <Activity className="h-5 w-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Revenue Trend</h2>
              </div>
              <select
                value={revenueDays}
                onChange={(e) => setRevenueDays(parseInt(e.target.value))}
                className="min-h-[36px] rounded-lg border border-white/10 bg-gray-900/50 px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            {revenueData.length === 0 || revenueData.every((d) => d.amount === 0) ? (
              <div className="flex h-64 items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-600" />
                  <p className="mt-3 text-sm font-medium text-gray-400">No revenue data yet</p>
                  <p className="text-xs text-gray-500">Revenue will appear here once payments are made</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <div className="relative h-full w-full">
                  {/* Y-Axis Labels */}
                  <div className="absolute -left-1 top-0 flex h-full flex-col justify-between text-[10px] text-gray-500">
                    {(() => {
                      const maxValue = Math.max(...revenueData.map((d) => d.amount), 1);
                      const steps = 5;
                      const stepSize = Math.ceil(maxValue / steps / 10) * 10;
                      const labels = [];
                      for (let i = 0; i <= steps; i++) {
                        labels.push(i * stepSize);
                      }
                      return labels.reverse().map((label) => (
                        <span key={label} className="text-right tabular-nums">
                          {label === 0 ? "0" : formatCurrency(label)}
                        </span>
                      ));
                    })()}
                  </div>

                  <div className="ml-12 h-[calc(100%-1.25rem)]">
                    <svg
                      className="h-full w-full overflow-visible"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
                          <stop offset="55%" stopColor="#818cf8" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="50%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                        <filter id="lineGlow" x="-20%" y="-40%" width="140%" height="180%">
                          <feGaussianBlur stdDeviation="1.6" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {[0, 25, 50, 75, 100].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="100"
                          y2={y}
                          stroke="rgba(148,163,184,0.12)"
                          strokeWidth="0.4"
                          strokeDasharray="2,3"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}

                      {(() => {
                        const maxValue = Math.max(...revenueData.map((d) => d.amount), 1);
                        const pts = revenueData.map((d, i) => {
                          const x = revenueData.length === 1 ? 50 : (i / (revenueData.length - 1)) * 100;
                          const y = 100 - (d.amount / maxValue) * 85 - 10;
                          return { x, y };
                        });

                        const linePath = smoothLinePath(pts);
                        const first = pts[0];
                        const last = pts[pts.length - 1];
                        const areaPath = `${linePath} L ${last.x},100 L ${first.x},100 Z`;

                        return (
                          <>
                            <path d={areaPath} fill="url(#areaGradient)" />
                            <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" filter="url(#lineGlow)" />
                            {pts.map((p, i) => {
                              const amount = revenueData[i]?.amount || 0;
                              if (amount <= 0) return null;
                              return (
                                <g key={i}>
                                  <circle cx={p.x} cy={p.y} r="6" fill="#818cf8" opacity="0.18" vectorEffect="non-scaling-stroke" />
                                  <circle cx={p.x} cy={p.y} r="2.4" fill="#c7d2fe" stroke="#4f46e5" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>

                    <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                      {revenueData.map((item, index) => {
                        const day = new Date(item.date).getDate();
                        const isToday = item.date === new Date().toISOString().split("T")[0];
                        const showEvery = Math.ceil(revenueData.length / 12);
                        if (index % showEvery !== 0 && index !== revenueData.length - 1) {
                          return <span key={index} className="w-0" />;
                        }
                        return (
                          <span key={index} className={`text-center ${isToday ? "font-bold text-indigo-400" : ""}`}>
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-white/5 pt-2 text-[10px] text-gray-500">
                  <span>Total: {formatCurrency(revenueData.reduce((sum, d) => sum + d.amount, 0))}</span>
                  <span>{revenueData.filter((d) => d.amount > 0).length} days with payments</span>
                  <span>Avg: {formatCurrency(revenueData.reduce((sum, d) => sum + d.amount, 0) / (revenueData.filter((d) => d.amount > 0).length || 1))}</span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-4 rounded bg-gradient-to-r from-indigo-500 to-purple-500" />
                    Revenue
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl transition-colors hover:border-purple-500/40 sm:p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <PieChart className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Payment Status</h2>
            </div>
            {statusDist.length === 0 || statusDist.every((s) => s.count === 0) ? (
              <div className="flex h-64 items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="mx-auto h-10 w-10 text-gray-600" />
                  <p className="mt-2 text-sm">No data yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {statusDist.map((item) => (
                  <StatusBar key={item.status} item={item} />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Payment Methods & Recent Payments */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-6">
          {/* Payment Methods */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl transition-colors hover:border-cyan-500/40 sm:p-6 lg:col-span-1"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-cyan-500/10 p-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Methods</h2>
            </div>
            <div className="space-y-3">
              {methods.length === 0 || methods.every((m) => m.count === 0) ? (
                <div className="py-6 text-center text-sm text-gray-500">No payment data yet</div>
              ) : (
                methods.map((method) => (
                  <div
                    key={method.method}
                    className="flex items-center justify-between rounded-lg bg-gray-900/30 px-3 py-2.5 transition-colors hover:bg-gray-900/50"
                  >
                    <span className="text-sm font-medium text-gray-300">{method.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{method.count}</span>
                      <span className="text-xs text-gray-500">({method.percentage}%)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Payments */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl transition-colors hover:border-indigo-500/40 sm:p-6 lg:col-span-3"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-500/10 p-2">
                  <Activity className="h-5 w-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
                <span className="rounded-full bg-gray-700/50 px-2.5 py-0.5 text-xs text-gray-400">
                  {pagination.total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="min-h-[40px] w-full rounded-lg border border-white/10 bg-gray-900/50 pl-8 pr-2 text-xs text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:w-48"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="min-h-[40px] rounded-lg border border-white/10 bg-gray-900/50 px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Paid</option>
                  <option value="PAYMENT_PENDING">Pending</option>
                  <option value="NOT_ENROLLED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No payments found</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
                        <th className="pb-2 pr-2 font-medium">Player</th>
                        <th className="pb-2 pr-2 font-medium">Amount</th>
                        <th className="pb-2 pr-2 font-medium">Status</th>
                        <th className="pb-2 pr-2 font-medium">Method</th>
                        <th className="pb-2 pr-2 font-medium">Season</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payments.map((payment) => (
                        <PaymentRow key={payment.id} payment={payment} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="space-y-3 md:hidden">
                  {payments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page <= 1}
                    className="min-h-[40px] rounded-lg border border-white/10 px-3 py-1 transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.pages}
                    className="min-h-[40px] rounded-lg border border-white/10 px-3 py-1 transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}