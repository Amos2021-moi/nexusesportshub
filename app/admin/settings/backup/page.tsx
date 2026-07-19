"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Shield, Download, Upload, History, Calendar, Clock,
  HardDrive, Database, FileArchive, CheckCircle,
  AlertCircle, RefreshCw, Zap, Settings,
  Trash2, ChevronRight, Plus, X,
  Bell, BellOff, RotateCw, Cloud, ArrowLeft
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface Backup {
  id: string
  name: string
  type: string
  status: string
  size: number
  createdAt: string
  createdBy: string
  filePath: string
  user: {
    name: string
    email: string
  }
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  latestBackup: Backup | null
}

interface ScheduleConfig {
  id?: string
  enabled: boolean
  frequency: string
  time: string
  keepDaily: number
  keepWeekly: number
  keepMonthly: number
  lastRunAt: string | null
  nextRunAt: string | null
}

export default function BackupSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [backups, setBackups] = useState<Backup[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferData, setTransferData] = useState({
    targetUrl: '',
    apiKey: '',
    seasonId: '',
    tournamentIds: ''
  })
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    enabled: true,
    frequency: "DAILY",
    time: "02:00",
    keepDaily: 7,
    keepWeekly: 4,
    keepMonthly: 3,
    lastRunAt: null,
    nextRunAt: null
  })
  const [savingSchedule, setSavingSchedule] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }
    
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchData()
      fetchSchedule()
    }
  }, [session])

  async function fetchData() {
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch("/api/admin/backup/history"),
        fetch("/api/admin/backup/stats")
      ])
      
      const historyData = await historyRes.json()
      const statsData = await statsRes.json()
      
      setBackups(Array.isArray(historyData) ? historyData : [])
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching backup data:", error)
      toast.error("Failed to load backup data")
    } finally {
      setLoading(false)
    }
  }

  async function fetchSchedule() {
    try {
      const res = await fetch("/api/admin/backup/schedule")
      const data = await res.json()
      setSchedule(data)
    } catch (error) {
      console.error("Error fetching schedule:", error)
    }
  }

  async function createBackup() {
    if (!confirm("Create a new backup snapshot? This may take a few minutes.")) return

    setCreating(true)
    try {
      const res = await fetch("/api/admin/backup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "MANUAL" })
      })

      if (res.ok) {
        toast.success("Backup created successfully!")
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to create backup")
      }
    } catch (error) {
      console.error("Error creating backup:", error)
      toast.error("Failed to create backup")
    } finally {
      setCreating(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a ZIP backup file')
      e.target.value = ''
      return
    }

    const MAX_SIZE = 4.5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error(`File too large. Max ${MAX_SIZE / 1024 / 1024}MB`)
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('backup', file)

    const loadingToast = toast.loading('Uploading backup...')

    try {
      const res = await fetch('/api/admin/backup/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Backup uploaded successfully!')
        fetchData()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload backup')
    } finally {
      toast.dismiss(loadingToast)
      e.target.value = ''
    }
  }

  async function handleTransfer() {
    if (!transferData.targetUrl) {
      toast.error('Target URL is required')
      return
    }

    const loadingToast = toast.loading('Transferring backup...')

    try {
      const res = await fetch('/api/admin/backup/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Backup transferred successfully!')
        setShowTransferModal(false)
        setTransferData({ targetUrl: '', apiKey: '', seasonId: '', tournamentIds: '' })
        fetchData()
      } else {
        toast.error(data.error || 'Transfer failed')
      }
    } catch (error) {
      console.error('Transfer error:', error)
      toast.error('Failed to transfer backup')
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  async function toggleAutoBackup() {
    const updated = { ...schedule, enabled: !schedule.enabled }
    await updateSchedule(updated)
  }

  async function updateSchedule(updates: Partial<ScheduleConfig>) {
    const updated = { ...schedule, ...updates }
    setSavingSchedule(true)
    try {
      const res = await fetch("/api/admin/backup/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        const data = await res.json()
        setSchedule(data)
        toast.success("Schedule updated!")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to update schedule")
      }
    } catch (error) {
      console.error("Error updating schedule:", error)
      toast.error("Failed to update schedule")
    } finally {
      setSavingSchedule(false)
    }
  }

  async function restoreBackup(backupId: string) {
    if (!confirm("⚠️ This will restore the selected backup. Current data will be overwritten. Continue?")) return

    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId })
      })

      if (res.ok) {
        toast.success("Backup restored successfully!")
        setShowRestoreModal(false)
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to restore backup")
      }
    } catch (error) {
      console.error("Error restoring backup:", error)
      toast.error("Failed to restore backup")
    }
  }

  async function deleteBackup(backupId: string) {
    if (!confirm("Delete this backup? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/admin/backup/${backupId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("Backup deleted")
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to delete backup")
      }
    } catch (error) {
      console.error("Error deleting backup:", error)
      toast.error("Failed to delete backup")
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading backup settings...</p>
        </div>
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return null
  }

  const frequencyLabels: Record<string, string> = {
    HOURLY: "Hourly",
    DAILY: "Daily",
    WEEKLY: "Weekly",
    MONTHLY: "Monthly"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-400" />
          Backup & Recovery
        </h1>
        <p className="text-gray-400 mt-1">Protect your platform with automated backups and recovery</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Database className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.totalBackups || 0}</p>
              <p className="text-xs text-gray-400">Total Backups</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <HardDrive className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatSize(stats?.totalSize || 0)}</p>
              <p className="text-xs text-gray-400">Total Storage</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.latestBackup ? new Date(stats.latestBackup.createdAt).toLocaleDateString() : "Never"}
              </p>
              <p className="text-xs text-gray-400">Latest Backup</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">Healthy</p>
              <p className="text-xs text-gray-400">System Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Backup Settings */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Auto Backup Schedule
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${schedule.enabled ? "text-green-400" : "text-gray-400"}`}>
              {schedule.enabled ? "Active" : "Disabled"}
            </span>
            <button
              onClick={toggleAutoBackup}
              disabled={savingSchedule}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                schedule.enabled ? "bg-indigo-600" : "bg-gray-700"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                schedule.enabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
            <div className="mt-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
  <p className="text-xs text-gray-400">
    <span className="font-medium text-white">Cron Schedule:</span> {schedule.enabled ? `Runs daily at ${schedule.time}` : "Disabled"}
  </p>
  <p className="text-xs text-gray-500 mt-1">
    Next run: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "Not scheduled"}
  </p>
  {schedule.lastRunAt && (
    <p className="text-xs text-gray-500">
      Last run: {new Date(schedule.lastRunAt).toLocaleString()}
    </p>
  )}
</div>
          </div>
        </div>

        {schedule.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
              <select
                value={schedule.frequency}
                onChange={(e) => updateSchedule({ frequency: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="HOURLY">Hourly</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time (24hr)</label>
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => updateSchedule({ time: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Retention (Days)</label>
              <select
                value={schedule.keepDaily}
                onChange={(e) => {
                  const days = parseInt(e.target.value)
                  updateSchedule({ 
                    keepDaily: days, 
                    keepWeekly: Math.floor(days / 2), 
                    keepMonthly: Math.floor(days / 4) 
                  })
                }}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
          {schedule.lastRunAt && (
            <span>Last run: {new Date(schedule.lastRunAt).toLocaleString()}</span>
          )}
          {schedule.nextRunAt && schedule.enabled && (
            <span>• Next run: {new Date(schedule.nextRunAt).toLocaleString()}</span>
          )}
          <span>• {frequencyLabels[schedule.frequency] || "Daily"} backup</span>
          <span>• Keep {schedule.keepDaily} daily backups</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={createBackup}
          disabled={creating}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          {creating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Snapshot
            </>
          )}
        </button>

        <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all cursor-pointer">
          <Upload className="h-4 w-4" />
          Upload Backup
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        <button
          onClick={() => setShowTransferModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-all"
        >
          <Cloud className="h-4 w-4" />
          Transfer Backup
        </button>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-600 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Backup History */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            Backup History
          </h2>
        </div>
        <div className="overflow-x-auto">
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <FileArchive className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Backups Yet</h3>
              <p className="text-gray-400">Create your first backup to protect your data.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{backup.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        backup.type === "MANUAL" ? "bg-blue-500/20 text-blue-400" :
                        backup.type === "AUTO" ? "bg-green-500/20 text-green-400" :
                        backup.type === "UPLOADED" ? "bg-purple-500/20 text-purple-400" :
                        backup.type === "TRANSFER" ? "bg-cyan-500/20 text-cyan-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        backup.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                        backup.status === "PROCESSING" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {backup.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{formatSize(backup.size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedBackup(backup)
                            setShowRestoreModal(true)
                          }}
                          className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-all"
                          title="Restore"
                        >
                          <Upload size={16} />
                        </button>
                        <button
                          onClick={() => window.open(`/api/admin/backup/download/${backup.id}`, '_blank')}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Restore Backup</h2>
            <div className="space-y-4">
              <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-400 font-medium">⚠️ Warning</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Restoring will overwrite current data. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Backup</span>
                  <span className="text-white">{selectedBackup.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-white">{new Date(selectedBackup.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Size</span>
                  <span className="text-white">{formatSize(selectedBackup.size)}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => restoreBackup(selectedBackup.id)}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-all"
                >
                  Restore
                </button>
                <button
                  onClick={() => setShowRestoreModal(false)}
                  className="flex-1 bg-gray-700 text-white py-2.5 rounded-lg hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Transfer Backup</h2>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target URL</label>
                <input
                  type="text"
                  value={transferData.targetUrl}
                  onChange={(e) => setTransferData({...transferData, targetUrl: e.target.value})}
                  placeholder="https://platform-b.vercel.app"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <p className="text-xs text-gray-500 mt-1">The URL of the target Nexus Esports platform</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">API Key (optional)</label>
                <input
                  type="password"
                  value={transferData.apiKey}
                  onChange={(e) => setTransferData({...transferData, apiKey: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <p className="text-xs text-gray-500 mt-1">If the target platform requires API authentication</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Season ID (optional)</label>
                <input
                  type="text"
                  value={transferData.seasonId}
                  onChange={(e) => setTransferData({...transferData, seasonId: e.target.value})}
                  placeholder="Leave empty to transfer all"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tournament IDs (optional)</label>
                <input
                  type="text"
                  value={transferData.tournamentIds}
                  onChange={(e) => setTransferData({...transferData, tournamentIds: e.target.value})}
                  placeholder="Comma separated: id1,id2"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-400 font-medium">What gets transferred?</p>
                    <p className="text-xs text-gray-400 mt-1">
                      All data including users, profiles, fixtures, results, tournaments, seasons, awards, news, and squads.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleTransfer}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-all"
              >
                Start Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}