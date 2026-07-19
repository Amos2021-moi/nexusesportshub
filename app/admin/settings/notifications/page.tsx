"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Save,
  Loader2,
  Bell,
  Calendar,
  Trophy,
  Flag,
  Shield,
  AlertTriangle,
  Users,
  Megaphone,
  Clock,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminNotificationSettings {
  matchReminders: boolean;
  resultApproved: boolean;
  tournamentUpdates: boolean;
  newsAlerts: boolean;
  systemAnnouncements: boolean;
  adminDigest: boolean;
  digestFrequency: "daily" | "weekly" | "monthly";
  moderationAlerts: boolean;
  reportAlerts: boolean;
}

const defaultSettings: AdminNotificationSettings = {
  matchReminders: true,
  resultApproved: true,
  tournamentUpdates: true,
  newsAlerts: true,
  systemAnnouncements: true,
  adminDigest: true,
  digestFrequency: "daily",
  moderationAlerts: true,
  reportAlerts: true,
};

// ✅ FIXED: Added type Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

// ✅ FIXED: Added type Variants
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

export default function AdminNotificationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<AdminNotificationSettings>(defaultSettings);
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
      const res = await fetch("/api/settings?category=admin_notifications");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          matchReminders:
            data.matchReminders !== undefined
              ? data.matchReminders
              : defaultSettings.matchReminders,
          resultApproved:
            data.resultApproved !== undefined
              ? data.resultApproved
              : defaultSettings.resultApproved,
          tournamentUpdates:
            data.tournamentUpdates !== undefined
              ? data.tournamentUpdates
              : defaultSettings.tournamentUpdates,
          newsAlerts:
            data.newsAlerts !== undefined ? data.newsAlerts : defaultSettings.newsAlerts,
          systemAnnouncements:
            data.systemAnnouncements !== undefined
              ? data.systemAnnouncements
              : defaultSettings.systemAnnouncements,
          adminDigest:
            data.adminDigest !== undefined ? data.adminDigest : defaultSettings.adminDigest,
          digestFrequency: data.digestFrequency || defaultSettings.digestFrequency,
          moderationAlerts:
            data.moderationAlerts !== undefined
              ? data.moderationAlerts
              : defaultSettings.moderationAlerts,
          reportAlerts:
            data.reportAlerts !== undefined ? data.reportAlerts : defaultSettings.reportAlerts,
        });
      }
    } catch (error) {
      console.error("Error fetching admin notification settings:", error);
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
            category: "admin_notifications",
            key,
            value,
          }),
        });
      }

      toast.success("Admin notification settings updated!");
    } catch (error) {
      console.error("Error saving admin notification settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (key: keyof AdminNotificationSettings, value: any) => {
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
              <Bell className="h-5 w-5 text-white" />
            </span>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Admin Notifications
            </h2>
          </div>
          <p className="text-sm text-gray-400">
            Configure which notifications you receive as an admin
          </p>
        </motion.div>

        {/* Notification Options */}
        <div className="space-y-4">
          <SettingCard
            icon={<Calendar className="h-4 w-4 flex-shrink-0 text-blue-400" />}
            title="Match Reminders"
            description="Get notified about upcoming matches"
            active={settings.matchReminders}
            onToggle={() => handleChange("matchReminders", !settings.matchReminders)}
          />

          <SettingCard
            icon={<CheckCircle className="h-4 w-4 flex-shrink-0 text-green-400" />}
            title="Result Approved"
            description="Get notified when a result is approved"
            active={settings.resultApproved}
            onToggle={() => handleChange("resultApproved", !settings.resultApproved)}
          />

          <SettingCard
            icon={<Trophy className="h-4 w-4 flex-shrink-0 text-yellow-400" />}
            title="Tournament Updates"
            description="Get notified about tournament status changes"
            active={settings.tournamentUpdates}
            onToggle={() => handleChange("tournamentUpdates", !settings.tournamentUpdates)}
          />

          <SettingCard
            icon={<Megaphone className="h-4 w-4 flex-shrink-0 text-purple-400" />}
            title="News Alerts"
            description="Get notified when news is published"
            active={settings.newsAlerts}
            onToggle={() => handleChange("newsAlerts", !settings.newsAlerts)}
          />

          <SettingCard
            icon={<AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />}
            title="System Announcements"
            description="Get notified about important system updates"
            active={settings.systemAnnouncements}
            onToggle={() =>
              handleChange("systemAnnouncements", !settings.systemAnnouncements)
            }
          />

          <SettingCard
            icon={<Shield className="h-4 w-4 flex-shrink-0 text-amber-400" />}
            title="Moderation Alerts"
            description="Get notified when content needs moderation approval"
            active={settings.moderationAlerts}
            onToggle={() => handleChange("moderationAlerts", !settings.moderationAlerts)}
          />

          <SettingCard
            icon={<Flag className="h-4 w-4 flex-shrink-0 text-red-400" />}
            title="Report Alerts"
            description="Get notified when content is reported by players"
            active={settings.reportAlerts}
            onToggle={() => handleChange("reportAlerts", !settings.reportAlerts)}
          />

          <SettingCard
            icon={<Users className="h-4 w-4 flex-shrink-0 text-cyan-400" />}
            title="Admin Digest"
            description="Receive a summary of platform activity"
            active={settings.adminDigest}
            onToggle={() => handleChange("adminDigest", !settings.adminDigest)}
          />
        </div>

        {/* Digest Frequency */}
        {settings.adminDigest && (
          <motion.div variants={itemVariants}>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Digest Frequency
              </span>
            </label>
            <select
              value={settings.digestFrequency}
              onChange={(e) =>
                handleChange(
                  "digestFrequency",
                  e.target.value as AdminNotificationSettings["digestFrequency"]
                )
              }
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2.5 text-white transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              How often to receive the admin digest email
            </p>
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