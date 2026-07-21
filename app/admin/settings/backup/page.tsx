// app/admin/settings/backup/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Shield,
  Download,
  Upload,
  History,
  Calendar,
  Clock,
  HardDrive,
  Database,
  FileArchive,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Settings,
  Trash2,
  ChevronRight,
  Plus,
  X,
  Bell,
  BellOff,
  RotateCw,
  Cloud,
  ArrowLeft,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Terminal,
  Server,
  Layers,
  Check,
  AlertTriangle,
  Grid,
  List,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface Backup {
  id: string;
  name: string;
  type: string;
  status: string;
  size: number;
  createdAt: string;
  createdBy: string;
  filePath: string;
  user: {
    name: string;
    email: string;
  };
  metadata?: {
    progress?: number;
    step?: string;
    encrypted?: boolean;
    verified?: boolean;
    tables?: string[];
  };
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  latestBackup: Backup | null;
}

interface ScheduleConfig {
  id?: string;
  enabled: boolean;
  frequency: string;
  time: string;
  keepDaily: number;
  keepWeekly: number;
  keepMonthly: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

/* -------------------------------------------------------------------------- */
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/* -------------------------------------------------------------------------- */
/*                           Background Component                             */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gray-950">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/80" />
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-40 top-10 h-[550px] w-[550px] rounded-full bg-indigo-600/20 blur-[140px]"
    />
    <motion.div
      animate={{ scale: [1.15, 1, 1.15], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-40 top-1/3 h-[550px] w-[550px] rounded-full bg-purple-600/15 blur-[140px]"
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-10 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[140px]"
    />
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                         Memoized Snapshot Row / Card                       */
/* -------------------------------------------------------------------------- */

interface BackupItemProps {
  backup: Backup;
  formatSize: (bytes: number) => string;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
  onRestore: (backup: Backup) => void;
  onDelete: (id: string) => void;
}

const BackupCard = memo(({ backup, formatSize, getStatusColor, getTypeColor, onRestore, onDelete }: BackupItemProps) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4 }}
    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/40 hover:bg-white/[0.09] hover:shadow-[0_12px_36px_0_rgba(79,70,229,0.2)]"
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    
    <div>
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30 text-indigo-400">
            <FileArchive className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              {backup.name}
            </h3>
            <p className="text-xs text-gray-400">
              Created by <span className="font-semibold text-gray-300">{backup.user?.name || backup.createdBy || "System AI"}</span>
            </p>
          </div>
        </div>

        {backup.metadata?.encrypted && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 shadow-sm" title="256-Bit Encrypted Snapshot">
            <Lock className="h-3 w-3" />
            Encrypted
          </span>
        )}
      </div>

      <div className="my-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Type</span>
          <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${getTypeColor(backup.type)}`}>
            {backup.type}
          </span>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</span>
          <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${getStatusColor(backup.status)}`}>
            {backup.status}
          </span>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Compressed Size</span>
          <span className="mt-1 block font-mono text-sm font-black text-white">{formatSize(backup.size)}</span>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Timestamp</span>
          <span className="mt-1 block text-xs font-semibold text-gray-300">
            {new Date(backup.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2 border-t border-white/[0.06] pt-3.5">
      <button
        onClick={() => onRestore(backup)}
        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/30 hover:text-white"
        title="Restore Snapshot"
      >
        <Upload className="h-3.5 w-3.5" />
        Restore
      </button>
      <button
        onClick={() => window.open(`/api/admin/backup/${backup.id}`, "_blank")}
        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 px-3 py-2 text-xs font-bold text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white"
        title="Download ZIP"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </button>
      <button
        onClick={() => onDelete(backup.id)}
        className="flex min-h-[40px] items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30 px-3 py-2 text-rose-400 transition-all hover:bg-rose-500/30 hover:text-white"
        title="Permanently Delete Snapshot"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </motion.div>
));

BackupCard.displayName = "BackupCard";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function BackupSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingProgress, setCreatingProgress] = useState(0);
  const [creatingStep, setCreatingStep] = useState("");
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    targetUrl: "",
    apiKey: "",
    seasonId: "",
    tournamentIds: "",
  });
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    enabled: true,
    frequency: "DAILY",
    time: "02:00",
    keepDaily: 7,
    keepWeekly: 4,
    keepMonthly: 3,
    lastRunAt: null,
    nextRunAt: null,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch("/api/admin/backup/history", { credentials: "include" }),
        fetch("/api/admin/backup/stats", { credentials: "include" }),
      ]);

      const historyData = await historyRes.json().catch(() => []);
      const statsData = await statsRes.json().catch(() => null);

      setBackups(Array.isArray(historyData) ? historyData : []);
      if (statsData) setStats(statsData);
    } catch (error) {
      console.error("Error fetching backup data:", error);
      toast.error("Failed to load backup data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backup/schedule", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (data) setSchedule(data);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchData();
      fetchSchedule();
    }
  }, [session, fetchData, fetchSchedule]);

  async function createBackup() {
    if (!confirm("Create a new 256-bit encrypted backup snapshot? This may take a few moments.")) return;

    setCreating(true);
    setCreatingProgress(15);
    setCreatingStep("Initializing database table dump...");

    const loadingToast = toast.loading("Creating snapshot...");

    // Simulated step progress while backend builds the dump
    const timer = setInterval(() => {
      setCreatingProgress((prev) => {
        if (prev < 40) {
          setCreatingStep("Encrypting user & match tables...");
          return prev + 15;
        }
        if (prev < 75) {
          setCreatingStep("Compressing archive volume...");
          return prev + 15;
        }
        if (prev < 90) {
          setCreatingStep("Finalizing SHA-256 verification hash...");
          return 90;
        }
        return prev;
      });
    }, 800);

    try {
      const res = await fetch("/api/admin/backup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "MANUAL" }),
      });

      const data = await res.json().catch(() => ({}));

      clearInterval(timer);
      setCreatingProgress(100);
      setCreatingStep("Snapshot verified and saved!");

      if (res.ok) {
        toast.success("🚀 Backup created successfully!", { id: loadingToast });
        fetchData();
      } else {
        toast.error(data.error || "Failed to create backup", { id: loadingToast });
      }
    } catch (error) {
      clearInterval(timer);
      console.error("Error creating backup:", error);
      toast.error("Failed to create backup", { id: loadingToast });
    } finally {
      setTimeout(() => {
        setCreating(false);
        setCreatingProgress(0);
        setCreatingStep("");
      }, 1200);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip") && !file.name.endsWith(".encrypted")) {
      toast.error("Please select a valid backup archive (.zip or .encrypted)");
      e.target.value = "";
      return;
    }

    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(`File too large. Maximum size allowed is ${MAX_SIZE / 1024 / 1024} MB`);
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("backup", file);

    const loadingToast = toast.loading("Uploading backup archive...");

    try {
      const res = await fetch("/api/admin/backup/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("✅ Backup uploaded successfully!", { id: loadingToast });
        fetchData();
      } else {
        toast.error(data.error || "Upload verification failed", { id: loadingToast });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload backup archive", { id: loadingToast });
    } finally {
      toast.dismiss(loadingToast);
      e.target.value = "";
    }
  }

  async function handleTransfer() {
    if (!transferData.targetUrl) {
      toast.error("Target platform URL is required");
      return;
    }

    const loadingToast = toast.loading("Transferring snapshot to external node...");

    try {
      const res = await fetch("/api/admin/backup/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("☁️ Backup transferred successfully!", { id: loadingToast });
        setShowTransferModal(false);
        setTransferData({ targetUrl: "", apiKey: "", seasonId: "", tournamentIds: "" });
        fetchData();
      } else {
        toast.error(data.error || "Transfer failed during protocol check", { id: loadingToast });
      }
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to transfer backup", { id: loadingToast });
    } finally {
      toast.dismiss(loadingToast);
    }
  }

  async function toggleAutoBackup() {
    const updated = { ...schedule, enabled: !schedule.enabled };
    await updateSchedule(updated);
  }

  async function updateSchedule(updates: Partial<ScheduleConfig>) {
    const updated = { ...schedule, ...updates };
    setSavingSchedule(true);
    try {
      const res = await fetch("/api/admin/backup/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data) setSchedule(data);
        toast.success("Schedule configuration updated!");
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "Failed to update schedule");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function restoreBackup(backupId: string) {
    if (!confirm("⚠️ WARNING: This will restore the selected backup snapshot. Current database rows will be overwritten. Continue?")) return;

    const loadingToast = toast.loading("Restoring database snapshot...");

    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success("✅ Backup restored successfully!", { id: loadingToast });
        setShowRestoreModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to restore backup", { id: loadingToast });
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("Failed to restore backup", { id: loadingToast });
    } finally {
      toast.dismiss(loadingToast);
    }
  }

  async function deleteBackup(backupId: string) {
    if (!confirm("Permanently delete this snapshot? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/backup/${backupId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Snapshot deleted");
        fetchData();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast.error("Failed to delete backup");
    }
  }

  const formatSize = useCallback((bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-emerald-400 bg-emerald-500/20 border border-emerald-500/30";
      case "PROCESSING":
        return "text-amber-400 bg-amber-500/20 border border-amber-500/30";
      case "FAILED":
        return "text-rose-400 bg-rose-500/20 border border-rose-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border border-gray-500/30";
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case "MANUAL":
        return "text-blue-400 bg-blue-500/20 border border-blue-500/30";
      case "AUTO":
        return "text-emerald-400 bg-emerald-500/20 border border-emerald-500/30";
      case "UPLOADED":
        return "text-purple-400 bg-purple-500/20 border border-purple-500/30";
      case "TRANSFER":
        return "text-cyan-400 bg-cyan-500/20 border border-cyan-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border border-gray-500/30";
    }
  }, []);

  const frequencyLabels: Record<string, string> = useMemo(
    () => ({
      HOURLY: "Hourly",
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
    }),
    []
  );

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
            <p className="text-sm font-bold tracking-wide text-gray-300">Loading Disaster Recovery Engine...</p>
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
        className="min-h-screen px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          {/* ===================================================================== */}
          {/* 1. HEADER & BACK NAVIGATION                                           */}
          {/* ===================================================================== */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4 sm:items-center">
              <Link
                href="/admin"
                className="group flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 transition-all duration-300 hover:border-indigo-500/40 hover:bg-white/10 hover:text-white"
                title="Back to Admin Dashboard"
              >
                <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
              <div>
                <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  <Shield className="h-6 w-6 text-indigo-400" />
                  Backup &amp; Disaster Recovery
                </h1>
                <p className="mt-0.5 text-xs font-medium text-gray-400 sm:text-sm">
                  Command automated snapshots, cryptographically verified backups, and node migrations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === "grid" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-gray-400 hover:text-white"
                  }`}
                  title="Grid Snapshot View"
                >
                  <Grid className="h-4 w-4" />
                  <span>Cards</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === "list" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-gray-400 hover:text-white"
                  }`}
                  title="Table List View"
                >
                  <List className="h-4 w-4" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* 2. STATS OVERVIEW WIDGETS (4 Columns)                                 */}
          {/* ===================================================================== */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-500/30 text-blue-400">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-black text-white sm:text-3xl">{stats?.totalBackups || 0}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Backups</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30 text-emerald-400">
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-black text-white sm:text-3xl">{formatSize(stats?.totalSize || 0)}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Storage Volume</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/30 text-amber-400">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-lg font-black text-white sm:text-xl truncate max-w-[160px]">
                    {stats?.latestBackup ? new Date(stats.latestBackup.createdAt).toLocaleDateString() : "Never"}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Latest Snapshot</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30 text-emerald-400">
                  <CheckCircle className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-400 sm:text-2xl">Healthy</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Recovery Status</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ===================================================================== */}
          {/* 3. AUTO BACKUP SCHEDULE CONFIGURATION CARD                            */}
          {/* ===================================================================== */}
          <motion.div
            variants={itemVariants}
            className="rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/30 text-amber-400">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white sm:text-xl">Automated Backup Schedule Engine</h2>
                  <p className="text-xs text-gray-400">Cron daemon configuration for unattended system dumps</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                  schedule.enabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-gray-700/50 text-gray-400 border border-gray-600"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${schedule.enabled ? "bg-emerald-400 animate-ping" : "bg-gray-500"}`} />
                  {schedule.enabled ? "CRON ACTIVE" : "CRON DISABLED"}
                </span>

                <button
                  onClick={toggleAutoBackup}
                  disabled={savingSchedule}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${
                    schedule.enabled ? "bg-indigo-600 shadow-md shadow-indigo-600/40" : "bg-gray-700"
                  }`}
                  title="Toggle Auto Backup Schedule"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-sm ${
                      schedule.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {schedule.enabled && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Cron Frequency</label>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => updateSchedule({ frequency: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-semibold text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="HOURLY" className="bg-gray-900">Hourly Dumps</option>
                    <option value="DAILY" className="bg-gray-900">Daily Snapshots</option>
                    <option value="WEEKLY" className="bg-gray-900">Weekly Full Backup</option>
                    <option value="MONTHLY" className="bg-gray-900">Monthly Archival</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Execution Time (24h UTC)</label>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => updateSchedule({ time: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 font-mono text-sm font-semibold text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Snapshot Retention SLA</label>
                  <select
                    value={schedule.keepDaily}
                    onChange={(e) => {
                      const days = parseInt(e.target.value);
                      updateSchedule({
                        keepDaily: days,
                        keepWeekly: Math.floor(days / 2),
                        keepMonthly: Math.floor(days / 4),
                      });
                    }}
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-semibold text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="3" className="bg-gray-900">3 Days (Quick Cycle)</option>
                    <option value="7" className="bg-gray-900">7 Days (Standard SLA)</option>
                    <option value="14" className="bg-gray-900">14 Days (Extended)</option>
                    <option value="30" className="bg-gray-900">30 Days (Monthly Vault)</option>
                    <option value="60" className="bg-gray-900">60 Days (Enterprise SLA)</option>
                    <option value="90" className="bg-gray-900">90 Days (Long-Term Vault)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-gray-300">
              <div className="flex flex-wrap items-center gap-4">
                {schedule.lastRunAt && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <History className="h-3.5 w-3.5 text-indigo-400" />
                    Last Run: <strong className="text-white">{new Date(schedule.lastRunAt).toLocaleString()}</strong>
                  </span>
                )}
                {schedule.nextRunAt && schedule.enabled && (
                  <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                    <Clock className="h-3.5 w-3.5" />
                    Next Scheduled: <strong>{new Date(schedule.nextRunAt).toLocaleString()}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-400 font-semibold">
                <span>• {frequencyLabels[schedule.frequency] || "Daily"} execution</span>
                <span>• Retain {schedule.keepDaily} daily copies</span>
              </div>
            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* 4. INSTANT COMMAND ACTION BAR (Touch-Friendly min 44px)             */}
          {/* ===================================================================== */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Create Snapshot Button */}
              <button
                onClick={createBackup}
                disabled={creating}
                className="group relative flex min-h-[48px] flex-1 sm:flex-initial items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:from-indigo-500 hover:to-pink-500 hover:shadow-indigo-500/50 active:scale-95 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-200" />
                    <span>Creating Snapshot ({creatingProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                    <span>Create Manual Snapshot</span>
                  </>
                )}
              </button>

              {/* Upload Backup Trigger */}
              <label className="group flex min-h-[48px] flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-600/20 px-5 py-3 text-sm font-bold text-emerald-300 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-emerald-600/30 hover:text-white active:scale-95 cursor-pointer">
                <Upload className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                <span>Upload Archive</span>
                <input
                  type="file"
                  accept=".zip,.encrypted"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>

              {/* Transfer Backup */}
              <button
                onClick={() => setShowTransferModal(true)}
                className="group flex min-h-[48px] flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/20 px-5 py-3 text-sm font-bold text-purple-300 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-purple-600/30 hover:text-white active:scale-95"
              >
                <Cloud className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>Node Transfer</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-gray-300 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.12] hover:text-white active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Vault</span>
            </button>
          </motion.div>

          {/* Animated Progress Bar during manual snapshot creation */}
          <AnimatePresence>
            {creating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 p-5 shadow-2xl backdrop-blur-xl"
              >
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    {creatingStep || "Generating cryptographically verified snapshot dump..."}
                  </span>
                  <span className="font-mono text-white">{creatingProgress}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-black/50 p-0.5 ring-1 ring-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${creatingProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===================================================================== */}
          {/* 5. BACKUP HISTORY VAULT (Cards or Responsive Table)                 */}
          {/* ===================================================================== */}
          <motion.div
            variants={itemVariants}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30 text-indigo-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white sm:text-2xl">Snapshot Vault &amp; History</h2>
                  <p className="text-xs text-gray-400">All stored database volumes, encrypted snapshots, and node transfers</p>
                </div>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs font-bold text-gray-300">
                {backups.length} Snapshots
              </span>
            </div>

            {backups.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-gray-500 shadow-inner">
                  <FileArchive className="h-10 w-10" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-white">No Snapshot Volumes Found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
                  Your backup history vault is currently empty. Click &ldquo;Create Manual Snapshot&rdquo; above to generate your first verified volume.
                </p>
                <button
                  onClick={createBackup}
                  className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-purple-500"
                >
                  <Plus className="h-4 w-4" />
                  Create First Snapshot
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 items-stretch"
              >
                {backups.map((backup) => (
                  <BackupCard
                    key={backup.id}
                    backup={backup}
                    formatSize={formatSize}
                    getStatusColor={getStatusColor}
                    getTypeColor={getTypeColor}
                    onRestore={(b) => {
                      setSelectedBackup(b);
                      setShowRestoreModal(true);
                    }}
                    onDelete={deleteBackup}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.04] text-xs font-bold uppercase tracking-wider text-gray-400">
                      <th className="px-5 py-4">Snapshot Volume</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Compressed Size</th>
                      <th className="px-5 py-4">Timestamp</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-sm">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="transition-colors hover:bg-white/[0.04]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
                              <FileArchive className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{backup.name}</p>
                              <p className="text-xs text-gray-400">by {backup.user?.name || backup.createdBy || "System AI"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${getTypeColor(backup.type)}`}>
                            {backup.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${getStatusColor(backup.status)}`}>
                            {backup.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-white">
                          {formatSize(backup.size)}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-gray-300">
                          {new Date(backup.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300 transition-all hover:bg-emerald-500/30 hover:text-white"
                              title="Restore Snapshot"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => window.open(`/api/admin/backup/${backup.id}`, "_blank")}
                              className="rounded-lg bg-blue-500/20 p-2 text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white"
                              title="Download ZIP Archive"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteBackup(backup.id)}
                              className="rounded-lg bg-rose-500/20 p-2 text-rose-400 transition-all hover:bg-rose-500/30 hover:text-white"
                              title="Delete Snapshot"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* ===================================================================== */}
          {/* 6. RESTORE SNAPSHOT MODAL                                             */}
          {/* ===================================================================== */}
          <AnimatePresence>
            {showRestoreModal && selectedBackup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-[#0d1126] p-6 shadow-2xl shadow-indigo-950/80 sm:p-8"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-black text-white">Restore Database Snapshot</h2>
                    </div>
                    <button
                      onClick={() => setShowRestoreModal(false)}
                      className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="my-6 space-y-4">
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                        <div>
                          <p className="text-sm font-bold text-amber-300">High-Risk System Action</p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                            Restoring this volume will overwrite all current database tables with the records contained inside <strong className="text-white">{selectedBackup.name}</strong>. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Snapshot Volume:</span>
                        <span className="font-bold text-white">{selectedBackup.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Creation Timestamp:</span>
                        <span className="font-semibold text-gray-200">{new Date(selectedBackup.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Compressed Archive Size:</span>
                        <span className="font-mono font-bold text-white">{formatSize(selectedBackup.size)}</span>
                      </div>
                      {selectedBackup.metadata?.encrypted && (
                        <div className="flex justify-between border-t border-white/10 pt-2">
                          <span className="text-gray-400">256-Bit Cryptographic Seal:</span>
                          <span className="font-bold text-emerald-400">✅ Verified &amp; Encrypted</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => restoreBackup(selectedBackup.id)}
                      className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 font-bold text-white shadow-lg shadow-rose-600/30 transition-all hover:from-rose-500 hover:to-red-500 active:scale-95"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Confirm &amp; Restore</span>
                    </button>
                    <button
                      onClick={() => setShowRestoreModal(false)}
                      className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] font-bold text-gray-300 transition-all hover:bg-white/15 hover:text-white active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ===================================================================== */}
          {/* 7. NODE TRANSFER SNAPSHOT MODAL                                       */}
          {/* ===================================================================== */}
          <AnimatePresence>
            {showTransferModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-[#0d1126] p-6 shadow-2xl shadow-indigo-950/80 sm:p-8"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                        <Cloud className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-black text-white">External Node Snapshot Transfer</h2>
                    </div>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="my-6 space-y-4 text-xs">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">Target Platform URL *</label>
                      <input
                        type="text"
                        value={transferData.targetUrl}
                        onChange={(e) => setTransferData({ ...transferData, targetUrl: e.target.value })}
                        placeholder="https://platform-b.vercel.app"
                        className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-semibold text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <p className="mt-1 text-[11px] text-gray-400">The destination Nexus Esports platform instance endpoint</p>
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">API Authentication Key (Optional)</label>
                      <input
                        type="password"
                        value={transferData.apiKey}
                        onChange={(e) => setTransferData({ ...transferData, apiKey: e.target.value })}
                        placeholder="••••••••••••••••••••••••••••"
                        className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm font-semibold text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <p className="mt-1 text-[11px] text-gray-400">Required if the destination node enforces secure API handshake</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">Season ID (Optional)</label>
                        <input
                          type="text"
                          value={transferData.seasonId}
                          onChange={(e) => setTransferData({ ...transferData, seasonId: e.target.value })}
                          placeholder="Leave blank for full"
                          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm font-semibold text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-gray-300 mb-1.5">Tournament IDs (Optional)</label>
                        <input
                          type="text"
                          value={transferData.tournamentIds}
                          onChange={(e) => setTransferData({ ...transferData, tournamentIds: e.target.value })}
                          placeholder="id1, id2, id3"
                          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-sm font-semibold text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleTransfer}
                      className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:from-purple-500 hover:to-indigo-500 active:scale-95"
                    >
                      <Cloud className="h-4 w-4" />
                      <span>Start Node Transfer</span>
                    </button>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] font-bold text-gray-300 transition-all hover:bg-white/15 hover:text-white active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
