// app/news/[id]/ShareButton.tsx
"use client";

import { useState, useCallback, memo } from "react";
import { Share2, Check, Copy, Bookmark, Send } from "lucide-react";
import toast from "react-hot-toast";

interface ShareButtonProps {
  title: string;
  content: string;
}

export const ShareButton = memo(({ title, content }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleShare = useCallback(async () => {
    const shareData = {
      title,
      text: content.slice(0, 120) + "...",
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("🚀 Shared successfully!");
        return;
      } catch (error: any) {
        if (error.name === "AbortError") return;
        // Fall back to copy
      }
    }

    // Fallback: Copy URL to clipboard
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("📋 Link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    }
  }, [title, content]);

  const handleCopyLink = useCallback(() => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("📋 Link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    }
  }, []);

  const handleBookmark = useCallback(() => {
    setBookmarked((prev) => {
      const next = !prev;
      if (next) {
        toast.success("🔖 Article saved to bookmarks!");
      } else {
        toast("Article removed from bookmarks", { icon: "🗑️" });
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-8">
      <div className="flex flex-wrap items-center gap-3">
        {/* Native / Main Share Button (Touch-Friendly min 44px) */}
        <button
          onClick={handleShare}
          className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/50 active:scale-95"
        >
          <Share2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          <span>Share Article</span>
        </button>

        {/* Copy Link Button (Touch-Friendly min 44px) */}
        <button
          onClick={handleCopyLink}
          className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-gray-300 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.1] hover:text-white active:scale-95"
          title="Copy exact article link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4 text-gray-400 transition-transform duration-300 group-hover:scale-110" />
          )}
          <span>{copied ? "Copied Link" : "Copy URL"}</span>
        </button>
      </div>

      {/* Bookmark Action */}
      <button
        onClick={handleBookmark}
        className={`group inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold backdrop-blur-md transition-all duration-300 active:scale-95 ${
          bookmarked
            ? "border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/10"
            : "border-white/[0.12] bg-white/[0.05] text-gray-300 hover:border-white/25 hover:bg-white/[0.1] hover:text-white"
        }`}
      >
        <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-amber-300 text-amber-300" : "text-gray-400 group-hover:text-amber-400"}`} />
        <span>{bookmarked ? "Bookmarked" : "Save for Later"}</span>
      </button>
    </div>
  );
});

ShareButton.displayName = "ShareButton";
