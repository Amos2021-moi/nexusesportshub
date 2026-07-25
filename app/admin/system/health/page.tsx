"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { 
  CheckCircle, AlertCircle, XCircle, 
  Database, HardDrive, Mail, Bell, 
  Shield, Clock, RefreshCw 
} from "lucide-react";
import toast from "react-hot-toast";

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "offline";
  message?: string;
  icon: any;
}

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
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px]" />
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
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Health Card ===
const HealthCard = memo(({ item }: { item: HealthCheck }) => {
  const isMobile = useIsMobile();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-400 bg-green-500/10";
      case "warning": return "text-yellow-400 bg-yellow-500/10";
      case "offline": return "text-red-400 bg-red-500/10";
      default: return "text-gray-400 bg-gray-500/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "warning": return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case "offline": return <XCircle className="h-5 w-5 text-red-400" />;
      default: return <CheckCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const Icon = item.icon;
  const statusColor = getStatusColor(item.status);

  return (
    <div className={`p-4 rounded-xl border ${statusColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${statusColor} flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{item.name}</p>
            <p className="text-xs text-gray-400 capitalize">{item.status}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {getStatusIcon(item.status)}
        </div>
      </div>
      {item.message && (
        <p className="mt-2 text-xs text-gray-400">{item.message}</p>
      )}
    </div>
  );
});

HealthCard.displayName = "HealthCard";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function HealthDashboard() {
  const isMobile = useIsMobile();
  const [health, setHealth] = useState<HealthCheck[]>([
    { name: "Database", status: "healthy", icon: Database },
    { name: "Storage", status: "healthy", icon: HardDrive },
    { name: "Email", status: "healthy", icon: Mail },
    { name: "Notifications", status: "healthy", icon: Bell },
    { name: "Authentication", status: "healthy", icon: Shield },
    { name: "Backups", status: "healthy", icon: Clock },
  ]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(prev => prev.map(item => ({
          ...item,
          status: data[item.name.toLowerCase()] || "healthy"
        })));
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error("Health check failed:", error);
      toast.error("Failed to check system health");
    } finally {
      setLoading(false);
    }
  }, []);

  const allOperational = useCallback(() => {
    return health.every(item => item.status === "healthy");
  }, [health]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Checking system health...</p>
          </div>
        </div>
      </>
    );
  }

  const operational = allOperational();

  return (
    <>
      <DecorBackground />
      <div className="space-y-6 px-3 pb-20 sm:px-4 lg:px-6">
        {/* Header - NO animations */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">System Health</h1>
            <p className="text-gray-400 text-sm">Real-time system status monitoring</p>
          </div>
          <button
            onClick={checkHealth}
            className="flex min-h-[44px] items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-150"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Health Cards - NO animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.map((item, index) => (
            <HealthCard key={index} item={item} />
          ))}
        </div>

        {/* Status Footer - NO animations */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <span className="text-gray-400">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-2 text-gray-400">
              <span className={`h-2 w-2 rounded-full ${operational ? "bg-green-400" : "bg-red-400"}`} />
              <span className={operational ? "text-green-400" : "text-red-400"}>
                {operational ? "● All systems operational" : "● Some systems need attention"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}