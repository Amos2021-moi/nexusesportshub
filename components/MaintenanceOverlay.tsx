"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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

interface MaintenanceOverlayProps {
  children: React.ReactNode;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const floatVariants: Variants = {
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function MaintenanceOverlay({ children }: MaintenanceOverlayProps) {
  const { data: session, status } = useSession();
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scheduledEnd || !isActive) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(scheduledEnd).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));

      if (diff <= 0) {
        setTimeRemaining(0);
        clearInterval(timer);
        return;
      }
      setTimeRemaining(diff);
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledEnd, isActive]);

  async function checkStatus() {
    try {
      const res = await fetch("/api/public/maintenance");
      if (res.ok) {
        const data = await res.json();
        setIsActive(data.isActive || false);
        setMessage(data.message || "");
        setScheduledEnd(data.scheduledEnd || null);

        if (data.scheduledEnd) {
          const now = new Date().getTime();
          const end = new Date(data.scheduledEnd).getTime();
          setTimeRemaining(Math.max(0, Math.floor((end - now) / 1000)));
        }
      }
    } catch (error) {
      console.error("Error checking maintenance:", error);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Admin bypass
  if (status !== "loading" && isAdmin) {
    return children;
  }

  if (loading || status === "loading") return children;

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatEndTime = (scheduledEnd: string) => {
    return new Date(scheduledEnd).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isActive) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2a]"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Gradient Orbs */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-3xl"
            />

            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />

            {/* Floating Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, -10, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
                className={`absolute h-1.5 w-1.5 rounded-full ${
                  i % 3 === 0
                    ? "bg-indigo-400/40"
                    : i % 3 === 1
                    ? "bg-purple-400/40"
                    : "bg-pink-400/40"
                }`}
                style={{
                  top: `${10 + i * 10}%`,
                  left: `${5 + i * 12}%`,
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 w-full max-w-2xl px-6 py-12 text-center"
          >
            {/* Shield Icon */}
            <motion.div
              variants={itemVariants}
              className="relative mx-auto mb-8 inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-yellow-500/20 blur-xl"
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 shadow-2xl shadow-yellow-500/20">
                <Shield className="h-10 w-10 text-yellow-400" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className="mb-4 text-4xl font-bold tracking-tight text-white md:text-6xl"
            >
              Under{" "}
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                Maintenance
              </span>
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
            />

            {/* Message */}
            <motion.p
              variants={itemVariants}
              className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-gray-300"
            >
              {message ||
                "We're currently performing scheduled maintenance to improve your experience."}
            </motion.p>

            {/* Countdown Card */}
            <motion.div
              variants={itemVariants}
              className="mx-auto mb-8 max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              {timeRemaining !== null && timeRemaining > 0 ? (
                <>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold tabular-nums text-white md:text-4xl">
                        {Math.floor(timeRemaining / 3600)
                          .toString()
                          .padStart(2, "0")}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                        Hours
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white/20">:</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold tabular-nums text-white md:text-4xl">
                        {Math.floor((timeRemaining % 3600) / 60)
                          .toString()
                          .padStart(2, "0")}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                        Minutes
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white/20">:</div>
                    <div className="text-center">
                      <div className="text-3xl font-bold tabular-nums text-white md:text-4xl">
                        {(timeRemaining % 60).toString().padStart(2, "0")}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
                        Seconds
                      </div>
                    </div>
                  </div>
                  {scheduledEnd && (
                    <div className="mt-3 text-sm text-gray-400">
                      Estimated end time:{" "}
                      <span className="font-medium text-green-400">
                        {formatEndTime(scheduledEnd)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                  <span className="text-sm text-gray-400">Processing...</span>
                </div>
              )}
            </motion.div>

            {/* Status Badges */}
            <motion.div
              variants={itemVariants}
              className="mb-8 flex flex-wrap justify-center gap-3"
            >
              <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-xs text-white/60">Secure</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5">
                <Shield className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-white/60">Protected</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5">
                <Clock className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-white/60">Back Soon</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5">
                <Server className="h-3 w-3 text-purple-400" />
                <span className="text-xs text-white/60">Upgrading</span>
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-2 text-sm text-gray-500"
            >
              <Mail className="h-4 w-4" />
              <span>Questions?</span>
              <a
                href="mailto:nexusesportshub@gmail.com"
                className="inline-flex items-center gap-1 font-medium text-indigo-400 transition-colors hover:text-indigo-300 hover:underline"
              >
                nexusesportshub@gmail.com
                <ArrowRight className="h-3 w-3" />
              </a>
            </motion.div>

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              className="mt-8 text-xs text-gray-600"
            >
              <p>🔄 We'll be back soon. Thank you for your patience.</p>
              <p className="mt-1 text-gray-700">
                © {new Date().getFullYear()} Nexus Esports League
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Hidden children (inert) */}
        <div className="pointer-events-none h-screen overflow-hidden opacity-0">
          {children}
        </div>
      </AnimatePresence>
    );
  }

  return children;
}