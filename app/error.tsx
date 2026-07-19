"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Home, Shield, Bug, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

/* -------------------------------------------------------------------------- */
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: 0.1,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: { type: "spring" as const, stiffness: 400, damping: 10 },
  },
};

const pulseRing = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: 1.5,
    opacity: 0,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeOut" as const,
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                            Background Decorations                          */
/* -------------------------------------------------------------------------- */

function BackgroundDecorations() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* ✅ Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />

      {/* ✅ Animated orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-red-600/20 blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl"
      />

      {/* ✅ Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* ✅ Subtle glow at center */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-3xl" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Error Detail Card                              */
/* -------------------------------------------------------------------------- */

function ErrorDetails({ error }: { error: Error & { digest?: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-red-500/5"
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-red-400" />
          <span className="text-sm font-medium text-red-300">Error Details</span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </motion.div>
      </button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="border-t border-red-500/10 px-4 py-3">
          <p className="text-xs font-mono text-gray-400 break-all">
            {error.message || "Unknown error occurred"}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              Error ID: <span className="text-gray-400">{error.digest}</span>
            </p>
          )}
          {error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                View Stack Trace
              </summary>
              <pre className="mt-2 text-[10px] text-gray-600 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // ✅ Log error to console with styling
    console.error(
      "%c❌ Application Error",
      "color: #ef4444; font-size: 16px; font-weight: bold;"
    );
    console.error(error);
  }, [error]);

  return (
    <>
      <BackgroundDecorations />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:min-h-[calc(100vh-64px)]"
      >
        <div className="relative w-full max-w-md">
          {/* ✅ Glow behind icon */}
          <div className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-2xl" />

          <motion.div
            variants={itemVariants}
            className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          >
            {/* ✅ Decorative line */}
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

            {/* ✅ Icon with pulse ring */}
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              <motion.div
                variants={pulseRing}
                initial="initial"
                animate="animate"
                className="absolute inset-0 rounded-full bg-red-500/10"
              />
              <motion.div
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-lg shadow-red-500/10"
              >
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </motion.div>
            </div>

            {/* ✅ Content */}
            <div className="text-center">
              <motion.h1
                variants={itemVariants}
                className="mb-2 text-4xl font-bold text-white sm:text-5xl"
              >
                Oops!
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mb-2 text-xl font-semibold text-white"
              >
                Something Went Wrong
              </motion.p>

              <motion.p
                variants={itemVariants}
                className="mx-auto mb-6 max-w-xs text-sm text-gray-400"
              >
                We encountered an unexpected error. Please try again or return home.
              </motion.p>

              {/* ✅ Error details */}
              <ErrorDetails error={error} />

              {/* ✅ Action buttons */}
              <motion.div
                variants={itemVariants}
                className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"
              >
                <button
                  onClick={reset}
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-600/40 active:scale-95"
                >
                  <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                  Try Again
                </button>

                <Link
                  href="/"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <Home className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  Go Home
                </Link>
              </motion.div>

              {/* ✅ Subtle footer */}
              <motion.div
                variants={itemVariants}
                className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500"
              >
                <Shield className="h-3 w-3 text-indigo-400/50" />
                <span>Nexus Esports League</span>
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                <span>v1.0</span>
              </motion.div>
            </div>

            {/* ✅ Decorative corner accents */}
            <div className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-3xl border-r border-t border-white/5" />
            <div className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-3xl border-b border-l border-white/5" />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}