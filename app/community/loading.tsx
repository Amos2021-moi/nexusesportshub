import { SkeletonCommunityPost, Skeleton } from "@/components/ui/Skeleton"

export default function CommunityLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-64 h-4 mt-1" />
      </div>
      {[...Array(3)].map((_, i) => (
        <SkeletonCommunityPost key={i} />
      ))}
    </div>
  )
}