"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { Shield, Clock, AlertTriangle, Mail, Calendar, Loader2 } from "lucide-react";

interface MaintenanceInfo {
  scheduledAt?: string;
  duration?: number;
  message?: string;
  startTime?: string;
}

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
const CountdownDisplay = memo(({ 
  hours, 
  minutes, 
  seconds 
}: { 
  hours: number; 
  minutes: number; 
  seconds: number;
}) => {
  const isMobile = useIsMobile();
  const textSize = isMobile ? "text-2xl" : "text-3xl";

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <div className="text-center">
          <div className={`${textSize} font-bold text-white`}>
            {String(hours).padStart(2, "0")}
          </div>
          <div className="text-[10px] text-gray-500">Hours</div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-gray-500">:</div>
        <div className="text-center">
          <div className={`${textSize} font-bold text-white`}>
            {String(minutes).padStart(2, "0")}
          </div>
          <div className="text-[10px] text-gray-500">Minutes</div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-gray-500">:</div>
        <div className="text-center">
          <div className={`${textSize} font-bold text-white`}>
            {String(seconds).padStart(2, "0")}
          </div>
          <div className="text-[10px] text-gray-500">Seconds</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3">Estimated time remaining</p>
    </div>
  );
});

CountdownDisplay.displayName = "CountdownDisplay";

// === STATIC Loading Spinner ===
const LoadingSpinner = memo(() => {
  const isMobile = useIsMobile();
  const spinClass = isMobile ? "" : "animate-spin";

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
      <Loader2 className={`h-4 w-4 ${spinClass}`} />
      <span>Loading maintenance info...</span>
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function MaintenancePage() {
  const isMobile = useIsMobile();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMaintenanceInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/maintenance/schedule");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setMaintenanceInfo({
            scheduledAt: data.scheduledAt,
            duration: data.duration,
            message: data.message,
            startTime: data.scheduledAt,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching maintenance info:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceInfo();
    const interval = setInterval(fetchMaintenanceInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchMaintenanceInfo]);

  useEffect(() => {
    if (!maintenanceInfo?.startTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(maintenanceInfo.startTime!).getTime();
      const diff = start + (maintenanceInfo.duration || 30) * 60 * 1000 - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenanceInfo]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-6">
            <Shield className="h-10 w-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-6">Under Maintenance</h1>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon - NO animations */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-6">
          <Shield className="h-10 w-10 text-yellow-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Under Maintenance</h1>
        <p className="text-sm sm:text-base text-gray-400 mb-6">
          {maintenanceInfo?.message || "We're currently performing scheduled maintenance to improve your experience."}
        </p>

        {/* Countdown Timer - NO animations */}
        {timeLeft ? (
          <CountdownDisplay 
            hours={timeLeft.hours} 
            minutes={timeLeft.minutes} 
            seconds={timeLeft.seconds} 
          />
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-gray-300">We'll be back <span className="text-white font-medium">shortly</span></span>
            </div>
          </div>
        )}

        {/* Scheduled time info - NO animations */}
        {maintenanceInfo?.scheduledAt && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Calendar className="h-4 w-4" />
            <span>Scheduled: {new Date(maintenanceInfo.scheduledAt).toLocaleString()}</span>
          </div>
        )}

        {/* Contact - NO animations */}
        <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-gray-500">
          <Mail className="h-4 w-4" />
          <span>Questions? Contact</span>
          <a 
            href="mailto:support@nexusesports.com" 
            className="text-indigo-400 transition-colors duration-150 hover:text-indigo-300"
          >
            support@nexusesports.com
          </a>
        </div>

        {/* Footer - NO animations */}
        <p className="text-xs text-gray-600 mt-6 sm:mt-8">
          We'll be back soon. Thank you for your patience.
        </p>
      </div>
    </div>
  );
}