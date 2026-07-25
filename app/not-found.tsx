"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

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
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
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
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
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
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function NotFound() {
  const isMobile = useIsMobile();

  return (
    <>
      <BackgroundDecorations />

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8 sm:min-h-[calc(100vh-64px)]">
        <div className="relative w-full max-w-md">
          {/* Glow behind icon - NO animation */}
          <div className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/10 blur-2xl" />

          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            {/* Decorative line */}
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

            {/* Icon - NO animations on mobile */}
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 shadow-lg shadow-yellow-500/10">
              <FileQuestion className="h-12 w-12 text-yellow-400" />
            </div>

            {/* Content - NO animations */}
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
                404
              </h1>

              <p className="mb-2 text-xl font-semibold text-white">
                Page Not Found
              </p>

              <p className="mx-auto mb-8 max-w-xs text-sm text-gray-400">
                The page you're looking for doesn't exist or has been moved.
              </p>

              {/* Action buttons - NO animations */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-150 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-indigo-600/40 active:scale-95"
                >
                  <Home className="h-4 w-4 transition-transform duration-150 group-hover:-translate-y-0.5" />
                  Go Home
                </Link>

                <button
                  onClick={() => window.history.back()}
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-300 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                  Go Back
                </button>
              </div>

              {/* Subtle footer - NO animations */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Sparkles className="h-3 w-3 text-yellow-400/50" />
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