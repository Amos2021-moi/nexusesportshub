"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  RefreshCw,
  DollarSign,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Season {
  id: string;
  name: string;
  isActive: boolean;
  status: string;
}

interface LeagueSettings {
  id: string;
  seasonId: string;
  paymentRequired: boolean;
  entryFee: number;
  currency: string;
  updatedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45 },
  },
};

export default function AdminLeagueSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    paymentRequired: false,
    entryFee: 0,
    currency: "KES",
  });

  // Role check - redirect if not admin
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
      fetchSeasons();
    }
  }, [session]);

  async function fetchSeasons() {
    try {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Failed to fetch seasons");
      const data = await res.json();
      setSeasons(data);

      // Select active season first, or the first one
      const activeSeason = data.find((s: Season) => s.isActive);
      if (activeSeason) {
        setSelectedSeasonId(activeSeason.id);
      } else if (data.length > 0) {
        setSelectedSeasonId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching seasons:", error);
      toast.error("Failed to load seasons");
    }
  }

  useEffect(() => {
    if (selectedSeasonId) {
      fetchSettings();
    }
  }, [selectedSeasonId]);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/settings/league?seasonId=${selectedSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data);
      setFormData({
        paymentRequired: data.paymentRequired || false,
        entryFee: data.entryFee || 0,
        currency: data.currency || "KES",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/league", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId: selectedSeasonId,
          paymentRequired: formData.paymentRequired,
          entryFee: formData.entryFee,
          currency: formData.currency,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const data = await res.json();
      setSettings(data.settings);
      toast.success("Settings saved successfully!");
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 sm:space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white sm:text-2xl">⚙️ League Settings</h1>
          <p className="mt-1 text-sm text-gray-400">
            Configure payment requirements and competition settings
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-gray-800/60 px-4 py-2 text-white transition-all hover:bg-gray-700/60"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </motion.div>

      {/* Season Selector */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl"
      >
        <label className="mb-2 block text-sm font-medium text-gray-300">Select Season</label>
        <select
          value={selectedSeasonId}
          onChange={(e) => setSelectedSeasonId(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 md:w-64"
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name} {season.isActive ? "⭐" : ""}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Settings Form */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl"
      >
        <div className="border-b border-white/10 bg-gray-900/30 p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            Payment Settings
          </h2>
        </div>

        <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          {/* Payment Required Toggle */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900/40 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                <h3 className="font-medium text-white">Require Payment to Join</h3>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {formData.paymentRequired
                  ? "🔴 Players must pay to access fixtures"
                  : "🟢 Players join automatically and get fixtures instantly"}
              </p>
            </div>
            <button
              onClick={() =>
                setFormData({ ...formData, paymentRequired: !formData.paymentRequired })
              }
              className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                formData.paymentRequired ? "bg-green-600" : "bg-gray-600"
              }`}
              aria-label="Toggle payment required"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  formData.paymentRequired ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Entry Fee Input - Only shown when payment is required */}
          {formData.paymentRequired && (
            <div className="rounded-xl border border-white/10 bg-gray-900/40 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-300">Entry Fee</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-400">
                    KES
                  </span>
                  <input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) =>
                      setFormData({ ...formData, entryFee: Number(e.target.value) })
                    }
                    min="0"
                    step="50"
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2.5 pl-16 pr-4 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                💡 This is the amount players must pay to participate
              </p>
            </div>
          )}

          {/* Info Messages */}
          <div className="space-y-3">
            {formData.paymentRequired ? (
              <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Payment Required</p>
                  <p className="text-xs text-gray-400">
                    Players must pay the entry fee before they can access fixtures and standings.
                    The prize pool will be calculated from collected fees.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">Free Access</p>
                  <p className="text-xs text-gray-400">
                    All players in the season will automatically have access to fixtures and
                    standings. No payment required.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Settings
              </>
            )}
          </button>

          {/* Current Status */}
          {settings && (
            <div className="border-t border-white/10 pt-4 text-center text-xs text-gray-500">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
