"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("❌ Global Error:", error)
  }, [error])

  return (
    <html>
      <body className="bg-gray-950">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Critical Error</h1>
            <p className="text-gray-400 text-sm mb-6">
              A critical error occurred. Please try again.
            </p>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 break-all font-mono">
                {error.message || "Unknown error"}
              </p>
            </div>

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}