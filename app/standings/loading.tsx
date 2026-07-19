import { SkeletonLeagueTable, Skeleton } from "@/components/ui/Skeleton"

export default function StandingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-64 h-4 mt-1" />
      </div>
      <SkeletonLeagueTable />
    </div>
  )
}