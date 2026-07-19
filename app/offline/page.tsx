"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <WifiOff className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">You're Offline</h1>
        <p className="mt-2 max-w-md text-gray-400">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <div className="mt-4 text-sm text-gray-500">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}