import { Skeleton } from "@/components/ui/Skeleton"

export default function PlayersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-64 h-4 mt-1" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <Skeleton variant="avatar" className="h-16 w-16 mx-auto mb-3" />
            <Skeleton variant="text" className="w-24 mx-auto" />
            <Skeleton variant="text" className="w-16 mx-auto mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}