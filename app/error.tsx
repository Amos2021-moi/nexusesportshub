"use client";

import { useEffect, useState, memo } from "react";
import { AlertTriangle, RefreshCw, Home, Shield, Bug, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";

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
/*                           STATIC Background - NO ANIMATIONS               */
/* -------------------------------------------------------------------------- */

function BackgroundDecorations() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
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
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
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
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-3xl" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Error Detail Card                        */
/* -------------------------------------------------------------------------- */

const ErrorDetails = memo(function ErrorDetails({ 
  error 
}: { 
  error: Error & { digest?: string } 
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors duration-150 hover:bg-red-500/5"
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-red-400" />
          <span className="text-sm font-medium text-red-300">Error Details</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`} 
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
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
      </div>
    </div>
  );
});

ErrorDetails.displayName = "ErrorDetails";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    console.error(
      "%c❌ Application Error",
      "color: #ef4444; font-size: 16px; font-weight: bold;"
    );
    console.error(error);
  }, [error]);

  return (
    <>
      <BackgroundDecorations />

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:min-h-[calc(100vh-64px)]">
        <div className="relative w-full max-w-md">
          {/* Glow behind icon - NO animation */}
          <div className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-2xl" />

          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            {/* Decorative line */}
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

            {/* Icon with static ring */}
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/10" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-lg shadow-red-500/10">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
            </div>

            {/* Content - NO animations */}
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
                Oops!
              </h1>

              <p className="mb-2 text-xl font-semibold text-white">
                Something Went Wrong
              </p>

              <p className="mx-auto mb-6 max-w-xs text-sm text-gray-400">
                We encountered an unexpected error. Please try again or return home.
              </p>

              {/* Error details */}
              <ErrorDetails error={error} />

              {/* Action buttons - NO animations */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={reset}
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-150 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-600/40 active:scale-95"
                >
                  <RefreshCw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                  Try Again
                </button>

                <Link
                  href="/"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-300 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <Home className="h-4 w-4 transition-transform duration-150 group-hover:-translate-y-0.5" />
                  Go Home
                </Link>
              </div>

              {/* Subtle footer - NO animations */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="h-3 w-3 text-indigo-400/50" />
                <span>Nexus Esports League</span>
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                <span>v1.0</span>
              </div>
            </div>

            {/* Decorative corner accents */}
            <div className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-3xl border-r border-t border-white/5" />
            <div className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-3xl border-b border-l border-white/5" />
          </div>
        </div>
      </div>
    </>
  );
}