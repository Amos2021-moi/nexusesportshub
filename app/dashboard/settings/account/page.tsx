"use client";

import { useEffect, useState, useCallback,memo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  User,
  Mail,
  Shield,
  Camera,
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Settings as SettingsIcon,
  Image as ImageIcon,
  FileText,
  Heart,
  LayoutGrid,
  Gamepad2,
  MessageCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Check,
  BadgeCheck,
  ChevronRight,
  X,
  ArrowRight,
} from "lucide-react";
import ImageUpload from "@/components/dashboard/ImageUpload";
import toast from "react-hot-toast";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProfileData {
  username: string;
  name: string;
  class: string;
  bio: string;
  favoriteClub: string;
  preferredFormation: string;
  preferredPlaystyle: string;
  profilePicture: string;
  bannerImage: string;
  whatsappNumber: string;
  whatsappVisible: boolean;
}

interface EmailStatus {
  verified: boolean;
  verifiedAt?: string;
  notificationsEnabled: boolean;
}

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

const SectionTitle = memo(({ icon: Icon, title, accent = "text-indigo-400" }: {
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

const SettingCard = memo(({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={itemVariants}
    className={`rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-indigo-500/10 ${className}`}
  >
    {children}
  </motion.div>
));

SettingCard.displayName = "SettingCard";

const ToggleSwitch = memo(({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-gray-900/40 p-4">
    <div>
      <p className="font-medium text-white">{label}</p>
      {description && <p className="text-sm text-gray-400">{description}</p>}
    </div>
    <label className={`relative inline-flex cursor-pointer items-center ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="peer sr-only"
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className={`h-6 w-11 rounded-full bg-gray-600 transition-all peer-checked:bg-indigo-600 ${disabled ? "" : ""}`}>
        <div className={`m-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? "translate-x-5" : ""}`} />
      </div>
    </label>
  </div>
));

ToggleSwitch.displayName = "ToggleSwitch";

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

export default function AccountSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [formData, setFormData] = useState<ProfileData>({
    username: "",
    name: "",
    class: "",
    bio: "",
    favoriteClub: "",
    preferredFormation: "",
    preferredPlaystyle: "",
    profilePicture: "",
    bannerImage: "",
    whatsappNumber: "",
    whatsappVisible: true,
  });

  const [emailStatus, setEmailStatus] = useState<EmailStatus>({
    verified: false,
    notificationsEnabled: false,
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setFormData({
        username: data.username || "",
        name: data.name || "",
        class: data.class || "",
        bio: data.bio || "",
        favoriteClub: data.favoriteClub || "",
        preferredFormation: data.preferredFormation || "",
        preferredPlaystyle: data.preferredPlaystyle || "",
        profilePicture: data.profilePicture || "",
        bannerImage: data.bannerImage || "",
        whatsappNumber: data.whatsappNumber || "",
        whatsappVisible: data.whatsappVisible !== undefined ? data.whatsappVisible : true,
      });
      setProfilePicture(data.profilePicture || "");
      setBannerImage(data.bannerImage || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmailStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/email/preferences");
      const data = await res.json();
      setEmailStatus({
        verified: data.emailVerified || false,
        verifiedAt: data.emailVerifiedAt,
        notificationsEnabled: data.emailNotificationsEnabled || false,
      });
    } catch (error) {
      console.error("Error fetching email status:", error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchEmailStatus();
  }, [fetchProfile, fetchEmailStatus]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendVerification = useCallback(async () => {
    setEmailLoading(true);
    setEmailMessage("");

    try {
      const res = await fetch("/api/user/email/verify", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setEmailMessage("✅ Verification email sent! Check your inbox.");
        toast.success("Verification email sent!");
        setResendCooldown(30);
      } else {
        setEmailMessage(`❌ ${data.error || "Failed to send verification"}`);
        toast.error(data.error || "Failed to send verification");
      }
    } catch {
      setEmailMessage("❌ Something went wrong");
      toast.error("Something went wrong");
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const handleResendVerification = useCallback(async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setEmailMessage("");

    try {
      const res = await fetch("/api/user/email/resend", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setEmailMessage("✅ Verification email resent! Check your inbox.");
        toast.success("Verification email resent!");
        setResendCooldown(30);
      } else {
        setEmailMessage(`❌ ${data.error || "Failed to resend verification"}`);
        toast.error(data.error || "Failed to resend verification");
      }
    } catch {
      setEmailMessage("❌ Something went wrong");
      toast.error("Something went wrong");
    } finally {
      setResendLoading(false);
    }
  }, [resendCooldown]);

  const handleNotificationToggle = useCallback(async (enabled: boolean) => {
    try {
      const res = await fetch("/api/user/email/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotificationsEnabled: enabled }),
      });

      if (res.ok) {
        setEmailStatus((prev) => ({ ...prev, notificationsEnabled: enabled }));
        toast.success(enabled ? "Email notifications enabled" : "Email notifications disabled");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update preference");
      }
    } catch (error) {
      console.error("Error updating notification preference:", error);
      toast.error("Failed to update preference");
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profilePicture,
          bannerImage,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2200);
        await update();
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }, [formData, profilePicture, bannerImage, router, update]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFormData({ ...formData, [e.target.name]: value });
  }, [formData]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <SettingsIcon className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading settings...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Preparing your account</span>
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
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <SettingsIcon className="h-6 w-6 text-white" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-900 bg-emerald-500">
              <BadgeCheck className="h-2.5 w-2.5 text-white" />
            </span>
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">👤 Account Settings</h1>
            <p className="mt-1 text-gray-400">Manage your profile, images, and account preferences</p>
          </div>
        </motion.div>

        {/* Account Summary Card */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
        >
          <div className="relative h-20 bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-pink-600/30">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-indigo-500/30 blur-2xl" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
          </div>

          <div className="-mt-10 flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative h-20 w-20 flex-shrink-0">
                <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                      {(formData.name || formData.username || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {emailStatus.verified && (
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-900 bg-emerald-500 shadow-lg">
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </span>
                )}
              </div>

              <div className="pb-1">
                <h2 className="text-lg font-bold text-white">{formData.name || formData.username || "Your Account"}</h2>
                <p className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail className="h-3.5 w-3.5" />
                  {session?.user?.email || "—"}
                </p>
                {formData.username && (
                  <p className="mt-0.5 text-xs text-indigo-300">@{formData.username}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-1">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Active
              </span>
              {emailStatus.verified ? (
                <span className="flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Unverified
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Images */}
          <SettingCard>
            <SectionTitle icon={ImageIcon} title="Profile Images" />
            <div className="mt-4 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Profile Picture</label>
                <div className="flex flex-wrap items-center gap-4">
                  <ImageUpload type="profile" currentImage={profilePicture} onUpload={(url) => setProfilePicture(url)} />
                  <p className="text-xs text-gray-500">Recommended: Square image, max 2MB</p>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Banner Image</label>
                <div className="flex flex-wrap items-center gap-4">
                  <ImageUpload type="banner" currentImage={bannerImage} onUpload={(url) => setBannerImage(url)} />
                  <p className="text-xs text-gray-500">Recommended: 1200x300px, max 2MB</p>
                </div>
              </div>
            </div>
          </SettingCard>

          {/* Personal Information */}
          <SettingCard>
            <SectionTitle icon={User} title="Personal Information" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Display Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Your display name"
                />
                <p className="mt-1 text-xs text-gray-500">This is how others see you</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 pl-10 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="Your unique username"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Unique identifier for your profile</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Class</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Select Class</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-300">
                  <Heart className="h-3.5 w-3.5 text-pink-400" />
                  Favorite Club
                </label>
                <input
                  type="text"
                  name="favoriteClub"
                  value={formData.favoriteClub}
                  onChange={handleChange}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="e.g., Real Madrid, Manchester City"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-300">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Tell the community about yourself..."
                />
                <p className="mt-1 text-xs text-gray-500">Max 500 characters</p>
              </div>
            </div>
          </SettingCard>

          {/* Gaming Preferences */}
          <SettingCard>
            <SectionTitle icon={Gamepad2} title="Gaming Preferences" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-300">
                  <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
                  Preferred Formation
                </label>
                <select
                  name="preferredFormation"
                  value={formData.preferredFormation}
                  onChange={handleChange}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Select Formation</option>
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-4-2">4-4-2</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="3-5-2">3-5-2</option>
                  <option value="5-3-2">5-3-2</option>
                  <option value="4-1-2-1-2">4-1-2-1-2</option>
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-300">
                  <Gamepad2 className="h-3.5 w-3.5 text-purple-400" />
                  Preferred Playstyle
                </label>
                <select
                  name="preferredPlaystyle"
                  value={formData.preferredPlaystyle}
                  onChange={handleChange}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">Select Playstyle</option>
                  <option value="Possession">Possession</option>
                  <option value="Counter Attack">Counter Attack</option>
                  <option value="Long Ball">Long Ball</option>
                  <option value="Wing Play">Wing Play</option>
                  <option value="Tiki-Taka">Tiki-Taka</option>
                  <option value="Quick Counter">Quick Counter</option>
                </select>
              </div>
            </div>
          </SettingCard>

          {/* Match Communication */}
          <SettingCard>
            <SectionTitle icon={MessageCircle} title="Match Communication" />
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-300">
                WhatsApp Number (with country code)
              </label>
              <input
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="+254712345678"
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="mt-1 text-xs text-gray-500">Include country code. Example: +254712345678 for Kenya</p>
            </div>

            <label htmlFor="whatsappVisible" className="mt-4 flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900/40 p-3">
              <div className="flex items-center gap-2">
                {formData.whatsappVisible ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
                <span className="text-sm text-gray-300">Allow match opponents to see my WhatsApp number</span>
              </div>
              <div className="relative inline-flex flex-shrink-0 items-center">
                <input
                  type="checkbox"
                  id="whatsappVisible"
                  name="whatsappVisible"
                  checked={formData.whatsappVisible}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-600 transition-all peer-checked:bg-indigo-600">
                  <div className={`m-1 h-4 w-4 rounded-full bg-white transition-all ${formData.whatsappVisible ? "translate-x-5" : ""}`} />
                </div>
              </div>
            </label>
          </SettingCard>

          {/* Email Settings */}
          <SettingCard>
            <SectionTitle icon={Mail} title="Email Settings" accent="text-indigo-400" />
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-gray-900/40 p-4">
                <div>
                  <p className="font-medium text-white">Email Verification</p>
                  <p className="text-sm text-gray-400">
                    {emailStatus.verified ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle size={14} /> Verified{" "}
                        {emailStatus.verifiedAt ? `at ${new Date(emailStatus.verifiedAt).toLocaleDateString()}` : ""}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <AlertCircle size={14} /> Not verified
                      </span>
                    )}
                  </p>
                </div>
                {!emailStatus.verified && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      disabled={emailLoading}
                      className="flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:opacity-50"
                    >
                      {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={14} />}
                      Verify Email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading || resendCooldown > 0}
                      className="flex min-h-[44px] items-center gap-2 rounded-lg border border-white/10 bg-gray-700/40 px-4 py-2 text-sm text-white transition-all hover:bg-gray-600/40 disabled:opacity-50"
                    >
                      {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={14} />}
                      {resendCooldown > 0 ? `${resendCooldown}s` : "Resend"}
                    </button>
                  </div>
                )}
              </div>

              {emailMessage && (
                <div className={`rounded-xl p-3 text-sm ${emailMessage.includes("✅") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {emailMessage}
                </div>
              )}

              <ToggleSwitch
                checked={emailStatus.notificationsEnabled}
                onChange={handleNotificationToggle}
                disabled={!emailStatus.verified}
                label="Email Notifications"
                description="Receive match reminders and important updates"
              />

              {!emailStatus.verified && (
                <p className="flex items-center gap-1 text-sm text-yellow-400/80">
                  <AlertCircle size={14} />
                  Verify your email to enable email notifications
                </p>
              )}
            </div>
          </SettingCard>

          {/* Security Tip */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-5 backdrop-blur-xl"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <Shield className="h-5 w-5 text-white" />
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-blue-200">
                  <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                  Security Tip
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  Keep your account information up to date and verify your email
                  to secure your account and never miss an important match update.
                </p>
              </div>
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
          <p className="hidden text-xs text-gray-500 sm:block">Changes are saved to your profile</p>
          <div className="flex w-full gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => router.back()}
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-gray-800/50 px-6 py-2.5 text-gray-400 transition-all hover:bg-gray-700/50 hover:text-white sm:flex-none"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-semibold text-white shadow-lg transition-all disabled:opacity-50 sm:flex-none ${
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
        </div>
      </motion.div>
    </div>
  );
}