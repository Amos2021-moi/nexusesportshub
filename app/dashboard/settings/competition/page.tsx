"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Loader2,
  Trophy,
  Calendar,
  Clock,
  Shield,
  CalendarCheck,
  Sparkles,
  Check,
  Zap,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface CompetitionSettings {
  defaultSquad: "MAIN" | "SEASONAL" | "TOURNAMENT";
  autoSelectTournamentSquad: boolean;
  matchReminderTime: "15m" | "30m" | "1h" | "2h" | "24h";
  fixtureCalendarSync: boolean;
}

const defaultSettings: CompetitionSettings = {
  defaultSquad: "MAIN",
  autoSelectTournamentSquad: false,
  matchReminderTime: "1h",
  fixtureCalendarSync: false,
};

/* -------------------------------------------------------------------------- */
/*                            Animation variants                              */
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

const SectionTitle = memo(({
  icon: Icon,
  title,
  accent = "text-indigo-400",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent?: string;
}) => (
  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
      <Icon className={`h-4 w-4 ${accent}`} />
    </span>
    <h3 className="text-base font-semibold text-white">{title}</h3>
  </div>
));

SectionTitle.displayName = "SectionTitle";

const SquadOption = memo(({
  option,
  isSelected,
  onSelect,
}: {
  option: { value: "MAIN" | "SEASONAL" | "TOURNAMENT"; label: string; icon: any; desc: string };
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const Icon = option.icon;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`relative flex min-h-[44px] flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20"
          : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/20"
      }`}
    >
      {isSelected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
          <Check className="h-3 w-3 text-white" />
        </motion.span>
      )}
      <Icon className={`h-6 w-6 ${isSelected ? "text-indigo-400" : "text-gray-400"}`} />
      <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-400"}`}>
        {option.label}
      </span>
      <span className="text-center text-[10px] text-gray-500">{option.desc}</span>
    </motion.button>
  );
});

SquadOption.displayName = "SquadOption";

const ToggleRow = memo(({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="group flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900/40 p-4 transition-all hover:border-indigo-500/40 hover:bg-gray-900/70"
  >
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
        enabled ? "bg-indigo-500/20 ring-1 ring-indigo-500/30" : "bg-gray-700/50 ring-1 ring-white/5"
      }`}>
        <Icon className={`h-5 w-5 transition-colors ${enabled ? "text-indigo-400" : "text-gray-500"}`} />
      </div>
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all ${
        enabled ? "bg-indigo-600 shadow-md shadow-indigo-500/30" : "bg-gray-700"
      }`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </motion.div>
));

ToggleRow.displayName = "ToggleRow";

const ReminderPill = memo(({
  value,
  label,
  isActive,
  onSelect,
}: {
  value: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`min-h-[44px] rounded-xl border px-4 text-sm font-medium transition-all ${
      isActive
        ? "border-indigo-500 bg-indigo-500/15 text-white shadow-md shadow-indigo-500/20"
        : "border-gray-700 bg-gray-900/40 text-gray-400 hover:border-gray-600 hover:text-white"
    }`}
  >
    {label}
  </button>
));

ReminderPill.displayName = "ReminderPill";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-600/10 blur-3xl"
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

export default function CompetitionSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<CompetitionSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?category=competition");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          defaultSquad: data.defaultSquad || defaultSettings.defaultSquad,
          autoSelectTournamentSquad: data.autoSelectTournamentSquad !== undefined ? data.autoSelectTournamentSquad : defaultSettings.autoSelectTournamentSquad,
          matchReminderTime: data.matchReminderTime || defaultSettings.matchReminderTime,
          fixtureCalendarSync: data.fixtureCalendarSync !== undefined ? data.fixtureCalendarSync : defaultSettings.fixtureCalendarSync,
        });
      }
    } catch (error) {
      console.error("Error fetching competition settings:", error);
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
            category: "competition",
            key,
            value,
          }),
        });
      }

      toast.success("Competition settings updated!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (error) {
      console.error("Error saving competition settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleChange = useCallback((key: keyof CompetitionSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  }, [settings]);

  const squadOptions = useMemo(() => [
    { value: "MAIN" as const, label: "Main Squad", icon: Shield, desc: "Your default lineup" },
    { value: "SEASONAL" as const, label: "Seasonal Squad", icon: Calendar, desc: "League season lineup" },
    { value: "TOURNAMENT" as const, label: "Tournament Squad", icon: Trophy, desc: "Knockout lineup" },
  ], []);

  const reminderLabels: Record<CompetitionSettings["matchReminderTime"], string> = {
    "15m": "15 minutes before",
    "30m": "30 minutes before",
    "1h": "1 hour before",
    "2h": "2 hours before",
    "24h": "24 hours before",
  };

  const reminderOptions = useMemo(() => [
    { value: "15m" as const, label: "15m" },
    { value: "30m" as const, label: "30m" },
    { value: "1h" as const, label: "1h" },
    { value: "2h" as const, label: "2h" },
    { value: "24h" as const, label: "24h" },
  ], []);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Trophy className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
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
    <div className="relative min-h-screen pb-28">
      <DecorBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto space-y-5 will-change-transform sm:space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Trophy className="h-6 w-6 text-white" />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-900 bg-yellow-500">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </span>
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">🏆 Competition Settings</h1>
                <p className="mt-1 text-gray-400">Configure your competitive preferences</p>
              </div>
            </div>

            <span className="hidden items-center gap-2 self-start rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-2 text-indigo-300 sm:flex">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-semibold capitalize">{settings.defaultSquad.toLowerCase()}</span>
            </span>
          </motion.div>

          {/* Default Squad */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
            <SectionTitle icon={Shield} title="Default Squad" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {squadOptions.map((option) => (
                <SquadOption
                  key={option.value}
                  option={option}
                  isSelected={settings.defaultSquad === option.value}
                  onSelect={() => handleChange("defaultSquad", option.value)}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">This squad will be used by default in matches</p>
          </motion.div>

          {/* Tournament & Fixtures */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
            <SectionTitle icon={Trophy} title="Tournament & Fixtures" accent="text-purple-400" />
            <div className="mt-4 space-y-3">
              <ToggleRow
                icon={Trophy}
                label="Auto-Select Tournament Squad"
                description="Automatically use your tournament squad in tournaments"
                enabled={settings.autoSelectTournamentSquad}
                onToggle={() => handleChange("autoSelectTournamentSquad", !settings.autoSelectTournamentSquad)}
              />
              <ToggleRow
                icon={CalendarCheck}
                label="Calendar Sync"
                description="Generate .ics calendar files when fixtures are created"
                enabled={settings.fixtureCalendarSync}
                onToggle={() => handleChange("fixtureCalendarSync", !settings.fixtureCalendarSync)}
              />
            </div>
          </motion.div>

          {/* Match Reminder Time */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
            <SectionTitle icon={Clock} title="Match Reminder Time" accent="text-pink-400" />
            <div className="mt-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {reminderOptions.map((opt) => (
                  <ReminderPill
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    isActive={settings.matchReminderTime === opt.value}
                    onSelect={() => handleChange("matchReminderTime", opt.value)}
                  />
                ))}
              </div>

              <select
                value={settings.matchReminderTime}
                onChange={(e) => handleChange("matchReminderTime", e.target.value as any)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="15m">15 minutes before</option>
                <option value="30m">30 minutes before</option>
                <option value="1h">1 hour before</option>
                <option value="2h">2 hours before</option>
                <option value="24h">24 hours before</option>
              </select>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                Reminders sent <span className="text-gray-400">{reminderLabels[settings.matchReminderTime]}</span> each match
              </p>
            </div>
          </motion.div>
        </form>
      </motion.div>

      {/* Sticky Save Bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-900/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <p className="hidden text-xs text-gray-500 sm:block">
            Default squad: <span className="font-semibold capitalize text-gray-300">{settings.defaultSquad.toLowerCase()}</span> · Reminder:{" "}
            <span className="font-semibold text-gray-300">{settings.matchReminderTime}</span>
          </p>
          <motion.button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-semibold text-white shadow-lg transition-all disabled:opacity-50 sm:w-auto ${
              saveSuccess
                ? "bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/50"
            }`}
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
      </motion.div>
    </div>
  );
}