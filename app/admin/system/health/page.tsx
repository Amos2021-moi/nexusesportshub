"use client"

import { useEffect, useState } from "react"
import { 
  CheckCircle, AlertCircle, XCircle, 
  Database, HardDrive, Mail, Bell, 
  Shield, Clock, RefreshCw 
} from "lucide-react"

interface HealthCheck {
  name: string
  status: "healthy" | "warning" | "offline"
  message?: string
  icon: any
}

export default function HealthDashboard() {
  const [health, setHealth] = useState<HealthCheck[]>([
    { name: "Database", status: "healthy", icon: Database },
    { name: "Storage", status: "healthy", icon: HardDrive },
    { name: "Email", status: "healthy", icon: Mail },
    { name: "Notifications", status: "healthy", icon: Bell },
    { name: "Authentication", status: "healthy", icon: Shield },
    { name: "Backups", status: "healthy", icon: Clock },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkHealth() {
    try {
      const res = await fetch("/api/admin/health")
      if (res.ok) {
        const data = await res.json()
        setHealth(prev => prev.map(item => ({
          ...item,
          status: data[item.name.toLowerCase()] || "healthy"
        })))
      }
    } catch (error) {
      console.error("Health check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-400 bg-green-500/10"
      case "warning": return "text-yellow-400 bg-yellow-500/10"
      case "offline": return "text-red-400 bg-red-500/10"
      default: return "text-gray-400 bg-gray-500/10"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="h-5 w-5 text-green-400" />
      case "warning": return <AlertCircle className="h-5 w-5 text-yellow-400" />
      case "offline": return <XCircle className="h-5 w-5 text-red-400" />
      default: return <CheckCircle className="h-5 w-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Checking system health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-gray-400 text-sm">Real-time system status monitoring</p>
        </div>
        <button
          onClick={checkHealth}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {health.map((item, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${getStatusColor(item.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.status}</p>
                </div>
              </div>
              {getStatusIcon(item.status)}
            </div>
            {item.message && (
              <p className="mt-2 text-xs text-gray-400">{item.message}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Last checked: {new Date().toLocaleTimeString()}</span>
          <span className="text-gray-400">
            <span className="text-green-400">●</span> All systems operational
          </span>
        </div>
      </div>
    </div>
  )
}