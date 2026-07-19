"use client";

import { useEffect, useState, memo, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { registerServiceWorker } from "@/lib/service-worker/register";
import { setQueryClient } from "@/lib/react-query";

// ✅ Create query client outside component
let queryClientInstance: QueryClient | null = null;

function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          // ✅ TEST: This forces React Query to ALWAYS fetch fresh data
          staleTime: 0, // Always stale (0 means always refetch)
          gcTime: 5 * 60 * 1000,
          refetchOnWindowFocus: true, // Refetch when tab focuses
          refetchOnMount: true, // Refetch when component mounts
          refetchOnReconnect: true, // Refetch when reconnecting
          retry: 2,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
          retry: 2,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
      },
    });

    // ✅ Listen to ALL mutations
    queryClientInstance.getMutationCache().subscribe((event) => {
      // When ANY mutation succeeds, invalidate ALL queries
      if (event.type === 'updated' && event.action?.type === 'success') {
        console.log('🔄 [TEST] Mutation detected - invalidating ALL queries');
        queryClientInstance?.invalidateQueries();
        
        // Also refetch active queries after a short delay
        setTimeout(() => {
          queryClientInstance?.refetchQueries();
          console.log('🔄 [TEST] All queries refetched');
        }, 100);
      }
    });
  }
  return queryClientInstance;
}

// ✅ Memoized Toaster
const MemoizedToaster = memo(function MemoizedToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--card-bg, #1f2937)",
          color: "var(--text-color, #f9fafb)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          border: "1px solid var(--border-color, #374151)",
          maxWidth: "420px",
        },
        success: {
          icon: "✅",
          style: {
            borderLeft: "4px solid #22c55e",
          },
        },
        error: {
          icon: "❌",
          style: {
            borderLeft: "4px solid #ef4444",
          },
        },
        loading: {
          style: {
            borderLeft: "4px solid #6366f1",
          },
        },
      }}
      containerStyle={{
        top: 20,
        right: 20,
      }}
    />
  );
});

// ✅ Memoized InstallPrompt
const MemoizedInstallPrompt = memo(InstallPrompt);

export const ClientProviders = memo(function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);

  const registerSW = useCallback(async () => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      !isServiceWorkerRegistered
    ) {
      try {
        await registerServiceWorker();
        setIsServiceWorkerRegistered(true);
        console.log("✅ Service Worker registered successfully");
      } catch (error) {
        console.warn("⚠️ Service Worker registration failed:", error);
      }
    }
  }, [isServiceWorkerRegistered]);

  useEffect(() => {
    registerSW();

    if (process.env.NODE_ENV === "development") {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (publicKey) {
        console.log(
          "✅ VAPID Public Key exists:",
          publicKey.substring(0, 20) + "..."
        );
      } else {
        console.warn("⚠️ NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
      }
    }
  }, [registerSW]);

  const queryClient = getQueryClient();
  setQueryClient(queryClient); // ✅ Register globally

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <MemoizedToaster />
      <MemoizedInstallPrompt />
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
});

ClientProviders.displayName = "ClientProviders";