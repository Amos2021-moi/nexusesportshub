"use client";

import { useEffect, useState, useCallback, useMemo,memo } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Loader2,
  Shield,
  ShieldCheck,
  Eye,
  Users,
  MessageSquare,
  User,
  Clock,
  Lock,
  Globe,
  Check,
  Sparkles,
  Zap,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface PrivacySettings {
  showSquad: boolean;
  showStats: boolean;
  allowComments: boolean;
  publicProfile: boolean;
  showLastSeen: boolean;
}

const defaultSettings: PrivacySettings = {
  showSquad: true,
  showStats: true,
  allowComments: true,
  publicProfile: true,
  showLastSeen: true,
};

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

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

interface ToggleRowProps {
  option: { key: keyof PrivacySettings; label: string; description: string; icon: any };
  isEnabled: boolean;
  onToggle: () => void;
}

const ToggleRow = memo(function ToggleRow({ option, isEnabled, onToggle }: ToggleRowProps) {
  const Icon = option.icon;
  return (
    <motion.div variants={itemVariants}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={`group relative flex min-h-[44px] items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${
          isEnabled ? "border-indigo-400/30 bg-indigo-500/[0.07]" : "border-white/10 bg-white/5"
        } backdrop-blur-xl`}
      >
        <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 ${
          isEnabled ? "shadow-[0_0_28px_-6px_rgba(99,102,241,0.45)]" : ""
        }`} />
        <div className="relative flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
            isEnabled ? "bg-gradient-to-br from-indigo-500/30 to-blue-500/20 text-indigo-300" : "bg-gray-700/40 text-gray-500"
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white">{option.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
              }`}>
                {isEnabled ? "Public" : "Private"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">{option.description}</p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          aria-label={option.label}
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
            isEnabled ? "bg-gradient-to-r from-indigo-500 to-blue-500 shadow-[0_0_16px_-2px_rgba(99,102,241,0.6)]" : "bg-gray-700"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 600, damping: 32 }}
            className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ${
              isEnabled ? "ml-auto" : "mr-auto"
            }`}
          >
            {isEnabled ? <Check className="h-3 w-3 text-indigo-600" /> : <Lock className="h-3 w-3 text-gray-400" />}
          </motion.span>
        </button>
      </motion.div>
    </motion.div>
  );
});

ToggleRow.displayName = "ToggleRow";

const SectionCard = memo(({
  icon: Icon,
  title,
  subtitle,
  accent,
  children,
}: {
  icon: any;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) => (
  <motion.section
    variants={itemVariants}
    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
  >
    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent}`} />
    <div className="mb-5 flex items-center gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-3">{children}</div>
  </motion.section>
));

SectionCard.displayName = "SectionCard";

const PreviewChip = memo(({ on, label }: { on: boolean; label: string }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
    on ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-gray-800/60 text-gray-500 line-through"
  }`}>
    <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-gray-600"}`} />
    {label}
  </span>
));

PreviewChip.displayName = "PreviewChip";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-indigo-600/25 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl"
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

export default function PrivacySettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?category=privacy");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          showSquad: data.showSquad !== undefined ? data.showSquad : defaultSettings.showSquad,
          showStats: data.showStats !== undefined ? data.showStats : defaultSettings.showStats,
          allowComments: data.allowComments !== undefined ? data.allowComments : defaultSettings.allowComments,
          publicProfile: data.publicProfile !== undefined ? data.publicProfile : defaultSettings.publicProfile,
          showLastSeen: data.showLastSeen !== undefined ? data.showLastSeen : defaultSettings.showLastSeen,
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
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
            category: "privacy",
            key,
            value,
          }),
        });
      }

      toast.success("Privacy settings updated!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleToggle = useCallback((key: keyof PrivacySettings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  }, [settings]);

  const visibilityOptions = useMemo(() => [
    { key: "publicProfile" as const, label: "Public Profile", description: "Allow others to view your profile", icon: Globe },
    { key: "showLastSeen" as const, label: "Show Last Seen", description: "Display when you were last active", icon: Clock },
  ], []);

  const contentOptions = useMemo(() => [
    { key: "showStats" as const, label: "Show Statistics", description: "Display your match stats to others", icon: Eye },
    { key: "showSquad" as const, label: "Show Squad", description: "Let others see your squad on your profile and match pages", icon: Users },
    { key: "allowComments" as const, label: "Allow Comments", description: "Enable comments from other players on your posts", icon: MessageSquare },
  ], []);

  const enabledCount = useMemo(() => Object.values(settings).filter(Boolean).length, [settings]);
  const totalCount = Object.values(settings).length;

  const privacyLevel = useMemo(() => {
    if (settings.publicProfile && enabledCount >= 4) {
      return { label: "Public", tone: "text-emerald-300", ring: "border-emerald-400/30 bg-emerald-500/10", dot: "bg-emerald-400", icon: Globe };
    } else if (settings.publicProfile) {
      return { label: "Limited", tone: "text-amber-300", ring: "border-amber-400/30 bg-amber-500/10", dot: "bg-amber-400", icon: Shield };
    } else {
      return { label: "Private", tone: "text-rose-300", ring: "border-rose-400/30 bg-rose-500/10", dot: "bg-rose-400", icon: Lock };
    }
  }, [settings.publicProfile, enabledCount]);

  const LevelIcon = privacyLevel.icon;
  const username = (session?.user as any)?.username || session?.user?.name || "Your Profile";

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Shield className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading privacy settings...</p>
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
      <div className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pt-8">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-5 will-change-transform sm:space-y-6">
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-900/40">
                    <ShieldCheck className="h-7 w-7 text-white" />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-900 bg-emerald-500">
                      <Lock className="h-2.5 w-2.5 text-white" />
                    </span>
                  </div>
                  <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-white">🛡️ Privacy Settings</h1>
                    <p className="mt-0.5 text-sm text-gray-400">Control who can see your information and activity</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 self-start rounded-full border px-3.5 py-2 ${privacyLevel.ring}`}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${privacyLevel.dot}`} />
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${privacyLevel.dot}`} />
                  </span>
                  <LevelIcon className={`h-4 w-4 ${privacyLevel.tone}`} />
                  <span className={`text-sm font-semibold ${privacyLevel.tone}`}>Profile is {privacyLevel.label}</span>
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-3 text-center">
                  <p className="text-lg font-bold text-white">{enabledCount}<span className="text-sm text-gray-500">/{totalCount}</span></p>
                  <p className="text-[11px] text-gray-400">Settings public</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-3 text-center">
                  <p className={`text-lg font-bold ${privacyLevel.tone}`}>{privacyLevel.label}</p>
                  <p className="text-[11px] text-gray-400">Privacy level</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-3 text-center">
                  <p className="text-lg font-bold text-white">{settings.publicProfile ? "Visible" : "Hidden"}</p>
                  <p className="text-[11px] text-gray-400">Your profile</p>
                </div>
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Visibility */}
            <SectionCard icon={Eye} title="Profile Visibility" subtitle="Who can find and view your profile" accent="from-indigo-500 to-blue-500">
              {visibilityOptions.map((option) => (
                <ToggleRow key={option.key} option={option} isEnabled={settings[option.key]} onToggle={() => handleToggle(option.key)} />
              ))}
            </SectionCard>

            {/* Stats & Content */}
            <SectionCard icon={Sparkles} title="Stats & Content" subtitle="Control your stats, squad and interactions" accent="from-purple-500 to-pink-500">
              {contentOptions.map((option) => (
                <ToggleRow key={option.key} option={option} isEnabled={settings[option.key]} onToggle={() => handleToggle(option.key)} />
              ))}
            </SectionCard>

            {/* Profile Preview */}
            <motion.section variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-300" />
                <h3 className="text-sm font-semibold text-white">How others see you</h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gray-900/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{settings.publicProfile ? username : "Private User"}</p>
                    <p className="text-xs text-gray-400">{settings.showLastSeen ? "Active recently" : "Last seen hidden"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PreviewChip on={settings.publicProfile} label="Profile" />
                  <PreviewChip on={settings.showStats} label="Statistics" />
                  <PreviewChip on={settings.showSquad} label="Squad" />
                  <PreviewChip on={settings.allowComments} label="Comments" />
                  <PreviewChip on={settings.showLastSeen} label="Last seen" />
                </div>

                {!settings.publicProfile && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-200">
                    <Lock className="h-3.5 w-3.5" />
                    Your profile is hidden — only admins can view it.
                  </div>
                )}
              </div>
            </motion.section>

            {/* Privacy Notice */}
            <motion.div variants={itemVariants} className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-300">Your Privacy Matters</p>
                  <p className="mt-1 text-xs text-gray-400">
                    These settings control what other players can see. Admins will still have access
                    to your profile for moderation purposes.
                  </p>
                </div>
              </div>
            </motion.div>
          </form>
        </motion.div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <p className="hidden text-xs text-gray-400 sm:block">
            <span className="font-semibold text-white">{enabledCount}</span> of {totalCount} settings public
          </p>
          <motion.button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-semibold text-white transition-all sm:flex-none ${
              saveSuccess
                ? "bg-gradient-to-r from-emerald-500 to-green-600"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-900/30"
            } disabled:opacity-60`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </motion.span>
              ) : saveSuccess ? (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Saved!
                </motion.span>
              ) : (
                <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </>
  );
}