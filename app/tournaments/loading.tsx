import { Skeleton } from "@/components/ui/Skeleton"

export default function TournamentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-64 h-4 mt-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} variant="card" className="h-64" />
        ))}
      </div>
    </div>
  )
}