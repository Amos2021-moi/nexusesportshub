"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  Settings,
  Upload,
  Archive,
  AlertTriangle,
  Shield,
  UserPlus,
  Database,
  RefreshCw,
  Sparkles,
  ChevronRight,
  X,
  CheckCircle,
  Clock,
  Zap,
  Server,
  HardDrive,
  Globe,
  Lock,
  Key,
  Trash2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ClearDataModal from "@/components/ui/ClearDataModal";

interface SystemSettings {
  registrationOpen: boolean;
  maintenanceMode: boolean;
  uploadsEnabled: boolean;
  maxUploadSize: number;
  archiveSeasons: boolean;
}

const defaultSettings: SystemSettings = {
  registrationOpen: true,
  maintenanceMode: false,
  uploadsEnabled: true,
  maxUploadSize: 5,
  archiveSeasons: false,
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
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
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

// === STATIC Toggle Component ===
const Toggle = memo(({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
      active ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-gray-700"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
        active ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
));

Toggle.displayName = "Toggle";

// === STATIC Setting Row ===
const SettingRow = memo(({
  icon: Icon,
  title,
  description,
  active,
  onToggle,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
  className?: string;
}) => {
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:border-indigo-500/40";

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors duration-150 ${hoverClass} ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 flex-shrink-0 text-indigo-400" />
          <p className="font-medium text-white">{title}</p>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
      <Toggle active={active} onClick={onToggle} label={`Toggle ${title}`} />
    </div>
  );
});

SettingRow.displayName = "SettingRow";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function AdminSystemSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceEndTime, setMaintenanceEndTime] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [endTimeInput, setEndTimeInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

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

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings?category=system");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          registrationOpen: data.registrationOpen !== undefined ? data.registrationOpen : defaultSettings.registrationOpen,
          maintenanceMode: data.maintenanceMode !== undefined ? data.maintenanceMode : defaultSettings.maintenanceMode,
          uploadsEnabled: data.uploadsEnabled !== undefined ? data.uploadsEnabled : defaultSettings.uploadsEnabled,
          maxUploadSize: data.maxUploadSize !== undefined ? data.maxUploadSize : defaultSettings.maxUploadSize,
          archiveSeasons: data.archiveSeasons !== undefined ? data.archiveSeasons : defaultSettings.archiveSeasons,
        });
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMaintenanceStatus() {
    try {
      const res = await fetch("/api/admin/maintenance");
      if (res.ok) {
        const data = await res.json();
        setMaintenanceActive(data.isActive || false);
        setMaintenanceMessage(data.message || "");
        setMaintenanceEndTime(data.endTime || null);
      }
    } catch (error) {
      console.error("Error fetching maintenance:", error);
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "system",
            key,
            value,
          }),
        });
      }

      toast.success("System settings updated!");

      if (settings.maintenanceMode) {
        toast.error("Maintenance mode is now active. Only admins can access the site.");
      }
    } catch (error) {
      console.error("Error saving system settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleChange = useCallback((key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStartMaintenance = useCallback(async () => {
    if (!endTimeInput) {
      toast.error("Please select an end time");
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledEnd: endTimeInput,
          message: messageInput || "We're currently performing scheduled maintenance.",
        }),
      });

      if (res.ok) {
        toast.success("Maintenance started! Players are now blocked.");
        await fetchMaintenanceStatus();
        setMessageInput("");
        setEndTimeInput("");
        window.location.reload();
      } else {
        toast.error("Failed to start maintenance");
      }
    } catch (error) {
      toast.error("Failed to start maintenance");
    } finally {
      setIsStarting(false);
    }
  }, [endTimeInput, messageInput]);

  const handleEndMaintenance = useCallback(async () => {
    setIsEnding(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Maintenance turned OFF");
        await fetchMaintenanceStatus();
        window.location.reload();
      } else {
        toast.error("Failed to turn off maintenance");
      }
    } catch (error) {
      toast.error("Failed to turn off maintenance");
    } finally {
      setIsEnding(false);
    }
  }, []);

  const handleOpenClearModal = useCallback(() => {
    setShowClearModal(true);
  }, []);

  const handleCloseClearModal = useCallback(() => {
    setShowClearModal(false);
  }, []);

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Settings className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading settings...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Preparing your configuration</span>
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
    <div className="max-w-3xl px-3 pb-20 sm:px-4 lg:px-6">
      <DecorBackground />
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* Header - NO animations */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Settings className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">⚙️ System Settings</h2>
              <p className="text-sm text-gray-400">Control platform-wide system behavior</p>
            </div>
          </div>
        </div>

        {/* Registration - NO animations */}
        <SettingRow
          icon={UserPlus}
          title="Registration Open"
          description="Allow new players to register on the platform"
          active={settings.registrationOpen}
          onToggle={() => handleChange("registrationOpen", !settings.registrationOpen)}
        />

        {/* Quick Maintenance - NO animations */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Shield className="h-5 w-5 text-yellow-400" />
            Maintenance Mode
            {maintenanceActive && (
              <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                Active
              </span>
            )}
          </h3>

          {maintenanceActive ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-white">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Maintenance is ACTIVE
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Players are currently blocked from accessing the platform.
                  </p>
                  {maintenanceEndTime && (
                    <p className="mt-1 text-sm text-gray-400">
                      Estimated end time:{" "}
                      <span className="font-medium text-white">
                        {new Date(maintenanceEndTime).toLocaleString()}
                      </span>
                    </p>
                  )}
                  {maintenanceMessage && (
                    <p className="mt-1 break-words text-sm text-gray-400">
                      Message: {maintenanceMessage}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEndMaintenance}
                  disabled={isEnding}
                  className="flex min-h-[44px] flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                >
                  {isEnding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Turning Off...
                    </>
                  ) : (
                    "Turn Off Maintenance"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Maintenance Ends At
                  </label>
                  <input
                    type="datetime-local"
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2.5 text-white transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Players will see countdown to this time
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="e.g., We're upgrading the database..."
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2.5 text-white transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartMaintenance}
                disabled={isStarting}
                className="min-h-[44px] w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-red-900/30 transition-colors duration-150 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 sm:w-auto"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "🚀 Turn On Maintenance"
                )}
              </button>
              <p className="text-xs text-gray-500">
                ⚠️ Players will see the overlay immediately. Admins will not be affected.
              </p>
            </div>
          )}
        </div>

        {/* Uploads Enabled - NO animations */}
        <SettingRow
          icon={Upload}
          title="Uploads Enabled"
          description="Allow players to upload images (profile pictures, squad screenshots)"
          active={settings.uploadsEnabled}
          onToggle={() => handleChange("uploadsEnabled", !settings.uploadsEnabled)}
        />

        {/* Max Upload Size - NO animations */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              Max Upload Size (MB)
            </span>
          </label>
          <select
            value={settings.maxUploadSize}
            onChange={(e) => handleChange("maxUploadSize", parseInt(e.target.value))}
            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2.5 text-white transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value={2}>2 MB</option>
            <option value={5}>5 MB</option>
            <option value={10}>10 MB</option>
            <option value={20}>20 MB</option>
            <option value={50}>50 MB</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">Maximum file size for image uploads</p>
        </div>

        {/* Archive Seasons - NO animations */}
        <SettingRow
          icon={Archive}
          title="Auto-Archive Seasons"
          description="Automatically archive completed seasons after 30 days"
          active={settings.archiveSeasons}
          onToggle={() => handleChange("archiveSeasons", !settings.archiveSeasons)}
        />

        {/* Registration Closed Warning - NO animations */}
        {!settings.registrationOpen && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Registration Closed</p>
                <p className="mt-1 text-xs text-gray-400">
                  New player registration is currently disabled. Existing players can still log in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone - NO animations */}
        <div className="border-t border-red-500/20 pt-6">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div className="min-w-0">
                <p className="font-medium text-white">Clear All Data</p>
                <p className="text-sm text-gray-400">
                  Permanently delete all platform data. This action cannot be undone.
                  <br />
                  <span className="text-xs text-gray-500">
                    A backup will be created before deletion.
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenClearModal}
                className="min-h-[44px] w-full flex-shrink-0 whitespace-nowrap rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 font-semibold text-white shadow-lg shadow-red-900/30 transition-colors duration-150 hover:from-red-700 hover:to-rose-700 sm:w-auto"
              >
                <Trash2 className="mr-2 inline h-4 w-4" />
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* Save Button - NO animations */}
        <div className="sticky bottom-0 -mx-4 flex gap-4 border-t border-white/10 bg-gray-900/80 px-4 pb-[env(safe-area-inset-bottom)] pt-4 backdrop-blur-xl sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-900/30 transition-colors duration-150 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 sm:w-auto"
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
        </div>
      </form>

      {/* Clear Data Modal */}
      <ClearDataModal
        isOpen={showClearModal}
        onClose={handleCloseClearModal}
        onSuccess={() => {
          toast.success("Data cleared successfully!");
        }}
      />
    </div>
  );
}