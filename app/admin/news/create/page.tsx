"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion"; // ✅ CHANGED
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  X,
  Loader2,
  Newspaper,
  Sparkles,
  UploadCloud,
  Eye,
  CheckCircle,
  FileText,
  PenLine,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

const containerVariants: Variants = { // ✅ CHANGED
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = { // ✅ CHANGED
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function DecorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-pink-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-rose-500/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

export default function CreateNewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
    published: false,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Redirect if not admin
  if (status === "loading") {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-[3px] border-pink-500 border-t-transparent" />
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(
          formData.published ? "News published successfully!" : "News saved as draft!"
        );
        router.push("/admin/news");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create news");
      }
    } catch (error) {
      console.error("Error creating news:", error);
      toast.error("Failed to create news");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setFormData({ ...formData, image: result });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: "" });
  };

  return (
    <>
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 pb-8 sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-pink-600/20 via-rose-600/20 to-purple-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/admin/news"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-gray-900/50 text-gray-300 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Back to news"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30 sm:h-12 sm:w-12">
                <Newspaper className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  📰 Create News Article
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Write and publish news for the community
                </p>
              </div>
            </div>

            <span
              className={`flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                formData.published
                  ? "border-green-400/30 bg-green-500/10 text-green-300"
                  : "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {formData.published ? "Publishing" : "Draft mode"}
            </span>
          </div>
        </motion.div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
          >
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter news title..."
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white placeholder-gray-400 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Content <span className="text-red-400">*</span>
              </label>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-900/60">
                <div className="flex items-center gap-2 border-b border-white/10 bg-gray-950/40 px-3 py-2 text-xs text-gray-500">
                  <FileText className="h-4 w-4" />
                  Rich text content area
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  placeholder="Write your news content here..."
                  className="min-h-[260px] w-full resize-y bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{formData.content.length} characters</p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Image (Optional)</label>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <label className="group flex min-h-[120px] cursor-pointer flex-1 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-gray-900/40 p-4 transition-all hover:border-pink-500/40 hover:bg-pink-500/5">
                  <div className="text-center">
                    <UploadCloud className="mx-auto mb-2 h-8 w-8 text-pink-300 transition-transform group-hover:-translate-y-0.5" />
                    <span className="text-sm font-medium text-gray-300">Upload Image</span>
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP • Max 5MB</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {imagePreview && (
                  <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 lg:w-60">
                    <Image
                      src={imagePreview}
                      alt="News preview image"
                      width={800}
                      height={400}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="truncate text-xs text-white">Featured image preview</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-2 top-2 flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Publish Toggle */}
            <label className="flex min-h-[44px] cursor-pointer flex-col gap-2 rounded-2xl border border-white/10 bg-gray-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-pink-600 focus:ring-pink-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-300">Publish immediately</span>
                  <p className="text-xs text-gray-500">Control whether this article is visible to players.</p>
                </div>
              </div>
              {formData.published && (
                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Visible to everyone
                </span>
              )}
            </label>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-pink-900/30 transition-all hover:from-pink-700 hover:to-rose-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {formData.published ? "Publish News" : "Save Draft"}
                  </>
                )}
              </button>
              <Link
                href="/admin/news"
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-gray-700 px-6 py-2.5 text-gray-300 transition-all hover:bg-gray-600"
              >
                Cancel
              </Link>
            </div>
          </motion.form>

          {/* Live Preview */}
          <motion.aside
            variants={itemVariants}
            className="h-fit rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-pink-300" />
              <h2 className="font-semibold text-white">Live Preview</h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="preview"
                  width={800}
                  height={400}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                  <ImageIcon className="h-10 w-10 text-gray-600" />
                </div>
              )}
              <div className="p-4">
                <span
                  className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    formData.published
                      ? "bg-green-500/15 text-green-300"
                      : "bg-yellow-500/15 text-yellow-300"
                  }`}
                >
                  {formData.published ? "Published" : "Draft"}
                </span>
                <h3 className="line-clamp-2 text-lg font-bold text-white">
                  {formData.title || "Your news title will appear here"}
                </h3>
                <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm text-gray-400">
                  {formData.content || "Start writing your news content to preview it here."}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-gray-900/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <PenLine className="h-4 w-4 text-pink-300" />
                Publishing checklist
              </div>
              <ul className="mt-3 space-y-2 text-xs text-gray-400">
                <li className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${formData.title.trim() ? "bg-green-400" : "bg-gray-600"}`} />
                  Add a clear headline
                </li>
                <li className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${formData.content.trim() ? "bg-green-400" : "bg-gray-600"}`} />
                  Write article content
                </li>
                <li className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${imagePreview ? "bg-green-400" : "bg-gray-600"}`} />
                  Optional featured image
                </li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </motion.div>
    </>
  );
}