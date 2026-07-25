"use client";

import EmptyState from "@/components/ui/EmptyState";
import { useEffect, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Shield,
  Plus,
  Trash2,
  Calendar,
  Trophy,
  X,
  Eye,
  EyeOff,
  Upload,
  Sparkles,
  Activity,
  Loader2,
  ChevronRight,
  Zap,
  Star,
  Medal,
  Crown,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Squad {
  id: string;
  type: string;
  screenshot: string;
  formation: string;
  teamStrength: number;
  playstyle: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  userId: string;
}

const squadTypes = [
  { value: "MAIN", label: "Main Squad", icon: Shield, color: "bg-yellow-500" },
  { value: "SEASONAL", label: "Seasonal Squad", icon: Calendar, color: "bg-green-500" },
  { value: "TOURNAMENT", label: "Tournament Squad", icon: Trophy, color: "bg-purple-500" },
];

const formations = [
  "4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "5-4-1",
  "4-1-2-1-2", "4-5-1", "3-6-1", "4-3-2-1", "3-4-1-2", "4-4-1-1",
];

const playstyles = [
  "Possession", "Counter Attack", "Long Ball", "Wing Play",
  "Tiki-Taka", "Quick Counter", "Out Wide", "Long Ball Counter", "Control",
];

const typeBadgeClasses: Record<string, string> = {
  MAIN: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30",
  SEASONAL: "bg-green-500/15 text-green-300 ring-green-500/30",
  TOURNAMENT: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
};

const DESCRIPTION_MAX = 300;

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
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Squad Card ===
const SquadCard = memo(({ squad, onDelete, onViewImage }: {
  squad: Squad;
  onDelete: (id: string) => void;
  onViewImage: (image: string) => void;
}) => {
  const isMobile = useIsMobile();
  const SquadIcon = squadTypes.find((t) => t.value === squad.type)?.icon || Shield;
  const iconColor = squadTypes.find((t) => t.value === squad.type)?.color || "bg-gray-500";
  const badgeClass = typeBadgeClasses[squad.type] || "bg-gray-500/15 text-gray-300 ring-gray-500/30";
  const hoverClass = isMobile ? "" : "hover:border-indigo-500/40";

  return (
    <div className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-colors duration-150 ${hoverClass}`}>
      {/* Image Preview */}
      <div
        className="relative h-52 cursor-pointer overflow-hidden bg-gray-900"
        onClick={() => onViewImage(squad.screenshot)}
      >
        <Image
          src={squad.screenshot}
          alt="Squad"
          width={400}
          height={208}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Eye className="h-8 w-8 text-white" />
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 backdrop-blur-sm ${badgeClass}`}>
            <SquadIcon size={12} />
            {squad.type}
          </span>
          {squad.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30 backdrop-blur-sm">
              <Sparkles size={12} />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Squad Info */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${iconColor}`}>
              <SquadIcon size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white">
              {squadTypes.find((t) => t.value === squad.type)?.label}
            </span>
          </div>
          <button
            onClick={() => onDelete(squad.id)}
            aria-label="Remove squad"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-gray-900/50 px-2.5 py-1 text-xs text-gray-300">
            <Activity size={12} className="text-pink-400" />
            <span className="text-gray-500">Formation:</span>
            <span className="font-semibold text-white">{squad.formation || "—"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-gray-900/50 px-2.5 py-1 text-xs text-gray-300">
            <Shield size={12} className="text-indigo-400" />
            <span className="text-gray-500">Strength:</span>
            <span className="font-semibold text-white">{squad.teamStrength || "—"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-gray-900/50 px-2.5 py-1 text-xs text-gray-300">
            <Trophy size={12} className="text-yellow-400" />
            <span className="text-gray-500">Playstyle:</span>
            <span className="font-semibold text-white">{squad.playstyle || "—"}</span>
          </span>
        </div>

        {squad.description && (
          <div className="mt-3">
            <span className="text-xs text-gray-500">NOTES</span>
            <p className="mt-1 text-sm text-gray-300">{squad.description}</p>
          </div>
        )}

        <div className="mt-3 border-t border-white/10 pt-3 text-xs text-gray-500">
          Uploaded: {new Date(squad.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
});

SquadCard.displayName = "SquadCard";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function SquadsPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState<{ showSquad: boolean }>({
    showSquad: true,
  });
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [formData, setFormData] = useState({
    type: "MAIN",
    screenshot: "",
    formation: "",
    teamStrength: "",
    playstyle: "",
    description: "",
  });

  // ✅ Only fetch once
  useEffect(() => {
    if (hasFetched) return;
    setHasFetched(true);
    fetchSquads();
    fetchPrivacySettings();
  }, [hasFetched]);

  async function fetchSquads() {
    try {
      const res = await fetch("/api/squads");
      const data = await res.json();
      setSquads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching squads:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrivacySettings() {
    try {
      const res = await fetch("/api/settings?category=privacy");
      if (res.ok) {
        const data = await res.json();
        setPrivacySettings({
          showSquad: data.showSquad !== undefined ? data.showSquad : true,
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.screenshot) {
      toast.error("Please upload your squad screenshot");
      return;
    }
    if (!formData.formation) {
      toast.error("Please select a formation");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Squad uploaded successfully!");
        setShowForm(false);
        setFormData({
          type: "MAIN",
          screenshot: "",
          formation: "",
          teamStrength: "",
          playstyle: "",
          description: "",
        });
        setHasFetched(false);
        fetchSquads();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to upload squad");
      }
    } catch (error) {
      toast.error("Failed to upload squad");
    }
    setSubmitting(false);
  }, [formData]);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Are you sure you want to remove this squad?")) {
      try {
        const res = await fetch(`/api/squads?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Squad removed");
          setHasFetched(false);
          fetchSquads();
        } else {
          toast.error("Failed to remove");
        }
      } catch (error) {
        toast.error("Failed to remove");
      }
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setFormData((prev) => ({ ...prev, screenshot: compressedDataUrl }));
        }
      };
      if (event?.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleOpenForm = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const descLength = formData.description.length;

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Shield className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading squads...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching your squads</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-5 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
        {/* Header - NO animations */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">🛡️ My Squads</h1>
            <p className="text-gray-400 mt-1">Upload and showcase your eFootball squads</p>
          </div>
          <button
            onClick={handleOpenForm}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500"
          >
            <Plus size={18} />
            Upload Squad
          </button>
        </div>

        {/* Privacy Warning - NO animations */}
        {!privacySettings.showSquad && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <EyeOff className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-400">Squads are Hidden</h3>
                <p className="text-sm text-gray-300">
                  Your squads are currently private. Other players cannot see your
                  squads. You can change this in your{" "}
                  <a
                    href="/dashboard/settings/privacy"
                    className="text-indigo-400 transition-colors duration-150 hover:underline"
                  >
                    Privacy Settings
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box - NO animations */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400">Showcase Your Squad</h3>
              <p className="text-sm text-gray-300">
                Upload screenshots of your eFootball squad. Other players can view
                your team formation, playstyle, and team strength. Share your best
                Main, Seasonal, or Tournament squads!
              </p>
            </div>
          </div>
        </div>

        {/* Squad Grid - NO animations */}
        {!privacySettings.showSquad ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center backdrop-blur-xl">
            <EyeOff className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">Squads are Private</h3>
            <p className="text-gray-400">This player has chosen to keep their squads private.</p>
            <a
              href="/dashboard/settings/privacy"
              className="mt-4 inline-block text-indigo-400 transition-colors duration-150 hover:text-indigo-300"
            >
              Change Privacy Settings →
            </a>
          </div>
        ) : squads.length === 0 ? (
          <EmptyState
            title="No Squads Uploaded Yet"
            message="Upload your eFootball squad to share with the community."
            icon={Shield}
            buttonText="Upload Squad"
            buttonAction={handleOpenForm}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {squads.map((squad) => (
              <SquadCard
                key={squad.id}
                squad={squad}
                onDelete={handleDelete}
                onViewImage={setSelectedImage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Modal - NO animations */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl p-4">
            <button
              onClick={() => setSelectedImage(null)}
              aria-label="Close preview"
              className="absolute -top-10 right-0 text-white transition-colors duration-150 hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <Image
              src={selectedImage}
              alt="Squad Full View"
              width={800}
              height={600}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      )}

      {/* Upload Modal - NO animations */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={handleCloseForm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-gray-800/90 p-6 shadow-2xl backdrop-blur-xl"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                  <Upload className="h-4 w-4 text-white" />
                </span>
                Upload Your Squad
              </h2>
              <button
                onClick={handleCloseForm}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Squad Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Squad Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {squadTypes.map((t) => {
                    const TypeIcon = t.icon;
                    const active = formData.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleFormChange("type", t.value)}
                        className={`flex min-h-[44px] flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition-colors duration-150 ${
                          active
                            ? "border-indigo-500/60 bg-indigo-500/15 text-white"
                            : "border-white/10 bg-gray-900/50 text-gray-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <TypeIcon size={16} />
                        {t.value}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Squad Screenshot <span className="text-pink-400">*</span>
                </label>
                {!formData.screenshot ? (
                  <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-gray-900/40 p-4 text-center transition-colors duration-150 hover:border-indigo-500/50 hover:bg-gray-900/60">
                    <Upload className="h-6 w-6 text-indigo-400" />
                    <span className="text-sm text-gray-300">Click to upload screenshot</span>
                    <span className="text-xs text-gray-500">PNG or JPG, max 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <Image
                      src={formData.screenshot}
                      alt="Preview"
                      width={400}
                      height={128}
                      className="h-32 w-full rounded-xl object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      type="button"
                      onClick={() => handleFormChange("screenshot", "")}
                      aria-label="Remove image"
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500 shadow-lg transition-colors duration-150 hover:bg-red-600"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Formation */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Formation <span className="text-pink-400">*</span>
                </label>
                <select
                  value={formData.formation}
                  onChange={(e) => handleFormChange("formation", e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Select Formation</option>
                  {formations.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Team Strength */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Team Strength <span className="text-xs text-gray-500">(1000 - 4000)</span>
                </label>
                <input
                  type="number"
                  value={formData.teamStrength}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 1000;
                    if (val < 1000) val = 1000;
                    if (val > 4000) val = 4000;
                    handleFormChange("teamStrength", val.toString());
                  }}
                  min="1000"
                  max="4000"
                  step="10"
                  placeholder="e.g., 2800"
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <input
                  type="range"
                  min="1000"
                  max="4000"
                  step="10"
                  value={formData.teamStrength || 1000}
                  onChange={(e) => handleFormChange("teamStrength", e.target.value)}
                  className="mt-2 w-full accent-indigo-500"
                  aria-label="Team strength slider"
                />
                <p className="mt-1 text-xs text-gray-500">Team strength rating from 1000 to 4000</p>
              </div>

              {/* Playstyle */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Playstyle</label>
                <select
                  value={formData.playstyle}
                  onChange={(e) => handleFormChange("playstyle", e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Select Playstyle</option>
                  {playstyles.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Notes (Optional)</label>
                  <span className="text-xs text-gray-500">{descLength}/{DESCRIPTION_MAX}</span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  rows={2}
                  maxLength={DESCRIPTION_MAX}
                  placeholder="Any additional info about your squad..."
                  className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Squad
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}