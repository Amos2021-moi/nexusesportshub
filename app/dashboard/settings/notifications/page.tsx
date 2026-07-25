"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Loader2,
  Bell,
  BellOff,
  Mail,
  MessageCircle,
  Calendar,
  Trophy,
  Award,
  Newspaper,
  Check,
  BellRing,
  Sparkles,
  Zap,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface NotificationSettings {
  fixtureAlerts: boolean;
  resultApproved: boolean;
  awardNotifications: boolean;
  newsAlerts: boolean;
  commentAlerts: boolean;
  matchReminders: boolean;
  emailNotifications: boolean;
}

const defaultSettings: NotificationSettings = {
  fixtureAlerts: true,
  resultApproved: true,
  awardNotifications: true,
  newsAlerts: true,
  commentAlerts: true,
  matchReminders: true,
  emailNotifications: true,
};

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

// === Mobile Detection Hook ===
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Background - NO ANIMATIONS               */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-600/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Stat Card ===
const StatCard = memo(({ label, value, total, color, icon: Icon }: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: any;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-2xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
    <p className={`text-2xl font-bold ${color}`}>
      {value}
      <span className="text-sm text-gray-500">/{total}</span>
    </p>
    <p className="mt-0.5 text-[11px] text-gray-400">{label}</p>
  </div>
));

StatCard.displayName = "StatCard";

// === STATIC Toggle Row ===
const ToggleRow = memo(({
  option,
  isEnabled,
  onToggle,
}: {
  option: { key: keyof NotificationSettings; label: string; description: string; icon: any };
  isEnabled: boolean;
  onToggle: () => void;
}) => {
  const isMobile = useIsMobile();
  const Icon = option.icon;
  const hoverClass = isMobile ? "" : "hover:border-indigo-500/40 hover:bg-gray-900/70";

  return (
    <div className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900/40 p-4 transition-colors duration-150 ${hoverClass}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ${
          isEnabled ? "bg-indigo-500/20 ring-1 ring-indigo-500/30" : "bg-gray-700/50 ring-1 ring-white/5"
        }`}>
          <Icon className={`h-5 w-5 transition-colors duration-150 ${isEnabled ? "text-indigo-400" : "text-gray-500"}`} />
        </div>
        <div>
          <p className="font-medium text-white">{option.label}</p>
          <p className="text-xs text-gray-400">{option.description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isEnabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
          isEnabled ? "bg-indigo-600 shadow-md shadow-indigo-500/30" : "bg-gray-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            isEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
});

ToggleRow.displayName = "ToggleRow";

// === STATIC Sticky Save Bar ===
const StickySaveBar = memo(({
  onSubmit,
  saving,
  saveSuccess,
  totalEnabled,
  totalOptions,
}: {
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  saveSuccess: boolean;
  totalEnabled: number;
  totalOptions: number;
}) => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-900/80 backdrop-blur-xl">
    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
      <p className="hidden text-xs text-gray-500 sm:block">
        {totalEnabled} of {totalOptions} notifications enabled
      </p>
      <button
        type="submit"
        onClick={onSubmit}
        disabled={saving}
        className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-semibold text-white shadow-lg transition-colors duration-150 disabled:opacity-50 sm:w-auto ${
          saveSuccess
            ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/50"
        }`}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : saveSuccess ? (
          <>
            <Check className="h-4 w-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Changes
          </>
        )}
      </button>
    </div>
  </div>
));

StickySaveBar.displayName = "StickySaveBar";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?category=notifications");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          fixtureAlerts: data.fixtureAlerts !== undefined ? data.fixtureAlerts : defaultSettings.fixtureAlerts,
          resultApproved: data.resultApproved !== undefined ? data.resultApproved : defaultSettings.resultApproved,
          awardNotifications: data.awardNotifications !== undefined ? data.awardNotifications : defaultSettings.awardNotifications,
          newsAlerts: data.newsAlerts !== undefined ? data.newsAlerts : defaultSettings.newsAlerts,
          commentAlerts: data.commentAlerts !== undefined ? data.commentAlerts : defaultSettings.commentAlerts,
          matchReminders: data.matchReminders !== undefined ? data.matchReminders : defaultSettings.matchReminders,
          emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : defaultSettings.emailNotifications,
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "notifications",
            key,
            value,
          }),
        });
      }

      toast.success("Notification settings updated!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleToggle = useCallback((key: keyof NotificationSettings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  }, [settings]);

  const notificationOptions = useMemo(() => [
    { key: "fixtureAlerts" as const, label: "Fixture Alerts", description: "Get notified when new fixtures are assigned to you", icon: Calendar },
    { key: "resultApproved" as const, label: "Result Approved", description: "Get notified when your match results are approved", icon: Bell },
    { key: "awardNotifications" as const, label: "Award Notifications", description: "Get notified when you win awards or trophies", icon: Trophy },
    { key: "newsAlerts" as const, label: "News Alerts", description: "Get notified about important announcements and news", icon: Newspaper },
    { key: "commentAlerts" as const, label: "Comment Alerts", description: "Get notified when someone comments on your posts", icon: MessageCircle },
    { key: "matchReminders" as const, label: "Match Reminders", description: "Receive reminders before your upcoming matches", icon: Calendar },
    { key: "emailNotifications" as const, label: "Email Notifications", description: "Receive notifications via email (in addition to in-app)", icon: Mail },
  ], []);

  const inAppOptions = useMemo(() => notificationOptions.filter((o) => o.key !== "emailNotifications"), [notificationOptions]);
  const emailOptions = useMemo(() => notificationOptions.filter((o) => o.key === "emailNotifications"), [notificationOptions]);

  const enabledCount = useMemo(() => inAppOptions.filter((o) => settings[o.key]).length, [inAppOptions, settings]);
  const totalEnabled = useMemo(() => notificationOptions.filter((o) => settings[o.key]).length, [notificationOptions, settings]);
  const emailOn = settings.emailNotifications;

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Bell className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading settings...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Preparing your preferences</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="relative min-h-screen pb-28 px-3 sm:px-4 lg:px-6">
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
          <form className="space-y-5">
            {/* Header - NO animations */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                  <Bell className="h-6 w-6 text-white" />
                  {totalEnabled > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-gray-900 bg-pink-500 px-1 text-[10px] font-bold text-white">
                      {totalEnabled}
                    </span>
                  )}
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">🔔 Notification Settings</h1>
                  <p className="mt-1 text-gray-400">Choose which notifications you want to receive</p>
                </div>
              </div>

              <span className={`hidden items-center gap-2 self-start rounded-full border px-3.5 py-2 sm:flex ${
                totalEnabled > 0 ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-gray-500/30 bg-gray-500/10 text-gray-400"
              }`}>
                {totalEnabled > 0 ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                <span className="text-sm font-semibold">{totalEnabled > 0 ? "Active" : "All Muted"}</span>
              </span>
            </div>

            {/* Quick Stats Summary - NO animations */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total enabled" value={totalEnabled} total={notificationOptions.length} color="text-white" icon={Bell} />
              <StatCard label="In-app alerts" value={enabledCount} total={inAppOptions.length} color="text-indigo-300" icon={BellRing} />
              <StatCard label="Email" value={emailOn ? 1 : 0} total={1} color={emailOn ? "text-emerald-300" : "text-gray-500"} icon={Mail} />
            </div>

            {/* In-App Notifications - NO animations */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <Bell className="h-4 w-4 text-indigo-400" />
                  </span>
                  <h3 className="text-base font-semibold text-white">In-App Notifications</h3>
                </div>
                <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                  {enabledCount}/{inAppOptions.length} on
                </span>
              </div>

              <div className="space-y-3">
                {inAppOptions.map((option) => (
                  <ToggleRow
                    key={option.key}
                    option={option}
                    isEnabled={settings[option.key]}
                    onToggle={() => handleToggle(option.key)}
                  />
                ))}
              </div>
            </div>

            {/* Email Notifications - NO animations */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
              <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <Mail className="h-4 w-4 text-purple-400" />
                </span>
                <h3 className="text-base font-semibold text-white">Email Notifications</h3>
              </div>

              <div className="space-y-3">
                {emailOptions.map((option) => (
                  <ToggleRow
                    key={option.key}
                    option={option}
                    isEnabled={settings[option.key]}
                    onToggle={() => handleToggle(option.key)}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sticky Save Bar - NO animations */}
      <StickySaveBar
        onSubmit={handleSubmit}
        saving={saving}
        saveSuccess={saveSuccess}
        totalEnabled={totalEnabled}
        totalOptions={notificationOptions.length}
      />
    </>
  );
}