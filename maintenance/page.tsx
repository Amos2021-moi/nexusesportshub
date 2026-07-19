"use client"

import { useEffect, useState } from "react"
import { Shield, Clock, AlertTriangle, Mail, Calendar } from "lucide-react"

interface MaintenanceInfo {
  scheduledAt?: string
  duration?: number
  message?: string
  startTime?: string
}

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaintenanceInfo()
    const interval = setInterval(fetchMaintenanceInfo, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!maintenanceInfo?.startTime) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const start = new Date(maintenanceInfo.startTime!).getTime()
      const diff = start + (maintenanceInfo.duration || 30) * 60 * 1000 - now

      if (diff <= 0) {
        setTimeLeft(null)
        clearInterval(timer)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(timer)
  }, [maintenanceInfo])

  async function fetchMaintenanceInfo() {
    try {
      // Try to get schedule info
      const res = await fetch("/api/admin/maintenance/schedule")
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setMaintenanceInfo({
            scheduledAt: data.scheduledAt,
            duration: data.duration,
            message: data.message,
            startTime: data.scheduledAt
          })
        }
      }
    } catch (error) {
      console.error("Error fetching maintenance info:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (value: number) => String(value).padStart(2, "0")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-6">
          <Shield className="h-10 w-10 text-yellow-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Under Maintenance</h1>
        <p className="text-gray-400 mb-6">
          {maintenanceInfo?.message || "We're currently performing scheduled maintenance to improve your experience."}
        </p>

        {/* Countdown Timer */}
        {timeLeft ? (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{formatTime(timeLeft.hours)}</div>
                <div className="text-xs text-gray-500">Hours</div>
              </div>
              <div className="text-2xl font-bold text-gray-500">:</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{formatTime(timeLeft.minutes)}</div>
                <div className="text-xs text-gray-500">Minutes</div>
              </div>
              <div className="text-2xl font-bold text-gray-500">:</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{formatTime(timeLeft.seconds)}</div>
                <div className="text-xs text-gray-500">Seconds</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Estimated time remaining</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-gray-300">We'll be back <span className="text-white font-medium">shortly</span></span>
            </div>
          </div>
        )}

        {/* Scheduled time info */}
        {maintenanceInfo?.scheduledAt && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Calendar className="h-4 w-4" />
            <span>Scheduled: {new Date(maintenanceInfo.scheduledAt).toLocaleString()}</span>
          </div>
        )}

        {/* Contact */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Mail className="h-4 w-4" />
          <span>Questions? Contact </span>
          <a href="mailto:support@nexusesports.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            support@nexusesports.com
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-600 mt-8">
          We'll be back soon. Thank you for your patience.
        </p>
      </div>
    </div>
  )
}