"use client"

import { useEffect, useState, useCallback, useMemo, memo } from "react"
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

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

// === Mobile Detection Hook ===
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

/* -------------------------------------------------------------------------- */
/*                           Memoized Components                             */
/* -------------------------------------------------------------------------- */

// === STATIC Metadata Item ===
const MetadataItem = memo(({ key: fieldKey, value }: { key: string; value: any }) => {
  if (typeof value === "string" && value.length > 50) return null
  if (fieldKey === "id" || fieldKey === "type") return null

  const getStatusColor = (status: string): string => {
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

  return (
    <div className="bg-gray-700/30 rounded-lg p-3">
      <p className="text-xs text-gray-400 capitalize">
        {fieldKey.replace(/([A-Z])/g, ' $1').trim()}
      </p>
      <p className={`text-sm font-medium ${
        fieldKey === "status" ? getStatusColor(value as string) : "text-white"
      }`}>
        {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
      </p>
    </div>
  )
})

MetadataItem.displayName = "MetadataItem"

// === STATIC Data Item ===
const DataItem = memo(({ key: fieldKey, value }: { key: string; value: any }) => {
  if (typeof value === "string" && value.length > 50) {
    return (
      <div className="col-span-2 bg-gray-700/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 capitalize">
          {fieldKey.replace(/([A-Z])/g, ' $1').trim()}
        </p>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{value}</p>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-700/30 rounded-lg p-3">
      <p className="text-xs text-gray-400 capitalize">
        {fieldKey.replace(/([A-Z])/g, ' $1').trim()}
      </p>
      <p className="text-sm font-medium text-white">
        {typeof value === "boolean" ? (value ? "✅ Yes" : "❌ No") : String(value)}
      </p>
    </div>
  )
})

DataItem.displayName = "DataItem"

// === STATIC Form Field ===
const FormField = memo(({ 
  field, 
  config, 
  value, 
  onChange 
}: { 
  field: string
  config: any
  value: any
  onChange: (field: string, value: any) => void
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(field, e.target.value)
  }, [field, onChange])

  if (config.type === "select") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {config.label || field}
        </label>
        <select
          value={value || ""}
          onChange={handleChange as any}
          className="w-full min-h-[44px] px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors duration-150"
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
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {config.label || field}
        </label>
        <textarea
          value={value || ""}
          onChange={handleChange as any}
          rows={config.rows || 4}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors duration-150 resize-none"
        />
      </div>
    )
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {config.label || field}
      </label>
      <input
        type={config.type || "text"}
        value={value || ""}
        onChange={handleChange as any}
        className="w-full min-h-[44px] px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors duration-150"
      />
    </div>
  )
})

FormField.displayName = "FormField"

// === STATIC Related Item ===
const RelatedItem = memo(({ item }: { item: any }) => (
  <Link
    href={`/admin/entity/${item.id}`}
    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white transition-colors duration-150"
  >
    {item.name || item.title || item.id}
  </Link>
))

RelatedItem.displayName = "RelatedItem"

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function EntityDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const isMobile = useIsMobile()
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

  const handleSave = useCallback(async () => {
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
  }, [id, editedData])

  const handleFieldChange = useCallback((field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleCopyId = useCallback(() => {
    if (entity) {
      navigator.clipboard.writeText(entity.id)
      toast.success("ID copied to clipboard!")
    }
  }, [entity])

  const handleRefresh = useCallback(() => {
    fetchEntity()
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditing(false)
    setEditedData(entity?.data || {})
  }, [entity])

  const getTypeIcon = useCallback((type: string) => {
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
  }, [])

  const getTypeLabel = useCallback((type: string): string => {
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
  }, [])

  const metadataItems = useMemo(() => {
    if (!entity) return []
    return Object.entries(entity.metadata || {}).filter(([key]) => {
      const value = entity.metadata[key]
      if (typeof value === "string" && value.length > 50) return false
      if (key === "id" || key === "type") return false
      return true
    })
  }, [entity])

  const dataItems = useMemo(() => {
    if (!entity) return []
    return Object.entries(entity.data || {})
  }, [entity])

  const schemaFields = useMemo(() => {
    if (!entity) return []
    return Object.entries(entity.schema || {}).filter(([_, config]: [string, any]) => !config.hidden)
  }, [entity])

  const relatedItems = useMemo(() => {
    if (!entity) return {}
    return entity.related || {}
  }, [entity])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading entity details...</p>
        </div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-4">
        <AlertCircle className="h-16 w-16 text-gray-600" />
        <h2 className="text-xl font-bold text-white">Entity Not Found</h2>
        <p className="text-gray-400">The entity you're looking for doesn't exist.</p>
        <Link href="/admin" className="text-indigo-400 hover:text-indigo-300 transition-colors duration-150">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const Icon = getTypeIcon(entity.type)
  const typeLabel = getTypeLabel(entity.type)

  return (
    <div className="space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
      {/* Header - NO animations */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-150"
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
        <div className="flex items-center gap-2 flex-wrap">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex min-h-[44px] items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-150"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex min-h-[44px] items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-150"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex min-h-[44px] items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-150 disabled:opacity-50"
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
            onClick={handleCopyId}
            className="min-h-[44px] min-w-[44px] p-2 hover:bg-gray-700 rounded-lg transition-colors duration-150"
          >
            <Copy className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Entity Overview - NO animations */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-400" />
          Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metadataItems.map(([key, value]) => (
            <MetadataItem key={key} value={value} />
          ))}
        </div>
      </div>

      {/* Entity Data - NO animations */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-yellow-400" />
          Details
        </h2>
        
        {editing ? (
          // Edit Mode - NO animations
          <div className="space-y-4">
            {schemaFields.map(([field, config]: [string, any]) => {
              const value = editedData[field] ?? entity.data[field] ?? ""
              return (
                <FormField
                  key={field}
                  field={field}
                  config={config}
                  value={value}
                  onChange={handleFieldChange}
                />
              )
            })}
          </div>
        ) : (
          // View Mode - NO animations
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {dataItems.map(([key, value]) => (
              <DataItem key={key} value={value} />
            ))}
          </div>
        )}
      </div>

      {/* Related Items - NO animations */}
      {Object.keys(relatedItems).length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-400" />
            Related Items
          </h2>
          <div className="space-y-2">
            {Object.entries(relatedItems).map(([key, items]) => (
              <div key={key}>
                <p className="text-sm text-gray-400 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item: any, index: number) => (
                    <RelatedItem key={index} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions - NO animations */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-purple-400" />
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors duration-150"
            >
              ✎ Edit Details
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="min-h-[44px] px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors duration-150 disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="min-h-[44px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-150"
              >
                ❌ Cancel
              </button>
            </>
          )}
          <button
            onClick={handleRefresh}
            className="min-h-[44px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors duration-150"
          >
            🔄 Refresh Data
          </button>
          <button
            className="min-h-[44px] px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors duration-150"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}