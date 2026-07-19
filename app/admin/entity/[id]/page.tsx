"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { 
  ArrowLeft, Edit2, Save, X, Trash2, Copy, Check,
  User, Trophy, Calendar, Users, DollarSign, Shield,
  Newspaper, Award, Crown, Clock, AlertCircle, Loader2,
  RefreshCw, Eye, Share2, FileText
} from "lucide-react"
import toast from "react-hot-toast"

interface EntityData {
  type: string
  id: string
  title: string
  data: Record<string, any>
  related: Record<string, any[]>
  metadata: Record<string, any>
  schema: Record<string, any>
}

export default function EntityDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [entity, setEntity] = useState<EntityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editedData, setEditedData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (id) {
      fetchEntity()
    }
  }, [id])

  async function fetchEntity() {
    try {
      const res = await fetch(`/api/admin/entity/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Entity not found")
        } else {
          throw new Error("Failed to fetch entity")
        }
        return
      }
      const data = await res.json()
      setEntity(data)
      setEditedData(data.data || {})
    } catch (error) {
      console.error("Error fetching entity:", error)
      toast.error("Failed to load entity")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/entity/${id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: editedData }),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success("Entity updated successfully!")
      setEditing(false)
      fetchEntity()
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, any> = {
      season: Calendar,
      tournament: Trophy,
      player: User,
      fixture: Calendar,
      result: Check,
      payment: DollarSign,
      squad: Shield,
      news: Newspaper,
      award: Award,
      hallOfFame: Crown,
    }
    return icons[type] || FileText
  }

  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      season: "Season",
      tournament: "Tournament",
      player: "Player",
      fixture: "Fixture",
      result: "Result",
      payment: "Payment",
      squad: "Squad",
      news: "News",
      award: "Award",
      hallOfFame: "Hall of Fame",
    }
    return labels[type] || type
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      ACTIVE: "text-green-400",
      PENDING: "text-yellow-400",
      COMPLETED: "text-blue-400",
      SCHEDULED: "text-blue-400",
      FIXTURE_LOCK: "text-orange-400",
      LIVE: "text-green-400",
      ENDED: "text-gray-400",
      ARCHIVED: "text-gray-500",
      PAID: "text-green-400",
      UNPAID: "text-red-400",
      Verified: "text-green-400",
      Unverified: "text-yellow-400",
      Approved: "text-green-400",
      Published: "text-green-400",
      Draft: "text-yellow-400",
    }
    return colors[status] || "text-gray-400"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading entity details...</p>
        </div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-16 w-16 text-gray-600" />
        <h2 className="text-xl font-bold text-white">Entity Not Found</h2>
        <p className="text-gray-400">The entity you're looking for doesn't exist.</p>
        <Link href="/admin" className="text-indigo-400 hover:text-indigo-300">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const Icon = getTypeIcon(entity.type)
  const typeLabel = getTypeLabel(entity.type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Icon className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{entity.title}</h1>
              <p className="text-sm text-gray-400">
                {typeLabel} • ID: {entity.id}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(entity.id)
              toast.success("ID copied to clipboard!")
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Copy className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Entity Overview */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-400" />
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(entity.metadata || {}).map(([key, value]) => {
            if (typeof value === "string" && value.length > 50) return null
            if (key === "id" || key === "type") return null
            
            return (
              <div key={key} className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className={`text-sm font-medium ${
                  key === "status" ? getStatusColor(value as string) : "text-white"
                }`}>
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Entity Data */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-yellow-400" />
          Details
        </h2>
        
        {editing ? (
          // Edit Mode - Inline editing
          <div className="space-y-4">
            {Object.entries(entity.schema || {}).map(([field, config]: [string, any]) => {
              if (config.hidden) return null
              
              const value = editedData[field] ?? entity.data[field] ?? ""
              
              if (config.type === "select") {
                return (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {config.label || field}
                    </label>
                    <select
                      value={value}
                      onChange={(e) => setEditedData({ ...editedData, [field]: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    >
                      {config.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )
              }
              
              if (config.type === "textarea") {
                return (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {config.label || field}
                    </label>
                    <textarea
                      value={value}
                      onChange={(e) => setEditedData({ ...editedData, [field]: e.target.value })}
                      rows={config.rows || 4}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )
              }
              
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {config.label || field}
                  </label>
                  <input
                    type={config.type || "text"}
                    value={value}
                    onChange={(e) => setEditedData({ ...editedData, [field]: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )
            })}
          </div>
        ) : (
          // View Mode
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(entity.data || {}).map(([key, value]) => {
              if (typeof value === "string" && value.length > 50) {
                return (
                  <div key={key} className="col-span-2 bg-gray-700/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{value}</p>
                  </div>
                )
              }
              
              return (
                <div key={key} className="bg-gray-700/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-sm font-medium text-white">
                    {typeof value === "boolean" ? (value ? "✅ Yes" : "❌ No") : String(value)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Related Items */}
      {entity.related && Object.keys(entity.related).length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-400" />
            Related Items
          </h2>
          <div className="space-y-2">
            {Object.entries(entity.related).map(([key, items]) => (
              <div key={key}>
                <p className="text-sm text-gray-400 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item: any, index: number) => (
                    <Link
                      key={index}
                      href={`/admin/entity/${item.id}`}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white transition-colors"
                    >
                      {item.name || item.title || item.id}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-purple-400" />
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-all"
            >
              ✎ Edit Details
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-all"
              >
                ❌ Cancel
              </button>
            </>
          )}
          <button
            onClick={fetchEntity}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-all"
          >
            🔄 Refresh Data
          </button>
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}