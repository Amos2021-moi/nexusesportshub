"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  GitBranch,
  Calendar,
  User,
  RefreshCw,
  Plus,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Database,
  ArrowUp,
  Clock,
  Globe,
  Shield,
  History,
  HardDrive,
} from "lucide-react";
import toast from "react-hot-toast";

interface VersionEntry {
  id: string;
  version: string;
  build: number;
  hash: string | null;
  changelog: string | null;
  environment: string;
  deployedAt: string;
  deployedBy: string;
  admin: {
    name: string | null;
    email: string;
  };
}

interface VersionStats {
  total: number;
  environments: Record<string, number>;
  latest: string;
}

export default function AdminVersionPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<VersionEntry[]>([]);
  const [stats, setStats] = useState<VersionStats | null>(null);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [inDatabase, setInDatabase] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [changelog, setChangelog] = useState("");
  const [environment, setEnvironment] = useState("development");

  useEffect(() => {
    fetchVersionData();
  }, []);

  async function fetchVersionData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/version");
      if (res.ok) {
        const data = await res.json();
        setCurrentVersion(data.current);
        setHistory(data.history || []);
        setStats(data.stats);
        setInDatabase(data.inDatabase);
      } else {
        toast.error("Failed to load version data");
      }
    } catch (error) {
      console.error("Error fetching version data:", error);
      toast.error("Failed to load version data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveVersion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changelog: changelog || `Version ${currentVersion?.version} deployed`,
          environment: environment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Version saved successfully!");
        setShowForm(false);
        setChangelog("");
        await fetchVersionData();
      } else {
        toast.error(data.error || "Failed to save version");
      }
    } catch (error) {
      console.error("Error saving version:", error);
      toast.error("Failed to save version");
    } finally {
      setSaving(false);
    }
  }

  const getEnvironmentBadge = (env: string) => {
    const colors: Record<string, string> = {
      production: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
      staging: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
      development: "bg-blue-500/20 text-blue-400 border-blue-500/20",
      preview: "bg-purple-500/20 text-purple-400 border-purple-500/20",
    };
    return colors[env] || colors.development;
  };

  const getEnvironmentIcon = (env: string) => {
    switch (env) {
      case "production": return "🚀";
      case "staging": return "🧪";
      case "development": return "🔧";
      default: return "📦";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <Tag className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
          </div>
          <p className="mt-2 font-medium text-gray-400">Loading version data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Version Management
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300">
                v{currentVersion?.version || "0.0.0"}
              </span>
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">
              Track and manage application versions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!inDatabase && (
            <button
              onClick={() => setShowForm(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4" />
              Save Current Version
            </button>
          )}
          <button
            onClick={fetchVersionData}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gray-700/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-600/50 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Version Card */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/10 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400">Current Version</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-3xl font-bold text-white">
                v{currentVersion?.version}
              </h2>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
                Build #{currentVersion?.build || 0}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                {currentVersion?.hash || "N/A"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {currentVersion?.date ? new Date(currentVersion.date).toLocaleString() : "N/A"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {currentVersion?.environment || "development"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {inDatabase ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                <CheckCircle className="h-3.5 w-3.5" />
                Saved in Database
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Not Saved Yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <History className="h-4 w-4" />
              Total Versions
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Tag className="h-4 w-4" />
              Latest Version
            </div>
            <p className="mt-1 text-2xl font-bold text-indigo-400">{stats.latest}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Globe className="h-4 w-4" />
              Environments
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {Object.keys(stats.environments).length}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <HardDrive className="h-4 w-4" />
              Total Deployments
            </div>
            <p className="mt-1 text-2xl font-bold text-white">
              {stats.total}
            </p>
          </div>
        </div>
      )}

      {/* Environment Breakdown */}
      {stats && Object.keys(stats.environments).length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-5 shadow-2xl backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white mb-3">Environment Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.environments).map(([env, count]) => (
              <div
                key={env}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${getEnvironmentBadge(env)}`}
              >
                <span>{getEnvironmentIcon(env)}</span>
                <span className="font-medium">{env}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version History */}
      <div className="rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Version History</h2>
            </div>
            <span className="text-xs text-gray-500">{history.length} entries</span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center">
              <Tag className="mx-auto mb-3 h-12 w-12 text-gray-600" />
              <p className="text-gray-400">No version history found</p>
              <p className="text-xs text-gray-500 mt-1">
                Deploy your application or save a version manually
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-white/5 bg-gray-900/30 p-4 transition-all hover:border-indigo-500/20"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                        <Tag className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">
                            v{entry.version}
                          </span>
                          <span className="text-xs text-gray-500">
                            Build #{entry.build}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${getEnvironmentBadge(entry.environment)}`}
                          >
                            {getEnvironmentIcon(entry.environment)} {entry.environment}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.deployedAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.admin?.name || entry.admin?.email || "Unknown"}
                          </span>
                          {entry.hash && (
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              #{entry.hash}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Latest
                      </span>
                    )}
                  </div>
                  {entry.changelog && (
                    <div className="mt-2 rounded-lg bg-gray-800/50 p-2 text-xs text-gray-400">
                      📝 {entry.changelog}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Version Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-800/95 p-6 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Save Version v{currentVersion?.version}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVersion} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Changelog (Optional)
                  </label>
                  <textarea
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    rows={3}
                    placeholder="Describe what changed in this version..."
                    className="min-h-[80px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="development">🔧 Development</option>
                    <option value="staging">🧪 Staging</option>
                    <option value="production">🚀 Production</option>
                    <option value="preview">📦 Preview</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Save Version
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}