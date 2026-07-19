"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  Home,
  Users,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionFactorsProps {
  factors: {
    eloAdvantage: string;
    formAdvantage: string;
    h2hAdvantage: string;
    homeAdvantage: string;
  };
  className?: string;
}

const factorIcons = {
  eloAdvantage: Zap,
  formAdvantage: TrendingUp,
  h2hAdvantage: Users,
  homeAdvantage: Home,
};

const factorLabels = {
  eloAdvantage: "ELO Rating",
  formAdvantage: "Recent Form",
  h2hAdvantage: "Head-to-Head",
  homeAdvantage: "Home Advantage",
};

function getFactorColor(text: string): "positive" | "negative" | "neutral" {
  if (text.includes("advantage") || text.includes("better") || text.includes("stronger")) {
    return "positive";
  }
  if (text.includes("weaker") || text.includes("worse") || text.includes("disadvantage")) {
    return "negative";
  }
  return "neutral";
}

function getFactorIcon(text: string) {
  const color = getFactorColor(text);
  if (color === "positive") return CheckCircle;
  if (color === "negative") return XCircle;
  return Minus;
}

function getFactorColorClass(color: string) {
  if (color === "positive") return "text-green-400 bg-green-500/10 border-green-500/20";
  if (color === "negative") return "text-red-400 bg-red-500/10 border-red-500/20";
  return "text-gray-400 bg-gray-500/10 border-gray-500/20";
}

export default function PredictionFactors({
  factors,
  className,
}: PredictionFactorsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-gray-400">📋 Key Factors</p>
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(factors).map(([key, value]) => {
          const Icon = factorIcons[key as keyof typeof factorIcons];
          const label = factorLabels[key as keyof typeof factorLabels];
          const color = getFactorColor(value);
          const StatusIcon = getFactorIcon(value);
          const colorClass = getFactorColorClass(color);

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs",
                colorClass
              )}
            >
              <Icon className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 truncate">{value}</span>
              <StatusIcon className="h-3 w-3 flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}