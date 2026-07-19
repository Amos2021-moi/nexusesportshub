"use client";

import { cn } from "@/lib/utils";
import { memo } from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "text" | "avatar" | "image" | "table-row";
  // ✅ New: shimmer effect option
  shimmer?: boolean;
}

// ✅ Optimized base skeleton with reduced motion support
export const Skeleton = memo(function Skeleton({
  className,
  variant = "text",
  shimmer = false,
  ...props
}: SkeletonProps) {
  const variants = {
    card: "h-32 w-full rounded-xl bg-gray-700/50",
    text: "h-4 w-full rounded bg-gray-700/50",
    avatar: "h-12 w-12 rounded-full bg-gray-700/50",
    image: "h-48 w-full rounded-lg bg-gray-700/50",
    "table-row": "h-12 w-full rounded bg-gray-700/30",
  };

  return (
    <div
      className={cn(
        // ✅ Reduced motion support - respect user preferences
        "motion-safe:animate-pulse motion-reduce:animate-none",
        variants[variant] || variants.text,
        // ✅ Shimmer effect (optional)
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
});

// ✅ Memoized SkeletonCard with reduced re-renders
export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="space-y-3 will-change-transform">
      <Skeleton variant="image" shimmer />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" className="w-1/3" />
    </div>
  );
});

// ✅ Memoized SkeletonStats with grid optimization
export const SkeletonStats = memo(function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-800/50 p-5 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <Skeleton variant="avatar" className="h-12 w-12" shimmer />
            <Skeleton variant="text" className="h-8 w-16" />
          </div>
          <Skeleton variant="text" className="mt-3 h-4 w-24" />
          <Skeleton variant="text" className="mt-1 h-3 w-16" />
        </div>
      ))}
    </div>
  );
});

// ✅ Memoized SkeletonMatchCard
export const SkeletonMatchCard = memo(function SkeletonMatchCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800/50 p-4">
        <Skeleton variant="text" className="w-32" />
        <Skeleton variant="text" className="w-16" />
      </div>
      <div className="space-y-3 p-5 text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton variant="avatar" className="h-10 w-10" shimmer />
            <Skeleton variant="text" className="w-20" />
          </div>
          <Skeleton variant="text" className="h-6 w-8" />
          <span className="text-sm text-gray-500">vs</span>
          <Skeleton variant="text" className="h-6 w-8" />
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="w-20" />
            <Skeleton variant="avatar" className="h-10 w-10" shimmer />
          </div>
        </div>
        <Skeleton variant="text" className="mx-auto w-32" />
        <Skeleton variant="text" className="mx-auto h-8 w-24" />
      </div>
    </div>
  );
});

// ✅ Memoized SkeletonLeagueTable with virtualized-like rendering
export const SkeletonLeagueTable = memo(function SkeletonLeagueTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 shadow-xl backdrop-blur-sm">
      <div className="border-b border-gray-700 bg-gray-800/50 p-4">
        <Skeleton variant="text" className="h-6 w-32" shimmer />
      </div>
      <div className="divide-y divide-gray-700">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton variant="text" className="h-4 w-6" />
            <Skeleton variant="avatar" className="h-8 w-8" />
            <Skeleton variant="text" className="h-4 flex-1" />
            <Skeleton variant="text" className="h-4 w-8" />
            <Skeleton variant="text" className="h-4 w-8" />
            <Skeleton variant="text" className="h-4 w-8" />
            <Skeleton variant="text" className="h-4 w-8" />
            <Skeleton variant="text" className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
});

// ✅ Memoized SkeletonCommunityPost
export const SkeletonCommunityPost = memo(function SkeletonCommunityPost() {
  return (
    <div className="space-y-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" shimmer />
        <div className="flex-1">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="mt-1 h-3 w-24" />
        </div>
      </div>
      <Skeleton variant="text" className="h-4 w-3/4" />
      <Skeleton variant="text" className="h-4 w-1/2" />
      <div className="flex items-center gap-4 pt-2">
        <Skeleton variant="text" className="h-4 w-16" />
        <Skeleton variant="text" className="h-4 w-16" />
      </div>
    </div>
  );
});

// ✅ Memoized SkeletonTournamentBracket
export const SkeletonTournamentBracket = memo(function SkeletonTournamentBracket() {
  return (
    <div className="flex flex-col gap-8 justify-center lg:flex-row">
      {[...Array(3)].map((_, round) => (
        <div key={round} className="min-w-[200px] max-w-[300px] flex-1">
          <Skeleton variant="text" className="mx-auto mb-4 h-5 w-32" shimmer />
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, match) => (
              <Skeleton key={match} variant="card" className="h-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
