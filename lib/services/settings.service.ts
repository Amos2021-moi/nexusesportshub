import { prisma } from "@/lib/prisma"

export interface SettingValue {
  category: string
  key: string
  value: any
}

export async function getSetting(userId: string | null, category: string, key: string) {
  try {
    const where: any = {
      category,
      key
    }
    if (userId) {
      where.userId = userId
    }
    
    const setting = await prisma.setting.findFirst({
      where
    })
    return setting ? JSON.parse(setting.value) : null
  } catch (error) {
    console.error("Error getting setting:", error)
    return null
  }
}

export async function getSettingsByCategory(userId: string | null, category: string) {
  try {
    const where: any = { category }
    if (userId) {
      where.userId = userId
    }
    
    const settings = await prisma.setting.findMany({
      where
    })
    return settings.reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = JSON.parse(setting.value)
      return acc
    }, {} as Record<string, any>)
  } catch (error) {
    console.error("Error getting settings by category:", error)
    return {}
  }
}

export async function setSetting(userId: string | null, category: string, key: string, value: any) {
  try {
    const where: any = {
      category,
      key
    }
    if (userId) {
      where.userId = userId
    } else {
      where.userId = null
    }
    
    const existing = await prisma.setting.findFirst({
      where
    })

    if (existing) {
      return await prisma.setting.update({
        where: { id: existing.id },
        data: {
          value: JSON.stringify(value)
        }
      })
    } else {
      const data: any = {
        category,
        key,
        value: JSON.stringify(value)
      }
      // ✅ Allow null userId (system settings)
      if (userId !== undefined) {
        data.userId = userId
      }
      
      try {
        return await prisma.setting.create({ data })
      } catch (error: any) {
        if (error.code === 'P2002') {
          const existing = await prisma.setting.findFirst({
            where: {
              userId: userId || null,
              category,
              key
            }
          })
          if (existing) {
            return await prisma.setting.update({
              where: { id: existing.id },
              data: {
                value: JSON.stringify(value)
              }
            })
          }
        }
        throw error
      }
    }
  } catch (error) {
    console.error("Error setting setting:", error)
    throw error
  }
}

export async function deleteSetting(userId: string | null, category: string, key: string) {
  try {
    const where: any = {
      category,
      key
    }
    if (userId) {
      where.userId = userId
    }
    
    const setting = await prisma.setting.findFirst({
      where
    })
    
    if (!setting) return null
    
    return await prisma.setting.delete({
      where: { id: setting.id }
    })
  } catch (error) {
    console.error("Error deleting setting:", error)
    throw error
  }
}

export async function getDefaultSettings(category: string): Promise<Record<string, any>> {
  const defaults: Record<string, Record<string, any>> = {
    account: {
      profileVisible: true,
      showStats: true,
      showSquad: true
    },
    notifications: {
      fixtureAlerts: true,
      resultApproved: true,
      awardNotifications: true,
      newsAlerts: true,
      commentAlerts: true,
      matchReminders: true,
      emailNotifications: true
    },
    privacy: {
      showSquad: true,
      showStats: true,
      allowComments: true,
      publicProfile: true,
      showLastSeen: true
    },
    appearance: {
      theme: "dark",
      compactMode: false,
      reduceMotion: false,
      sidebarStyle: "default"
    },
    competition: {
      defaultSquad: "MAIN",
      autoSelectTournamentSquad: false,
      matchReminderTime: "1h",
      fixtureCalendarSync: false
    },
    league: {
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      autoFixtureGeneration: true,
      fixtureLock: false,
      seasonFreeze: false
    },
    system: {
      registrationOpen: true,
      maintenanceMode: false,
      uploadsEnabled: true,
      maxUploadSize: 5,
      archiveSeasons: false
    },
    moderation: {
      postApproval: false,
      commentFiltering: true,
      squadApproval: false,
      playerReports: true
    }
  }

  return defaults[category] || {}
}