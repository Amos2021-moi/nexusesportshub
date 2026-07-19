"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback,memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User as UserIcon,
  Gamepad2,
  Phone,
  Image as ImageIcon,
  Save,
  Loader2,
  Eye,
  EyeOff,
  AtSign,
  GraduationCap,
  Crown,
  Activity,
  X,
  Sparkles,
  ChevronRight,
  Shield,
  Mail,
  CheckCircle,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import ImageUpload from "@/components/dashboard/ImageUpload";
import toast from "react-hot-toast";

const BIO_MAX = 200;

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* Shared input styling */
const inputClass =
  "min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-300";

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const SectionHeader = memo(({ icon: Icon, title, subtitle, gradient }: {
  icon: any;
  title: string;
  subtitle: string;
  gradient: string;
}) => (
  <div className="mb-5 flex items-center gap-2">
    <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
      <Icon className="h-5 w-5 text-white" />
    </span>
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  </div>
));

SectionHeader.displayName = "SectionHeader";

const InputField = memo(({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  className = "",
  children,
}: {
  icon?: any;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={className}>
    <label htmlFor={name} className={labelClass}>
      {label} {required && <span className="text-pink-400">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 z-10">
          <Icon className="h-4 w-4" />
        </span>
      )}
      {children ? (
        <div className={`${inputClass} pl-9`}>
          {children}
        </div>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`${inputClass} ${Icon ? 'pl-9' : ''}`}
        />
      )}
    </div>
  </div>
));

InputField.displayName = "InputField";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"
    />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    class: "",
    bio: "",
    favoriteClub: "",
    preferredFormation: "",
    preferredPlaystyle: "",
    whatsappNumber: "",
    whatsappVisible: true,
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      setFormData({
        username: data.username || "",
        name: data.name || "",
        class: data.class || "",
        bio: data.bio || "",
        favoriteClub: data.favoriteClub || "",
        preferredFormation: data.preferredFormation || "",
        preferredPlaystyle: data.preferredPlaystyle || "",
        whatsappNumber: data.whatsappNumber || "",
        whatsappVisible: data.whatsappVisible !== undefined ? data.whatsappVisible : true,
      });
      setProfilePicture(data.profilePicture || "");
      setBannerImage(data.bannerImage || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profilePicture,
          bannerImage,
        }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        router.push("/dashboard/profile");
      } else {
        const error = await response.json();
        toast.error(error.error || "Error updating profile");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error updating profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const bioLength = formData.bio.length;
  const bioOver = bioLength > BIO_MAX;

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <UserIcon className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading profile...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Preparing your data</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl">
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 will-change-transform sm:space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            aria-label="Back to profile"
            className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">✏️ Edit Profile</h1>
            <p className="text-sm text-gray-400">Update your details, gaming preferences and contact info.</p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Images Section */}
          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            <SectionHeader
              icon={ImageIcon}
              title="Images"
              subtitle="Your profile picture and banner."
              gradient="from-pink-500 to-rose-500"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className={labelClass}>Profile Picture</label>
                <ImageUpload
                  type="profile"
                  currentImage={profilePicture}
                  onUpload={(url) => setProfilePicture(url)}
                />
              </div>
              <div>
                <label className={labelClass}>Banner Image</label>
                <ImageUpload
                  type="banner"
                  currentImage={bannerImage}
                  onUpload={(url) => setBannerImage(url)}
                />
              </div>
            </div>
          </motion.section>

          {/* Personal Information Section */}
          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            <SectionHeader
              icon={UserIcon}
              title="Personal Information"
              subtitle="How you appear across Nexus Esports."
              gradient="from-indigo-500 to-purple-500"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                icon={UserIcon}
                label="Display Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your display name"
              />

              <InputField
                icon={AtSign}
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Your unique username"
              />

              <div className="sm:col-span-2">
                <label htmlFor="class" className={labelClass}>Class</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 z-10">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <select
                    id="class"
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    className={`${inputClass} pl-9`}
                  >
                    <option value="">Select Class</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="bio" className={labelClass}>Bio</label>
                  <span className={`text-xs ${bioOver ? "text-red-400" : "text-gray-500"}`}>
                    {bioLength}/{BIO_MAX}
                  </span>
                </div>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={BIO_MAX}
                  className={`${inputClass} min-h-[96px] resize-y py-2.5`}
                  placeholder="Tell us about yourself..."
                />
                {bioOver && <p className="mt-1 text-xs text-red-400">Bio must be {BIO_MAX} characters or fewer.</p>}
              </div>
            </div>
          </motion.section>

          {/* Gaming Preferences Section */}
          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            <SectionHeader
              icon={Gamepad2}
              title="Gaming Preferences"
              subtitle="Your style on the pitch."
              gradient="from-yellow-500 to-orange-500"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InputField
                  icon={Crown}
                  label="Favorite Club"
                  name="favoriteClub"
                  value={formData.favoriteClub}
                  onChange={handleChange}
                  placeholder="e.g., Real Madrid, Manchester City"
                />
              </div>

              <InputField
                label="Preferred Formation"
                name="preferredFormation"
                value={formData.preferredFormation}
                onChange={handleChange}
              >
                <select
                  id="preferredFormation"
                  name="preferredFormation"
                  value={formData.preferredFormation}
                  onChange={handleChange}
                  className="w-full bg-transparent text-white outline-none"
                >
                  <option value="" className="bg-gray-800">Select Formation</option>
                  <option value="4-3-3" className="bg-gray-800">4-3-3</option>
                  <option value="4-4-2" className="bg-gray-800">4-4-2</option>
                  <option value="4-2-3-1" className="bg-gray-800">4-2-3-1</option>
                  <option value="3-5-2" className="bg-gray-800">3-5-2</option>
                  <option value="5-3-2" className="bg-gray-800">5-3-2</option>
                </select>
              </InputField>

              <InputField
                icon={Activity}
                label="Preferred Playstyle"
                name="preferredPlaystyle"
                value={formData.preferredPlaystyle}
                onChange={handleChange}
              >
                <select
                  id="preferredPlaystyle"
                  name="preferredPlaystyle"
                  value={formData.preferredPlaystyle}
                  onChange={handleChange}
                  className="w-full bg-transparent text-white outline-none"
                >
                  <option value="" className="bg-gray-800">Select Playstyle</option>
                  <option value="Possession" className="bg-gray-800">Possession</option>
                  <option value="Counter Attack" className="bg-gray-800">Counter Attack</option>
                  <option value="Long Ball" className="bg-gray-800">Long Ball</option>
                  <option value="Wing Play" className="bg-gray-800">Wing Play</option>
                  <option value="Tiki-Taka" className="bg-gray-800">Tiki-Taka</option>
                </select>
              </InputField>
            </div>
          </motion.section>

          {/* Contact / WhatsApp Section */}
          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            <SectionHeader
              icon={Phone}
              title="Match Communication"
              subtitle="How opponents reach you to coordinate matches."
              gradient="from-green-500 to-emerald-500"
            />

            <div className="mb-4">
              <InputField
                icon={Phone}
                label="WhatsApp Number (with country code)"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="+254712345678"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Include country code. Example: +254712345678 for Kenya
              </p>
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-gray-900/40 p-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  formData.whatsappVisible
                    ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                    : "bg-gray-700/40 text-gray-400 ring-1 ring-white/10"
                }`}>
                  {formData.whatsappVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </span>
                <div>
                  <label htmlFor="whatsappVisible" className="block cursor-pointer text-sm font-medium text-gray-200">
                    Allow opponents to see my WhatsApp number
                  </label>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    formData.whatsappVisible ? "bg-emerald-500/15 text-emerald-300" : "bg-gray-700/50 text-gray-400"
                  }`}>
                    {formData.whatsappVisible ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>

              <label htmlFor="whatsappVisible" className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  id="whatsappVisible"
                  name="whatsappVisible"
                  checked={formData.whatsappVisible}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <span className="h-7 w-12 rounded-full bg-gray-600 transition-colors peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/50" />
                <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          </motion.section>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col-reverse gap-3 sm:flex-row"
          >
            <Link
              href="/dashboard/profile"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-center text-sm font-semibold text-gray-200 transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
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
        </form>
      </motion.div>
    </div>
  );
}