"use client";

import { Trophy, Zap, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionBadgeProps {
  winner: string;
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Low";
  compact?: boolean;
  className?: string;
}

const confidenceColors = {
  High: "text-green-400 border-green-400/30 bg-green-500/10",
  Medium: "text-yellow-400 border-yellow-400/30 bg-yellow-500/10",
  Low: "text-red-400 border-red-400/30 bg-red-500/10",
};

const confidenceEmojis = {
  High: "🔥",
  Medium: "⚡",
  Low: "💫",
};

export default function PredictionBadge({
  winner,
  confidence,
  confidenceLabel,
  compact = false,
  className,
}: PredictionBadgeProps) {
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          confidenceColors[confidenceLabel],
          className
        )}
      >
        <Trophy className="h-3 w-3" />
        {winner}
        <span className="opacity-70">•</span>
        {confidence}%
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
        confidenceColors[confidenceLabel],
        className
      )}
    >
      <span className="text-base">{confidenceEmojis[confidenceLabel]}</span>
      <span className="font-bold">{winner}</span>
      <span className="opacity-60">•</span>
      <span>{confidence}% confidence</span>
    </div>
  );
}