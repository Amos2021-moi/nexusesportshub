"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";

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
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  // ✅ Optimized QueryClient configuration
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          // ✅ Longer stale time on mobile to reduce refetches
          staleTime: isMobile ? 120 * 1000 : 60 * 1000, // 2 min mobile, 1 min desktop
          gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
          refetchOnWindowFocus: false,
          refetchOnMount: true,
          refetchOnReconnect: false,
          retry: 1,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          // ✅ Use placeholder data when available
          placeholderData: (previousData: unknown) => previousData,
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
        },
      },
    });
  }, [isMobile]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}