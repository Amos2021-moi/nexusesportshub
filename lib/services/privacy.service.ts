import { prisma } from "@/lib/prisma"

interface PrivacySettings {
  showSquad: boolean
  showStats: boolean
  allowComments: boolean
  publicProfile: boolean
  showLastSeen: boolean
}

const DEFAULT_PRIVACY: PrivacySettings = {
  showSquad: true,
  showStats: true,
  allowComments: true,
  publicProfile: true,
  showLastSeen: true,
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        userId,
        category: "privacy"
      }
    })

    const result = { ...DEFAULT_PRIVACY }
    settings.forEach(setting => {
      if (setting.key in result) {
        result[setting.key as keyof PrivacySettings] = JSON.parse(setting.value)
      }
    })
    return result
  } catch (error) {
    console.error("Error fetching privacy settings:", error)
    return DEFAULT_PRIVACY
  }
}

export async function canViewProfile(viewerId: string | null, targetId: string): Promise<boolean> {
  // Admins can always view
  if (viewerId) {
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { role: true }
    })
    if (viewer?.role === "ADMIN") {
      return true
    }
  }

  // If viewing own profile, always allowed
  if (viewerId === targetId) {
    return true
  }

  // Check target's privacy setting
  const privacy = await getPrivacySettings(targetId)
  return privacy.publicProfile
}

export async function canViewSquad(viewerId: string | null, targetId: string): Promise<boolean> {
  if (viewerId === targetId) return true
  
  const privacy = await getPrivacySettings(targetId)
  return privacy.showSquad
}

export async function canViewStats(viewerId: string | null, targetId: string): Promise<boolean> {
  if (viewerId === targetId) return true
  
  const privacy = await getPrivacySettings(targetId)
  return privacy.showStats
}

export async function canComment(postUserId: string, commenterId: string): Promise<boolean> {
  if (commenterId === postUserId) return true
  
  const privacy = await getPrivacySettings(postUserId)
  return privacy.allowComments
}

export async function shouldShowLastSeen(viewerId: string | null, targetId: string): Promise<boolean> {
  if (viewerId === targetId) return true
  
  const privacy = await getPrivacySettings(targetId)
  return privacy.showLastSeen
}