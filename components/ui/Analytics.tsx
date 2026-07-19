"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Simple page view tracking
export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          })
        })
      } catch (error) {
        // Silent fail - analytics shouldn't break the app
        console.debug("Analytics error:", error)
      }
    }

    trackPageView()
  }, [pathname])

  return null
}