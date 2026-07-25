"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Loader2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Layout,
  Check,
  Sparkles,
  Zap,
  Maximize2,
  PanelLeft,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface AppearanceSettings {
  theme: "dark" | "light" | "system";
  compactMode: boolean;
  reduceMotion: boolean;
  sidebarStyle: "default" | "compact" | "icon";
}

const defaultSettings: AppearanceSettings = {
  theme: "light",
  compactMode: false,
  reduceMotion: false,
  sidebarStyle: "default",
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

// === STATIC Section Title ===
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

// === STATIC Theme Option ===
const ThemeOption = memo(({
  option,
  isActive,
  onSelect,
}: {
  option: { value: "dark" | "light" | "system"; label: string; icon: any; desc: string };
  isActive: boolean;
  onSelect: () => void;
}) => {
  const isMobile = useIsMobile();
  const Icon = option.icon;
  const hoverClass = isMobile ? "" : "hover:border-gray-600 hover:bg-gray-700/20";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex min-h-[44px] flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors duration-150 ${
        isActive
          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20"
          : `border-gray-700 ${hoverClass}`
      }`}
    >
      {isActive && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      <Icon className={`h-6 w-6 ${isActive ? "text-indigo-400" : "text-gray-400"}`} />
      <span className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-400"}`}>
        {option.label}
      </span>
      <span className="text-[10px] text-gray-500">{option.desc}</span>
    </button>
  );
});

ThemeOption.displayName = "ThemeOption";

// === STATIC Sidebar Option ===
const SidebarOption = memo(({
  option,
  isActive,
  onSelect,
}: {
  option: { value: "default" | "compact" | "icon"; label: string; icon: any };
  isActive: boolean;
  onSelect: () => void;
}) => {
  const isMobile = useIsMobile();
  const Icon = option.icon;
  const hoverClass = isMobile ? "" : "hover:border-gray-600 hover:bg-gray-700/20";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex min-h-[44px] flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors duration-150 ${
        isActive
          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20"
          : `border-gray-700 ${hoverClass}`
      }`}
    >
      {isActive && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      <Icon className={`h-6 w-6 ${isActive ? "text-indigo-400" : "text-gray-400"}`} />
      <span className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-400"}`}>
        {option.label}
      </span>
    </button>
  );
});

SidebarOption.displayName = "SidebarOption";

// === STATIC Toggle Row ===
const ToggleRow = memo(({
  icon: Icon,
  label,
  description,
  isEnabled,
  onToggle,
}: {
  icon: any;
  label: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
}) => {
  const isMobile = useIsMobile();
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
          <p className="font-medium text-white">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
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
  theme,
  sidebarStyle,
}: {
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  saveSuccess: boolean;
  theme: string;
  sidebarStyle: string;
}) => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-900/80 backdrop-blur-xl">
    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
      <p className="hidden text-xs text-gray-500 sm:block">
        Theme: <span className="font-semibold capitalize text-gray-300">{theme}</span> · Sidebar:{" "}
        <span className="font-semibold capitalize text-gray-300">{sidebarStyle}</span>
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

export default function AppearanceSettingsPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<"dark" | "light" | "system">("dark");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?category=appearance");
      if (res.ok) {
        const data = await res.json();
        const loadedSettings = {
          theme: data.theme || defaultSettings.theme,
          compactMode: data.compactMode !== undefined ? data.compactMode : defaultSettings.compactMode,
          reduceMotion: data.reduceMotion !== undefined ? data.reduceMotion : defaultSettings.reduceMotion,
          sidebarStyle: data.sidebarStyle || defaultSettings.sidebarStyle,
        };
        setSettings(loadedSettings);
        setPreviewTheme(loadedSettings.theme);
        applyAllSettings(loadedSettings);
      }
    } catch (error) {
      console.error("Error fetching appearance settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const applyAllSettings = useCallback((settings: AppearanceSettings) => {
    applyTheme(settings.theme);
    applyCompactMode(settings.compactMode);
    applyReduceMotion(settings.reduceMotion);
    applySidebarStyle(settings.sidebarStyle);
    localStorage.setItem("appearance", JSON.stringify(settings));
  }, []);

  const applyTheme = useCallback((theme: "dark" | "light" | "system") => {
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, []);

  const applyCompactMode = useCallback((compact: boolean) => {
    document.documentElement.classList.toggle("compact-mode", compact);
    localStorage.setItem("compactMode", String(compact));
  }, []);

  const applyReduceMotion = useCallback((reduce: boolean) => {
    document.documentElement.classList.toggle("reduce-motion", reduce);
    localStorage.setItem("reduceMotion", String(reduce));
  }, []);

  const applySidebarStyle = useCallback((style: "default" | "compact" | "icon") => {
    document.documentElement.setAttribute("data-sidebar-style", style);
    localStorage.setItem("sidebarStyle", style);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "appearance",
            key,
            value,
          }),
        });
      }

      applyAllSettings(settings);
      toast.success("Appearance settings updated!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings, applyAllSettings]);

  const handleThemeChange = useCallback((theme: "dark" | "light" | "system") => {
    setSettings({ ...settings, theme });
    setPreviewTheme(theme);
    applyTheme(theme);
  }, [settings, applyTheme]);

  const handleSidebarStyleChange = useCallback((style: "default" | "compact" | "icon") => {
    setSettings({ ...settings, sidebarStyle: style });
    applySidebarStyle(style);
  }, [settings, applySidebarStyle]);

  const handleToggle = useCallback((key: "compactMode" | "reduceMotion") => {
    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });

    if (key === "compactMode") {
      applyCompactMode(newValue);
    } else if (key === "reduceMotion") {
      applyReduceMotion(newValue);
    }
  }, [settings, applyCompactMode, applyReduceMotion]);

  const themeOptions = [
    { value: "dark" as const, label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { value: "light" as const, label: "Light", icon: Sun, desc: "Bright & clean" },
    { value: "system" as const, label: "System", icon: Monitor, desc: "Match device" },
  ];

  const sidebarOptions = [
    { value: "default" as const, label: "Default", icon: Layout },
    { value: "compact" as const, label: "Compact", icon: PanelLeft },
    { value: "icon" as const, label: "Icon Only", icon: Maximize2 },
  ];

  const toggleOptions = [
    { key: "compactMode" as const, label: "Compact Mode", description: "Reduce spacing and padding throughout the platform", icon: Maximize2 },
    { key: "reduceMotion" as const, label: "Reduce Motion", description: "Minimize animations and transitions", icon: Zap },
  ];

  const enabledToggles = toggleOptions.filter((t) => settings[t.key]).length;

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Palette className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
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
                  <Palette className="h-6 w-6 text-white" />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-900 bg-pink-500">
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  </span>
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">🎨 Appearance</h1>
                  <p className="mt-1 text-gray-400">Customize how the platform looks and feels</p>
                </div>
              </div>

              <span className="hidden items-center gap-2 self-start rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-2 text-indigo-300 sm:flex">
                {settings.theme === "dark" ? <Moon className="h-4 w-4" /> : settings.theme === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                <span className="text-sm font-semibold capitalize">{settings.theme}</span>
              </span>
            </div>

            {/* Theme Selection - NO animations */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
              <SectionTitle icon={Palette} title="Theme" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {themeOptions.map((opt) => (
                  <ThemeOption
                    key={opt.value}
                    option={opt}
                    isActive={settings.theme === opt.value}
                    onSelect={() => handleThemeChange(opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar Style - NO animations */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
              <SectionTitle icon={Layout} title="Sidebar Style" accent="text-purple-400" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {sidebarOptions.map((opt) => (
                  <SidebarOption
                    key={opt.value}
                    option={opt}
                    isActive={settings.sidebarStyle === opt.value}
                    onSelect={() => handleSidebarStyleChange(opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Toggles - NO animations */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                    <Zap className="h-4 w-4 text-pink-400" />
                  </span>
                  <h3 className="text-base font-semibold text-white">Display Options</h3>
                </div>
                <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                  {enabledToggles}/{toggleOptions.length} on
                </span>
              </div>

              <div className="space-y-3">
                {toggleOptions.map((opt) => (
                  <ToggleRow
                    key={opt.key}
                    icon={opt.icon}
                    label={opt.label}
                    description={opt.description}
                    isEnabled={settings[opt.key]}
                    onToggle={() => handleToggle(opt.key)}
                  />
                ))}
              </div>
            </div>

            {/* Live Preview Indicator - NO animations */}
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
                </span>
                <span>Live preview active — changes apply immediately</span>
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
        theme={settings.theme}
        sidebarStyle={settings.sidebarStyle}
      />
    </>
  );
}