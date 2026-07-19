"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/service-worker/register";

export function ServiceWorkerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <>{children}</>;
}