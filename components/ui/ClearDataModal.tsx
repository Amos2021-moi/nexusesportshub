"use client"

import { useState } from "react"
import { AlertTriangle, X, Loader2, Shield } from "lucide-react"
import toast from "react-hot-toast"

interface ClearDataModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ClearDataModal({ isOpen, onClose, onSuccess }: ClearDataModalProps) {
  const [confirmation, setConfirmation] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleClear = async () => {
    if (confirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/system/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || "All data cleared successfully!")
        setConfirmation("")
        onSuccess()
        onClose()
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = "/auth/signin"
        }, 2000)
      } else {
        toast.error(data.error || "Failed to clear data")
      }
    } catch (error) {
      console.error("Error clearing data:", error)
      toast.error("Failed to clear data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Clear All Data</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-red-400 font-semibold text-sm">⚠️ This action cannot be undone!</p>
          <p className="text-gray-400 text-sm mt-1">
            All platform data will be permanently deleted. A backup will be created before clearing.
          </p>
        </div>

        {/* What will be deleted */}
        <div className="bg-gray-700/30 rounded-xl p-4 mb-6">
          <p className="text-gray-300 text-sm font-medium mb-2">This will delete:</p>
          <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
            <li>All players and their profiles</li>
            <li>All matches, results, and tournaments</li>
            <li>All seasons and standings</li>
            <li>All community posts and comments</li>
            <li>All awards and Hall of Fame entries</li>
            <li>All news articles</li>
            <li>All squads</li>
            <li>All notifications</li>
          </ul>
          <p className="text-xs text-green-400 mt-2">
            ✅ Admin account, settings, and backup will be preserved.
          </p>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Type <span className="font-bold text-red-500">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type DELETE here..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-red-500 focus:outline-none transition-all"
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            disabled={loading || confirmation !== "DELETE"}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                Clear All Data
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Backup notice */}
        <p className="text-xs text-gray-500 text-center mt-4">
          A backup will be created automatically before clearing.
        </p>
      </div>
    </div>
  )
}