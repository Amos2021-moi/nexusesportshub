"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Save,
  Loader2,
  Shield,
  MessageSquare,
  Flag,
  Ban,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

interface ModerationSettings {
  postApproval: boolean;
  commentFiltering: boolean;
  squadApproval: boolean;
  playerReports: boolean;
  autoBanThreshold: number;
  requireVerification: boolean;
  allowGuestReporting: boolean;
}

const defaultSettings: ModerationSettings = {
  postApproval: false,
  commentFiltering: true,
  squadApproval: false,
  playerReports: true,
  autoBanThreshold: 5,
  requireVerification: false,
  allowGuestReporting: true,
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

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-all ${
        active ? "bg-indigo-600" : "bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all ${
          active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingCard({
  icon,
  title,
  description,
  active,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/30"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium text-white">
          {icon}
          {title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
      <Toggle active={active} onClick={onToggle} label={`Toggle ${title}`} />
    </motion.div>
  );
}

export default function AdminModerationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<ModerationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      fetchSettings();
    }
  }, [session]);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings?category=moderation");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          postApproval:
            data.postApproval !== undefined ? data.postApproval : defaultSettings.postApproval,
          commentFiltering:
            data.commentFiltering !== undefined
              ? data.commentFiltering
              : defaultSettings.commentFiltering,
          squadApproval:
            data.squadApproval !== undefined ? data.squadApproval : defaultSettings.squadApproval,
          playerReports:
            data.playerReports !== undefined ? data.playerReports : defaultSettings.playerReports,
          autoBanThreshold:
            data.autoBanThreshold !== undefined
              ? data.autoBanThreshold
              : defaultSettings.autoBanThreshold,
          requireVerification:
            data.requireVerification !== undefined
              ? data.requireVerification
              : defaultSettings.requireVerification,
          allowGuestReporting:
            data.allowGuestReporting !== undefined
              ? data.allowGuestReporting
              : defaultSettings.allowGuestReporting,
        });
      }
    } catch (error) {
      console.error("Error fetching moderation settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "moderation",
            key,
            value,
          }),
        });
      }

      toast.success("Moderation settings updated!");
    } catch (error) {
      console.error("Error saving moderation settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (key: keyof ModerationSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-500/30 border-t-indigo-500" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="max-w-3xl">
      <motion.form
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 sm:space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Shield className="h-5 w-5 text-white" />
            </span>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Moderation Settings
            </h2>
          </div>
          <p className="text-sm text-gray-400">
            Configure content moderation and community safety
          </p>
        </motion.div>

        {/* Toggle Cards */}
        <div className="space-y-4">
          <SettingCard
            icon={<MessageSquare className="h-4 w-4 flex-shrink-0 text-blue-400" />}
            title="Post Approval"
            description="Require admin approval before posts appear in community feed"
            active={settings.postApproval}
            onToggle={() => handleChange("postApproval", !settings.postApproval)}
          />

          <SettingCard
            icon={<Filter className="h-4 w-4 flex-shrink-0 text-purple-400" />}
            title="Comment Filtering"
            description="Auto-filter inappropriate comments"
            active={settings.commentFiltering}
            onToggle={() => handleChange("commentFiltering", !settings.commentFiltering)}
          />

          <SettingCard
            icon={<Shield className="h-4 w-4 flex-shrink-0 text-amber-400" />}
            title="Squad Approval"
            description="Require admin approval before squads appear on player profiles"
            active={settings.squadApproval}
            onToggle={() => handleChange("squadApproval", !settings.squadApproval)}
          />

          <SettingCard
            icon={<Flag className="h-4 w-4 flex-shrink-0 text-red-400" />}
            title="Player Reports"
            description="Allow players to report inappropriate content and behavior"
            active={settings.playerReports}
            onToggle={() => handleChange("playerReports", !settings.playerReports)}
          />
        </div>

        {/* Auto-Ban Threshold */}
        <motion.div variants={itemVariants}>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            <span className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-400" />
              Auto-Ban Threshold
            </span>
          </label>
          <select
            value={settings.autoBanThreshold}
            onChange={(e) => handleChange("autoBanThreshold", parseInt(e.target.value))}
            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2.5 text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value={3}>3 Reports</option>
            <option value={5}>5 Reports (Default)</option>
            <option value={10}>10 Reports</option>
            <option value={15}>15 Reports</option>
            <option value={20}>20 Reports</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Number of valid reports needed to auto-ban a player
          </p>
        </motion.div>

        <div className="space-y-4">
          <SettingCard
            icon={<CheckCircle className="h-4 w-4 flex-shrink-0 text-green-400" />}
            title="Require Email Verification"
            description="Players must verify their email before posting in community"
            active={settings.requireVerification}
            onToggle={() => handleChange("requireVerification", !settings.requireVerification)}
          />

          <SettingCard
            icon={<Eye className="h-4 w-4 flex-shrink-0 text-cyan-400" />}
            title="Allow Guest Reporting"
            description="Allow non-logged-in users to report content"
            active={settings.allowGuestReporting}
            onToggle={() => handleChange("allowGuestReporting", !settings.allowGuestReporting)}
          />
        </div>

        {/* Warning */}
        {settings.postApproval && (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Post Approval Enabled</p>
                <p className="mt-1 text-xs text-gray-400">
                  All community posts will require admin approval before being visible to other
                  players. This may slow down community engagement but improves content quality.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        <motion.div
          variants={itemVariants}
          className="sticky bottom-0 -mx-4 flex gap-4 border-t border-white/10 bg-gray-900/80 px-4 pb-[env(safe-area-inset-bottom)] pt-4 backdrop-blur-xl sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none"
        >
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
}