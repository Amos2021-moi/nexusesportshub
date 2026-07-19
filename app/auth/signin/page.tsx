"use client";

import { Suspense, memo } from "react";
import SignInForm from "./SignInForm";
import { Loader2, Shield } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                            Loading Component                               */
/* -------------------------------------------------------------------------- */

const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/80">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 blur-md opacity-60" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-900/50">
            <Shield className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-gray-400 animate-pulse">Loading sign in...</p>
      </div>
    </div>
  );
});

LoadingFallback.displayName = "LoadingFallback";

/* -------------------------------------------------------------------------- */
/*                            Main Page Component                             */
/* -------------------------------------------------------------------------- */

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignInForm />
    </Suspense>
  );
}