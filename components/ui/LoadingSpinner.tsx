"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "md",
  color = "indigo",
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
    xl: "h-16 w-16 border-4",
  };

  const colorClasses: Record<string, string> = {
    indigo: "border-indigo-500",
    white: "border-white",
    gray: "border-gray-400",
    emerald: "border-emerald-500",
    red: "border-red-500",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* ✅ Outer ring - always visible */}
        <div className={`${sizeClasses[size]} rounded-full border-t-transparent ${colorClasses[color] || colorClasses.indigo}`} style={{ animation: 'spin 0.8s linear infinite' }} />
        {/* ✅ Inner dot */}
        <div className={`absolute inset-0 flex items-center justify-center ${size === 'sm' ? 'scale-50' : ''}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${colorClasses[color] || colorClasses.indigo} animate-pulse`} />
        </div>
      </div>
      {text && (
        <p className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-400 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}

export function ButtonLoader() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="h-4 w-4 animate-spin-custom rounded-full border-2 border-white border-t-transparent" />
      <span className="text-sm">Loading...</span>
    </div>
  );
}