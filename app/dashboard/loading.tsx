import { SkeletonStats, Skeleton } from "@/components/ui/Skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-sm p-6 border border-white/10">
        <Skeleton variant="text" className="w-64 h-8" />
        <Skeleton variant="text" className="w-48 h-4 mt-2" />
        <Skeleton variant="text" className="w-32 h-5 mt-2" />
      </div>
      <SkeletonStats />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <Skeleton variant="avatar" className="h-4 w-4 mb-2" />
            <Skeleton variant="text" className="w-16 h-7" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton variant="card" className="h-48" />
        <Skeleton variant="card" className="h-48" />
      </div>
    </div>
  )
}