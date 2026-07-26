"use client";

import { Loader2, Wifi, WifiOff, RefreshCw, LogOut, XCircle, AlertCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  CONNECTING: { icon: Loader2, color: "text-yellow-400", label: "Connecting" },
  OPEN: { icon: Wifi, color: "text-emerald-400", label: "Online" },
  CLOSED: { icon: WifiOff, color: "text-red-400", label: "Offline" },
  RECONNECTING: { icon: RefreshCw, color: "text-yellow-400", label: "Reconnecting" },
  LOGGED_OUT: { icon: LogOut, color: "text-red-500", label: "Logged Out" },
  SHUTTING_DOWN: { icon: XCircle, color: "text-gray-400", label: "Shutting Down" },
};

export default function StatusBadge({ state }: { state: string }) {
  const s = STATUS_CONFIG[state] || { icon: AlertCircle, color: "text-gray-400", label: state };
  const Icon = s.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${s.color} border-current/30 bg-current/10`}>
      <Icon className={`h-3 w-3 ${state === "RECONNECTING" ? "animate-spin" : ""}`} />
      {s.label}
    </span>
  );
}
