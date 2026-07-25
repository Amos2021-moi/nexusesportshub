"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import {
  Shield,
  Clock,
  Mail,
  Zap,
  Loader2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Crown,
  Wrench,
  Settings,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Gauge,
  Server,
  Database,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

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
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Countdown Display ===
const CountdownDisplay = memo(({ timeRemaining, scheduledEnd }: { 
  timeRemaining: number | null; 
  scheduledEnd: string | null;
}) => {
  if (timeRemaining !== null && timeRemaining > 0) {
    return (
      <>
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums text-white sm:text-3xl md:text-4xl">
              {Math.floor(timeRemaining / 3600).toString().padStart(2, "0")}
            </div>
            <div className="mt-0.5 text-[8px] uppercase tracking-wider text-gray-400 sm:text-[10px]">
              Hours
            </div>
          </div>
          <div className="text-2xl font-bold text-white/20 sm:text-3xl">:</div>
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums text-white sm:text-3xl md:text-4xl">
              {Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, "0")}
            </div>
            <div className="mt-0.5 text-[8px] uppercase tracking-wider text-gray-400 sm:text-[10px]">
              Minutes
            </div>
          </div>
          <div className="text-2xl font-bold text-white/20 sm:text-3xl">:</div>
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums text-white sm:text-3xl md:text-4xl">
              {(timeRemaining % 60).toString().padStart(2, "0")}
            </div>
            <div className="mt-0.5 text-[8px] uppercase tracking-wider text-gray-400 sm:text-[10px]">
              Seconds
            </div>
          </div>
        </div>
        {scheduledEnd && (
          <div className="mt-2 text-xs text-gray-400 sm:mt-3">
            Estimated end time:{" "}
            <span className="font-medium text-green-400">
              {new Date(scheduledEnd).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
      <span className="text-sm text-gray-400">Processing...</span>
    </div>
  );
});

CountdownDisplay.displayName = "CountdownDisplay";

// === STATIC Status Badge ===
const StatusBadge = memo(({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-1 sm:px-3 sm:py-1.5">
    <Icon className="h-3 w-3 text-green-400" />
    <span className="text-[10px] text-white/60 sm:text-xs">{label}</span>
  </div>
));

StatusBadge.displayName = "StatusBadge";

/* -------------------------------------------------------------------------- */
/*                           STATIC Background - NO ANIMATIONS               */
/* -------------------------------------------------------------------------- */

function MaintenanceBackground() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2a]">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2a]">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

interface MaintenanceOverlayProps {
  children: React.ReactNode;
}

export default function MaintenanceOverlay({ children }: MaintenanceOverlayProps) {
  const { data: session, status } = useSession();
  const isMobile = useIsMobile();
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  // ✅ Check status with caching
  const checkStatus = useCallback(async () => {
    // ✅ Skip if already have cached data within 30 seconds
    const cached = sessionStorage.getItem("maintenance_data");
    const cachedTime = sessionStorage.getItem("maintenance_timestamp");
    
    if (cached && cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age < 30000) {
        try {
          const data = JSON.parse(cached);
          setIsActive(data.isActive || false);
          setMessage(data.message || "");
          setScheduledEnd(data.scheduledEnd || null);
          if (data.scheduledEnd) {
            const now = new Date().getTime();
            const end = new Date(data.scheduledEnd).getTime();
            setTimeRemaining(Math.max(0, Math.floor((end - now) / 1000)));
          }
          setLoading(false);
          return;
        } catch (e) {
          // Cache parse failed
        }
      }
    }

    try {
      const res = await fetch("/api/public/maintenance", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      sessionStorage.setItem("maintenance_data", JSON.stringify({
        isActive: data.isActive || false,
        message: data.message || "",
        scheduledEnd: data.scheduledEnd || null,
      }));
      sessionStorage.setItem("maintenance_timestamp", String(Date.now()));
      
      setIsActive(data.isActive || false);
      setMessage(data.message || "");
      setScheduledEnd(data.scheduledEnd || null);

      if (data.scheduledEnd) {
        const now = new Date().getTime();
        const end = new Date(data.scheduledEnd).getTime();
        setTimeRemaining(Math.max(0, Math.floor((end - now) / 1000)));
      }
      setError(false);
    } catch (error) {
      console.error("Error checking maintenance:", error);
      setError(true);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setIsActive(data.isActive || false);
          setMessage(data.message || "");
          setScheduledEnd(data.scheduledEnd || null);
        } catch (e) {
          setIsActive(false);
        }
      } else {
        setIsActive(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Check status on mount and every 60 seconds
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await checkStatus();
      }
    };
    
    init();
    
    const interval = setInterval(() => {
      if (mounted) {
        checkStatus();
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [checkStatus]);

  // ✅ Update countdown every second
  useEffect(() => {
    if (!scheduledEnd || !isActive) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(scheduledEnd).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeRemaining(diff);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [scheduledEnd, isActive]);

  // ✅ Admin bypass
  if (status !== "loading" && isAdmin) {
    return children;
  }

  if (loading || status === "loading") {
    return children;
  }

  if (isActive) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2a]">
        <MaintenanceBackground />

        {/* Main Content - NO animations */}
        <div className="relative z-10 w-full max-w-2xl px-4 py-8 text-center sm:px-6 sm:py-12">
          {/* Shield Icon - NO animations */}
          <div className="relative mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 sm:h-28 sm:w-28">
            <div className="absolute inset-0 rounded-full bg-yellow-500/20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 shadow-2xl shadow-yellow-500/20 sm:h-20 sm:w-20">
              <Shield className="h-8 w-8 text-yellow-400 sm:h-10 sm:w-10" />
            </div>
          </div>

          {/* Title - NO animations */}
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:mb-4 sm:text-4xl md:text-6xl">
            Under{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
              Maintenance
            </span>
          </h1>

          <div className="mx-auto mb-4 h-0.5 w-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 sm:mb-6 sm:w-24" />

          {/* Message - NO animations */}
          <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-gray-300 sm:mb-8 sm:text-base sm:leading-relaxed">
            {message ||
              "We're currently performing scheduled maintenance to improve your experience."}
          </p>

          {/* Countdown Card - NO animations */}
          <div className="mx-auto mb-6 max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:mb-8 sm:p-6">
            <CountdownDisplay timeRemaining={timeRemaining} scheduledEnd={scheduledEnd} />
          </div>

          {/* Status Badges - NO animations */}
          <div className="mb-6 flex flex-wrap justify-center gap-2 sm:gap-3 sm:mb-8">
            <StatusBadge icon={CheckCircle} label="Secure" />
            <StatusBadge icon={Shield} label="Protected" />
            <StatusBadge icon={Clock} label="Back Soon" />
            <StatusBadge icon={Server} label="Upgrading" />
          </div>

          {/* Contact - NO animations */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 sm:gap-2 sm:text-sm">
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Questions?</span>
            <a
              href="mailto:nexusesportshub@gmail.com"
              className="inline-flex items-center gap-1 font-medium text-indigo-400 transition-colors duration-150 hover:text-indigo-300 hover:underline"
            >
              nexusesportshub@gmail.com
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          {/* Footer - NO animations */}
          <div className="mt-6 text-[10px] text-gray-600 sm:mt-8 sm:text-xs">
            <p>🔄 We'll be back soon. Thank you for your patience.</p>
            <p className="mt-1 text-gray-700">
              © {new Date().getFullYear()} Nexus Esports League
            </p>
          </div>
        </div>

        {/* Hidden children (inert) */}
        <div className="pointer-events-none h-screen overflow-hidden opacity-0">
          {children}
        </div>
      </div>
    );
  }

  return children;
}